const express = require('express');
const groq = require('../services/groqClient');
const retrieve = require('../rag/retriever');
const ChatHistory = require('../models/ChatHistory');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { message, topic = 'General', sessionId } = req.body;
  const userId = req.user.id;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const ragContext = await retrieve(message);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI tutor specializing in ${topic}.
Use the following context to answer accurately:
${ragContext || 'No specific context found - use general knowledge when needed.'}`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices?.[0]?.message?.content?.trim() || 'I could not generate a response.';

    let chat = null;
    if (sessionId) {
      chat = await ChatHistory.findOne({ _id: sessionId, userId });
    }

    if (!chat) {
      chat = await ChatHistory.create({ userId, topic, messages: [] });
    }

    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'assistant', content: aiResponse });
    await chat.save();

    return res.status(200).json({ response: aiResponse, sessionId: chat._id });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Chat failed' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user.id })
      .select('topic createdAt _id')
      .sort({ createdAt: -1 });

    return res.status(200).json(sessions);
  } catch (err) {
    console.error('Chat history error:', err);
    return res.status(500).json({ error: 'Failed to load chat history' });
  }
});

router.get('/history/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await ChatHistory.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json(chat);
  } catch (err) {
    console.error('Chat session error:', err);
    return res.status(500).json({ error: 'Failed to load session' });
  }
});

module.exports = router;
