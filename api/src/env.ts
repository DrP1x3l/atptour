import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  APP_SECRET: z.string().min(16, "APP_SECRET deve essere almeno 16 caratteri"),
  CORS_ORIGIN: z.string().default("*"),
  REDIS_URL: z.string().optional(),
});

export const env = schema.parse(process.env);
export type Env = typeof env;
