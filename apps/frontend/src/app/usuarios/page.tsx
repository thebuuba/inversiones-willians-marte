'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ShieldCheck, ShieldX, X, UserRound, Mail, KeyRound, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getUsers, createUser, toggleActiveUser, type UserItem, type CreateUserInput } from '@/lib/api/users';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-[#FFE8D8] text-[#B45B38]',
  MANAGER: 'bg-[#D9ECFF] text-[#3A75B8]',
  COLLECTOR: 'bg-[#E7F4EC] text-[#3E8A61]',
  VIEWER: 'bg-[#F0F0F0] text-[#7A8A80]',
};

function CreateUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateUserInput>({ name: '', email: '', password: '', role: 'COLLECTOR' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createUser(form);
      onCreated();
      onClose();
      setForm({ name: '', email: '', password: '', role: 'COLLECTOR' });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-xl"
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#173D2C]">Nuevo usuario</h2>
              <button onClick={onClose} type="button" className="rounded-full p-1 text-[#A9CDBB] hover:bg-[#F3F4F6]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-[12px] bg-[#FFE8D8] p-3 text-sm text-[#B45B38]">{error}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-[#173D2C]">
                  <UserRound className="h-4 w-4 text-[#5FA37D]" />
                  Nombre completo
                </label>
                <input
                  className="w-full rounded-[12px] border border-[#DDEBE3] px-4 py-2.5 text-sm text-[#173D2C] outline-none transition focus:border-[#285C43] focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  required
                  value={form.name}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-[#173D2C]">
                  <Mail className="h-4 w-4 text-[#5FA37D]" />
                  Correo electrónico
                </label>
                <input
                  className="w-full rounded-[12px] border border-[#DDEBE3] px-4 py-2.5 text-sm text-[#173D2C] outline-none transition focus:border-[#285C43] focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  required
                  type="email"
                  value={form.email}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-[#173D2C]">
                  <KeyRound className="h-4 w-4 text-[#5FA37D]" />
                  Contraseña
                </label>
                <input
                  className="w-full rounded-[12px] border border-[#DDEBE3] px-4 py-2.5 text-sm text-[#173D2C] outline-none transition focus:border-[#285C43] focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  required
                  type="password"
                  value={form.password}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-[#173D2C]">
                  <ShieldCheck className="h-4 w-4 text-[#5FA37D]" />
                  Rol
                </label>
                <select
                  className="w-full rounded-[12px] border border-[#DDEBE3] px-4 py-2.5 text-sm text-[#173D2C] outline-none transition focus:border-[#285C43] focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  value={form.role}
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="COLLECTOR">Cobrador</option>
                  <option value="VIEWER">Solo vista</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-full bg-[#F3F4F6] py-2.5 text-sm font-bold text-[#7E9086] transition hover:bg-[#E7F4EC]"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={`flex-1 rounded-full py-2.5 text-sm font-bold text-white transition ${
                  saving ? 'bg-[#A9CDBB]' : 'bg-[#285C43] shadow-[0_8px_16px_rgba(40,92,67,0.22)] hover:-translate-y-0.5'
                }`}
                disabled={saving}
                type="submit"
              >
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const isAdmin = user?.role === 'ADMIN';

  function load() {
    getUsers().then(setUsers);
  }

  useEffect(() => { load(); }, []);

  async function handleToggle(id: string) {
    await toggleActiveUser(id);
    load();
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />

      <motion.header
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
        initial={{ opacity: 0, y: 16 }}
      >
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#173D2C]">Usuarios</h1>
          <p className="mt-1.5 text-sm text-[#7E9086]">Gestión de usuarios del sistema.</p>
        </div>
        {isAdmin && (
          <button
            className="flex h-11 items-center gap-2 rounded-full bg-[#285C43] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.22)] transition hover:-translate-y-0.5"
            onClick={() => setShowCreate(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </button>
        )}
      </motion.header>

      <div className="space-y-3">
        {users.length === 0 && (
          <p className="py-12 text-center text-sm font-medium text-[#A9CDBB]">No hay usuarios registrados</p>
        )}
        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-4 rounded-[16px] border border-[#DDEBE3] bg-white p-4 transition hover:shadow-[0_8px_20px_rgba(40,92,67,0.06)]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E7F4EC] text-[#5FA37D]">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold text-[#173D2C]">{u.name}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleColors[u.role] ?? roleColors.VIEWER}`}>
                  {u.role}
                </span>
                {!u.active && (
                  <span className="rounded-full bg-[#FFE8D8] px-2.5 py-0.5 text-[11px] font-bold text-[#B45B38]">
                    Inactivo
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#A9CDBB]">{u.email}</p>
            </div>
            {isAdmin && (
              <button
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  u.active
                    ? 'text-[#A9CDBB] hover:bg-[#FFE8D8] hover:text-[#C96F4A]'
                    : 'text-[#5FA37D] hover:bg-[#E7F4EC]'
                }`}
                onClick={() => handleToggle(u.id)}
                title={u.active ? 'Desactivar usuario' : 'Activar usuario'}
                type="button"
              >
                {u.active ? <ShieldX className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
