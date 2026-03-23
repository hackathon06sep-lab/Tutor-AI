# Module 1 — Onboarding & Auth

## Overview
Build the landing page, sign-up, sign-in, and session management for the AI Tutor app.
Uses **MongoDB** for user storage and **JWT** for session tokens.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React.js + TailwindCSS |
| Animation | Framer Motion + SVG animations |
| Backend | Node.js + Express |
| Database | MongoDB (via Mongoose) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Routing | React Router v7 |

---

## Folder Structure

```
/src
    /pages
      Onboarding.jsx       ← animated landing page
      Signin.jsx           ← sign-in form
      Signup.jsx           ← sign-up form
    /components
      PrivateRoute.jsx     ← auth guard
      Sidebar.jsx          ← post-login navigation
      Navbar.jsx
    /context
      AuthContext.jsx      ← global auth state
    /assets
      hero.svg             ← SVG animation for landing
    /hooks
      useAuth.js           ← custom auth hook

/server
  /models
    User.js               ← Mongoose user schema
  /routes
    auth.js               ← /api/auth/register, /api/auth/login
  /middleware
    authMiddleware.js     ← JWT verify middleware
  .env
  index.js
```

---

## Step 1 — MongoDB User Model

**File:** `server/models/User.js`

```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
```

---

## Step 2 — Auth Routes (Register & Login)

**File:** `server/routes/auth.js`

```js
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const router   = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
```

---

## Step 3 — JWT Middleware

**File:** `server/middleware/authMiddleware.js`

```js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Step 4 — Auth Context (Frontend)

**File:** `src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai_tutor_token');
    const savedUser = localStorage.getItem('ai_tutor_user');
    if (saved) { setToken(saved); setUser(JSON.parse(savedUser)); }
  }, []);

  const login = (tokenVal, userData) => {
    localStorage.setItem('ai_tutor_token', tokenVal);
    localStorage.setItem('ai_tutor_user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## Step 5 — Protected Route

**File:** `src/components/PrivateRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/signin" replace />;
}
```

---

## Step 6 — Onboarding Page (Animated Landing)

**File:** `src/pages/Onboarding.jsx`

```jsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="flex flex-col md:flex-row items-center gap-16 max-w-5xl w-full">

        {/* Text side */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            Your AI Tutor,<br />
            <span className="text-purple-400">Always Ready</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Chat with AI, generate quizzes, create assignments — all powered by intelligent retrieval.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/signup')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              Get started
            </button>
            <button
              onClick={() => navigate('/signin')}
              className="border border-gray-600 text-gray-300 hover:bg-gray-800 px-6 py-3 rounded-xl transition"
            >
              Sign in
            </button>
          </div>
        </motion.div>

        {/* SVG / 3D side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 flex justify-center"
        >
          {/* Replace with hero.svg or Three.js Canvas */}
          <img src="/hero.svg" alt="AI Tutor" className="w-80" />
        </motion.div>

      </div>
    </div>
  );
}
```

---

## Step 7 — Sign Up Page

**File:** `src/pages/Signup.jsx`

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      login(data.token, data.user);
      navigate('/chat');
    } catch {
      setError('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Create account</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Full name" required
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <input
            type="email" placeholder="Email" required
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <input
            type="password" placeholder="Password" required
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition"
          >
            Create account
          </button>
        </form>
        <p className="text-gray-500 text-sm mt-4 text-center">
          Already have an account? <Link to="/signin" className="text-purple-400">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
```

---

## Step 8 — Sign In Page

**File:** `src/pages/Signin.jsx`

```jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Signin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      login(data.token, data.user);
      navigate('/chat');
    } catch {
      setError('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-800"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Welcome back</h2>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Email" required
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <input
            type="password" placeholder="Password" required
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition"
          >
            Sign in
          </button>
        </form>
        <p className="text-gray-500 text-sm mt-4 text-center">
          No account? <Link to="/signup" className="text-purple-400">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
```

---

## Step 9 — React Router Setup

**File:** `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Onboarding from './pages/Onboarding';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Quiz from './pages/Quiz';
import PDFGenerator from './pages/PDFGenerator';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<Onboarding />} />
          <Route path="/signin"  element={<Signin />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/chat"    element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/quiz"    element={<PrivateRoute><Quiz /></PrivateRoute>} />
          <Route path="/pdf"     element={<PrivateRoute><PDFGenerator /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

---

## Environment Variables

**File:** `server/.env`

```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/ai_tutor
JWT_SECRET=your_super_secret_key_here
PORT=5000
```

---

## NPM Packages

```bash
# Backend
npm install express mongoose bcryptjs jsonwebtoken dotenv cors

# Frontend
npm install react-router-dom framer-motion
```

---

## Checklist

- [ ] MongoDB connected via Mongoose
- [ ] Register route hashes password and returns JWT
- [ ] Login route validates and returns JWT
- [ ] JWT middleware protects API routes
- [ ] AuthContext stores token in localStorage
- [ ] PrivateRoute redirects unauthenticated users
- [ ] Onboarding page has entrance animations
- [ ] Sign up / Sign in forms handle errors
- [ ] App.jsx has all routes wired up
