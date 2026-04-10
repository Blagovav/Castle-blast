import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgres://dev:dev@localhost:5432/castle_blast'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  PORT: z.coerce.number().default(3000),
});

export const config = envSchema.parse(process.env);
