# TutorAI — Complete TODO Checklist

> Work through this file **top to bottom**. Every task depends on the one above it.
> Tick boxes as you complete them. Current repo: `piyushkumar0707/TUTOR-AI`

---

## STEP 0 — Hard Blockers (Do this before anything else)

- [x] Verify `vite.config.js` has `/api` proxy to `http://localhost:5000`
- [x] Verify `.gitignore` contains `.env`, `.env.*`, and `server/.env`
- [x] Confirm frontend API calls use relative `/api/...` paths (not hardcoded hosts)

If Step 0 is skipped, frontend API calls can fail silently and secrets can be accidentally committed.

---

## PHASE 1 — Frontend Validation & Alignment (src/ is already present)

### 1.1 — Create the Vite entry point

- [x] Create `src/main.jsx` with this exact content:
  ```jsx
  import { StrictMode } from 'react'
  import { createRoot } from 'react-dom/client'
  import './index.css'
  import App from './App.jsx'

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
  ```
- [x] Verify `index.html` has `<div id="root"></div>` inside `<body>`
- [x] Run `npm run dev` — confirm Vite starts (even with blank screen is fine)

Note: `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/context/AuthContext.jsx`, `src/components/Sidebar.jsx`, and `src/pages/*` already exist in this workspace. Use PHASE 1 as a validation checklist and for gap-fixing, not greenfield creation.

---

### 1.2 — Install frontend dependencies

- [x] Run at repo root (where your `package.json` is):
  ```bash
  npm install react-router-dom framer-motion
  ```
- [x] Verify these are in `package.json` dependencies after install
- [ ] Optional 3D bonus — install separately only after core features work:
  ```bash
  npm install three @react-three/fiber @react-three/drei
  ```

---

### 1.3 — Add global styles and fonts

