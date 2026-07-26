'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, ClipboardCheck, PhoneCall } from 'lucide-react';
import type { NotificationItem } from '@inversiones/shared';
import { getNotifications, markNotificationsRead } from '@/lib/api/notifications';

const priorityTone = {
  URGENT: 'bg-state-danger-bg text-state-danger',
  HIGH: 'bg-state-warning-bg text-state-warning',
  MEDIUM: 'bg-state-info-bg text-state-info',
  LOW: 'bg-state-neutral-bg text-state-neutral',
} as const;

export function NotificationCenter() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const unread = items.filter((item) => !item.read);

  const load = useCallback(async () => {
    try {
      setItems(await getNotifications());
    } catch {
      // Keep the previous list during a temporary backend outage.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
    const interval = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  async function markRead(keys: string[]) {
    if (keys.length === 0) return;
    setItems((current) =>
      current.map((item) => (keys.includes(item.key) ? { ...item, read: true } : item)),
    );
    await markNotificationsRead(keys).catch(() => void load());
  }

  async function openItem(item: NotificationItem) {
    await markRead([item.key]);
    setOpen(false);
    router.push(item.href);
  }

  return (
    <div className="relative ml-auto" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${unread.length} notificaciones nuevas`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-primary-border bg-card text-text-secondary transition hover:bg-primary-soft hover:text-primary-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
        onClick={() => {
          setOpen((value) => !value);
          void load();
        }}
        type="button"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-state-danger px-1 text-[10px] font-bold leading-none text-white">
            {unread.length > 99 ? '99+' : unread.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          aria-label="Centro de notificaciones"
          className="absolute right-0 top-[3.25rem] w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-panel border border-border-soft bg-card shadow-modal"
          role="dialog"
        >
          <header className="flex items-center justify-between border-b border-border-soft px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Notificaciones</h2>
              <p className="mt-0.5 text-xs text-text-muted">
                {unread.length > 0 ? `${unread.length} nuevas` : 'Todo revisado'}
              </p>
            </div>
            {unread.length > 0 ? (
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-primary-accent hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent"
                onClick={() => void markRead(unread.map((item) => item.key))}
                type="button"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas
              </button>
            ) : null}
          </header>

          <div className="max-h-[min(70vh,34rem)] overflow-y-auto">
            {loading ? (
              <p className="px-5 py-10 text-center text-sm text-text-muted">Cargando...</p>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <CheckCheck className="mx-auto h-8 w-8 text-state-success" />
                <p className="mt-2 text-sm font-semibold text-text-primary">No hay pendientes</p>
              </div>
            ) : (
              items.map((item) => {
                const Icon = item.kind === 'COLLECTION' ? PhoneCall : ClipboardCheck;
                return (
                  <button
                    className={`flex w-full items-start gap-3 border-b border-border-soft px-5 py-4 text-left transition last:border-0 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-accent ${
                      item.read ? 'bg-card' : 'bg-primary-soft/45'
                    }`}
                    key={item.key}
                    onClick={() => void openItem(item)}
                    type="button"
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${priorityTone[item.priority]}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-2">
                        <span className="line-clamp-2 flex-1 text-sm font-bold text-text-primary">
                          {item.title}
                        </span>
                        {!item.read ? (
                          <span
                            aria-label="Nueva"
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-accent"
                          />
                        ) : null}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-text-muted">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
