'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { ArrowLeft, Eye, Lock, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await register(name, username, password);
      } else {
        await login(username, password);
      }
      router.push('/inicio');
    } catch (err) {
      const error = err as AxiosError<{ error?: string; message?: string | string[] }>;
      const message = error.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message.join(' ')
          : message ?? error.response?.data?.error ?? (mode === 'register' ? 'Error al registrarse' : 'Error al iniciar sesión'),
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6FAF7] px-5 py-8 font-sans">
      <div className="w-full max-w-[470px]">
        <div className="mb-9 text-left">
          {mode === 'register' && (
            <button
              className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5FA37D] transition hover:text-[#173D2C]"
              onClick={() => switchMode('login')}
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a iniciar sesión
            </button>
          )}
          <h1 className="text-[34px] font-bold leading-tight tracking-[-0.02em] text-[#173D2C]">
            {mode === 'register' ? 'Crear cuenta' : 'Bienvenido de vuelta'}
          </h1>
          <p className="mt-3 text-[19px] font-normal leading-7 text-[#5FA37D]">
            {mode === 'register'
              ? 'Registra un usuario para acceder al sistema'
              : 'Ingresa tus credenciales para continuar'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[#DDEBE3] bg-white px-8 py-8 shadow-[0_14px_45px_rgba(40,92,67,0.06)]"
        >
          {error && (
            <div className="mb-7 rounded-2xl bg-danger-bg px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {mode === 'register' && (
              <div>
                <label htmlFor="name" className="mb-3 block text-[16px] font-bold text-[#173D2C]">
                  Nombre completo
                </label>
                <div className="flex h-[54px] items-center gap-4 rounded-[999px] border border-[#DDEBE3] bg-[#FBFDFB] px-5 transition-colors focus-within:border-[#A9CDBB] focus-within:ring-2 focus-within:ring-[#DDEBE3]">
                  <User className="h-5 w-5 text-[#A9CDBB]" aria-hidden="true" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre del usuario"
                    required
                    className="h-full flex-1 bg-transparent text-[16px] text-[#173D2C] outline-none placeholder:text-[#A9CDBB]"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="username" className="mb-3 block text-[16px] font-bold text-[#173D2C]">
                Nombre de usuario
              </label>
              <div className="flex h-[54px] items-center gap-4 rounded-[999px] border border-[#DDEBE3] bg-[#FBFDFB] px-5 transition-colors focus-within:border-[#A9CDBB] focus-within:ring-2 focus-within:ring-[#DDEBE3]">
                <User className="h-5 w-5 text-[#A9CDBB]" aria-hidden="true" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                  required
                  className="h-full flex-1 bg-transparent text-[16px] text-[#173D2C] outline-none placeholder:text-[#A9CDBB]"
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <label htmlFor="password" className="block text-[16px] font-bold text-[#173D2C]">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    className="text-[14px] font-bold text-[#5FA37D] transition-colors hover:text-[#173D2C]"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="flex h-[54px] items-center gap-4 rounded-[999px] border border-[#DDEBE3] bg-[#FBFDFB] px-5 transition-colors focus-within:border-[#A9CDBB] focus-within:ring-2 focus-within:ring-[#DDEBE3]">
                <Lock className="h-5 w-5 text-[#A9CDBB]" aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-full flex-1 bg-transparent text-[16px] tracking-[0.22em] text-[#173D2C] outline-none placeholder:text-[#A9CDBB]"
                />
                <button
                  type="button"
                  className="text-[#A9CDBB] transition-colors hover:text-[#5FA37D]"
                  aria-label="Mostrar contraseña"
                >
                  <Eye className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="confirm-password" className="mb-3 block text-[16px] font-bold text-[#173D2C]">
                  Confirmar contraseña
                </label>
                <div className="flex h-[54px] items-center gap-4 rounded-[999px] border border-[#DDEBE3] bg-[#FBFDFB] px-5 transition-colors focus-within:border-[#A9CDBB] focus-within:ring-2 focus-within:ring-[#DDEBE3]">
                  <Lock className="h-5 w-5 text-[#A9CDBB]" aria-hidden="true" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-full flex-1 bg-transparent text-[16px] tracking-[0.22em] text-[#173D2C] outline-none placeholder:text-[#A9CDBB]"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <label className="flex w-fit items-center gap-3 text-[17px] font-normal text-[#5FA37D]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-5 w-5 rounded-[5px] border-[#DDEBE3] accent-[#285C43]"
                />
                Recordar sesión
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-[54px] w-full rounded-[999px] bg-gradient-to-r from-[#7DBD9A] to-[#5FA37D] text-[18px] font-bold text-white shadow-[0_14px_24px_rgba(95,163,125,0.22)] transition-opacity hover:opacity-95 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? (mode === 'register' ? 'Registrando...' : 'Iniciando...') : mode === 'register' ? 'Registrarse' : 'Iniciar sesión'}
            </button>


          </div>
        </form>

        <p className="mt-8 text-center text-[14px] text-[#A9CDBB]">
          ¿Problemas para acceder?{' '}
          <button
            type="button"
            className="font-bold text-[#5FA37D] transition-colors hover:text-[#173D2C]"
          >
            Contactar soporte
          </button>
        </p>
      </div>
    </main>
  );
}
