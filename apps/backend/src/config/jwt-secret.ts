type ConfigReader = {
  get: (key: string) => string | undefined;
};

export function getJwtSecret(config: ConfigReader): string {
  const configuredSecret = config.get('JWT_SECRET')?.trim() || process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  const railwaySecret = [
    process.env.RAILWAY_SERVICE_ID,
    process.env.RAILWAY_PROJECT_ID,
    process.env.RAILWAY_ENVIRONMENT_ID,
  ]
    .filter(Boolean)
    .join(':');

  if (railwaySecret) return `railway:${railwaySecret}`;
  if (process.env.NODE_ENV !== 'production') return 'inversiones-willians-marte-dev-secret';

  throw new Error('JWT_SECRET is required in production');
}
