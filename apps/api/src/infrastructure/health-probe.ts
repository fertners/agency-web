export interface HealthProbe {
  ping(): Promise<void>;
}

export const DATABASE_HEALTH_PROBE = Symbol('DATABASE_HEALTH_PROBE');
export const REDIS_HEALTH_PROBE = Symbol('REDIS_HEALTH_PROBE');
