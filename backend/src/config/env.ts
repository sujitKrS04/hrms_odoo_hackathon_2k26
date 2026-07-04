/**
 * backend/src/config/env.ts
 *
 * Single place where environment variables are loaded, validated, and exported.
 * Every other module imports from here — never reads process.env directly.
 *
 * At startup this module will throw a descriptive error if any required
 * variable is missing, failing fast before the server binds a port.
 */
import dotenv from 'dotenv';

// Load .env file from the backend/ directory (process.cwd() when running npm scripts)
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `❌  Missing required environment variable: ${name}\n` +
      `   Copy backend/.env.example → backend/.env and fill in the values.`,
    );
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() ?? fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development') as 'development' | 'production' | 'test',

  PORT: parseInt(optional('PORT', '4000'), 10),

  /** PostgreSQL connection string — required */
  DATABASE_URL: required('DATABASE_URL'),

  /** Secret used to sign/verify JWTs — required */
  JWT_SECRET: required('JWT_SECRET'),

  /** JWT expiry string accepted by jsonwebtoken (e.g. '7d', '2h') */
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  /**
   * Comma-separated list of allowed CORS origins.
   * Defaults to the Next.js dev server.
   */
  ALLOWED_ORIGINS: optional('ALLOWED_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
} as const;
