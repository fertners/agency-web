import { z } from 'zod';

export const LOCAL_DATABASE_URL =
  'postgresql://agency:local_development_only@localhost:5432/ai_web_agency';

const databaseUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === 'postgres:' || protocol === 'postgresql:';
    },
    { message: 'DATABASE_URL must use the postgres or postgresql protocol' },
  );

type DatabaseEnvironment = Readonly<{
  DATABASE_URL?: string | undefined;
  NODE_ENV?: string | undefined;
}>;

export function getDatabaseUrl(
  environment: DatabaseEnvironment = process.env,
): string {
  const configuredUrl = environment.DATABASE_URL;

  if (configuredUrl !== undefined) {
    return databaseUrlSchema.parse(configuredUrl);
  }

  if (environment.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required in production');
  }

  return LOCAL_DATABASE_URL;
}
