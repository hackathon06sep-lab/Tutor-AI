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

function shouldUseBrevoApiFallback() {
  return String(process.env.BREVO_API_FALLBACK || 'true').toLowerCase() === 'true';
}

function shouldFailOpen() {
  // Default is fail-open to preserve generic forgot-password UX.
  // Set SMTP_FAIL_OPEN=false in production to fail when SMTP is unavailable.
  return String(process.env.SMTP_FAIL_OPEN || 'true').toLowerCase() === 'true';
}

async function resolveConnectHosts(smtpHost) {
  const manualConnectHost = (process.env.SMTP_CONNECT_HOST || '').trim();
  if (manualConnectHost) {
    return [{
      host: manualConnectHost,
      servername: (process.env.SMTP_TLS_SERVERNAME || smtpHost).trim() || smtpHost,
      source: 'manual',
    }];
  }

  if (!smtpHost) return [{ host: smtpHost, servername: smtpHost, source: 'direct' }];

  const forceIpv4 = String(process.env.SMTP_FORCE_IPV4 || 'true').toLowerCase() === 'true';
  if (!forceIpv4 || net.isIP(smtpHost)) {
    return [{ host: smtpHost, servername: smtpHost, source: 'direct' }];
  }

  try {
    const ipv4Records = await dns.promises.resolve4(smtpHost);
    if (Array.isArray(ipv4Records) && ipv4Records.length > 0) {
      const records = ipv4Records
        .filter((value, index, array) => value && array.indexOf(value) === index)
        .map((value) => ({ host: value, servername: smtpHost, source: 'resolve4' }));

      // Add hostname as final fallback to let runtime resolver choose an address.
      records.push({ host: smtpHost, servername: smtpHost, source: 'direct-fallback' });
      return records;
    }
  } catch (error) {
    logger.warn('Could not resolve SMTP host to IPv4, falling back to hostname', {
      host: smtpHost,
      error: error.message,
      code: error.code,
    });
  }

  return [{ host: smtpHost, servername: smtpHost, source: 'direct-fallback' }];
}

function createSmtpTransport(target) {
  return nodemailer.createTransport({
    host: target.host,
    port: Number(process.env.SMTP_PORT),
    secure: toBool(process.env.SMTP_SECURE),
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000),
    tls: {
      servername: target.servername,
    },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function getTransporter() {
  if (transporter) return transporter;

  const hasSmtpConfig = process.env.SMTP_HOST
    && process.env.SMTP_PORT
    && process.env.SMTP_USER
    && process.env.SMTP_PASS;

  if (hasSmtpConfig) {
    return null;
  }

  // Fallback for local development if SMTP is not configured.
  transporter = nodemailer.createTransport({ jsonTransport: true });
  return transporter;
}

function parseFromAddress(fromValue) {
  const from = String(fromValue || '').trim();
  const match = from.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim().replace(/^"|"$/g, ''),
      email: match[2].trim(),
    };
  }
  return { name: 'TutorAI', email: from || 'no-reply@tutorai.local' };
}

async function sendViaBrevoApi(payload) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey || !shouldUseBrevoApiFallback()) return null;

  const sender = parseFromAddress(payload.from);
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    const error = new Error(`Brevo API error: ${response.status}`);
    error.code = 'BREVO_API_ERROR';
    error.details = responseText;
    throw error;
  }

  const result = await response.json();
  return { delivered: true, provider: 'brevo-api', info: result };
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
    const hasSmtpConfig = process.env.SMTP_HOST
      && process.env.SMTP_PORT
      && process.env.SMTP_USER
      && process.env.SMTP_PASS;

    let info;

    if (hasSmtpConfig) {
      const smtpHost = process.env.SMTP_HOST.trim();
      const targets = await resolveConnectHosts(smtpHost);
      const maxAttempts = Number(process.env.SMTP_MAX_HOST_ATTEMPTS || 3);
      const candidates = targets.slice(0, Math.max(1, maxAttempts));

      let lastError;
      for (const target of candidates) {
        try {
          const transport = createSmtpTransport(target);
          logger.info('SMTP transporter configured', {
            host: target.host,
            source: target.source,
            port: Number(process.env.SMTP_PORT),
            secure: toBool(process.env.SMTP_SECURE),
          });
          info = await transport.sendMail(payload);
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          logger.warn('SMTP delivery attempt failed', {
            host: target.host,
            source: target.source,
            error: error.message,
            code: error.code,
          });
        }
      }

      if (lastError) {
        throw lastError;
      }
    } else {
      const transport = await getTransporter();
      info = await transport.sendMail(payload);
    }

    if (!process.env.SMTP_HOST) {
      logger.info('SMTP not configured. Password reset email captured locally', { resetUrl });
    }

    return { delivered: true, info };
  } catch (error) {
    logger.warn('Password reset email delivery failed; using fallback transport', {
      error: error.message,
      code: error.code,
    });

    try {
      const apiFallback = await sendViaBrevoApi(payload);
      if (apiFallback?.delivered) {
        logger.info('Password reset email delivered via Brevo API fallback', {
          provider: apiFallback.provider,
        });
        return apiFallback;
      }
    } catch (apiError) {
      logger.warn('Brevo API fallback failed', {
        error: apiError.message,
        code: apiError.code,
      });
    }

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
