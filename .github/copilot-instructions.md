---
description: "TutorAI — AI-powered tutoring platform. React 19 + React Router v7 + Vite 6 + TailwindCSS 3 frontend at repo root. Express + Mongoose + Groq SDK + pdfkit backend in server/ subfolder."
applyTo: "**"
---

# TutorAI — Copilot Workspace Instructions

always follow these instructions when generating code for this repo. If you find any contradictions or missing information, ask for clarification before proceeding.
and start your work with a message rules loaded.
after completing a task verify it , and then move to the next one.

## Actual Repo Structure (verified from GitHub)

```
TUTOR-AI/                          ← repo root
├── src/                           ← React app lives HERE (no client/ subfolder)
│   ├── main.jsx                   ← Vite entry
│   ├── App.jsx                    ← Router + PrivateRoute + PublicRoute
│   ├── index.css                  ← @tailwind + Google Fonts imports
│   ├── context/
│   │   └── AuthContext.jsx        ← React 19 use() based auth context
│   ├── components/
│   │   ├── Sidebar.jsx            ← active route via useLocation()
│   │   └── three/                 ← bonus 3D components (optional)
│   └── pages/
│       ├── Onboarding.jsx         ← landing page
│       ├── Signin.jsx             ← login form
│       ├── Signup.jsx             ← register form
│       ├── Chat.jsx               ← AI chat interface
│       ├── Quiz.jsx               ← quiz generator
│       └── PDFGenerator.jsx       ← PDF creator
├── server/                        ← Express backend (MISSING — create this folder)
│   ├── index.js
│   ├── package.json               ← separate from root package.json
│   ├── .env                       ← NEVER commit this
│   ├── .env.example               ← commit this (no real values)
│   ├── models/                    ← User, ChatHistory, Document, QuizResult, Assignment
│   ├── routes/                    ← auth, chat, quiz, pdf
│   ├── rag/                       ← retriever.js + seeder.js + documents/
│   ├── services/                  ← groqClient.js + pdfBuilder.js
│   └── middleware/                ← authMiddleware.js
├── index.html                     ✓ exists
├── package.json                   ✓ exists (frontend deps)
├── vite.config.js                 ✓ exists (add /api proxy)
├── tailwind.config.js             ✓ exists
├── postcss.config.js              ✓ exists
└── .github/
    └── copilot-instructions.md    ✓ this file
```

---

## Exact Package Versions (from actual package.json)

### Frontend (root package.json — already installed)
```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^7.1.1",
  "vite": "^6.0.5",
  "tailwindcss": "^3.4.17",
  "@vitejs/plugin-react": "^4.3.4"
}
```

### Still needs installing (run at repo root)
```bash
npm install framer-motion
```

### Backend (run inside server/ folder)
```bash
cd server
npm init -y
npm install express mongoose groq-sdk pdfkit bcryptjs jsonwebtoken dotenv cors
npm install --save-dev nodemon
```

---

## Critical Rules (Never Violate)

- **Never** call Groq API from frontend — all AI calls go through Express routes in `server/`
- **Never** generate PDFs in the browser — `pdfkit` server-side only
- **Never** hardcode secrets — all keys/URIs live in `server/.env`
- **Never** commit `server/.env` — verify `.gitignore` has it listed
- **Always** call `retrieve(query)` from `server/rag/retriever.js` before every Groq call
- **Always** attach `Authorization: Bearer ${token}` on every protected fetch
- **Always** protect backend routes with `authMiddleware`
- **Always** use TailwindCSS for styling — no inline styles, no CSS modules
- **Always** use Framer Motion for complex animations — no raw `@keyframes` for transitions
- **React Router v7** — JSX-based API still works; see routing section below

---

## Environment Variables

### `server/.env` (local only — never push)
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai_tutor
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
GROQ_API_KEY=gsk_<your_key_from_console.groq.com>
NODE_ENV=development
```

### `server/.env.example` (safe to push)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai_tutor
JWT_SECRET=your_jwt_secret_here
GROQ_API_KEY=gsk_your_groq_key_here
NODE_ENV=development
```

---

## Vite Config — Required API Proxy

