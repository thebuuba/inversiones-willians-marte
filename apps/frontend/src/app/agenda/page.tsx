'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { Plus, Calendar, Flag, Trash2, CheckCircle2, Circle, ArrowUp, AlertTriangle } from 'lucide-react';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/api/tasks';
import { useAuth } from '@/lib/auth-context';
import type { TaskItem, TaskPriority, TaskStatus } from '@inversiones/shared';

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  URGENT: { label: 'Urgente', color: '#C96F4A', bg: '#FFF7EF', icon: AlertTriangle },
  HIGH: { label: 'Alta', color: '#C96F4A', bg: '#FFE8D8', icon: ArrowUp },
  MEDIUM: { label: 'Media', color: '#A98219', bg: '#FFF2B8', icon: Flag },
  LOW: { label: 'Baja', color: '#6F8076', bg: '#F3F4F6', icon: Flag },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35 } }),
};

function formatDate(d: string): string {
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(d: string): boolean {
  return new Date(d) < new Date(new Date().toDateString());
}

export default function AgendaPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');

  const load = useCallback(() => {
    setLoading(true);
    getTasks()
      .then(setTasks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createTask({ title: title.trim(), description: description.trim() || undefined, dueDate: dueDate || undefined, priority });
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('MEDIUM');
      setShowForm(false);
      load();
    } catch { /* silent */ }
    setSaving(false);
  };

  const handleToggle = async (task: TaskItem) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await updateTask(task.id, { status: nextStatus });
      load();
    } catch { /* silent */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await deleteTask(id);
      load();
    } catch { /* silent */ }
  };

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);
  const pendingCount = tasks.filter((t) => t.status !== 'COMPLETED').length;
  const initials = (user?.name ?? 'U').split(' ').map((s: string) => s[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-[#173D2C]">Agenda</h1>
            <p className="mt-1.5 text-sm text-[#A9CDBB]">
              {pendingCount} tarea{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex h-11 items-center gap-2 rounded-full bg-[#5FA37D] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(95,163,125,0.22)]"
          >
            <Plus className="h-4 w-4" />
            Nueva tarea
          </button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-[18px] border border-[#DDEBE3] bg-white p-5 shadow-[0_7px_22px_rgba(40,92,67,0.035)]"
          >
            <div className="mb-4 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título de la tarea..."
                className="h-11 w-full rounded-[12px] border border-[#DDEBE3] bg-[#F9FBFB] px-4 text-sm text-[#173D2C] placeholder:text-[#A9CDBB] outline-none focus:border-[#5FA37D]"
                autoFocus
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full rounded-[12px] border border-[#DDEBE3] bg-[#F9FBFB] px-4 py-2.5 text-sm text-[#173D2C] placeholder:text-[#A9CDBB] outline-none focus:border-[#5FA37D] resize-none"
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-11 rounded-[12px] border border-[#DDEBE3] bg-[#F9FBFB] px-4 text-sm text-[#173D2C] outline-none focus:border-[#5FA37D]"
                />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="h-11 rounded-[12px] border border-[#DDEBE3] bg-[#F9FBFB] px-4 text-sm text-[#173D2C] outline-none focus:border-[#5FA37D]"
                >
                  <option value="LOW">Baja</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="h-9 rounded-full border border-[#DDEBE3] bg-white px-4 text-sm font-bold text-[#5FA37D]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || saving}
                className="h-9 rounded-full bg-[#5FA37D] px-4 text-sm font-bold text-white shadow-sm disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Crear tarea'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="mb-5 flex gap-2">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-9 rounded-full px-4 text-sm font-bold transition-colors ${
                filter === f
                  ? 'bg-[#5FA37D] text-white shadow-sm'
                  : 'border border-[#DDEBE3] bg-white text-[#6F8076]'
              }`}
            >
              {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendientes' : f === 'IN_PROGRESS' ? 'En curso' : 'Completadas'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-[#A9CDBB]">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[#DDEBE3] bg-white py-20">
            <p className="text-sm font-medium text-[#A9CDBB]">No hay tareas</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-bold text-[#5FA37D] underline"
            >
              Crear primera tarea
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((task, i) => {
              const PriorityIcon = priorityConfig[task.priority].icon;
              const done = task.status === 'COMPLETED';

              return (
                <motion.div
                  key={task.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className={`group flex items-start gap-3.5 rounded-[16px] border p-4 transition-all ${
                    done
                      ? 'border-[#DDEBE3] bg-[#F3FAF6] opacity-70'
                      : 'border-[#DDEBE3] bg-white shadow-[0_4px_12px_rgba(40,92,67,0.025)]'
                  }`}
                >
                  <button
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 shrink-0"
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-[#5FA37D]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[#A9CDBB] transition-colors group-hover:text-[#5FA37D]" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-bold ${done ? 'text-[#6F8076] line-through' : 'text-[#173D2C]'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 text-sm text-[#6F8076]">{task.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-[#C96F4A]" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: priorityConfig[task.priority].bg, color: priorityConfig[task.priority].color }}
                      >
                        <PriorityIcon className="h-3 w-3" />
                        {priorityConfig[task.priority].label}
                      </span>

                      {task.dueDate && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            !done && isOverdue(task.dueDate)
                              ? 'bg-[#FFE8D8] text-[#C96F4A]'
                              : 'bg-[#F3FAF6] text-[#6F8076]'
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.dueDate)}
                          {isOverdue(task.dueDate) && !done && ' (vencida)'}
                        </span>
                      )}

                      <span className="text-[11px] text-[#A9CDBB]">
                        {done ? 'Completada' : task.status === 'IN_PROGRESS' ? 'En curso' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
