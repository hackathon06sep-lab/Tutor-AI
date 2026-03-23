# Module 2 — AI Chat

## Overview
A full-featured chat interface where users ask questions and receive AI-powered answers.
Uses **Groq API** (llama-3 model) for fast responses and **MongoDB** to store chat history per user.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React.js + TailwindCSS |
| AI API | Groq (`groq-sdk`) — llama3-8b-8192 |
| Backend | Node.js + Express |
| Database | MongoDB (Mongoose) — chat history |
| Auth | JWT middleware (from Module 1) |
| RAG | retriever.js from Module 3 |

---

## Folder Structure

```
/client/src
  /pages
    Chat.jsx              ← main chat page
  /components
    MessageBubble.jsx     ← individual message UI
    TypingIndicator.jsx   ← 3-dot animation
    TopicSelector.jsx     ← dropdown for topic

/server
  /models
    ChatHistory.js        ← MongoDB schema
  /routes
    chat.js               ← POST /api/chat
  /rag
    retriever.js          ← (from Module 3)
```

---

## Step 1 — MongoDB Chat History Model

**File:** `server/models/ChatHistory.js`

```js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatHistorySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic:     { type: String, default: 'General' },
  messages:  [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
```

---

## Step 2 — Groq API Setup

**Install:**
```bash
npm install groq-sdk
```

**File:** `server/services/groqClient.js`

```js
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

module.exports = groq;
```

**Add to `.env`:**
```
GROQ_API_KEY=gsk_your_groq_api_key_here
```

---

## Step 3 — Chat Route (Backend)

**File:** `server/routes/chat.js`

```js
const express     = require('express');
const groq        = require('../services/groqClient');
const retrieve    = require('../rag/retriever');
const ChatHistory = require('../models/ChatHistory');
const authMiddleware = require('../middleware/authMiddleware');
const router      = express.Router();

// POST /api/chat
router.post('/', authMiddleware, async (req, res) => {
  const { message, topic, sessionId } = req.body;
  const userId = req.user.id;

  try {
    // 1. Get RAG context
    const ragContext = await retrieve(message);

    // 2. Build system prompt
    const systemPrompt = `You are a helpful AI tutor specializing in ${topic || 'general education'}.
Use the following context to answer the student's question accurately:

CONTEXT:
${ragContext}

Be clear, educational, and encouraging. If the context doesn't cover the question, answer from your general knowledge.`;

    // 3. Call Groq API
    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: message }
      ],
      temperature: 0.7,
      max_tokens:  1024
    });

    const aiResponse = completion.choices[0].message.content;

    // 4. Save to MongoDB
    let chat = await ChatHistory.findById(sessionId);
    if (!chat) {
      chat = await ChatHistory.create({ userId, topic, messages: [] });
    }
    chat.messages.push({ role: 'user',      content: message });
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    res.json({
      response:  aiResponse,
      sessionId: chat._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

// GET /api/chat/history — fetch all sessions for user
router.get('/history', authMiddleware, async (req, res) => {
  const sessions = await ChatHistory.find({ userId: req.user.id })
    .select('topic createdAt _id')
    .sort({ createdAt: -1 });
  res.json(sessions);
});

// GET /api/chat/history/:id — fetch one session's messages
router.get('/history/:id', authMiddleware, async (req, res) => {
  const chat = await ChatHistory.findById(req.params.id);
  if (!chat) return res.status(404).json({ error: 'Not found' });
  res.json(chat);
});

module.exports = router;
```

---

## Step 4 — MessageBubble Component

**File:** `client/src/components/MessageBubble.jsx`

```jsx
import { motion } from 'framer-motion';

export default function MessageBubble({ role, content, timestamp }) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-purple-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        {content}
        <p className="text-xs mt-1 opacity-50">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}
```

---

## Step 5 — Typing Indicator

**File:** `client/src/components/TypingIndicator.jsx`

```jsx
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-gray-800 rounded-2xl rounded-bl-sm w-16 mb-4">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
```

---

## Step 6 — Chat Page (Frontend)

**File:** `client/src/pages/Chat.jsx`

```jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';

const TOPICS = ['General', 'Mathematics', 'Science', 'History', 'English', 'Coding'];

export default function Chat() {
  const { token } = useAuth();
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [topic,     setTopic]     = useState('General');
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: input, topic, sessionId })
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-semibold">AI Tutor Chat</h1>
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="bg-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-lg border border-gray-700"
          >
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <button
          onClick={newChat}
          className="text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition"
        >
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-20">
            <p className="text-4xl mb-3">🎓</p>
            <p className="text-lg">Ask me anything about {topic}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} {...msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-800">
        <div className="flex items-end gap-3 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${topic}...`}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm resize-none focus:outline-none max-h-32"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>

    </div>
  );
}
```

---

## Step 7 — Register Route in Express

**File:** `server/index.js` (add this)

```js
const chatRoute = require('./routes/chat');
app.use('/api/chat', chatRoute);
```

---

## Environment Variables (additions)

```
GROQ_API_KEY=gsk_your_groq_api_key_here
```

Get your key at: https://console.groq.com

---

## NPM Packages

```bash
# Backend
npm install groq-sdk

# Frontend (already installed from Module 1)
# framer-motion, react-router-dom
```

---

## Groq Models Available

| Model | Speed | Best For |
|---|---|---|
| `llama3-8b-8192` | Fastest | Tutoring, Q&A |
| `llama3-70b-8192` | Slower, smarter | Complex explanations |
| `mixtral-8x7b-32768` | Fast, long context | Documents, long RAG context |

Recommended: **`llama3-8b-8192`** for speed, switch to `llama3-70b-8192` for better quality.

---

## Checklist

- [ ] ChatHistory MongoDB model created
- [ ] Groq SDK installed and configured
- [ ] POST /api/chat calls Groq with RAG context
- [ ] Chat history saved to MongoDB per session
- [ ] GET /api/chat/history returns user sessions
- [ ] MessageBubble renders user vs AI styles
- [ ] TypingIndicator shows while loading
- [ ] Topic selector changes system prompt
- [ ] Enter key submits message
- [ ] Auto-scroll to latest message
- [ ] New Chat button resets session