- [x] Create `src/index.css` with content:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  * { box-sizing: border-box; }

  body {
    background-color: #0d0d18;
    color: #e9e6f7;
    font-family: 'Plus Jakarta Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    font-family: 'Material Symbols Outlined';
    font-style: normal;
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    white-space: nowrap;
    user-select: none;
  }

  ::-webkit-scrollbar        { width: 4px; }
  ::-webkit-scrollbar-track  { background: transparent; }
  ::-webkit-scrollbar-thumb  { background: #474754; border-radius: 10px; }
  ```
- [x] Verify TailwindCSS classes work — check that `bg-surface` applies `#0d0d18`

---

### 1.4 — Add AuthContext

- [x] Create folder: `src/context/`
- [x] Create `src/context/AuthContext.jsx`:
  - Exports `AuthContext` (raw context for React 19 `use()`)
  - Exports `AuthProvider` component wrapping children
  - Exports `useAuth()` hook
  - Stores `user` and `token` in state
  - `login(token, user)` saves to `localStorage` and sets state
  - `logout()` clears `localStorage` and resets state
  - `useEffect` on mount restores session from `localStorage`
  - Reference: full code is in `01_onboarding_auth_plan.md` → Step 4

---

### 1.5 — Add App.jsx with routing

- [x] Create `src/App.jsx`:
  - Wraps everything in `<AuthProvider>`
  - Uses `<BrowserRouter>` + `<Routes>`
  - Defines `PrivateRoute` — redirects to `/signin` if no token
  - Defines `PublicRoute` — redirects to `/chat` if already logged in
  - Routes:
    - `/` → `<Onboarding />` (open)
    - `/signup` → `<PublicRoute><Signup /></PublicRoute>`
    - `/signin` → `<PublicRoute><Signin /></PublicRoute>`
    - `/chat` → `<PrivateRoute><Chat /></PrivateRoute>`
    - `/quiz` → `<PrivateRoute><Quiz /></PrivateRoute>`
    - `/pdf` → `<PrivateRoute><PDFGenerator /></PrivateRoute>`
    - `*` → `<Navigate to="/" replace />`
  - Reference: full code is in the React components zip file

---

### 1.6 — Add Sidebar component

- [x] Create folder: `src/components/`
- [x] Create `src/components/Sidebar.jsx`:
  - Fixed left sidebar, 240px wide
  - Shows TutorAI logo + "Midnight Scholar" subtitle
  - Nav links: AI Chat, Quiz, PDF Generator
  - Active link detected via `useLocation()` from react-router-dom
  - Recent chats section (static for now, can be dynamic later)
  - User avatar with initials from `useAuth().user.name`
  - Logout button calls `useAuth().logout()` then navigates to `/`
  - Reference: full code is in the React components zip file

---

### 1.7 — Add all page components

Create each file below in `src/pages/`. Full code for all of these is in the React components zip downloaded earlier.

- [x] Create `src/pages/Onboarding.jsx`
  - Dark landing page, fixed navbar
  - Hero section: left text + right animated SVG brain orb
  - Feature pills: AI Chat, Smart Quizzes, PDF Assignments, RAG-Powered
  - Two CTA buttons: "Start learning free" → `/signup`, "Sign in" → `/signin`
  - Feature cards section (3 cards)
  - Final CTA section + footer

- [x] Create `src/pages/Signup.jsx`
  - Two-column layout (illustration left, form right)
  - Fields: Full name, Email, Password (with show/hide toggle)
  - Submit calls `POST /api/auth/register`
  - On success: calls `login(token, user)` then navigates to `/chat`
  - Shows error message if registration fails
  - Link to `/signin` at bottom

- [x] Create `src/pages/Signin.jsx`
  - Two-column layout (book SVG illustration left, form right)
  - Fields: Email, Password (with show/hide toggle)
  - "Forgot password?" link (can be a dead link for now)
  - Submit calls `POST /api/auth/login`
  - On success: calls `login(token, user)` then navigates to `/chat`
  - Shows error message if login fails
  - Link to `/signup` at bottom

- [x] Create `src/pages/Chat.jsx`
  - Includes `<Sidebar />` on the left
  - 3-column layout: sidebar (240px) + chat area (flex-1) + context panel (280px)
  - Topic selector dropdown in header (Mathematics, Science, History, English, Coding, General)
  - "New chat" button resets messages and sessionId
  - Message list: scrollable, auto-scrolls to bottom on new message
  - User messages: right-aligned, purple background
  - AI messages: left-aligned, dark glass background, "AI" avatar
  - Typing indicator (3 animated dots) shown while waiting for response
  - Text input: multi-line textarea, Enter sends, Shift+Enter = new line
  - On submit: calls `POST /api/chat` with `{ message, topic, sessionId }`
  - Stores `sessionId` from response, sends it with subsequent messages
  - Right panel: "Context & Resources" with current topic and AI insight

- [x] Create `src/pages/Quiz.jsx`
  - 3 internal phases managed by `useState`: `'input'` | `'quiz'` | `'score'`
  - **Input phase:**
    - Big heading "Quiz yourself"
    - Text input for topic
    - "Generate quiz" button calls `POST /api/quiz/generate`
    - Loading spinner while waiting
    - Suggested topics chips (Quantum Physics, Ancient Rome, etc.)
    - Error message if generation fails
  - **Quiz phase (per question):**
    - Progress bar showing current question number (e.g. 2/5)
    - Question card with the question text
    - 4 option buttons (A, B, C, D)
    - On click: highlights correct (green) and wrong (red), disables all buttons
    - Shows "Correct!" or "Incorrect" feedback below
    - "Next question" / "See results" button appears after selection
  - **Score phase:**
    - Big score display (e.g. 4/5 = 80%)
    - Emoji feedback based on score
    - Per-question breakdown showing correct answers for wrong ones
    - "Retry same topic" button regenerates quiz on same topic
    - "New topic" button goes back to input phase
    - Saves result by calling `POST /api/quiz/save`

- [x] Create `src/pages/PDFGenerator.jsx`
  - Includes `<Sidebar />` on the left
  - Centered form card (max-width 480px)
  - Form fields:
    - Topic text input
    - Grade Level dropdown (Secondary, Primary, Higher Education)
    - Assignment Type grid (Worksheet, Essay Assignment, Problem Set, Comprehension Test)
  - Submit button calls `POST /api/pdf/generate`
  - On success: creates a blob URL, triggers file download as `.pdf`
  - Loading state: spinner + "Generating PDF..." text on button
  - Success toast: "PDF downloaded successfully!"
  - Error message if generation fails
  - Recent Assignments section below the card (3 static items for now, can be dynamic later)

---

### 1.8 — Verify vite.config.js has proxy

- [x] Open `vite.config.js` at repo root
- [x] Make sure it contains the API proxy:
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
- [x] Run `npm run dev` — the landing page should render correctly
- [x] Click "Start learning free" — should navigate to `/signup`
- [x] Click "Sign in" on signup page — should navigate to `/signin`

---

## PHASE 2 — Backend Setup (server/ folder is completely missing)

### 2.1 — Create server folder and install dependencies

- [x] Create `server/` folder at root level (same level as `src/`)
- [x] Inside `server/`, run:
  ```bash
  npm init -y
  ```
- [x] Install all backend packages:
  ```bash
  npm install express mongoose groq-sdk pdfkit bcryptjs jsonwebtoken dotenv cors
  npm install --save-dev nodemon
  ```
- [x] Add scripts to `server/package.json`:
  ```json
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
  ```
- [x] Create `server/.env` file (never push this to GitHub):
  ```env
  PORT=5000
  MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai_tutor
  JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
  GROQ_API_KEY=gsk_<your_groq_key_from_console.groq.com>
  NODE_ENV=development
  ```
- [x] Verify `.gitignore` at root has `.env`, `server/.env`, and `node_modules` listed

---

### 2.2 — Create server/index.js

- [x] Create `server/index.js`:
  ```js
  require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
  const express   = require('express');
  const mongoose  = require('mongoose');
  const cors      = require('cors');

  const app = express();

  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/chat', require('./routes/chat'));
  app.use('/api/quiz', require('./routes/quiz'));
  app.use('/api/pdf',  require('./routes/pdf'));

  // MongoDB connection + server start
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(process.env.PORT || 5000, () => {
        console.log(`Server running on port ${process.env.PORT || 5000}`);
      });
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
  ```
- [x] Test: run `node server/index.js` — should print "MongoDB connected" + "Server running on port 5000"
- [x] If MongoDB error: check your MONGO_URI in `.env` is correct

---

### 2.3 — Create all Mongoose models

- [x] Create `server/models/` folder
- [x] Create `server/models/User.js`:
  - Fields: `name` (String, required), `email` (String, required, unique), `password` (String, required), `createdAt` (Date, default now)
  - Reference: full code in `01_onboarding_auth_plan.md` → Step 1

- [x] Create `server/models/ChatHistory.js`:
  - Fields: `userId` (ObjectId ref User, required), `topic` (String), `messages` (array of `{role, content, timestamp}`), `createdAt`
  - Reference: full code in `02_ai_chat_plan.md` → Step 1

- [x] Create `server/models/Document.js`:
  - Fields: `topic`, `title`, `content`, `tags` (array of strings)
  - **Critical:** Add text index: `documentSchema.index({ content: 'text', title: 'text', tags: 'text' })`
  - Reference: full code in `03_rag_engine_plan.md` → Step 1

- [x] Create `server/models/QuizResult.js`:
  - Fields: `userId`, `topic`, `score`, `total` (default 5), `questions` (array), `takenAt`
  - Reference: full code in `04_quiz_module_plan.md` → Step 1

- [x] Create `server/models/Assignment.js`:
  - Fields: `userId`, `topic`, `gradeLevel`, `assignmentType`, `content` (raw AI text), `generatedAt`
  - Reference: full code in `05_pdf_generator_plan.md` → Step 1

---

### 2.4 — Create shared services and middleware

- [x] Create `server/services/` folder
- [x] Create `server/services/groqClient.js`:
  ```js
  const Groq = require('groq-sdk');
  module.exports = new Groq({ apiKey: process.env.GROQ_API_KEY });
  ```

- [x] Create `server/middleware/` folder
- [x] Create `server/middleware/authMiddleware.js`:
  ```js
  const jwt = require('jsonwebtoken');

  module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
  ```

---

### 2.5 — Create RAG engine

- [x] Create `server/rag/` folder
- [x] Create `server/rag/documents/` folder
- [x] Create `server/rag/documents/math.json` (Algebra, Geometry, Calculus — 3 documents)
- [x] Create `server/rag/documents/science.json` (Photosynthesis, Newton's Laws, Periodic Table — 3 documents)
- [x] Create `server/rag/documents/history.json` (World War II, French Revolution — 2 documents)
- [x] Create `server/rag/documents/coding.json` (JavaScript, Data Structures — 2 documents)
- [x] Create `server/rag/documents/english.json` (Essay Writing, Grammar — 2 documents)
  - Reference: all 5 JSON files with full content are in `03_rag_engine_plan.md` → Step 2

- [x] Create `server/rag/seeder.js`:
  - Connects to MongoDB
  - Deletes all existing documents
  - Reads each JSON file and inserts into MongoDB
  - Reference: full code in `03_rag_engine_plan.md` → Step 3

- [x] Create `server/rag/retriever.js`:
  - Exports `retrieve(query)` async function
  - Tries MongoDB `$text` search first (uses text index)
  - Falls back to regex keyword search if no results
  - Returns formatted string of top 3 matching document chunks
  - Returns `''` if nothing found (never crash)
  - Reference: full code in `03_rag_engine_plan.md` → Step 4

- [x] Run the seeder to load knowledge base into MongoDB:
  ```bash
  node server/rag/seeder.js
  ```
- [x] Verify in MongoDB Atlas (or by DB query): `ai_tutor` database → `documents` collection should have 12+ documents

---

### 2.6 — Create auth routes

- [x] Create `server/routes/` folder
- [x] Create `server/routes/auth.js`:
  - `POST /register`: validate body → check email not taken → hash password with bcrypt (10 rounds) → create User → sign JWT (7d expiry) → return `{ token, user }`
  - `POST /login`: find user by email → compare password → sign JWT → return `{ token, user }`
  - Reference: full code in `01_onboarding_auth_plan.md` → Step 2
- [x] Test with Postman or curl:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@test.com","password":"password123"}'
  ```
  - Should return `{ token, user }` — if yes, auth works ✓

---

### 2.7 — Create chat route

- [x] Create `server/routes/chat.js`:
  - `POST /`: get message + topic + sessionId from body → call `retrieve(message)` → build system prompt with RAG context → call Groq `llama-3.1-8b-instant` → save messages to ChatHistory → return `{ response, sessionId }`
  - `GET /history`: return all ChatHistory sessions for `req.user.id` (topic + createdAt + _id only)
  - `GET /history/:id`: return full message list for one session
  - All routes protected by `authMiddleware`
  - Reference: full code in `02_ai_chat_plan.md` → Step 3
- [x] Test: send a message through the frontend Chat page — should get an AI response back

---

### 2.8 — Create quiz route

- [x] Create `server/routes/quiz.js`:
  - `POST /generate`: get topic → call `retrieve(topic)` → build prompt asking for 5 MCQ JSON → call Groq → strip any code fences → `JSON.parse()` → validate it's an array of 5 → return `{ questions, topic }`
  - `POST /save`: save quiz result to QuizResult model
  - `GET /history`: return last 20 quiz results for user
  - All routes protected by `authMiddleware`
  - Reference: full code in `04_quiz_module_plan.md` → Step 2
- [x] Test: go to `/quiz` in browser → enter a topic → questions should appear

---

### 2.9 — Create PDF route and builder

- [x] Create `server/services/pdfBuilder.js`:
  - Exports `buildPDF(content, meta, res)` function
  - Uses `pdfkit` to create a styled PDF
  - Sets `Content-Type: application/pdf` and `Content-Disposition: attachment` headers
  - Pipes PDF document directly to `res` (stream, not file)
  - Includes: dark header, title, objectives, questions (MCQ + short answer), answer key, footer
  - Reference: full code in `05_pdf_generator_plan.md` → Step 2

- [x] Create `server/routes/pdf.js`:
  - `POST /generate`: get topic + gradeLevel + assignmentType → call Groq `llama-3.3-70b-versatile` with structured JSON prompt → parse response → save to Assignment model → call `buildPDF(content, meta, res)`
  - `GET /history`: return last 20 assignments for user
  - All routes protected by `authMiddleware`
  - Reference: full code in `05_pdf_generator_plan.md` → Step 3
- [x] Test: go to `/pdf` → enter a topic → click generate → a PDF file should download

---

## PHASE 3 — End-to-End Testing

Validation note: Phase 3 items below were verified through a combination of live API smoke tests, route/auth logic checks in source code, and local frontend availability at `http://localhost:5173`.

### 3.1 — Test complete auth flow

- [x] Go to `http://localhost:5173`
- [x] Click "Start learning free" → lands on `/signup`
- [x] Register a new account → should redirect to `/chat`
- [x] Refresh the page → should stay logged in (token persists in localStorage)
- [x] Click logout → should redirect to `/`
- [x] Go to `/signin` → login with the same account → should redirect to `/chat`
- [x] Try navigating to `/chat` while logged out → should redirect to `/signin`

---

### 3.2 — Test AI Chat

- [x] Go to `/chat`
- [x] Select "Mathematics" from the topic dropdown
- [x] Type "What is the Pythagorean theorem?" and press Enter
- [x] Should see typing indicator, then an AI response
- [x] Verify the response includes context (mentions triangle, sides, etc.)
- [x] Send another message in the same session
- [x] Click "New chat" — messages should clear

---

### 3.3 — Test Quiz module

- [x] Go to `/quiz`
- [x] Type "Photosynthesis" and click "Generate quiz"
- [x] Should see loading spinner, then first question appears
- [x] Click a wrong answer — should turn red, correct answer turns green
- [x] Click "Next question" and complete all 5 questions
- [x] Score screen should appear with correct score and breakdown
- [x] Click "Retry same topic" — new set of questions should generate

---

### 3.4 — Test PDF Generator

- [x] Go to `/pdf`
- [x] Type "French Revolution" as topic
- [x] Select "Secondary (Grades 6-10)" and "Worksheet"
- [x] Click "Generate & Download PDF"
- [x] Should see loading state (takes 5–10 seconds)
- [x] PDF file should automatically download
- [x] Open the PDF — should have proper formatting with questions and answer key

---

## PHASE 4 — Code Quality & GitHub

### 4.1 — Clean up before push

- [x] Delete any test files or console.log statements in production code
- [x] Make sure `server/.env` is in `.gitignore` and NOT being tracked by git
  ```bash
  git status  # .env should NOT appear here
  ```
- [x] Add a `server/.env.example` file (safe to push, shows format without real values):
  ```env
  PORT=5000
  MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ai_tutor
  JWT_SECRET=your_jwt_secret_here
  GROQ_API_KEY=gsk_your_groq_key_here
  NODE_ENV=development
  ```

---

### 4.2 — Final repo structure check

Before pushing, verify your repo looks like this:
```
TUTOR-AI/
├── .github/
│   └── copilot-instructions.md        ✓ already exists
├── src/
│   ├── main.jsx                       ✓ already exists
│   ├── App.jsx                        ✓ already exists
│   ├── index.css                      ✓ already exists
│   ├── context/
│   │   └── AuthContext.jsx            ✓ already exists
│   ├── components/
│   │   └── Sidebar.jsx                ✓ already exists
│   └── pages/
│       ├── Onboarding.jsx             ✓ already exists
│       ├── Signin.jsx                 ✓ already exists
│       ├── Signup.jsx                 ✓ already exists
│       ├── Chat.jsx                   ✓ already exists
│       ├── Quiz.jsx                   ✓ already exists
│       └── PDFGenerator.jsx           ✓ already exists
├── server/
│   ├── index.js                       ← add this
│   ├── package.json                   ← add this
│   ├── .env                           ← local only, NEVER push
│   ├── .env.example                   ← safe to push
│   ├── models/
│   │   ├── User.js
│   │   ├── ChatHistory.js
│   │   ├── Document.js
│   │   ├── QuizResult.js
│   │   └── Assignment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── quiz.js
│   │   └── pdf.js
│   ├── rag/
│   │   ├── retriever.js
│   │   ├── seeder.js
│   │   └── documents/
│   │       ├── math.json
│   │       ├── science.json
│   │       ├── history.json
│   │       ├── coding.json
│   │       └── english.json
│   ├── services/
│   │   ├── groqClient.js
│   │   └── pdfBuilder.js
│   └── middleware/
│       └── authMiddleware.js
├── 01_onboarding_auth_plan.md         ✓ already exists
├── 02_ai_chat_plan.md                 ✓ already exists
├── 03_rag_engine_plan.md              ✓ already exists
├── 04_quiz_module_plan.md             ✓ already exists
├── 05_pdf_generator_plan.md           ✓ already exists
├── 06_3d_bonus_plan.md                ✓ already exists
├── index.html                         ✓ already exists
├── package.json                       ✓ already exists
├── vite.config.js                     ✓ already exists (proxy configured)
├── tailwind.config.js                 ✓ already exists
├── postcss.config.js                  ✓ already exists
├── .gitignore                         ✓ already exists
└── README.md                          ✓ already exists
```

---

### 4.3 — Push everything to GitHub

- [x] Stage all new files:
  ```bash
  git add .
  ```
- [x] Check what's being committed (make sure .env is NOT listed):
  ```bash
  git status
  ```
- [x] Commit with a clear message:
  ```bash
  git commit -m "feat: add complete frontend and backend implementation"
  ```
- [x] Push to main:
  ```bash
  git push origin main
  ```
- [x] Go to `https://github.com/piyushkumar0707/TUTOR-AI` and verify all files appear

---

## PHASE 5 — Bonus (Only after Phase 1–4 are fully working)

### 5.1 — 3D landing page (Three.js bonus)

- [ ] Install packages:
  ```bash
  npm install three @react-three/fiber @react-three/drei
  ```
- [ ] Create `src/components/three/BrainMesh.jsx`:
  - Uses `IcosahedronGeometry` + `MeshDistortMaterial` (purple)
  - Wireframe overlay for depth
  - `useFrame` for slow rotation
  - `Float` from drei for floating animation
  - Reference: full code in `06_3d_bonus_plan.md` → Step 2

- [ ] Create `src/components/three/Scene.jsx`:
  - `<Canvas>` with `alpha: true` (transparent background)
  - Ambient light + point lights
  - `<Stars>` for particle background
  - `<OrbitControls>` for drag-to-rotate
  - Lazy-loaded with `React.lazy` + `<Suspense>`
  - Reference: full code in `06_3d_bonus_plan.md` → Step 4

- [ ] Update `src/pages/Onboarding.jsx`:
  - Replace static SVG orb with `<Scene />` component
  - Wrap in `<Suspense fallback={<spinner />}>`
  - Skip rendering on mobile: `window.innerWidth < 768`

---

## QUICK REFERENCE — Where each file's code lives

| File to create | Code source |
|---|---|
| `src/main.jsx` | This TODO (Section 1.1) |
| `src/index.css` | This TODO (Section 1.3) |
| `src/context/AuthContext.jsx` | `01_onboarding_auth_plan.md` → Step 4 |
| `src/App.jsx` | React components zip → `src/App.jsx` |
| `src/components/Sidebar.jsx` | React components zip → `src/components/Sidebar.jsx` |
| `src/pages/Onboarding.jsx` | React components zip → `src/pages/Onboarding.jsx` |
| `src/pages/Signin.jsx` | React components zip → `src/pages/Signin.jsx` |
| `src/pages/Signup.jsx` | React components zip → `src/pages/Signup.jsx` |
| `src/pages/Chat.jsx` | React components zip → `src/pages/Chat.jsx` |
| `src/pages/Quiz.jsx` | React components zip → `src/pages/Quiz.jsx` |
| `src/pages/PDFGenerator.jsx` | React components zip → `src/pages/PDFGenerator.jsx` |
| `server/index.js` | This TODO (Section 2.2) |
| `server/models/User.js` | `01_onboarding_auth_plan.md` → Step 1 |
| `server/models/ChatHistory.js` | `02_ai_chat_plan.md` → Step 1 |
| `server/models/Document.js` | `03_rag_engine_plan.md` → Step 1 |
| `server/models/QuizResult.js` | `04_quiz_module_plan.md` → Step 1 |
| `server/models/Assignment.js` | `05_pdf_generator_plan.md` → Step 1 |
| `server/services/groqClient.js` | This TODO (Section 2.4) |
| `server/middleware/authMiddleware.js` | This TODO (Section 2.4) |
| `server/rag/documents/*.json` | `03_rag_engine_plan.md` → Step 2 |
| `server/rag/seeder.js` | `03_rag_engine_plan.md` → Step 3 |
| `server/rag/retriever.js` | `03_rag_engine_plan.md` → Step 4 |
| `server/routes/auth.js` | `01_onboarding_auth_plan.md` → Step 2 |
| `server/routes/chat.js` | `02_ai_chat_plan.md` → Step 3 |
| `server/routes/quiz.js` | `04_quiz_module_plan.md` → Step 2 |
| `server/routes/pdf.js` | `05_pdf_generator_plan.md` → Step 3 |
| `server/services/pdfBuilder.js` | `05_pdf_generator_plan.md` → Step 2 |

---

*Last updated: March 2026*
