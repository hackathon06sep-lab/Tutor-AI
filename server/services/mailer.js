const nodemailer = require('nodemailer');
const dns = require('node:dns');
const net = require('node:net');
const logger = require('./logger');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore when unavailable on older Node runtimes.
}

let transporter;

function toBool(value) {
  return String(value).toLowerCase() === 'true';
}

function shouldFailOpen() {
  // Default is fail-open to preserve generic forgot-password UX.
  // Set SMTP_FAIL_OPEN=false in production to fail when SMTP is unavailable.
  return String(process.env.SMTP_FAIL_OPEN || 'true').toLowerCase() === 'true';
}

async function resolveConnectHost(smtpHost) {
  const manualConnectHost = (process.env.SMTP_CONNECT_HOST || '').trim();
  if (manualConnectHost) {
    return {
      host: manualConnectHost,
      servername: (process.env.SMTP_TLS_SERVERNAME || smtpHost).trim() || smtpHost,
      source: 'manual',
    };
  }

  if (!smtpHost) return { host: smtpHost, servername: smtpHost, source: 'direct' };

  const forceIpv4 = String(process.env.SMTP_FORCE_IPV4 || 'true').toLowerCase() === 'true';
  if (!forceIpv4 || net.isIP(smtpHost)) {
    return { host: smtpHost, servername: smtpHost, source: 'direct' };
  }

  try {
    const ipv4Records = await dns.promises.resolve4(smtpHost);
    if (Array.isArray(ipv4Records) && ipv4Records.length > 0) {
      return { host: ipv4Records[0], servername: smtpHost, source: 'resolve4' };
    }
  } catch (error) {
    logger.warn('Could not resolve SMTP host to IPv4, falling back to hostname', {
      host: smtpHost,
      error: error.message,
      code: error.code,
    });
  }

  return { host: smtpHost, servername: smtpHost, source: 'direct-fallback' };
}

async function getTransporter() {
  if (transporter) return transporter;

  const hasSmtpConfig = process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    const smtpHost = process.env.SMTP_HOST.trim();
    const resolved = await resolveConnectHost(smtpHost);

    transporter = nodemailer.createTransport({
      host: resolved.host,
      port: Number(process.env.SMTP_PORT),
      secure: toBool(process.env.SMTP_SECURE),
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000),
      tls: {
        servername: resolved.servername,
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    logger.info('SMTP transporter configured', {
      host: resolved.host,
      source: resolved.source,
      port: Number(process.env.SMTP_PORT),
      secure: toBool(process.env.SMTP_SECURE),
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
    const transport = await getTransporter();
    const info = await transport.sendMail(payload);

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
