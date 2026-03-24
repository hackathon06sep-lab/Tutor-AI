const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { sendPasswordResetEmail } = require('../services/mailer');

const router = express.Router();

const LOGIN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPasswordValidationError(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number';
  }
  return '';
}

function buildCookieBaseOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
}

function issueAuthCookie(res, userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('ai_tutor_token', token, { ...buildCookieBaseOptions(), maxAge: LOGIN_MAX_AGE_MS });
}

function buildResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedName || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (normalizedName.length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long' });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: normalizedName, email: normalizedEmail, password: hashed });

    issueAuthCookie(res, user._id.toString());

    return res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err?.code === 11000 && err?.keyPattern?.email) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ error: 'Invalid account details. Please check your inputs.' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Could not create account right now. Please try again.' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    issueAuthCookie(res, user._id.toString());

    return res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const genericMessage = 'If that email exists, a reset link has been sent.';

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: genericMessage });

    const { rawToken, hashedToken } = buildResetToken();
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    return res.status(200).json({ message: genericMessage });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Could not process password reset request' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Reset link is invalid or expired' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. Please sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('ai_tutor_token', buildCookieBaseOptions());
  return res.status(200).json({ message: 'Logged out' });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id name email');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Session check error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
