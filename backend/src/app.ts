/**
 * backend/src/app.ts
 *
 * Pure Express application factory — no server.listen() here.
 * Kept separate from server.ts so the app can be imported by integration
 * tests without binding a port.
 */
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import apiRouter from './routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

const app = express();

// ─── Security & CORS ──────────────────────────────────────────────────────────
app.use(
  cors({
    /**
     * Restrict to known frontend origins only.
     * Configured via ALLOWED_ORIGINS env var (comma-separated list).
     * Default: http://localhost:3000 (Next.js dev server)
     */
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, Postman, health checks from same host)
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not permitted by CORS policy.`));
      }
    },
    credentials:      true,
    allowedHeaders:   ['Content-Type', 'Authorization'],
    exposedHeaders:   ['Content-Range', 'X-Total-Count'],
    methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── Error handling (MUST be last) ───────────────────────────────────────────
app.use(notFoundHandler);   // 404 for any unmatched route
app.use(errorHandler);      // converts thrown errors to structured JSON

export default app;
