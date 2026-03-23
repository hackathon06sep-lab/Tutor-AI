---
description: "TutorAI — AI-powered tutoring platform built with React 18, Node.js/Express, Groq API (llama3), and MongoDB Atlas"
applyTo: "**"
---

# TutorAI — Copilot Workspace Instructions

**Stack:** React 18 · Vite · TailwindCSS · Framer Motion · Express · Mongoose · Groq SDK · pdfkit  
**Auth:** JWT (jsonwebtoken + bcryptjs) stored in localStorage via AuthContext  
**AI:** Groq API — llama3-8b-8192 (chat/quiz) · llama3-70b-8192 (PDF long-form)  
**RAG:** MongoDB $text search via `server/rag/retriever.js` — injected into every Groq call

---

## Critical Rules (Never Violate)

- **Never** hardcode API keys, secrets, or URLs — always use `process.env.*`
- **Never** call Groq API from the frontend — all AI calls go through Express routes
- **Never** generate PDFs in-browser — use `pdfkit` server-side only
- **Always** run `retrieve(query)` from `server/rag/retriever.js` before every Groq call
- **Always** attach `Authorization: Bearer ${token}` header on protected fetch calls
- **Always** protect backend routes with `authMiddleware` from `server/middleware/authMiddleware.js`
- **Always** use TailwindCSS for styling — no inline styles, no CSS modules
- **Always** use Framer Motion for animations — no raw CSS `@keyframes` for transitions

---

## Project Structure

```
tutorai/
├── client/                         # Vite + React 18
│   ├── src/
│   │   ├── App.jsx                 # BrowserRouter + PrivateRoute + PublicRoute
│   │   ├── index.css               # @tailwind directives + Google Fonts imports
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # { user, token, login(), logout() }
│   │   ├── components/
│   │   │   ├── Sidebar.jsx         # Active route via useLocation(); links to /chat /quiz /pdf
│   │   │   └── three/
│   │   │       ├── Scene.jsx       # Canvas + lights + OrbitControls
│   │   │       └── BrainMesh.jsx   # IcosahedronGeometry + Float + useFrame
│   │   └── pages/
│   │       ├── Onboarding.jsx      # Landing — SVG brain orb + feature cards
│   │       ├── Signin.jsx          # POST /api/auth/login → login() → /chat
│   │       ├── Signup.jsx          # POST /api/auth/register → login() → /chat
│   │       ├── Chat.jsx            # 3-panel: Sidebar + chat + context panel
│   │       ├── Quiz.jsx            # 3 phases: 'input' | 'quiz' | 'score'
│   │       └── PDFGenerator.jsx    # Form → POST → blob download
│   ├── tailwind.config.js          # Full Midnight Scholar color palette
│   └── vite.config.js              # proxy: { '/api': 'http://localhost:5000' }
│
└── server/                         # Express REST API
    ├── index.js                    # app.listen; mounts all routes
    ├── models/
    │   ├── User.js                 # name, email, password(hashed), createdAt
    │   ├── ChatHistory.js          # userId, topic, messages[], createdAt
    │   ├── Document.js             # topic, title, content, tags — text-indexed
    │   ├── QuizResult.js           # userId, topic, score, total, questions[], takenAt
    │   └── Assignment.js           # userId, topic, gradeLevel, type, content, generatedAt
    ├── routes/
    │   ├── auth.js                 # POST /register  POST /login
    │   ├── chat.js                 # POST /  GET /history  GET /history/:id
    │   ├── quiz.js                 # POST /generate  POST /save  GET /history
    │   └── pdf.js                  # POST /generate  GET /history
    ├── rag/
    │   ├── retriever.js            # retrieve(query) → string (top 3 chunks)
    │   ├── seeder.js               # node rag/seeder.js → seeds MongoDB
    │   └── documents/              # math.json science.json history.json coding.json english.json
    ├── services/
    │   ├── groqClient.js           # new Groq({ apiKey: process.env.GROQ_API_KEY })
    │   └── pdfBuilder.js           # buildPDF(content, meta, res) — streams to response
    └── middleware/
        └── authMiddleware.js       # jwt.verify → attaches req.user = { id }
```

