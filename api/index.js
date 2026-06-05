require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('../server/src/middleware/errorHandler');

// ─── Routes ───────────────────────────────────────────────────────────────────
const healthRouter = require('../server/src/routes/health');
const authRouter   = require('../server/src/routes/auth');
const uploadRouter = require('../server/src/routes/upload');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production on Vercel the frontend is served from the same origin, so the
// CLIENT_ORIGIN env var can be set to the Vercel deployment URL.
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, same-origin browser requests)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
// Note: multer handles its own body parsing for multipart requests — this only
// applies to JSON endpoints.
app.use(express.json({ limit: '1mb' }));

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ─── Mount routes ─────────────────────────────────────────────────────────────
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', uploadRouter);

// ─── 404 + error handler ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// Vercel invokes this file as a serverless function — export the app instead
// of calling app.listen(). For local dev, `server/src/index.js` still works.
module.exports = app;
