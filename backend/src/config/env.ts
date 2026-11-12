import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/krishi_setu'),
  CORS_ALLOWED_ORIGINS: z
    .string()
    .default(
      'http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175'
    ),
  OGD_API_KEY: z.string().optional(),
  EXTERNAL_API_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  PRICE_STALE_AFTER_HOURS: z.coerce.number().int().positive().default(72),
  WEATHER_STALE_AFTER_HOURS: z.coerce.number().int().positive().default(6),
  JWT_SECRET: z.string().default('krishi_setu_jwt_dev_secret_2026_change_in_prod'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ALLOW_SEED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌  Invalid environment configuration:');
    result.error.issues.forEach((issue) => {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();

export const corsOrigins = config.CORS_ALLOWED_ORIGINS.split(',').map((o) =>
  o.trim()
);
