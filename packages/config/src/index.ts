import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info')
  })
  .transform((values) => ({
    ...values,
    isProduction: values.NODE_ENV === 'production'
  }));

export type AppConfig = z.infer<typeof envSchema> & { isProduction: boolean };

let cachedConfig: AppConfig | undefined;

export const getConfig = (): AppConfig => {
  if (!cachedConfig) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
    }
    cachedConfig = parsed.data;
  }
  return cachedConfig;
};
