import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
      <section className="w-full max-w-md rounded-panel border border-primary-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-panel bg-primary-soft text-primary">
          <WifiOff className="h-7 w-7" strokeWidth={2.2} aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-text-primary">Sin conexión</h1>
        <p className="mt-3 text-base leading-7 text-text-secondary">
          No se pudo cargar esta pantalla. Revisa la conexión e intenta de nuevo.
        </p>
        <Link
          href="/inicio"
          className="mt-7 inline-flex h-12 items-center justify-center rounded-control-comfortable bg-primary px-6 text-base font-bold text-white shadow-action transition-colors hover:bg-primary-hover"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
