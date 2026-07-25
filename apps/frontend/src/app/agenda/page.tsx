'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Plus,
  ListTodo,
  CircleCheck,
  Circle,
  Clock,
  Banknote,
  CalendarDays,
  ChevronRight,
  X,
} from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/api/tasks';
import { getStaggerDelay } from '@/lib/animation';
import type { TaskItem, TaskPriority, TaskStatus } from '@inversiones/shared';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: getStaggerDelay(i, 0.05) },
  }),
};

function MotionCard({
  children,
  className = '',
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type FilterKey = 'todas' | 'pendiente' | 'en-progreso' | 'completada';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function isSameDay(a: string | null | undefined, b: Date): boolean {
  if (!a) return false;
  const d = new Date(a);
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  );
}

function getDayLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return date.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'short' });
}

function tasksOn(date: Date, allTasks: TaskItem[]): number {
  return allTasks.filter((t) => isSameDay(t.dueDate, date)).length;
}

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  URGENT: { bg: '#fde4d4', text: '#9f3f25', dot: '#f97316' },
  HIGH: { bg: '#fde4d4', text: '#9f3f25', dot: '#f97316' },
  MEDIUM: { bg: '#fef3c7', text: '#7a5a0a', dot: '#eab308' },
  LOW: { bg: '#eaf5ed', text: '#2f7654', dot: '#2f7654' },
};

const categoryConfig: Record<string, { bg: string; text: string; label: string }> = {
  oficina: { bg: '#eaf5ed', text: '#2f7654', label: 'Oficina' },
  prestamo: { bg: '#dbeafe', text: '#1d4ed8', label: 'Préstamo' },
  cobro: { bg: '#fde4d4', text: '#9f3f25', label: 'Cobro' },
  reunion: { bg: '#e9e2f5', text: '#6d28d9', label: 'Reunión' },
  admin: { bg: '#F3F4F6', text: '#525252', label: 'Admin' },
};

