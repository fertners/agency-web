import { z } from 'zod';

export const serviceHealthStatusSchema = z.enum(['UP', 'DEGRADED', 'DOWN']);

export const serviceHealthSchema = z
  .object({
    status: serviceHealthStatusSchema,
    latencyMs: z.number().nonnegative().finite().optional(),
    message: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const healthResponseSchema = z
  .object({
    status: serviceHealthStatusSchema,
    timestamp: z.iso.datetime(),
    services: z
      .object({
        api: serviceHealthSchema,
        postgres: serviceHealthSchema,
        redis: serviceHealthSchema,
      })
      .strict(),
  })
  .strict();

export type ServiceHealthStatus = z.infer<typeof serviceHealthStatusSchema>;
export type ServiceHealth = z.infer<typeof serviceHealthSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
