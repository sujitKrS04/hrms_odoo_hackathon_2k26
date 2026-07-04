/**
 * backend/src/config/prisma.ts
 *
 * Exports a single PrismaClient instance shared across the entire process.
 * The globalThis pattern prevents duplicate connections during ts-node-dev
 * hot-reloads (each reload re-executes module code; storing on globalThis
 * keeps the connection pool alive across reloads in development).
 */
import { PrismaClient } from '@prisma/client';
import { env } from './env';

function createClient(): PrismaClient {
  return new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
            // Uncomment to see every query during development:
            // { emit: 'stdout', level: 'query' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });
}

// Preserve the existing instance across hot-reloads in dev
const g = globalThis as unknown as { __prisma?: PrismaClient };
export const prisma: PrismaClient = g.__prisma ?? createClient();

if (env.NODE_ENV !== 'production') {
  g.__prisma = prisma;
}
