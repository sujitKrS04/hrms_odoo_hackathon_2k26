/**
 * backend/src/server.ts
 *
 * Entry point — imports the Express app, validates environment, tests the
 * database connection, then starts the HTTP server.
 *
 * Run in development:  npm run dev   (ts-node-dev --respawn)
 * Run in production:   npm start     (node dist/server.js after npm run build)
 */

// env.ts MUST be imported first — it calls dotenv.config() and throws
// immediately if any required variable is missing.
import { env } from './config/env';
import { prisma } from './config/prisma';
import app from './app';

const { PORT, NODE_ENV } = env;

async function bootstrap(): Promise<void> {
  // ── Verify database connectivity before accepting traffic ───────────────
  console.log('  ⟳  Connecting to database…');
  await prisma.$connect();
  console.log('  ✔  Database connected');

  // ── Start HTTP server ────────────────────────────────────────────────────
  app.listen(PORT, () => {
    const divider = '─'.repeat(52);
    console.log(`\n┌${divider}┐`);
    console.log(`│  🚀  HRMS API                                      │`);
    console.log(`├${divider}┤`);
    console.log(`│  URL:    http://localhost:${String(PORT).padEnd(24)} │`);
    console.log(`│  Health: http://localhost:${PORT}/api/health${' '.repeat(16)} │`);
    console.log(`│  Env:    ${NODE_ENV.padEnd(42)} │`);
    console.log(`└${divider}┘\n`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error('\n❌  Failed to start server:', err);
  // Disconnect cleanly before exiting
  void prisma.$disconnect().finally(() => process.exit(1));
});
