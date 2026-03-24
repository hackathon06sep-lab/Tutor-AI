const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

function toBool(value) {
  return String(value).toLowerCase() === 'true';
}

function shouldFailOpen() {
  // Default is fail-open to preserve generic forgot-password UX.
  // Set SMTP_FAIL_OPEN=false in production to fail when SMTP is unavailable.
  return String(process.env.SMTP_FAIL_OPEN || 'true').toLowerCase() === 'true';
}

function getTransporter() {
  if (transporter) return transporter;

  const hasSmtpConfig = process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: toBool(process.env.SMTP_SECURE),
      family: Number(process.env.SMTP_IP_FAMILY || 4),
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback for local development if SMTP is not configured.
  transporter = nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const from = process.env.SMTP_FROM || 'TutorAI <no-reply@tutorai.local>';

  const payload = {
    from,
    to,
    subject: 'TutorAI Password Reset',
    text: `You requested a password reset. Use this link within 30 minutes: ${resetUrl}`,
    html: `<p>You requested a password reset.</p><p>Use this link within 30 minutes:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  };

  try {
    const info = await getTransporter().sendMail(payload);

    if (!process.env.SMTP_HOST) {
      logger.info('SMTP not configured. Password reset email captured locally', { resetUrl });
    }

    return { delivered: true, info };
  } catch (error) {
    logger.warn('Password reset email delivery failed; using fallback transport', {
      error: error.message,
      code: error.code,
    });

    if (process.env.SMTP_HOST && !shouldFailOpen()) {
      throw error;
    }

    // Fallback keeps forgot-password endpoint functional even if SMTP provider is down.
    const fallbackTransport = nodemailer.createTransport({ jsonTransport: true });
    const fallbackInfo = await fallbackTransport.sendMail(payload);
    logger.info('Password reset email captured via fallback transport', { resetUrl });

    return { delivered: false, fallback: true, info: fallbackInfo, error: error.message };
  }
}

module.exports = {
  sendPasswordResetEmail,
};
