import { z } from 'zod';

const environmentSchema = z.object({
  ACRCLOUD_HOST: z.string().min(1),
  ACRCLOUD_ACCESS_KEY: z.string().min(1),
  ACRCLOUD_ACCESS_SECRET: z.string().min(1),
  PER_IP_DAILY_LIMIT: z.coerce.number().int().positive().default(20),
  GLOBAL_DAILY_LIMIT: z.coerce.number().int().positive().default(200),
  ALLOWED_ORIGIN: z.url().transform((origin) => origin.replace(/\/$/, '')),
  PORT: z.preprocess(
    (value) => (value === '' || value === '0' || value === 0 ? undefined : value),
    z.coerce.number().int().positive().max(65535).default(3000),
  ),
});

export type AppConfig = z.infer<typeof environmentSchema>;
export const readConfig = (env: NodeJS.ProcessEnv = process.env): AppConfig =>
  environmentSchema.parse(env);
