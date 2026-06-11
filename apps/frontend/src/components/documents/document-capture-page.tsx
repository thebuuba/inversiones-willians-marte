'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import type { DocumentCaptureSessionItem } from '@inversiones/shared';
import { getDocumentCaptureSession, uploadDocumentCapture } from '@/lib/api/documents';
import { compressImage } from '@/lib/compress-image';

type CaptureState = 'loading' | 'ready' | 'uploading' | 'success' | 'error' | 'expired';

function getResponseStatus(error: unknown) {
  return typeof error === 'object' && error !== null && 'response' in error
    ? (error.response as { status?: number } | undefined)?.status
    : undefined;
}

export function DocumentCapturePage({ token }: { token: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<DocumentCaptureSessionItem | null>(null);
  const [state, setState] = useState<CaptureState>('loading');
  const [message, setMessage] = useState('Validando enlace...');

  useEffect(() => {
    let active = true;

    getDocumentCaptureSession(token)
      .then((nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setState('ready');
        setMessage('Toma una foto o selecciona el documento.');
      })
      .catch((error) => {
        if (!active) return;
        const status = getResponseStatus(error);
        setState(status === 410 || status === 404 ? 'expired' : 'error');
        setMessage('Este enlace ya no esta disponible.');
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleFile(file?: File) {
    if (!file || state === 'uploading') return;
    setState('uploading');
    setMessage('Subiendo documento...');

    try {
      const uploadFile = file.type.startsWith('image/') ? await compressImage(file) : file;
      const formData = new FormData();
      formData.append('file', uploadFile);
      await uploadDocumentCapture(token, formData);
      if (inputRef.current) inputRef.current.value = '';
      setState('success');
      setMessage('Documento subido correctamente. Puedes volver a la computadora.');
    } catch (error) {
      console.error('Error al subir documento desde captura movil:', error);
      const status = getResponseStatus(error);
      if (status === 410 || status === 404) {
        setState('expired');
        setMessage('Este enlace ya no esta disponible.');
      } else {
        setState('error');
        setMessage('No se pudo subir el documento. Revisa la conexion e intenta de nuevo.');
      }
    }
  }

  const isReady = state === 'ready' || state === 'error';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f6] px-5 py-8">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf5ed] text-[#5a9a7a]">
          {state === 'success' ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : state === 'loading' || state === 'uploading' ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : state === 'expired' ? (
            <XCircle className="h-6 w-6" />
          ) : (
            <Camera className="h-6 w-6" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-neutral-900">Capturar documento</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {session ? `Cliente: ${session.clientName}` : 'Enlace temporal de captura'}
        </p>

        <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          {message}
        </div>

        <input
          ref={inputRef}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          capture="environment"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
          type="file"
        />

        <button
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#5a9a7a] px-5 text-sm font-semibold text-white transition hover:bg-[#4a866a] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isReady}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Camera className="h-4 w-4" />
          Tomar foto o subir archivo
        </button>

        {state === 'success' ? (
          <button
            className="mt-3 h-11 w-full rounded-full border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-600"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = '';
              setState('ready');
              setMessage('Puedes capturar otro documento con este enlace si sigue activo.');
            }}
            type="button"
          >
            Subir otro documento
          </button>
        ) : null}
      </section>
    </main>
  );
}