---

## Environment Variables

### `server/.env`
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai_tutor
JWT_SECRET=<random 32-byte hex string>
GROQ_API_KEY=gsk_<your_groq_key>
NODE_ENV=development
```

### `client/.env`
```env
VITE_API_URL=http://localhost:5000
```

> Generate JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`  
> Get Groq key: https://console.groq.com → API Keys  
> Get Mongo URI: MongoDB Atlas → Connect → Drivers

---

## Routing Rules

```jsx
// App.jsx pattern — always follow this
<Route path="/"       element={<Onboarding />} />                              // open
<Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />        // redirect to /chat if logged in
<Route path="/signin" element={<PublicRoute><Signin /></PublicRoute>} />        // redirect to /chat if logged in
<Route path="/chat"   element={<PrivateRoute><Chat /></PrivateRoute>} />        // redirect to /signin if not logged in
<Route path="/quiz"   element={<PrivateRoute><Quiz /></PrivateRoute>} />
<Route path="/pdf"    element={<PrivateRoute><PDFGenerator /></PrivateRoute>} />
```

---

## Auth Pattern

### Frontend — always use `useAuth()`
```jsx
import { useAuth } from '../context/AuthContext';

export default function MyPage() {
  const { user, token, logout } = useAuth();

  const fetchData = async () => {
    const res = await fetch('/api/some-route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,   // ← always include
      },
      body: JSON.stringify({ payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };
}
```

### Backend — always use `authMiddleware`
```js
// Every protected route must have authMiddleware as second argument
router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;   // ← decoded from JWT by middleware
  // ...
});
```

---

## Groq API Pattern

```js
// server/services/groqClient.js — import this, never instantiate inline
const groq = require('../services/groqClient');

// Standard call — always inject RAG context first
const retrieve = require('../rag/retriever');

async function callGroq(userQuery, topic) {
  const ragContext = await retrieve(userQuery);    // ← never skip this

  const completion = await groq.chat.completions.create({
    model: 'llama3-8b-8192',                      // fast; use 70b for PDF
    messages: [
      {
        role: 'system',
        content: `You are an AI tutor for ${topic}.
Context: ${ragContext || 'Answer from general knowledge.'}`,
      },
      { role: 'user', content: userQuery },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
}
```

| Use case | Model |
|---|---|
| AI Chat responses | `llama3-8b-8192` |
| Quiz generation (JSON) | `llama3-8b-8192` |
| PDF assignment content | `llama3-70b-8192` |

---

## RAG Pattern

```js
// Always call before Groq — in chat.js, quiz.js, and pdf.js
const retrieve = require('../rag/retriever');

const ragContext = await retrieve(userQuery);
// Returns: "[Mathematics — Algebra Basics]\ncontent...\n\n---\n\n[...]"
// Returns: "" if no match — handle gracefully (fall back to general knowledge)
```

**To add knowledge:** Create JSON in `server/rag/documents/topic.json`:
```json
[
  {
    "topic": "Physics",
    "title": "Thermodynamics",
    "tags": ["heat", "entropy", "temperature"],
    "content": "Full text content here..."
  }
]
```
Then re-run: `node server/rag/seeder.js`

---

## Mongoose Schema Pattern

```js
// All models must include timestamps and userId where applicable
const schema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topic:     { type: String, required: true },
  // ... feature-specific fields
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Always query by userId for user-scoped data
const results = await Model.find({ userId: req.user.id }).sort({ createdAt: -1 });
```

---

## React Component Pattern

```jsx
// Functional components only — no class components
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';           // all animations via Framer Motion
import { useAuth } from '../context/AuthContext';

export default function MyComponent({ prop }) {
  const { token } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Always track loading + error state for API calls
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/route', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container-high rounded-2xl p-6"  // TailwindCSS only
    >
      {loading && <Spinner />}
      {error   && <p className="text-error text-sm">{error}</p>}
      {data    && <Content data={data} />}
    </motion.div>
  );
}
```

---

## TailwindCSS Color Reference

These custom colors are defined in `tailwind.config.js`:

