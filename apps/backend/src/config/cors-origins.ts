const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3001';

export function parseCorsOrigins(value?: string) {
  const origins = (value ?? DEFAULT_FRONTEND_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : [DEFAULT_FRONTEND_ORIGIN];
}
