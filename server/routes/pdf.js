const express        = require('express');
const groq           = require('../services/groqClient');
const retrieve       = require('../rag/retriever');
const buildPDF       = require('../services/pdfBuilder');
const Assignment     = require('../models/Assignment');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ── Per-type config: prompt instructions + score label ───────────────────────
const TYPE_CONFIG = {
  'Worksheet': {
    score: '______ / 10',
    desc:  'a mixed-format WORKSHEET',
    questions: `Generate exactly 5 questions:
- Q1: MCQ (4 options A B C D) — basic recall, one clear correct answer
- Q2: MCQ (4 options A B C D) — concept understanding
- Q3: Short answer — "Describe in 2-3 sentences..."
- Q4: Short answer — "Explain the significance of..."
- Q5: Short answer — "Complete the following: [fill-in-the-blank style]"
Keep questions concise and clear.`,
  },

  'Essay Assignment': {
    score: '______ / 20',
    desc:  'a formal ESSAY ASSIGNMENT',
    questions: `Generate exactly 4 questions:
- Q1: Short answer — a 1-2 sentence warm-up question
- Q2: Short answer — "Define and explain the key terms..."
- Q3: Short answer — "Compare and contrast..." (3-4 sentences)
- Q4: Short answer — the main essay prompt, start with "Write a structured essay (400-500 words) explaining..."
In the answerKey, end with: "Rubric: Content (5pts) + Structure (5pts) + Analysis (5pts) + Language (5pts) = 20pts"`,
  },

  'Problem Set': {
    score: '______ / 25',
    desc:  'a structured PROBLEM SET with clear, concise problems',
    questions: `Generate exactly 5 problems. Keep each problem statement SHORT (1-2 sentences max):
- Q1: MCQ (4 options A B C D) — application scenario, requires thinking
- Q2: Numerical/calculation problem — give specific numbers, e.g. "A plant absorbs 6 molecules of CO2. How many molecules of O2 are produced? Show your working."
- Q3: Three-part problem — write it as ONE sentence then label "(a) ... (b) ... (c) ..."
- Q4: Short scenario — 1 sentence setup + "Predict what happens and explain why in 2-3 sentences."
- Q5: Application problem — 1 sentence, requires a short calculated or reasoned 2-sentence answer
IMPORTANT: Do NOT write paragraph-long questions. Each problem must be concise.
In answerKey, show working for Q2. Mark scheme: Q1=5pts, Q2=5pts, Q3=5pts, Q4=5pts, Q5=5pts`,
  },

  'Comprehension Test': {
    score: '______ / 10',
    desc:  "a COMPREHENSION TEST following Bloom's taxonomy",
    questions: `Generate exactly 5 questions progressing in difficulty:
- Q1: MCQ (4 options A B C D) — Remember level (basic recall)
- Q2: MCQ (4 options A B C D) — Understand level (explain a concept)
- Q3: MCQ (4 options A B C D) — Apply level (given a scenario, what happens?)
- Q4: Short answer — Analyse level: "Analyse why..." or "Examine the relationship between..."
- Q5: Short answer — Evaluate level: "Evaluate the importance of..." or "Justify whether..."
Questions must increase in complexity from Q1 to Q5.`,
  },
};

// ── POST /api/pdf/generate ───────────────────────────────────────────────────
router.post('/generate', authMiddleware, async (req, res) => {
  const { topic, gradeLevel = 'Secondary', assignmentType = 'Worksheet' } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'Topic required' });
  }

  const config = TYPE_CONFIG[assignmentType] || TYPE_CONFIG['Worksheet'];

  try {
    const ragContext = await retrieve(topic);

    const prompt = `You are an expert educator. Create ${config.desc} for ${gradeLevel} level students on: "${topic}".
${ragContext ? `\nReference context:\n${ragContext}\n` : ''}

${config.questions}

Return ONLY valid JSON — no markdown, no backticks:
{
  "title": "${topic} — ${assignmentType}",
  "objectives": "By the end of this ${assignmentType}, students will be able to [2-3 specific objectives].",
  "questions": [
    { "type": "mcq",   "question": "Concise question?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."] },
    { "type": "short", "question": "Concise question?" }
  ],
  "answerKey": "1. ...\\n2. ...\\n3. ...\\n4. ...\\n5. ..."
}

Rules:
- Title is exactly: "${topic} — ${assignmentType}"
- Every question must be appropriate for ${gradeLevel} level
- answerKey must have a numbered answer for EVERY question
- For Problem Set: keep question text SHORT — problems not essays`;

    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens:  2000,
    });

    const raw     = completion.choices?.[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/```json\n?|```/g, '').trim();

    let content;
    try {
      content = JSON.parse(cleaned);
    } catch {
      console.error('PDF JSON parse error. Raw output:', raw);
      return res.status(500).json({ error: 'AI returned invalid format. Try a simpler topic.' });
    }

    if (!content.questions || !Array.isArray(content.questions) || content.questions.length === 0) {
      return res.status(500).json({ error: 'AI returned malformed questions. Please retry.' });
    }

    await Assignment.create({
      userId:         req.user.id,
      topic,
      gradeLevel,
      assignmentType,
      content:        cleaned,
    });

    // Pass scoreLabel so pdfBuilder shows the correct max score per type
    return buildPDF(content, {
      topic,
      gradeLevel,
      type:       assignmentType,
      scoreLabel: config.score,
    }, res);

  } catch (err) {
    console.error('PDF generation error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate PDF. Try a simpler topic.' });
    }
    return undefined;
  }
});

// ── GET /api/pdf/history ─────────────────────────────────────────────────────
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