'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Clock,
  House,
  Phone,
  Plus,
  Users,
  X,
} from 'lucide-react';
import type { CreateTaskDto, TaskItem, TaskStatus } from '@inversiones/shared';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/api/tasks';
import { getUsers, type UserItem } from '@/lib/api/users';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  buildAgendaMonth,
  getAgendaDate,
  getAgendaDayEvents,
  getAgendaEventType,
  type AgendaEventType,
} from '@/components/agenda/agenda.helpers';

const eventTypes = {
  cobro: {
    label: 'Cobro',
    icon: Banknote,
    tone: 'bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-600',
  },
  visita: { label: 'Visita', icon: House, tone: 'bg-rose-50 text-rose-500', dot: 'bg-rose-400' },
  llamada: {
    label: 'Llamada',
    icon: Phone,
    tone: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-400',
  },
  reunion: { label: 'Reunión', icon: Users, tone: 'bg-sky-50 text-sky-600', dot: 'bg-sky-400' },
};
const inputClass =
  'mt-1.5 h-11 w-full rounded-2xl border border-border-soft bg-surface-subtle px-3 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-brand-sky';

function EventEditor({
  event,
  date,
  assignees,
  currentUserId,
  canDelete,
  onClose,
  onSave,
  onDelete,
}: {
  event: TaskItem | null;
  date: string;
  assignees: UserItem[];
  currentUserId: string;
  canDelete: boolean;
  onClose: () => void;
  onSave: (values: CreateTaskDto & { status: TaskStatus }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [eventDate, setEventDate] = useState(event?.dueDate ? getAgendaDate(event.dueDate) : date);
  const [time, setTime] = useState(event?.time ?? '');
  const [category, setCategory] = useState<AgendaEventType>(
    getAgendaEventType(event?.category ?? 'cobro'),
  );
  const [assignedToId, setAssignedToId] = useState(event?.assignedToId ?? currentUserId);
  const [status, setStatus] = useState<TaskStatus>(event?.status ?? 'PENDING');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    dialogRef.current?.showModal();
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!title.trim()) {
      setError('Escribe el título del evento.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        dueDate: `${eventDate}T12:00:00-04:00`,
        time,
        category,
        assignedToId: assignedToId || undefined,
        status,
      });
      onClose();
    } catch {
      setError('No se pudo guardar el evento. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (saving || !window.confirm('¿Eliminar este evento?')) return;
    setSaving(true);
    setError('');
    try {
      await onDelete();
      onClose();
    } catch {
      setError('No se pudo eliminar el evento. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }
  const people = assignees.filter((person) => person.active || person.id === assignedToId);
  if (assignedToId && !people.some((person) => person.id === assignedToId)) {
    people.push({
      id: assignedToId,
      name: event?.assignedTo?.name ?? 'Yo',
      active: true,
    } as UserItem);
  }
  return (
    <motion.dialog
      ref={dialogRef}
      initial={{ opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              scale: { type: 'spring', stiffness: 380, damping: 17, mass: 0.8 },
              opacity: { duration: 0.14 },
            }
      }
      aria-labelledby="agenda-editor-title"
      onCancel={(e) => {
        if (saving) e.preventDefault();
        else onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-[28px] bg-card p-6 text-text-primary shadow-modal backdrop:bg-black/40 backdrop:transition-opacity backdrop:duration-300 backdrop:starting:opacity-0 backdrop:motion-reduce:transition-none"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id="agenda-editor-title" className="text-xl font-bold">
          {event ? 'Editar evento' : 'Nuevo evento'}
        </h2>
        <button
          type="button"
          aria-label="Cerrar"
          disabled={saving}
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-subtle disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">
          Título
          <input
            autoFocus
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Ej.: Visita domiciliaria"
          />
        </label>
        <label className="block text-sm font-semibold">
          Persona o detalle
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
            placeholder="Nombre o detalles del evento"
          />
        </label>
        <label className="block text-sm font-semibold">
          Tipo
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as AgendaEventType)}
            className={inputClass}
          >
            {Object.entries(eventTypes).map(([key, type]) => (
              <option key={key} value={key}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">
            Fecha
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold">
            Hora
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        {people.length > 1 && (
          <label className="block text-sm font-semibold">
            Responsable
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className={inputClass}
            >
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {event && (
          <label className="block text-sm font-semibold">
            Estado
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className={inputClass}
            >
              <option value="PENDING">Pendiente</option>
              <option value="IN_PROGRESS">En progreso</option>
              <option value="COMPLETED">Completado</option>
            </select>
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-state-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {event && canDelete && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void remove()}
              className="mr-auto h-11 px-2 text-sm font-semibold text-state-danger disabled:opacity-50"
            >
              Eliminar
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-11 rounded-full bg-surface-subtle px-4 text-sm font-semibold disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-full bg-brand-sky px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar evento'}
          </button>
        </div>
      </form>
    </motion.dialog>
  );
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<TaskItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(getAgendaDate);
  const [viewingMonth, setViewingMonth] = useState(() => getAgendaDate().slice(0, 7));
  const [editor, setEditor] = useState<TaskItem | null | undefined>(undefined);
  const [assignees, setAssignees] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEvents(await getTasks());
    } catch {
      setError('No se pudo cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);
  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    let active = true;
    getUsers()
      .then((people) => {
        if (active) setAssignees(people);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [user?.role]);

  const cells = buildAgendaMonth(`${viewingMonth}-01`);
  const selectedEvents = getAgendaDayEvents(events, selectedDate);
  const today = getAgendaDate();
  const monthLabel = new Date(`${viewingMonth}-01T12:00:00Z`).toLocaleDateString('es-DO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const dayLabel =
    selectedDate === today
      ? 'Hoy'
      : new Date(`${selectedDate}T12:00:00-04:00`).toLocaleDateString('es-DO', {
          day: 'numeric',
          month: 'long',
          timeZone: 'America/Santo_Domingo',
        });
  function changeMonth(offset: number) {
    const date = new Date(`${viewingMonth}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    const next = date.toISOString().slice(0, 7);
    setViewingMonth(next);
    setSelectedDate(next === today.slice(0, 7) ? today : `${next}-01`);
  }
  async function save(values: CreateTaskDto & { status: TaskStatus }) {
    const { status, ...createValues } = values;
    const saved = editor
      ? await updateTask(editor.id, {
          ...createValues,
          status,
          assignedToId:
            createValues.assignedToId === editor.assignedToId
              ? undefined
              : createValues.assignedToId,
          category:
            createValues.category === getAgendaEventType(editor.category)
              ? editor.category
              : createValues.category,
        })
      : await createTask(createValues);
    setEvents((current) =>
      editor
        ? current.map((event) => (event.id === saved.id ? saved : event))
        : [...current, saved],
    );
    const date = getAgendaDate(saved.dueDate!);
    setSelectedDate(date);
    setViewingMonth(date.slice(0, 7));
  }
  async function remove() {
    if (!editor) return;
    await deleteTask(editor.id);
    setEvents((current) => current.filter((event) => event.id !== editor.id));
  }
  return (
    <div className="min-h-screen bg-page p-4 text-text-primary sm:p-6">
      <header className="mb-6 flex animate-[fade-in-up_0.45s_ease-out_both] flex-wrap items-end justify-between gap-4 motion-reduce:animate-none">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-sky">
            General
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Cobros, visitas y llamadas programadas.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => setEditor(null)}
          className="flex h-11 items-center gap-2 rounded-full bg-brand-sky px-5 text-sm font-semibold text-white transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Nuevo evento
        </button>
      </header>
      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section
          aria-label="Calendario mensual"
          className="min-w-0 animate-[fade-in-up_0.45s_ease-out_both] rounded-[32px] bg-card p-4 shadow-card [animation-delay:70ms] motion-reduce:animate-none sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold capitalize">{monthLabel.replace(' de ', ' ')}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Mes anterior"
                onClick={() => changeMonth(-1)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-subtle transition hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-brand-sky"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Mes siguiente"
                onClick={() => changeMonth(1)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-subtle transition hover:bg-primary-soft focus-visible:ring-2 focus-visible:ring-brand-sky"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mb-3 grid grid-cols-7 text-center text-[10px] font-bold uppercase text-text-secondary sm:text-xs">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {cells.map((date, index) => {
              if (!date) return <div aria-hidden="true" key={`blank-${index}`} />;
              const dayEvents = getAgendaDayEvents(events, date);
              const types = [
                ...new Set(dayEvents.map((event) => getAgendaEventType(event.category))),
              ];
              return (
                <button
                  key={date}
                  type="button"
                  aria-pressed={selectedDate === date}
                  aria-current={date === today ? 'date' : undefined}
                  aria-label={`${new Date(`${date}T12:00:00Z`).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}, ${dayEvents.length} eventos`}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'relative flex min-h-[64px] flex-col items-start rounded-2xl p-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky sm:min-h-[110px] sm:rounded-[24px] sm:p-3 sm:text-sm',
                    selectedDate === date
                      ? 'bg-[#ffd83d] text-[#25251e]'
                      : 'bg-surface-subtle hover:bg-primary-soft',
                  )}
                >
                  <span>{Number(date.slice(-2))}</span>
                  <span
                    aria-hidden="true"
                    className="mt-auto flex w-full justify-center gap-1 pb-0.5"
                  >
                    {types.map((type) => (
                      <span
                        key={type}
                        className={cn('h-1.5 w-1.5 rounded-full', eventTypes[type].dot)}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-text-secondary">
            {Object.entries(eventTypes).map(([key, type]) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', type.dot)} />
                {type.label}
              </span>
            ))}
          </div>
        </section>
        <section
          aria-labelledby="agenda-day-title"
          className="min-w-0 animate-[fade-in-up_0.45s_ease-out_both] rounded-[32px] bg-card p-5 shadow-card [animation-delay:140ms] motion-reduce:animate-none sm:p-6"
        >
          <h2 id="agenda-day-title" className="text-xl font-bold">
            {dayLabel}
          </h2>
          <p className="mt-1 text-xs text-text-secondary" aria-live="polite">
            {selectedEvents.length} evento(s) programado(s)
          </p>
          <div className="mt-5 space-y-3">
            {loading ? (
              <p role="status" className="py-8 text-center text-sm text-text-secondary">
                Cargando agenda...
              </p>
            ) : error ? (
              <div role="alert" className="py-6 text-center text-sm text-state-danger">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-3 h-11 rounded-full bg-surface-subtle px-4 font-semibold text-text-primary"
                >
                  Reintentar
                </button>
              </div>
            ) : selectedEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">Día libre, sin eventos</p>
            ) : (
              selectedEvents.map((event) => {
                const type = eventTypes[getAgendaEventType(event.category)];
                const Icon = type.icon;
                const person = event.client
                  ? `${event.client.firstName} ${event.client.lastName}`
                  : event.description;
                return (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => setEditor(event)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-[24px] border border-border-soft p-4 text-left transition hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky',
                      event.status === 'COMPLETED' && 'opacity-60',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                        type.tone,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-sm font-bold',
                          event.status === 'COMPLETED' && 'line-through',
                        )}
                      >
                        {event.title}
                      </span>
                      {person && (
                        <span className="mt-0.5 block truncate text-xs text-text-secondary">
                          {person}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-secondary">
                      <Clock className="h-3.5 w-3.5" />
                      {event.time || 'Sin hora'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
      {editor !== undefined && (
        <EventEditor
          event={editor}
          date={selectedDate}
          assignees={assignees}
          currentUserId={user?.id ?? ''}
          canDelete={user?.role === 'ADMIN'}
          onClose={() => setEditor(undefined)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}
