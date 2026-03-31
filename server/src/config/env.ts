import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);