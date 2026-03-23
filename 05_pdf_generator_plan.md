# Module 5 — PDF Assignment Generator

## Overview
Generates a formatted, downloadable PDF assignment on any topic using **Groq API** for content
and **pdfkit** (Node.js) for PDF creation. Assignment history stored in **MongoDB**.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React.js + TailwindCSS |
| AI API | Groq (`llama3-70b-8192`) — better for long-form content |
| PDF Generation | `pdfkit` (Node.js) |
| Backend | Node.js + Express |
| Database | MongoDB — assignment history |
| Auth | JWT middleware |

---

## Folder Structure

```
/client/src
  /pages
    PDFGenerator.jsx      ← generator form + preview + download

/server
  /models
    Assignment.js         ← MongoDB schema
  /routes
    pdf.js                ← POST /api/pdf/generate + GET /api/pdf/history
  /services
    pdfBuilder.js         ← pdfkit PDF construction logic
```

---

## Step 1 — MongoDB Assignment Model

**File:** `server/models/Assignment.js`

```js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic:         { type: String, required: true },
  gradeLevel:    { type: String, default: 'Secondary' },
  assignmentType:{ type: String, default: 'Worksheet' },
  content:       { type: String },        // raw AI-generated text
  generatedAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
```

---

## Step 2 — PDF Builder Service

**Install:**
```bash
npm install pdfkit
```

**File:** `server/services/pdfBuilder.js`

```js
const PDFDocument = require('pdfkit');

/**
 * buildPDF(content, meta) → streams a PDF to the Express response
 * @param {object} content - { title, objectives, questions, answerKey }
 * @param {object} meta    - { topic, gradeLevel, type }
 * @param {object} res     - Express response object
 */
function buildPDF(content, meta, res) {
  const doc = new PDFDocument({ margin: 60, size: 'A4' });

  // Stream directly to response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="assignment-${meta.topic.replace(/\s+/g, '-')}.pdf"`);
  doc.pipe(res);

  // ── Header ────────────────────────────────────────────────
  doc
    .rect(0, 0, doc.page.width, 100)
    .fill('#1a1a2e');

  doc
    .fillColor('#a78bfa')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('AI TUTOR', 60, 30);

  doc
    .fillColor('#ffffff')
    .fontSize(11)
    .font('Helvetica')
    .text('AI-Powered Assignment', 60, 55);

  doc
    .fillColor('#a78bfa')
    .fontSize(9)
    .text(`Generated: ${new Date().toLocaleDateString()}`, 60, 75);

  // ── Title Section ─────────────────────────────────────────
  doc.moveDown(3);

  doc
    .fillColor('#1a1a2e')
    .roundedRect(60, doc.y, doc.page.width - 120, 60, 8)
    .fill();

  doc
    .fillColor('#ffffff')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(content.title || `${meta.topic} Assignment`, 80, doc.y - 48);

  doc
    .fillColor('#a78bfa')
    .fontSize(10)
    .font('Helvetica')
    .text(`${meta.gradeLevel} Level  •  ${meta.type}  •  Topic: ${meta.topic}`, 80, doc.y - 25);

  doc.moveDown(2);

  // ── Student Info ──────────────────────────────────────────
  doc
    .fillColor('#374151')
    .fontSize(10)
    .font('Helvetica')
    .text('Name: ___________________________   Date: _______________   Score: _______ / 10', 60);

  doc.moveDown(1);
  drawLine(doc);
  doc.moveDown(1);

  // ── Learning Objectives ───────────────────────────────────
  sectionHeader(doc, 'Learning Objectives');
  doc
    .fillColor('#374151')
    .fontSize(11)
    .font('Helvetica')
    .text(content.objectives || '', 60, doc.y, { width: doc.page.width - 120 });

  doc.moveDown(1.5);
  drawLine(doc);
  doc.moveDown(1);

  // ── Questions ─────────────────────────────────────────────
  sectionHeader(doc, 'Questions');

  const questions = content.questions || [];
  questions.forEach((q, i) => {
    doc.moveDown(0.5);

    doc
      .fillColor('#1a1a2e')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`${i + 1}. ${q.question}`, 60, doc.y, { width: doc.page.width - 120 });

    if (q.type === 'mcq' && q.options) {
      doc.moveDown(0.3);
      q.options.forEach(opt => {
        doc
          .fillColor('#374151')
          .fontSize(10)
          .font('Helvetica')
          .text(`    ${opt}`, 70, doc.y, { width: doc.page.width - 130 });
      });
    } else {
      // Short answer lines
      doc.moveDown(0.5);
      for (let l = 0; l < 3; l++) {
        doc
          .moveTo(70, doc.y + 5)
          .lineTo(doc.page.width - 60, doc.y + 5)
          .strokeColor('#d1d5db')
          .lineWidth(0.5)
          .stroke();
        doc.moveDown(0.8);
      }
    }

    doc.moveDown(0.5);
  });

  doc.moveDown(1);
  drawLine(doc);
  doc.moveDown(1);

  // ── Answer Key ────────────────────────────────────────────
  sectionHeader(doc, 'Answer Key (Teacher Use Only)');

  doc
    .fillColor('#374151')
    .fontSize(10)
    .font('Helvetica')
    .text(content.answerKey || '', 60, doc.y, { width: doc.page.width - 120 });

  // ── Footer ────────────────────────────────────────────────
  const pageBottom = doc.page.height - 40;
  doc
    .moveTo(60, pageBottom - 15)
    .lineTo(doc.page.width - 60, pageBottom - 15)
    .strokeColor('#e5e7eb')
    .lineWidth(0.5)
    .stroke();

  doc
    .fillColor('#9ca3af')
    .fontSize(8)
    .text('Generated by AI Tutor App', 60, pageBottom - 5);

  doc.end();
}

