# Module 4 — Quiz Module

## Overview
Dynamically generates 5 multiple-choice questions on any topic using **Groq API**,
presents them one-by-one with animated feedback, and saves results to **MongoDB**.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React.js + TailwindCSS + Framer Motion |
| AI API | Groq (`llama3-8b-8192`) |
| Backend | Node.js + Express |
| Database | MongoDB (quiz results history) |
| Auth | JWT middleware |

---

## Folder Structure

```
/src
  /pages
    Quiz.jsx              ← main quiz page (topic input + questions + score)
  /components
    QuizCard.jsx          ← single question card with options
    ScoreScreen.jsx       ← results display after completion

/server
  /models
    QuizResult.js         ← MongoDB schema for quiz history
  /routes
    quiz.js               ← POST /api/quiz (generate) + GET /api/quiz/history
```

---

## Step 1 — MongoDB Quiz Result Model

**File:** `server/models/QuizResult.js`

```js
const mongoose = require('mongoose');

const questionResultSchema = new mongoose.Schema({
  question:       String,
  options:        [String],
  correctAnswer:  String,
  userAnswer:     String,
  isCorrect:      Boolean
});

const quizResultSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic:     { type: String, required: true },
  score:     { type: Number, required: true },
  total:     { type: Number, default: 5 },
  questions: [questionResultSchema],
  takenAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizResult', quizResultSchema);
```

---

## Step 2 — Quiz Generation Route (Backend)

**File:** `server/routes/quiz.js`

```js
const express    = require('express');
const groq       = require('../services/groqClient');
const retrieve   = require('../rag/retriever');
const QuizResult = require('../models/QuizResult');
const authMiddleware = require('../middleware/authMiddleware');
const router     = express.Router();

// POST /api/quiz/generate
router.post('/generate', authMiddleware, async (req, res) => {
  const { topic } = req.body;

  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  try {
    // Get RAG context for the topic
    const ragContext = await retrieve(topic);

    const prompt = `You are a quiz generator. Generate exactly 5 multiple-choice questions about "${topic}".
${ragContext ? `Use this context as reference:\n${ragContext}\n` : ''}

Return ONLY a valid JSON array. No markdown, no extra text, no backticks. Format:
[
  {
    "question": "What is ...?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "answer": "A) ..."
  }
]

Rules:
- Each question must have exactly 4 options labeled A), B), C), D)
- The answer must be the FULL option text (e.g., "A) Paris")
- Questions must be clear and educational
- Vary difficulty: 2 easy, 2 medium, 1 hard`;

    const completion = await groq.chat.completions.create({
      model:       'llama3-8b-8192',
      messages:    [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens:  1500
    });

    let raw = completion.choices[0].message.content.trim();

    // Strip markdown code fences if model adds them
    raw = raw.replace(/```json|```/g, '').trim();

    const questions = JSON.parse(raw);

    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error('Invalid question format from AI');
    }

    res.json({ questions, topic });
  } catch (err) {
    console.error('Quiz generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate quiz. Try a different topic.' });
  }
});

// POST /api/quiz/save — save completed quiz result
router.post('/save', authMiddleware, async (req, res) => {
  const { topic, score, questions } = req.body;
  try {
    const result = await QuizResult.create({
      userId: req.user.id,
      topic,
      score,
      total: 5,
      questions
    });
    res.json({ message: 'Saved', id: result._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save result' });
  }
});

// GET /api/quiz/history — get user's quiz history
router.get('/history', authMiddleware, async (req, res) => {
  const results = await QuizResult.find({ userId: req.user.id })
    .select('topic score total takenAt')
    .sort({ takenAt: -1 })
    .limit(20);
  res.json(results);
});

module.exports = router;
```

---

## Step 3 — Register Route in Express

**File:** `server/index.js` (add this)

```js
const quizRoute = require('./routes/quiz');
app.use('/api/quiz', quizRoute);
```

---

## Step 4 — QuizCard Component

**File:** `src/components/QuizCard.jsx`

```jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizCard({ question, options, answer, onNext, questionNumber, total }) {
  const [selected,  setSelected]  = useState(null);
  const [revealed,  setRevealed]  = useState(false);

  const handleSelect = (option) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
  };

  const getStyle = (option) => {
    if (!revealed) return 'border-gray-700 hover:border-purple-500 hover:bg-gray-800 cursor-pointer';
    if (option === answer)   return 'border-green-500 bg-green-500/10 text-green-300';
    if (option === selected) return 'border-red-500 bg-red-500/10 text-red-300';
    return 'border-gray-800 opacity-50';
  };

  return (
    <motion.div
      key={questionNumber}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="w-full max-w-2xl"
    >
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < questionNumber ? 'w-6 bg-purple-500' :
                i === questionNumber - 1 ? 'w-6 bg-purple-400' : 'w-6 bg-gray-700'
              }`}
            />
          ))}
        </div>
        <span className="text-gray-500 text-sm">{questionNumber}/{total}</span>
      </div>

      {/* Question */}
      <h2 className="text-white text-xl font-semibold mb-6 leading-relaxed">
        {question}
      </h2>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(option)}
            className={`w-full text-left px-5 py-4 rounded-xl border transition-all text-sm text-gray-200 ${getStyle(option)}`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Feedback + Next */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <p className={`text-sm font-medium ${selected === answer ? 'text-green-400' : 'text-red-400'}`}>
              {selected === answer ? 'Correct!' : `Correct answer: ${answer}`}
            </p>
            <button
              onClick={() => onNext(selected === answer)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              {questionNumber === total ? 'See results' : 'Next question'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

## Step 5 — Score Screen Component

**File:** `src/components/ScoreScreen.jsx`

```jsx
import { motion } from 'framer-motion';

const getFeedback = (score, total) => {
  const pct = score / total;
  if (pct === 1)   return { emoji: '🏆', msg: 'Perfect score! Outstanding!' };
  if (pct >= 0.8)  return { emoji: '🎉', msg: 'Excellent work!' };
  if (pct >= 0.6)  return { emoji: '👍', msg: 'Good job! Keep practising.' };
  if (pct >= 0.4)  return { emoji: '📚', msg: 'Not bad, but review the topic.' };
  return               { emoji: '💪', msg: "Keep studying — you'll get there!" };
};

export default function ScoreScreen({ score, total, topic, questions, onRetry, onNewTopic }) {
  const { emoji, msg } = getFeedback(score, total);
  const percentage     = Math.round((score / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl"
    >
      {/* Score card */}
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center mb-6">
        <p className="text-5xl mb-3">{emoji}</p>
        <h2 className="text-3xl font-bold text-white mb-1">{score}/{total}</h2>
        <p className="text-purple-400 text-lg font-medium mb-2">{percentage}%</p>
        <p className="text-gray-400">{msg}</p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3 mb-6">
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wide">Review</h3>
        {questions.map((q, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border text-sm ${
              q.isCorrect
                ? 'border-green-800 bg-green-900/20'
                : 'border-red-800 bg-red-900/20'
            }`}
          >
            <p className="text-gray-200 mb-1">{i + 1}. {q.question}</p>
            {!q.isCorrect && (
              <p className="text-green-400 text-xs">Correct: {q.correctAnswer}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition"
        >
          Retry same topic
        </button>
        <button
          onClick={onNewTopic}
          className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-3 rounded-xl font-medium transition"
        >
          New topic
        </button>
      </div>
    </motion.div>
  );
}
```

---

## Step 6 — Quiz Page (Main)

**File:** `src/pages/Quiz.jsx`

```jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import QuizCard from '../components/QuizCard';
import ScoreScreen from '../components/ScoreScreen';

export default function Quiz() {
  const { token }   = useAuth();
  const [phase,     setPhase]     = useState('input');   // input | loading | quiz | score
  const [topic,     setTopic]     = useState('');
  const [questions, setQuestions] = useState([]);
  const [current,   setCurrent]   = useState(0);
  const [score,     setScore]     = useState(0);
  const [answers,   setAnswers]   = useState([]);
  const [error,     setError]     = useState('');

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setPhase('loading');
    setError('');

    try {
      const res  = await fetch('/api/quiz/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ topic })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQuestions(data.questions);
      setCurrent(0);
      setScore(0);
      setAnswers([]);
      setPhase('quiz');
    } catch (err) {
      setError(err.message || 'Failed to generate quiz');
      setPhase('input');
    }
  };

  const handleNext = async (isCorrect) => {
    const newScore   = isCorrect ? score + 1 : score;
    const q          = questions[current];
    const newAnswers = [...answers, {
      question:      q.question,
      options:       q.options,
      correctAnswer: q.answer,
      userAnswer:    '', // captured in QuizCard
      isCorrect
    }];

    if (current + 1 >= questions.length) {
      setScore(newScore);
      setAnswers(newAnswers);
      setPhase('score');

      // Save to MongoDB
      await fetch('/api/quiz/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body:    JSON.stringify({ topic, score: newScore, questions: newAnswers })
      });
    } else {
      setScore(newScore);
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
    }
  };

  const reset = () => { setPhase('input'); setTopic(''); };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-10">

      <AnimatePresence mode="wait">

        {/* Input phase */}
        {phase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md text-center"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Quiz yourself</h1>
            <p className="text-gray-400 mb-8">Enter any topic and get 5 AI-generated questions</p>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <input
              type="text"
              placeholder="e.g. Photosynthesis, World War II, Algebra..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generateQuiz()}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500 mb-4 text-center"
            />
            <button
              onClick={generateQuiz}
              disabled={!topic.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white py-3 rounded-xl font-medium transition"
            >
              Generate quiz
            </button>
          </motion.div>
        )}

        {/* Loading phase */}
        {phase === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Generating your quiz on <span className="text-white font-medium">{topic}</span>...</p>
          </motion.div>
        )}

        {/* Quiz phase */}
        {phase === 'quiz' && questions[current] && (
          <motion.div key="quiz" className="flex justify-center w-full">
            <QuizCard
              question={questions[current].question}
              options={questions[current].options}
              answer={questions[current].answer}
              onNext={handleNext}
              questionNumber={current + 1}
              total={questions.length}
            />
          </motion.div>
        )}

        {/* Score phase */}
        {phase === 'score' && (
          <motion.div key="score" className="flex justify-center w-full">
            <ScoreScreen
              score={score}
              total={questions.length}
              topic={topic}
              questions={answers}
              onRetry={generateQuiz}
              onNewTopic={reset}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
```

---

## NPM Packages

```bash
# Backend (already installed from Module 2)
# groq-sdk, mongoose

# Frontend (already installed)
# framer-motion
```

---

## Checklist

- [ ] QuizResult MongoDB schema created
- [ ] POST /api/quiz/generate calls Groq with structured prompt
- [ ] JSON parsing handles model output safely (strips code fences)
- [ ] POST /api/quiz/save stores result to MongoDB
- [ ] GET /api/quiz/history returns user's past quizzes
- [ ] QuizCard shows correct/wrong highlight after selection
- [ ] Progress bar tracks current question
- [ ] ScoreScreen shows breakdown of all questions
- [ ] Retry button re-generates quiz on same topic
- [ ] New Topic button resets to input screen
