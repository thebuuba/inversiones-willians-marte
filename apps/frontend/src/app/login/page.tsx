'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/inicio');
    } catch (err) {
      const error = err as AxiosError<{ error?: string }>;
      setError(error.response?.data?.error ?? 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 px-4">
      <Card className="w-full max-w-md border-brand-200 shadow-2xl shadow-brand-950/30">
        <CardHeader>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-ink-inverse">
              WM
            </div>
            <h1 className="text-2xl font-bold text-ink">Inversiones Willians Marte</h1>
            <p className="mt-1 text-sm text-ink-secondary">Sistema de Gestión de Préstamos</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-danger-bg p-3 text-sm text-danger">{error}</div>
            )}
            <Input
              id="email"
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              required
            />
            <Input
              id="password"
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Iniciar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
