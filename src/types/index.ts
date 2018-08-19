export interface Health {
  data?: object;
  message?: string;
  status: boolean;
}
export type HealthCheck = (...args: any[]) => Promise<Health>;
export interface HealthCheckList {
  [key: string]: HealthCheck;
}