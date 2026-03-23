const express = require('express');
const groq = require('../services/groqClient');
const retrieve = require('../rag/retriever');
const QuizResult = require('../models/QuizResult');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate', authMiddleware, async (req, res) => {
  const { topic } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    const ragContext = await retrieve(topic);

    const prompt = `You are a quiz generator. Generate exactly 5 multiple-choice questions about "${topic}".
${ragContext ? `Use this context as reference:\n${ragContext}\n` : ''}
Return ONLY a valid JSON array. No markdown, no extra text, no backticks.
Format:
[
  {
    "question": "What is ...?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "A) ..."
  }
]
Rules:
- Exactly 5 questions
- Exactly 4 options per question labeled A), B), C), D)
- The answer must be the full option text
- Vary difficulty: 2 easy, 2 medium, 1 hard`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 1500,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/```json\n?|```/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch {
      console.error('Quiz parse error, raw output:', raw);
      return res.status(500).json({ error: 'AI returned invalid format. Try a different topic.' });
    }

    if (!Array.isArray(questions) || questions.length !== 5) {
      return res.status(500).json({ error: 'Unexpected question count. Please retry.' });
    }

    return res.status(200).json({ questions, topic });
  } catch (err) {
    console.error('Quiz generation error:', err);
    return res.status(500).json({ error: 'Failed to generate quiz. Try a different topic.' });
  }
});

router.post('/save', authMiddleware, async (req, res) => {
  const { topic, score, questions } = req.body;

  try {
    const result = await QuizResult.create({
      userId: req.user.id,
      topic,
      score,
      total: 5,
      questions,
    });

    return res.status(201).json({ message: 'Saved', id: result._id });
  } catch (err) {
    console.error('Quiz save error:', err);
    return res.status(500).json({ error: 'Failed to save result' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const results = await QuizResult.find({ userId: req.user.id })
      .select('topic score total takenAt')
      .sort({ takenAt: -1 })
      .limit(20);

    return res.status(200).json(results);
  } catch (err) {
    console.error('Quiz history error:', err);
    return res.status(500).json({ error: 'Failed to load quiz history' });
  }
});

module.exports = router;
