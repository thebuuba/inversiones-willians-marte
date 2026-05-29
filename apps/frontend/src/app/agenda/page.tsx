'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Plus, ListTodo, CircleCheck, Circle, LoaderCircle, Clock,
  Banknote, CalendarDays, ChevronRight, Flag, Users, Phone,
  Building, X,
} from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/api/tasks';
import type { TaskItem, TaskPriority, TaskStatus } from '@inversiones/shared';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 } }),
};

function MotionCard({ children, className = '', index = 0 }: { children: React.ReactNode; className?: string; index?: number }) {
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={index} className={className}>
      {children}
    </motion.div>
  );
}

type FilterKey = 'todas' | 'pendiente' | 'en-progreso' | 'completada';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  URGENT: { bg: '#fde4d4', text: '#c2410c', dot: '#f97316' },
  HIGH: { bg: '#fde4d4', text: '#c2410c', dot: '#f97316' },
  MEDIUM: { bg: '#fef3c7', text: '#a16207', dot: '#eab308' },
  LOW: { bg: '#eaf5ed', text: '#5a9a7a', dot: '#7fb89a' },
};

const categoryConfig: Record<string, { bg: string; text: string; label: string }> = {
  oficina: { bg: '#eaf5ed', text: '#5a9a7a', label: 'Oficina' },
  prestamo: { bg: '#dbeafe', text: '#1d4ed8', label: 'Préstamo' },
  cobro: { bg: '#fde4d4', text: '#c2410c', label: 'Cobro' },
  reunion: { bg: '#e9e2f5', text: '#6d28d9', label: 'Reunión' },
  admin: { bg: '#F3F4F6', text: '#525252', label: 'Admin' },
};

function fmtMoney(n: number) {
  return 'RD$ ' + n.toLocaleString('es-DO', { maximumFractionDigits: 0 });
}

