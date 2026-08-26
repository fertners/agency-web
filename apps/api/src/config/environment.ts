import { z } from 'zod';

const redisUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === 'redis:' || protocol === 'rediss:';
    },
    { message: 'REDIS_URL must use the redis or rediss protocol' },
  );

const apiEnvironmentSchema = z
  .object({
    API_HOST: z.string().trim().min(1).default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
    REDIS_URL: redisUrlSchema.default('redis://localhost:6379'),
  })
  .transform((environment) => ({
    host: environment.API_HOST,
    port: environment.API_PORT,
    redisUrl: environment.REDIS_URL,
  }));

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;

export function loadApiEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ApiEnvironment {
  return apiEnvironmentSchema.parse(environment);
}
