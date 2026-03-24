require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { randomUUID } = require('crypto');
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const logger = require('./services/logger');
const { metricsMiddleware, getMetricsSnapshot } = require('./middleware/metrics');
const User = require('./models/User');

const app = express();

app.disable('x-powered-by');

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(/[\s,]+/)
  .map((value) => value.trim().replace(/\/$/, ''))
  .filter(Boolean);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth requests. Please try again later.' },
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server and same-origin requests without an Origin header.
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
}));

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

morgan.token('request-id', (req) => req.id || '-');

app.use(morgan(':method :url :status :response-time ms - reqId=:request-id', {
  skip: (req) => req.url === '/health',
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

app.use(cookieParser());
app.use(express.json());
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

app.get('/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  if (!dbReady) {
    return res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: 'ready',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/metrics', (req, res) => {
  return res.status(200).json(getMetricsSnapshot());
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/pdf',  require('./routes/pdf'));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled server error', { requestId: req.id, error: err.message, stack: err.stack });
  if (res.headersSent) return next(err);
  return res.status(500).json({ error: 'Server error' });
});

// MongoDB connection + server start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    logger.info('MongoDB connected');
    return repairUserIndexes();
  })
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      logger.info(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => {
    logger.error('MongoDB connection error', { error: err.message, stack: err.stack });
    process.exit(1);
  });

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.fatal('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

async function repairUserIndexes() {
  try {
    // Legacy deployments may still have a unique phoneNumber index that rejects
    // inserts where phoneNumber is missing/null. Remove it and sync to schema.
    await User.collection.dropIndex('phoneNumber_1');
    logger.info('Dropped legacy User index phoneNumber_1');
  } catch (err) {
    const notFound = err?.codeName === 'IndexNotFound' || err?.code === 27;
    if (!notFound) {
      logger.warn('Could not drop legacy User index phoneNumber_1', { error: err.message });
    }
  }

  try {
    await User.syncIndexes();
    logger.info('User indexes synced with schema');
  } catch (err) {
    logger.warn('Failed to sync User indexes', { error: err.message });
  }
}