function sectionHeader(doc, text) {
  doc
    .fillColor('#7c3aed')
    .fontSize(13)
    .font('Helvetica-Bold')
    .text(text, 60);
  doc.moveDown(0.5);
}

function drawLine(doc) {
  doc
    .moveTo(60, doc.y)
    .lineTo(doc.page.width - 60, doc.y)
    .strokeColor('#e5e7eb')
    .lineWidth(0.5)
    .stroke();
}

module.exports = buildPDF;
```

---

## Step 3 — PDF Generation Route

**File:** `server/routes/pdf.js`

```js
const express    = require('express');
const groq       = require('../services/groqClient');
const buildPDF   = require('../services/pdfBuilder');
const Assignment = require('../models/Assignment');
const authMiddleware = require('../middleware/authMiddleware');
const router     = express.Router();

// POST /api/pdf/generate
router.post('/generate', authMiddleware, async (req, res) => {
  const { topic, gradeLevel = 'Secondary', assignmentType = 'Worksheet' } = req.body;

  if (!topic) return res.status(400).json({ error: 'Topic required' });

  try {
    // 1. Generate content with Groq
    const prompt = `Create a complete academic assignment about "${topic}" for ${gradeLevel} level students.

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
  "answerKey": "1. B) ...\n2. C) ...\n3. Sample answer: ...\n4. Sample answer: ...\n5. Sample answer: ..."
}`;

    const completion = await groq.chat.completions.create({
      model:       'llama3-70b-8192',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens:  2000
    });

    let raw = completion.choices[0].message.content.trim();
    raw = raw.replace(/```json|```/g, '').trim();

    const content = JSON.parse(raw);

    // 2. Save to MongoDB
    await Assignment.create({
      userId:         req.user.id,
      topic,
      gradeLevel,
      assignmentType,
      content:        raw
    });

    // 3. Build and stream PDF
    buildPDF(content, { topic, gradeLevel, type: assignmentType }, res);

  } catch (err) {
    console.error('PDF generation error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF. Try a simpler topic.' });
    }
  }
});

// GET /api/pdf/history — past assignments
router.get('/history', authMiddleware, async (req, res) => {
  const assignments = await Assignment.find({ userId: req.user.id })
    .select('topic gradeLevel assignmentType generatedAt')
    .sort({ generatedAt: -1 })
    .limit(20);
  res.json(assignments);
});

module.exports = router;
```

---

## Step 4 — Register Route in Express

**File:** `server/index.js` (add this)

```js
const pdfRoute = require('./routes/pdf');
app.use('/api/pdf', pdfRoute);
```

---

## Step 5 — PDF Generator Page (Frontend)

**File:** `client/src/pages/PDFGenerator.jsx`

```jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const GRADE_LEVELS  = ['Primary (Grades 1–5)', 'Secondary (Grades 6–10)', 'College Level'];
const ASSIGNMENT_TYPES = ['Worksheet', 'Essay Assignment', 'Problem Set', 'Comprehension Test'];

export default function PDFGenerator() {
  const { token }   = useAuth();
  const [topic,     setTopic]     = useState('');
  const [grade,     setGrade]     = useState(GRADE_LEVELS[1]);
  const [type,      setType]      = useState(ASSIGNMENT_TYPES[0]);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const res = await fetch('/api/pdf/generate', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, gradeLevel: grade, assignmentType: type })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Generation failed');
      }

      // Download the PDF blob
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `assignment-${topic.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📄</span>
          </div>
          <h1 className="text-3xl font-bold text-white">PDF Generator</h1>
          <p className="text-gray-400 mt-2">Generate a formatted assignment on any topic</p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-5"
        >
          {/* Topic */}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Topic</label>
            <input
              type="text"
              placeholder="e.g. Photosynthesis, French Revolution, Algebra..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Grade Level</label>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
            >
              {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          {/* Assignment Type */}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Assignment Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ASSIGNMENT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-2.5 rounded-xl text-sm border transition ${
                    type === t
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-green-400 text-sm bg-green-900/20 border border-green-800 rounded-lg px-4 py-2"
              >
                PDF downloaded successfully!
              </motion.p>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={!topic.trim() || loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating PDF...
              </>
            ) : (
              'Generate & Download PDF'
            )}
          </button>

          <p className="text-gray-600 text-xs text-center">
            Uses AI to create a complete assignment with questions and an answer key
          </p>
        </motion.div>

      </div>
    </div>
  );
}
```

---

## NPM Packages

```bash
# Backend
npm install pdfkit

# Frontend — no new packages needed
```

---

## Groq Model Choice

Use `llama3-70b-8192` for this module — it produces higher quality long-form structured content compared to the 8B model. The extra generation time is acceptable for PDF creation.

---

## Checklist

- [ ] Assignment MongoDB model created
- [ ] pdfkit installed and pdfBuilder.js written
- [ ] POST /api/pdf/generate calls Groq with structured JSON prompt
- [ ] JSON response safely parsed (strips code fences)
- [ ] buildPDF() creates styled PDF with header, questions, answer key
- [ ] PDF streamed as binary response (not JSON)
- [ ] Frontend receives blob and triggers file download
- [ ] GET /api/pdf/history returns user's generated assignments
- [ ] Grade level and assignment type affect the prompt
- [ ] Loading state shown during generation (takes 5-10 seconds)
- [ ] Error shown if JSON parsing fails