Add to `vite.config.js` at repo root:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

Without this, every `fetch('/api/...')` call from the frontend fails with CORS errors.

---

## React 19 Patterns

### use() for context (replaces useContext)
```jsx
// AuthContext.jsx — export the raw context
export const AuthContext = createContext(null);

// In any component — React 19 use() replaces useContext()
import { use } from 'react';
import { AuthContext } from '../context/AuthContext';

function MyComponent() {
  const { user, token } = use(AuthContext);
}
```

### useActionState for form submissions (replaces useState + manual submit handler)
```jsx
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

// Action receives (prevState, formData) — return new state
async function loginAction(prevState, formData) {
  const email    = formData.get('email');
  const password = formData.get('password');
  const res  = await fetch('/api/auth/login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error };
  return { success: true, data };
}

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <form action={formAction}>
      <input name="email"    type="email"    required />
      <input name="password" type="password" required />
      {state?.error && <p className="text-error text-sm">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}

// useFormStatus MUST be in a child component — not in the form itself
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#bd9dff] to-[#8a4cfc] text-[#000000] font-bold disabled:opacity-40">
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  );
}
```

### When to use which pattern
| Scenario | Hook |
|---|---|
| Form submission (login, register, generate quiz, PDF) | `useActionState` |
| UI state (messages, current question, selected answer) | `useState` |
| Submit button loading state | `useFormStatus` in a child component |
| Non-form async (e.g. sending a chat message on Enter key) | `useState` + async function |
| Reading auth context in any component | `use(AuthContext)` |

---

## React Router v7 Patterns

React Router v7 is installed as `react-router-dom` (same package, `^7.1.1`).
The JSX-based `<BrowserRouter>` API still works — no migration needed.

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { use } from 'react';
import { AuthContext } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { token } = use(AuthContext);
  return token ? children : <Navigate to="/signin" replace />;
}

