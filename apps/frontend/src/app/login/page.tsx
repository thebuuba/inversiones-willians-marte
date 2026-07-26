'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchClientCache } from '@/lib/client-cache';
import { getDashboardOverview } from '@/lib/api/dashboard';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      await login(username, password);
      void fetchClientCache('dashboard-overview', getDashboardOverview, 60_000).catch(
        () => undefined,
      );
      router.push('/inicio');
    } catch (err) {
      const error = err as AxiosError<{ error?: string; message?: string | string[] }>;
      const message = error.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(' ')
          : message ?? error.response?.data?.error ?? 'Error al iniciar sesión',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-page px-5 py-8 font-sans text-text-primary">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-control-comfortable bg-primary-soft text-base font-bold text-primary shadow-soft">
            WM
          </div>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-text-primary">Willians Marte</h1>
          <p className="mt-2 text-base font-medium text-text-secondary">
            Sistema de Préstamos · Ingresa tus credenciales
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-panel border border-border-soft bg-card px-7 py-7 shadow-card"
        >
          {error && (
            <div className="mb-6 rounded-[14px] bg-danger-bg px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2.5 block text-sm font-bold text-text-primary">
                Nombre de usuario
              </label>
              <div className="flex h-[48px] items-center rounded-control-comfortable border border-primary-border bg-surface-subtle px-4 transition-colors focus-within:border-primary-accent focus-within:ring-2 focus-within:ring-primary-soft">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  required
                  className="h-full flex-1 bg-transparent text-base font-medium text-text-primary outline-none placeholder:text-text-subtle"
                />
              </div>
            </div>

            <div>
              <div className="mb-2.5 flex items-center justify-between gap-4">
                <label htmlFor="password" className="block text-sm font-bold text-text-primary">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-primary-accent transition-colors hover:text-text-primary"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="flex h-[48px] items-center gap-3 rounded-control-comfortable border border-primary-border bg-surface-subtle px-4 transition-colors focus-within:border-primary-accent focus-within:ring-2 focus-within:ring-primary-soft">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-full flex-1 bg-transparent text-base font-medium tracking-[0.18em] text-text-primary outline-none placeholder:text-text-subtle"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-text-muted transition-colors hover:text-primary-accent"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-primary-accent text-base font-bold text-text-inverse shadow-action transition hover:bg-primary active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>

        <p className="mt-7 text-center text-sm font-medium text-text-secondary">
          ¿Problemas para acceder?{' '}
          <button
            type="button"
            className="font-bold text-primary-accent transition-colors hover:text-text-primary"
          >
            Contactar soporte
          </button>
        </p>
      </div>
    </main>
  );
}
