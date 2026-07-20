'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, FileUp, Loader2, XCircle } from 'lucide-react';
import type { DocumentCaptureSessionItem } from '@inversiones/shared';
import { getDocumentCaptureSession, uploadDocumentCapture } from '@/lib/api/documents';
import { appendDocumentUploadFiles } from '@/lib/document-image-processing';

type CaptureState = 'loading' | 'ready' | 'uploading' | 'success' | 'error' | 'expired';

function getResponseStatus(error: unknown) {
  return typeof error === 'object' && error !== null && 'response' in error
    ? (error.response as { status?: number } | undefined)?.status
    : undefined;
}

export function DocumentCapturePage({ token }: { token: string }) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const formData = new FormData();
      await appendDocumentUploadFiles(formData, file);
      await uploadDocumentCapture(token, formData);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
      setState('success');
      setMessage('Documento subido correctamente. Puedes volver a la computadora.');
    } catch (error) {
      console.error('Error al subir documento desde captura movil:', error);
      const status = getResponseStatus(error);
      if (status === 410 || status === 404) {
        setState('expired');
        setMessage('Este enlace ya no esta disponible.');
      } else if (status === 413) {
        setState('error');
        setMessage('El archivo es demasiado grande. El limite es 10 MB.');
      } else if (error instanceof Error && error.name === 'TimeoutError') {
        setState('error');
        setMessage('La subida tardo demasiado. Intenta nuevamente sin cerrar esta pagina.');
      } else if (status && status >= 400 && status < 500 && error instanceof Error) {
        setState('error');
        setMessage(error.message);
      } else {
        setState('error');
        setMessage('El servicio no pudo completar la subida. Intenta nuevamente en unos segundos.');
      }
    }
  }

  const isReady = state === 'ready' || state === 'error';

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-5 py-8">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-accent">
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

        <h1 className="text-2xl font-bold text-text-primary">Capturar documento</h1>
        <p className="mt-2 text-sm text-text-muted">
          {session ? `Cliente: ${session.clientName}` : 'Enlace temporal de captura'}
        </p>

        <div className="mt-6 rounded-xl border border-border-soft bg-surface-subtle px-4 py-3 text-sm text-text-secondary">
          {message}
        </div>

        <input
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
          type="file"
        />
        <input
          ref={fileInputRef}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
          type="file"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isReady}
            onClick={() => cameraInputRef.current?.click()}
            type="button"
          >
            <Camera className="h-4 w-4" />
            Tomar foto
          </button>
          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-primary-accent bg-white px-5 text-sm font-semibold text-primary-accent transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!isReady}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <FileUp className="h-4 w-4" />
            Elegir foto o archivo
          </button>
        </div>

        {state === 'success' ? (
          <button
            className="mt-3 h-11 w-full rounded-full border border-primary-border bg-white px-5 text-sm font-semibold text-text-secondary"
            onClick={() => {
              if (cameraInputRef.current) cameraInputRef.current.value = '';
              if (fileInputRef.current) fileInputRef.current.value = '';
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
