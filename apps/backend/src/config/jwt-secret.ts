type ConfigReader = {
  get: (key: string) => string | undefined;
};

export function getJwtSecret(config: ConfigReader): string {
  const configuredSecret = config.get('JWT_SECRET')?.trim() || process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  if (process.env.NODE_ENV !== 'production') return 'inversiones-willians-marte-dev-secret';

  throw new Error('JWT_SECRET is required in production');
}