function MiniCalendar({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (d: Date) => void;
}) {
  const [viewing, setViewing] = useState(selectedDate);
  const year = viewing.getFullYear();
  const month = viewing.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setViewing(new Date(year, month - 1, 1));
  const nextMonth = () => setViewing(new Date(year, month + 1, 1));

  function isSelected(day: number) {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  }

  function isToday(day: number) {
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  }

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm border border-border-soft">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">
          {MONTHS[month]} {year}
        </span>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="rounded-lg p-1 hover:bg-primary-soft text-text-muted hover:text-primary-accent"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <button
            onClick={nextMonth}
            className="rounded-lg p-1 hover:bg-primary-soft text-text-muted hover:text-primary-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-subtle"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const sel = day ? isSelected(day) : false;
          const tod = day ? isToday(day) : false;
          return (
            <div
              key={i}
              onClick={() => day && onDateChange(new Date(year, month, day))}
              className={`relative flex h-8 w-full items-center justify-center rounded-xl text-sm transition cursor-pointer ${
                sel
                  ? 'bg-primary-accent font-bold text-white shadow-sm'
                  : tod
                    ? 'border border-primary-accent font-bold text-primary-accent'
                    : day
                      ? 'text-text-secondary hover:bg-primary-soft'
                      : ''
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewTaskModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (f: {
    title: string;
    description: string;
    time: string;
    priority: TaskPriority;
    category: string;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [category, setCategory] = useState('oficina');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim() || '',
      time,
      priority,
      category,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl bg-card shadow-xl border border-border-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-soft bg-surface-subtle px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft">
              <ListTodo className="h-4 w-4 text-primary-accent" />
            </div>
            <p className="text-base font-semibold text-text-primary">Nueva tarea</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-subtle hover:bg-state-neutral-bg hover:text-text-secondary transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
              Título <span className="text-primary-accent">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              placeholder="Ej: Llamar a cliente por cuota atrasada"
              className={`h-11 w-full rounded-xl border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-primary-accent ${error ? 'border-red-400' : 'border-primary-border'}`}
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              className="w-full rounded-xl border border-primary-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-primary-accent resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 w-full rounded-xl border border-primary-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-primary-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-11 w-full rounded-xl border border-primary-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-primary-accent"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-xl border border-primary-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-primary-accent"
            >
              {Object.entries(categoryConfig).map(([key, c]) => (
                <option key={key} value={key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border-soft bg-surface-subtle px-6 py-4">
          <button
            onClick={onClose}
            className="h-10 rounded-xl border border-primary-border bg-card px-5 text-sm font-semibold text-text-secondary hover:bg-surface-subtle"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="h-10 rounded-xl bg-primary-accent px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary"
          >
            Crear tarea
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<FilterKey>('todas');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = selectedDate;
  const dateStr = today.toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const tasksForDate = tasks.filter((t) => isSameDay(t.dueDate, selectedDate));

  const load = useCallback(() => {
    getTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async (form: {
    title: string;
    description: string;
    time: string;
    priority: TaskPriority;
    category: string;
  }) => {
    await createTask({
      title: form.title,
      description: form.description || undefined,
      dueDate: selectedDate.toISOString(),
      time: form.time || undefined,
      priority: form.priority,
      category: form.category,
    });
    load();
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await updateTask(id, { status: nextStatus });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    await deleteTask(id);
    load();
  };

  const visibleTasks =
    filter === 'todas'
      ? tasksForDate
      : tasksForDate.filter((t) => t.status.toLowerCase().replace(/_/g, '-') === filter);

  const doneCount = tasksForDate.filter((t) => t.status === 'COMPLETED').length;
  const pendientes = tasksForDate.filter((t) => t.status === 'PENDING');
  const appointments = tasksForDate
    .filter((t) => t.time)
    .sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });

  const untimed = tasksForDate.filter((t) => !t.time);
  const nextDays = [0, 1, 2].map((n) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + n);
    return { date: d, count: tasksOn(d, tasks) };
  });

  const filterLabels: Record<FilterKey, string> = {
    todas: 'Todas',
    pendiente: 'Pendientes',
    'en-progreso': 'En progreso',
    completada: 'Completadas',
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-accent">
              Panel de trabajo
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">Agenda</h1>
            <p className="mt-1 text-sm capitalize text-text-muted">{dateStr}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="h-11 rounded-full bg-primary-accent px-6 text-white shadow-sm hover:bg-primary inline-flex items-center"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva tarea
          </button>
          {showModal && <NewTaskModal onClose={() => setShowModal(false)} onSave={addTask} />}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_300px]">
          <aside className="space-y-5">
            <MotionCard index={0}>
              <MiniCalendar selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </MotionCard>
            <MotionCard
              index={1}
              className="rounded-2xl bg-card p-5 shadow-sm border border-border-soft space-y-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Resumen de hoy
              </p>
              {[
                {
                  label: 'Tareas completadas',
                  value: `${doneCount}/${tasksForDate.length}`,
                  color: '#2f7654',
                  bg: '#eaf5ed',
                },
                {
                  label: 'Pendientes',
                  value: String(pendientes.length),
                  color: '#7a5a0a',
                  bg: '#fef3c7',
                },
                {
                  label: 'Citas del día',
                  value: String(appointments.length),
                  color: '#1d4ed8',
                  bg: '#dbeafe',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between rounded-xl px-3 py-2"
                  style={{ backgroundColor: s.bg }}
                >
                  <span className="text-xs font-medium text-text-secondary">{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </MotionCard>
            <MotionCard
              index={2}
              className="rounded-2xl bg-card p-5 shadow-sm border border-border-soft"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Próximos días
              </p>
              <div className="space-y-2">
                {nextDays.map(({ date, count }) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition ${
                      date.toDateString() === selectedDate.toDateString()
                        ? 'bg-primary-soft text-primary-accent'
                        : 'hover:bg-surface-subtle text-text-secondary'
                    }`}
                  >
                    <span className="text-sm font-medium capitalize">{getDayLabel(date)}</span>
                    <span
                      className={`text-xs font-bold ${count > 0 ? 'bg-primary-accent text-white' : 'bg-state-neutral-bg text-text-subtle'} rounded-full px-2 py-0.5 min-w-[24px] text-center`}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </MotionCard>
          </aside>

          <main className="space-y-5">
            <MotionCard
              index={3}
              className="rounded-2xl bg-card p-5 shadow-sm border border-border-soft"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary-accent" />
                  <span className="text-base font-semibold text-text-primary">Tareas del día</span>
                </div>
                <span className="text-sm font-bold text-primary-accent">
                  {doneCount}/{tasksForDate.length}
                </span>
              </div>
              {tasksForDate.length > 0 && (
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-page">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-accent to-primary-accent transition-all duration-500"
                    style={{ width: `${(doneCount / tasksForDate.length) * 100}%` }}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(Object.keys(filterLabels) as FilterKey[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      filter === f
                        ? 'bg-[#1f3b2c] text-white shadow-sm'
                        : 'bg-primary-soft text-primary-accent hover:bg-primary-soft'
                    }`}
                  >
                    {filterLabels[f]}
                  </button>
                ))}
              </div>
            </MotionCard>

            <MotionCard
              index={4}
              className="overflow-hidden rounded-2xl bg-card shadow-sm border border-border-soft divide-y divide-border-soft"
            >
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-sm text-text-subtle">Cargando...</p>
                </div>
              ) : visibleTasks.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <CircleCheck className="h-10 w-10 text-[#c2dfcb]" />
                  <p className="text-sm font-semibold text-text-secondary">¡Todo al día!</p>
                  <p className="text-xs text-text-subtle">No hay tareas en esta categoría.</p>
                </div>
              ) : (
                visibleTasks.map((task) => {
                  const pri = priorityConfig[task.priority] ?? priorityConfig.MEDIUM;
                  const cat = categoryConfig[task.category] ?? categoryConfig.oficina;
                  const done = task.status === 'COMPLETED';

                  return (
                    <div
                      key={task.id}
                      className={`group flex items-start gap-3 rounded-xl px-4 py-3 transition hover:bg-primary-soft/50 ${done ? 'opacity-60' : ''}`}
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-0.5 shrink-0 transition"
                      >
                        {done ? (
                          <CircleCheck className="h-5 w-5 text-primary-accent" />
                        ) : (
                          <Circle className="h-5 w-5 text-neutral-300 group-hover:text-primary-accent" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {task.loanId ? (
                            <Link
                              className={`max-w-[350px] truncate text-sm font-medium hover:text-primary-accent ${done ? 'line-through text-text-subtle' : 'text-text-primary'}`}
                              href={`/prestamos/${task.loanId}`}
                            >
                              {task.title}
                            </Link>
                          ) : (
                            <p
                              className={`max-w-[350px] truncate text-sm font-medium ${done ? 'line-through text-text-subtle' : 'text-text-primary'}`}
                            >
                              {task.title}
                            </p>
                          )}
                          {task.time && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-page px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                              <Clock className="h-3 w-3" />
                              {task.time}
                            </span>
                          )}
                        </div>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-text-muted line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: cat.bg, color: cat.text }}
                          >
                            {cat.label}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: pri.bg, color: pri.text }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: pri.dot }}
                            />
                            {task.priority === 'URGENT'
                              ? 'Urgente'
                              : task.priority === 'HIGH'
                                ? 'Alta'
                                : task.priority === 'MEDIUM'
                                  ? 'Media'
                                  : 'Baja'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                      >
                        <X className="h-4 w-4 text-neutral-300 hover:text-red-500" />
                      </button>
                    </div>
                  );
                })
              )}
            </MotionCard>

            <MotionCard
              index={5}
              className="rounded-2xl bg-card shadow-sm border border-border-soft overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-border-soft bg-surface-subtle px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef3c7]">
                  <Banknote className="h-4 w-4 text-state-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Desembolsos pendientes</p>
                  <p className="text-xs text-text-muted">
                    Clientes que esperan recibir su préstamo
                  </p>
                </div>
              </div>
              <div className="divide-y divide-border-soft">
                {pendientes.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-text-subtle">
                    Sin desembolsos pendientes
                  </div>
                ) : (
                  pendientes.slice(0, 5).map((t) => {
                    const initial = t.title.charAt(0).toUpperCase();
                    return (
                      <div
                        key={t.id}
                        className="flex items-start gap-4 px-5 py-4 hover:bg-primary-soft/30 transition"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-accent text-sm font-bold text-white border-2 border-white shadow-sm">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-text-primary">
                              {t.title}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {t.category} · {t.description?.slice(0, 40) ?? 'Sin detalles'}
                          </p>
                          {t.time && (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[10px] font-semibold text-state-warning">
                              <Clock className="h-3 w-3" />
                              {t.time}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </MotionCard>
          </main>

          <aside className="space-y-5">
            <MotionCard
              index={6}
              className="rounded-2xl bg-card shadow-sm border border-border-soft overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-border-soft bg-surface-subtle px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#dbeafe]">
                  <CalendarDays className="h-4 w-4 text-[#1d4ed8]" />
                </div>
                <p className="text-sm font-semibold text-text-primary">Citas de hoy</p>
              </div>
              <div className="relative px-5 py-4">
                <div className="absolute left-[2.35rem] top-0 bottom-0 w-px bg-state-neutral-bg" />
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <p className="text-xs text-text-subtle text-center py-4">
                      Sin citas agendadas hoy
                    </p>
                  ) : (
                    appointments.map((a) => (
                      <div
                        key={a.id}
                        className={`relative flex items-start gap-3 ${a.status === 'COMPLETED' ? 'opacity-50' : ''}`}
                      >
                        <div
                          className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm"
                          style={{
                            backgroundColor: a.status === 'COMPLETED' ? '#eaf5ed' : '#dbeafe',
                            color: a.status === 'COMPLETED' ? '#2f7654' : '#1d4ed8',
                          }}
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-page px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                              {a.time}
                            </span>
                            {a.status === 'COMPLETED' && (
                              <span className="text-[10px] font-semibold text-primary-accent">
                                ✓ Hecho
                              </span>
                            )}
                          </div>
                          <p
                            className={`mt-0.5 text-xs font-semibold ${a.status === 'COMPLETED' ? 'line-through text-text-subtle' : 'text-text-primary'}`}
                          >
                            {a.title}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-[11px] text-text-muted">
                              {categoryConfig[a.category]?.label ?? a.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </MotionCard>
            <MotionCard
              index={7}
              className="rounded-2xl bg-card shadow-sm border border-border-soft overflow-hidden"
            >
              <div className="flex items-center gap-3 border-b border-border-soft bg-surface-subtle px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-page">
                  <ListTodo className="h-4 w-4 text-text-muted" />
                </div>
                <p className="text-sm font-semibold text-text-primary">Otras tareas del día</p>
              </div>
              <div className="divide-y divide-border-soft">
                {untimed.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-text-subtle">
                    Todas las tareas tienen horario
                  </div>
                ) : (
                  untimed.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 px-5 py-3 hover:bg-surface-subtle transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary">{t.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[10px] font-medium text-text-muted">
                            {categoryConfig[t.category]?.label ?? t.category}
                          </span>
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: priorityConfig[t.priority]?.dot ?? '#6b7280' }}
                          >
                            ·{' '}
                            {t.priority === 'URGENT'
                              ? 'Urgente'
                              : t.priority === 'HIGH'
                                ? 'Alta'
                                : t.priority === 'MEDIUM'
                                  ? 'Media'
                                  : 'Baja'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </MotionCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
