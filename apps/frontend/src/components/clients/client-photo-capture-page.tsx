'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { ClientPhotoCaptureSessionItem } from '@inversiones/shared';
import {
  getPublicClientPhotoCaptureSession,
  uploadClientPhotoCapture,
} from '@/lib/api/client-photo-capture';
import { cropClientPhotoToFace } from '@/lib/face-crop';
import { MAX_COMPRESSED_CLIENT_PHOTO_BYTES, validateClientPhoto } from './client-photo';

type CaptureState = 'loading' | 'ready' | 'uploading' | 'success' | 'error' | 'expired';

function getResponseStatus(error: unknown) {
  return typeof error === 'object' && error !== null && 'response' in error
    ? (error.response as { status?: number } | undefined)?.status
    : undefined;
}

export function ClientPhotoCapturePage({ token }: { token: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<ClientPhotoCaptureSessionItem | null>(null);
  const [state, setState] = useState<CaptureState>('loading');
  const [message, setMessage] = useState('Validando enlace...');

  useEffect(() => {
    let active = true;
    getPublicClientPhotoCaptureSession(token)
      .then((nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setState('ready');
        setMessage('Toma una fotografía clara del rostro del cliente.');
      })
      .catch((error) => {
        if (!active) return;
        const status = getResponseStatus(error);
        setState(status === 404 || status === 410 ? 'expired' : 'error');
        setMessage(
          status === 404 || status === 410
            ? 'Este enlace ya no está disponible.'
            : 'No se pudo conectar con el sistema. Revisa la red e intenta nuevamente.',
        );
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function handleFile(file?: File) {
    if (!file || state === 'uploading') return;
    const validationError = validateClientPhoto(file);
    if (validationError) {
      setState('error');
      setMessage(validationError);
      return;
    }

    setState('uploading');
    setMessage('Detectando el rostro y ajustando el encuadre...');
    try {
      const cropped = await cropClientPhotoToFace(file);
      if (cropped.size > MAX_COMPRESSED_CLIENT_PHOTO_BYTES) {
        throw new Error('La fotografía no pudo reducirse al tamaño permitido.');
      }
      const formData = new FormData();
      formData.append('file', cropped, cropped.name || 'foto-cliente.webp');
      await uploadClientPhotoCapture(token, formData);
      setState('success');
      setMessage('Fotografía recibida. Ya puedes volver a la computadora.');
    } catch (error) {
      const status = getResponseStatus(error);
      setState(status === 404 || status === 410 ? 'expired' : 'error');
      setMessage(
        status === 404 || status === 410
          ? 'Este enlace ya no está disponible.'
          : error instanceof Error
            ? error.message
            : 'No se pudo enviar la fotografía. Intenta nuevamente.',
      );
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const canCapture = state === 'ready' || state === 'error';

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-5 py-8 text-text-primary">
      <section className="w-full max-w-md rounded-[24px] border border-primary-border bg-card p-7 shadow-[0_12px_36px_rgba(40,92,67,0.08)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary-soft text-primary">
          {state === 'success' ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : state === 'loading' || state === 'uploading' ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : state === 'expired' ? (
            <XCircle className="h-7 w-7" />
          ) : (
            <Camera className="h-7 w-7" />
          )}
        </div>

        <h1 className="mt-5 text-2xl font-bold text-text-primary">Fotografía del cliente</h1>
        <p className="mt-2 text-sm font-medium text-text-secondary">
          {session?.clientName ?? 'Enlace temporal de captura'}
        </p>

        <div className="mt-6 rounded-[16px] border border-primary-border bg-[#F7FCF9] px-4 py-4 text-sm font-medium leading-6 text-text-secondary">
          {message}
        </div>

        <input
          ref={inputRef}
          accept="image/jpeg,image/png,image/webp"
          capture="user"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
          type="file"
        />

        {state !== 'success' && state !== 'expired' ? (
          <button
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(47,118,84,0.22)] transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canCapture}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <Camera className="h-5 w-5" />
            Abrir cámara
          </button>
        ) : null}
      </section>
    </main>
  );
}
