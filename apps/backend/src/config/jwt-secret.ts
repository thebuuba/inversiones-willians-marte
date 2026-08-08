type ConfigReader = {
  get: (key: string) => string | undefined;
};

export function getJwtSecret(config: ConfigReader): string {
  const configuredSecret = config.get('JWT_SECRET')?.trim() || process.env.JWT_SECRET?.trim();
  if (configuredSecret) return configuredSecret;

  const environment = process.env.NODE_ENV;
  if (environment === 'development' || environment === 'test') {
    return 'inversiones-willians-marte-dev-secret';
  }

  throw new Error('JWT_SECRET is required in production');
}