| Token | Hex | Use |
|---|---|---|
| `primary` | `#bd9dff` | Accent, active states, links |
| `primary-dim` | `#8a4cfc` | Gradient end, hover states |
| `secondary` | `#a88cfb` | Secondary text, icons |
| `tertiary` | `#ff97b2` | Status dots, highlights |
| `surface` | `#0d0d18` | Page background |
| `surface-container-low` | `#12121e` | Sidebar background |
| `surface-container-high` | `#1e1e2d` | Cards, chat bubbles |
| `surface-container-highest` | `#242434` | Inputs, dropdowns |
| `on-surface` | `#e9e6f7` | Primary text |
| `on-surface-variant` | `#aba9b9` | Muted/secondary text |
| `outline-variant` | `#474754` | Borders, dividers |
| `error` | `#ff6e84` | Error messages |

**Gradient shorthand** (used for buttons, logo bg):
```
bg-gradient-to-r from-[#bd9dff] to-[#8a4cfc]
```

---

## PDF Generation Pattern

```js
// server/services/pdfBuilder.js — always stream, never write to disk
const buildPDF = require('../services/pdfBuilder');

router.post('/generate', authMiddleware, async (req, res) => {
  const content = await getAIContent(req.body);  // call Groq first

  // buildPDF sets Content-Type and Content-Disposition headers, then streams
  buildPDF(content, { topic, gradeLevel, type }, res);
});

// Frontend — receive as blob and trigger download
const res  = await fetch('/api/pdf/generate', { method: 'POST', ... });
const blob = await res.blob();
const url  = URL.createObjectURL(blob);
const a    = document.createElement('a');
a.href     = url;
a.download = 'assignment.pdf';
a.click();
URL.revokeObjectURL(url);
```

---

## Quiz Generation Pattern

```js
// Always request strict JSON — strip code fences before parsing
const prompt = `Generate 5 MCQs about "${topic}". 
Return ONLY a JSON array, no markdown, no backticks:
[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"answer":"A) ..."}]`;

const raw     = completion.choices[0].message.content.trim();
const cleaned = raw.replace(/```json|```/g, '').trim();
const questions = JSON.parse(cleaned);   // wrap in try/catch

if (!Array.isArray(questions) || questions.length !== 5) {
  throw new Error('Invalid question format');
}
```

---

## API Response Conventions

```js
// Success
res.status(200).json({ data: result });
res.status(201).json({ message: 'Created', id: doc._id });

// Error
res.status(400).json({ error: 'Validation message' });
res.status(401).json({ error: 'No token' });
res.status(403).json({ error: 'Invalid token' });
res.status(500).json({ error: 'Server error' });
```

---

## Common Tasks

### Add a new protected page
1. Create `src/pages/NewPage.jsx`
2. Add `<Route path="/new" element={<PrivateRoute><NewPage /></PrivateRoute>} />` in `App.jsx`
3. Add nav link in `Sidebar.jsx` `NAV_ITEMS` array
4. Use `useAuth()` for token in all API calls

### Add a new API route
1. Create handler in `server/routes/module.js`
2. Mount in `server/index.js`: `app.use('/api/module', require('./routes/module'))`
3. Protect with `authMiddleware`: `router.post('/', authMiddleware, handler)`
4. Call `retrieve()` before Groq if user input is involved

### Add RAG documents
1. Add JSON file to `server/rag/documents/`
2. Run `node server/rag/seeder.js`
3. Verify in MongoDB Atlas → `ai_tutor` → `documents` collection

---

## Module Plan Files

Detailed specs for each feature — reference before building:

| File | Covers |
|---|---|
| `01_onboarding_auth_plan.md` | User model, bcrypt, JWT, AuthContext, PrivateRoute |
| `02_ai_chat_plan.md` | Chat UI, Groq integration, ChatHistory model, streaming |
| `03_rag_engine_plan.md` | Document model, seeder, retriever.js, text index |
| `04_quiz_module_plan.md` | Quiz generation prompt, QuizResult model, score screen |
| `05_pdf_generator_plan.md` | pdfBuilder.js, Groq content prompt, blob download |
| `06_3d_bonus_plan.md` | Three.js, React Three Fiber, BrainMesh, performance |

---

*Last updated: March 2026*