function MiniCalendar() {
  const today = new Date();
  const [viewing, setViewing] = useState(today);
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

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-800">{MONTHS[month]} {year}</span>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="rounded-lg p-1 hover:bg-[#eaf5ed] text-neutral-500 hover:text-[#5a9a7a]"><ChevronRight className="h-4 w-4 rotate-180" /></button>
          <button onClick={nextMonth} className="rounded-lg p-1 hover:bg-[#eaf5ed] text-neutral-500 hover:text-[#5a9a7a]"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS.map((d) => (
          <div key={d} className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div
              key={i}
              className={`relative flex h-8 w-full items-center justify-center rounded-xl text-sm transition cursor-pointer ${
                isToday ? 'bg-[#5a9a7a] font-bold text-white shadow-sm' : day ? 'text-neutral-700 hover:bg-[#eaf5ed]' : ''
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

function NewTaskModal({ onClose, onSave }: { onClose: () => void; onSave: (f: { title: string; description: string; time: string; priority: TaskPriority; category: string }) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [category, setCategory] = useState('oficina');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    onSave({ title: title.trim(), description: description.trim() || '', time, priority, category });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-neutral-100 overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 bg-[#fafafa] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf5ed]"><ListTodo className="h-4 w-4 text-[#5a9a7a]" /></div>
            <p className="text-base font-semibold text-neutral-900">Nueva tarea</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Título <span className="text-[#7fb89a]">*</span></label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="Ej: Llamar a cliente por cuota atrasada"
              className={`h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-[#7fb89a] ${error ? 'border-red-400' : 'border-neutral-200'}`}
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-[#7fb89a] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Hora</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-[#7fb89a]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-[#7fb89a]"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#c2dfcb]/60 focus:border-[#7fb89a]"
            >
              {Object.entries(categoryConfig).map(([key, c]) => (
                <option key={key} value={key}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 bg-[#fafafa] px-6 py-4">
          <button onClick={onClose} className="h-10 rounded-xl border border-neutral-200 bg-white px-5 text-sm font-semibold text-neutral-600 hover:bg-neutral-50">Cancelar</button>
          <button onClick={handleSubmit} className="h-10 rounded-xl bg-[#5a9a7a] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#4a866a]">Crear tarea</button>
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

  const today = new Date();
  const dateStr = today.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const load = useCallback(() => {
    setLoading(true);
    getTasks().then(setTasks).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTask = async (form: { title: string; description: string; time: string; priority: TaskPriority; category: string }) => {
    await createTask({
      title: form.title,
      description: form.description || undefined,
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

  const visibleTasks = filter === 'todas'
    ? tasks
    : tasks.filter((t) => t.status.toLowerCase().replace(/_/g, '-') === filter);

  const doneCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const pendientes = tasks.filter((t) => t.status === 'PENDING');
  const appointments = tasks.filter((t) => t.time).sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return 0;
  });

  const filterLabels: Record<FilterKey, string> = { todas: 'Todas', pendiente: 'Pendientes', 'en-progreso': 'En progreso', completada: 'Completadas' };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#7fb89a]">Panel de trabajo</p>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Agenda</h1>
            <p className="mt-1 text-sm capitalize text-neutral-500">{dateStr}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="h-11 rounded-full bg-[#5a9a7a] px-6 text-white shadow-sm hover:bg-[#4a866a] inline-flex items-center"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva tarea
          </button>
          {showModal && <NewTaskModal onClose={() => setShowModal(false)} onSave={addTask} />}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_300px]">
          <aside className="space-y-5">
            <MotionCard index={0}><MiniCalendar /></MotionCard>
            <MotionCard index={1} className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Resumen de hoy</p>
              {[
                { label: 'Tareas completadas', value: `${doneCount}/${tasks.length}`, color: '#7fb89a', bg: '#eaf5ed' },
                { label: 'Pendientes', value: String(pendientes.length), color: '#a16207', bg: '#fef3c7' },
                { label: 'Citas del día', value: String(appointments.length), color: '#1d4ed8', bg: '#dbeafe' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: s.bg }}>
                  <span className="text-xs font-medium text-neutral-700">{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </MotionCard>
          </aside>

          <main className="space-y-5">
            <MotionCard index={2} className="rounded-2xl bg-white p-5 shadow-sm border border-neutral-100">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-[#5a9a7a]" />
                  <span className="text-base font-semibold text-neutral-900">Tareas del día</span>
                </div>
                <span className="text-sm font-bold text-[#5a9a7a]">{doneCount}/{tasks.length}</span>
              </div>
              {tasks.length > 0 && (
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7fb89a] to-[#5a9a7a] transition-all duration-500"
                    style={{ width: `${(doneCount / tasks.length) * 100}%` }}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(Object.keys(filterLabels) as FilterKey[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      filter === f ? 'bg-[#1f3b2c] text-white shadow-sm' : 'bg-[#eaf5ed] text-[#5a9a7a] hover:bg-[#c2dfcb]/60'
                    }`}
                  >
                    {filterLabels[f]}
                  </button>
                ))}
              </div>
            </MotionCard>

            <MotionCard index={3} className="overflow-hidden rounded-2xl bg-white shadow-sm border border-neutral-100 divide-y divide-neutral-100">
            {loading ? (
              <div className="flex items-center justify-center py-20"><p className="text-sm text-neutral-400">Cargando...</p></div>
            ) : visibleTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <CircleCheck className="h-10 w-10 text-[#c2dfcb]" />
                <p className="text-sm font-semibold text-neutral-700">¡Todo al día!</p>
                <p className="text-xs text-neutral-400">No hay tareas en esta categoría.</p>
              </div>
            ) : (
              visibleTasks.map((task) => {
                const pri = priorityConfig[task.priority] ?? priorityConfig.MEDIUM;
                const cat = categoryConfig[task.category] ?? categoryConfig.oficina;
                const done = task.status === 'COMPLETED';

                return (
                  <div
                    key={task.id}
                    className={`group flex items-start gap-3 rounded-xl px-4 py-3 transition hover:bg-[#eaf5ed]/50 ${done ? 'opacity-60' : ''}`}
                  >
                    <button onClick={() => toggleTask(task.id)} className="mt-0.5 shrink-0 transition">
                      {done ? <CircleCheck className="h-5 w-5 text-[#7fb89a]" /> : <Circle className="h-5 w-5 text-neutral-300 group-hover:text-[#7fb89a]" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm font-medium max-w-[350px] truncate ${done ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                          {task.title}
                        </p>
                        {task.time && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                            <Clock className="h-3 w-3" />{task.time}
                          </span>
                        )}
                      </div>
                      {task.description && <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">{task.description}</p>}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: cat.bg, color: cat.text }}>
                          {cat.label}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: pri.bg, color: pri.text }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pri.dot }} />
                          {task.priority === 'URGENT' ? 'Urgente' : task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Media' : 'Baja'}
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

            <MotionCard index={4} className="rounded-2xl bg-white shadow-sm border border-neutral-100 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-neutral-100 bg-[#fafafa] px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef3c7]"><Banknote className="h-4 w-4 text-[#a16207]" /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Desembolsos pendientes</p>
                  <p className="text-xs text-neutral-500">Clientes que esperan recibir su préstamo</p>
                </div>
              </div>
              <div className="divide-y divide-neutral-100">
                {pendientes.length === 0 ? (
                  <div className="px-5 py-8 text-center text-xs text-neutral-400">Sin desembolsos pendientes</div>
                ) : (
                  pendientes.slice(0, 5).map((t) => {
                    const initial = t.title.charAt(0).toUpperCase();
                    return (
                      <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-[#eaf5ed]/30 transition">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5a9a7a] text-sm font-bold text-white border-2 border-white shadow-sm">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-neutral-900">{t.title}</p>
                          </div>
                          <p className="mt-0.5 text-xs text-neutral-500">{t.category} · {t.description?.slice(0, 40) ?? 'Sin detalles'}</p>
                          {t.time && (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[10px] font-semibold text-[#a16207]">
                              <Clock className="h-3 w-3" />{t.time}
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
            <MotionCard index={5} className="rounded-2xl bg-white shadow-sm border border-neutral-100 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-neutral-100 bg-[#fafafa] px-5 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#dbeafe]"><CalendarDays className="h-4 w-4 text-[#1d4ed8]" /></div>
                <p className="text-sm font-semibold text-neutral-900">Citas de hoy</p>
              </div>
              <div className="relative px-5 py-4">
                <div className="absolute left-[2.35rem] top-0 bottom-0 w-px bg-neutral-100" />
                <div className="space-y-4">
                  {appointments.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-4">Sin citas agendadas hoy</p>
                  ) : (
                    appointments.map((a) => (
                      <div key={a.id} className={`relative flex items-start gap-3 ${a.status === 'COMPLETED' ? 'opacity-50' : ''}`}>
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: a.status === 'COMPLETED' ? '#eaf5ed' : '#dbeafe', color: a.status === 'COMPLETED' ? '#5a9a7a' : '#1d4ed8' }}>
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-bold text-neutral-600">{a.time}</span>
                            {a.status === 'COMPLETED' && <span className="text-[10px] font-semibold text-[#7fb89a]">✓ Hecho</span>}
                          </div>
                          <p className={`mt-0.5 text-xs font-semibold ${a.status === 'COMPLETED' ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                            {a.title}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-[11px] text-neutral-500">
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
          </aside>
        </div>
      </div>
    </div>
  );
}
