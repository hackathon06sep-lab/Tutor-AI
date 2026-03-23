const express = require('express');
const groq = require('../services/groqClient');
const retrieve = require('../rag/retriever');
const buildPDF = require('../services/pdfBuilder');
const Assignment = require('../models/Assignment');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/generate', authMiddleware, async (req, res) => {
  const { topic, gradeLevel = 'Secondary', assignmentType = 'Worksheet' } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic required' });
  }

  try {
    const ragContext = await retrieve(topic);

    const prompt = `Create a complete academic assignment about "${topic}" for ${gradeLevel} level students.
${ragContext ? `Use this context as reference:\n${ragContext}\n` : ''}
Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "Assignment title here",
  "objectives": "2-3 learning objectives as a single paragraph",
  "questions": [
    { "type": "mcq", "question": "Question text?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."] },
    { "type": "mcq", "question": "Question text?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."] },
    { "type": "short", "question": "Describe in 2-3 sentences..." },
    { "type": "short", "question": "Explain the significance of..." },
    { "type": "short", "question": "Compare and contrast..." }
  ],
  "answerKey": "1. B) ...\\n2. C) ...\\n3. Sample answer: ...\\n4. Sample answer: ...\\n5. Sample answer: ..."
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/```json\n?|```/g, '').trim();

    let content;
    try {
      content = JSON.parse(cleaned);
    } catch {
      console.error('PDF parse error, raw output:', raw);
      return res.status(500).json({ error: 'AI returned invalid format. Try a simpler topic.' });
    }

    await Assignment.create({
      userId: req.user.id,
      topic,
      gradeLevel,
      assignmentType,
      content: cleaned,
    });

    return buildPDF(content, { topic, gradeLevel, type: assignmentType }, res);
  } catch (err) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate PDF. Try a simpler topic.' });
    }
    return undefined;
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find({ userId: req.user.id })
      .select('topic gradeLevel assignmentType generatedAt')
      .sort({ generatedAt: -1 })
      .limit(20);

    return res.status(200).json(assignments);
  } catch (err) {
    console.error('PDF history error:', err);
    return res.status(500).json({ error: 'Failed to load PDF history' });
  }
});

module.exports = router;
