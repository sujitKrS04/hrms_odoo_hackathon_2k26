/**
 * backend/src/index.ts — DEPRECATED
 *
 * This file is superseded by:
 *   src/server.ts  ← entry point (start server)
 *   src/app.ts     ← Express app factory (routes, middleware, CORS)
 *
 * The `npm run dev` script now runs `src/server.ts` directly.
 * This file is kept so existing IDE tabs don't break. Do not add code here.
 */
export { default } from './app';
