/**
 * backend/src/routes/health.routes.ts
 *
 * GET /api/health
 * Liveness + readiness probe used by load balancers, Docker health checks,
 * and the frontend to confirm the API is reachable before making real requests.
 *
 * Checks:
 *   - Service is alive (always true if this handler runs)
 *   - Database is reachable (SELECT 1 via Prisma)
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

const router = Router();

router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  let dbStatus: 'ok' | 'error' = 'ok';
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
  } catch {
    dbStatus = 'error';
  }

  const isHealthy = dbStatus === 'ok';

  res.status(isHealthy ? 200 : 503).json({
    status:      isHealthy ? 'ok' : 'degraded',
    service:     'hrms-backend',
    version:     '1.0.0',
    environment: env.NODE_ENV,
    timestamp:   new Date().toISOString(),
    checks: {
      database: {
        status:    dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
  });
});

export default router;
