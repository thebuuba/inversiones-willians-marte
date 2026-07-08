'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
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
      await login(username, password, remember);
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
    <main className="flex min-h-dvh items-center justify-center bg-[#F4F5F6] px-5 py-8 font-sans text-[#1F4A36]">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-[18px] bg-[#E9F4EE] text-base font-bold text-[#285C43] shadow-[0_10px_24px_rgba(40,92,67,0.06)]">
            WM
          </div>
          <h1 className="mt-5 text-[26px] font-bold leading-tight text-[#173D2C]">Willians Marte</h1>
          <p className="mt-2 text-[15px] font-medium text-[#687A70]">
            Sistema de Préstamos · Ingresa tus credenciales
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[18px] bg-white px-7 py-7 shadow-[0_2px_4px_rgba(40,92,67,0.04),0_16px_34px_rgba(40,92,67,0.06)]"
        >
          {error && (
            <div className="mb-6 rounded-[14px] bg-danger-bg px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2.5 block text-[14px] font-bold text-[#173D2C]">
                Nombre de usuario
              </label>
              <div className="flex h-[48px] items-center rounded-[14px] border border-[#E4EBE7] bg-[#FBFCFC] px-4 transition-colors focus-within:border-[#B9C8BD] focus-within:ring-2 focus-within:ring-[#E7F4EC]">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  required
                  className="h-full flex-1 bg-transparent text-[15px] font-medium text-[#173D2C] outline-none placeholder:text-[#A1AAA5]"
                />
              </div>
            </div>

            <div>
              <div className="mb-2.5 flex items-center justify-between gap-4">
                <label htmlFor="password" className="block text-[14px] font-bold text-[#173D2C]">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-[13px] font-medium text-[#2F7654] transition-colors hover:text-[#173D2C]"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="flex h-[48px] items-center gap-3 rounded-[14px] border border-[#E4EBE7] bg-[#FBFCFC] px-4 transition-colors focus-within:border-[#B9C8BD] focus-within:ring-2 focus-within:ring-[#E7F4EC]">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-full flex-1 bg-transparent text-[15px] font-medium tracking-[0.18em] text-[#173D2C] outline-none placeholder:text-[#A1AAA5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-[#7A8780] transition-colors hover:text-[#2F7654]"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <label className="flex w-fit items-center gap-3 text-[15px] font-normal text-[#687A70]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 rounded-[5px] border-[#DDEBE3] accent-[#285C43]"
              />
              Recordar sesión
            </label>

            <button
              type="submit"
              disabled={loading}
              className="h-[48px] w-full rounded-[999px] bg-[#2B6849] text-[16px] font-bold text-white shadow-[0_9px_16px_rgba(40,92,67,0.28)] transition hover:bg-[#24583E] active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>

        <p className="mt-7 text-center text-[13px] font-medium text-[#687A70]">
          ¿Problemas para acceder?{' '}
          <button
            type="button"
            className="font-bold text-[#2F7654] transition-colors hover:text-[#173D2C]"
          >
            Contactar soporte
          </button>
        </p>
      </div>
    </main>
  );
}