function PublicRoute({ children }) {
  const { token } = use(AuthContext);
  return !token ? children : <Navigate to="/chat" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"       element={<Onboarding />} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/signin" element={<PublicRoute><Signin /></PublicRoute>} />
          <Route path="/chat"   element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/quiz"   element={<PrivateRoute><Quiz /></PrivateRoute>} />
          <Route path="/pdf"    element={<PrivateRoute><PDFGenerator /></PrivateRoute>} />
          <Route path="*"       element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Navigation in components
import { useNavigate, useLocation, Link } from 'react-router-dom';

// Sidebar — detect active route
const { pathname } = useLocation();
const isActive = (path) => pathname === path;

// Programmatic navigation
const navigate = useNavigate();
navigate('/chat');
```

---

## Auth Pattern

### Frontend
```jsx
import { use } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function MyPage() {
  const { user, token, logout } = use(AuthContext);

  const fetchProtected = async () => {
    const res = await fetch('/api/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,    // ← always include
      },
      body: JSON.stringify({ payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };
}
```

### Backend — always use `authMiddleware` on protected routes
```js
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;   // ← decoded from JWT by middleware
});
```

---

## Groq API Pattern

```js
const groq     = require('../services/groqClient');
const retrieve = require('../rag/retriever');

async function callGroq(userQuery, topic) {
  const ragContext = await retrieve(userQuery);    // ← NEVER skip

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',                 // chat/quiz; use 70b for PDF
    messages: [
      {
        role: 'system',
        content: `You are an expert AI tutor specialising in ${topic}.
Use this context to answer accurately:
${ragContext || 'No specific context found — use your general knowledge.'}`,
      },
      { role: 'user', content: userQuery },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
}
```

| Route | Model |
|---|---|
| `routes/chat.js` | `llama-3.1-8b-instant` |
| `routes/quiz.js` | `llama-3.1-8b-instant` |
| `routes/pdf.js`  | `llama-3.3-70b-versatile` |

---

## RAG Pattern

```js
const retrieve = require('../rag/retriever');
// Returns top 3 matching doc chunks as a formatted string, or '' if nothing found

const ragContext = await retrieve(userQuery);
// Inject into Groq system prompt — always handle the empty string case gracefully
```

---

## Quiz JSON Safety Pattern

```js
const raw     = completion.choices[0].message.content.trim();
const cleaned = raw.replace(/```json\n?|```/g, '').trim();

let questions;
try {
  questions = JSON.parse(cleaned);
} catch (e) {
  console.error('Groq returned invalid JSON:', raw);
  return res.status(500).json({ error: 'AI returned invalid format. Try a different topic.' });
}

if (!Array.isArray(questions) || questions.length !== 5) {
  return res.status(500).json({ error: 'Unexpected question count. Please retry.' });
}
```

---

## PDF Stream Pattern

```js
// Always stream PDF — never write to disk
buildPDF(parsedContent, { topic, gradeLevel, type: assignmentType }, res);
// buildPDF sets Content-Type: application/pdf and streams via doc.pipe(res)

// Frontend blob download
const res  = await fetch('/api/pdf/generate', { method: 'POST', headers, body });
if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
const blob = await res.blob();
const url  = URL.createObjectURL(blob);
const a    = document.createElement('a');
a.href = url; a.download = `assignment-${topic}.pdf`; a.click();
URL.revokeObjectURL(url);
```

---

## Mongoose Schema Pattern

```js
const schema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Always scope queries to the authenticated user
const results = await Model.find({ userId: req.user.id }).sort({ createdAt: -1 });
```

---

## TailwindCSS Color Reference

| Token | Hex | Use |
|---|---|---|
| `primary` | `#bd9dff` | Accent, active nav, links |
| `primary-dim` | `#8a4cfc` | Gradient end, hover darken |
| `secondary` | `#a88cfb` | Secondary text, muted icons |
| `tertiary` | `#ff97b2` | Status dots, highlights |
| `surface` | `#0d0d18` | Page background |
| `surface-container-low` | `#12121e` | Sidebar background |
| `surface-container-high` | `#1e1e2d` | Cards, chat bubbles |
| `surface-container-highest` | `#242434` | Inputs, dropdowns |
| `surface-bright` | `#2b2a3c` | Card hover state |
| `on-surface` | `#e9e6f7` | Primary body text |
| `on-surface-variant` | `#aba9b9` | Muted / label text |
| `outline-variant` | `#474754` | Borders, dividers |
| `error` | `#ff6e84` | Error text |

**Primary gradient + correct text color:**
```
bg-gradient-to-r from-[#bd9dff] to-[#8a4cfc] text-[#000000]
```
Use `text-[#000000]` not `text-white` — the light purple gradient has poor contrast with white.

---

## API Response Conventions

```js
res.status(200).json({ data: result });           // success with data
res.status(201).json({ message: 'Created', id }); // resource created
res.status(400).json({ error: 'Bad request' });   // validation failure
res.status(401).json({ error: 'No token' });      // missing auth
res.status(403).json({ error: 'Invalid token' }); // bad/expired JWT
res.status(500).json({ error: 'Server error' });  // unexpected failure
```

Frontend always checks `data.error` key: `if (!res.ok) throw new Error(data.error)`

---

## Dev Commands

```bash
# Frontend — run at repo root
npm run dev                      # http://localhost:5173

# Backend — run inside server/
cd server && npm run dev         # http://localhost:5000 (nodemon)

# Seed RAG knowledge base — run once after server/ is set up
node server/rag/seeder.js

# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Module Plan Files

| File | What it covers |
|---|---|
| `01_onboarding_auth_plan.md` | User model, bcrypt, JWT, AuthContext, PrivateRoute |
| `02_ai_chat_plan.md` | Chat UI, Groq, ChatHistory model, topic selector |
| `03_rag_engine_plan.md` | Document model, seeder, retriever.js, 5 JSON files |
| `04_quiz_module_plan.md` | Quiz prompt, JSON parsing, QuizResult model, score screen |
| `05_pdf_generator_plan.md` | pdfBuilder.js, Groq content prompt, blob download |
| `06_3d_bonus_plan.md` | Three.js, React Three Fiber, BrainMesh, lazy load |

See `TODO.md` at repo root for the complete ordered build checklist.

---

*Last updated: March 2026 | Repo: github.com/piyushkumar0707/TUTOR-AI*
