export interface AdminSeedConfig {
  email: string;
  username: string;
  password: string;
}

export function resolveAdminSeedConfig(env: NodeJS.ProcessEnv): AdminSeedConfig {
  const password = env.ADMIN_PASSWORD?.trim();

  if (env.NODE_ENV === 'production' && !password) {
    throw new Error('ADMIN_PASSWORD is required when seeding production');
  }

  return {
    email: env.ADMIN_EMAIL ?? 'admin@inversiones.com',
    username: env.ADMIN_USERNAME ?? 'admin',
    password: password || 'admin123456',
  };
}
