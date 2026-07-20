'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { getUsers, createUser, toggleActiveUser, type UserItem, type CreateUserInput } from '@/lib/api/users';
import { useAuth } from '@/lib/auth-context';
import {
  Building2,
  Bell,
  Check,
  ChevronDown,
  Cloud,
  CreditCard,
  Download,
  KeyRound,
  Mail,
  Percent,
  Plus,
  ShieldCheck,
  ShieldX,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

const tabs = ['General', 'Préstamos', 'Usuarios y roles', 'Notificaciones', 'Seguridad', 'Integraciones'];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.055 },
  }),
};

function SectionCard({
  children,
  className = '',
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.section
      animate="visible"
      className={`rounded-2xl border border-border-soft bg-white shadow-sm ${className}`}
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function SettingsHeader() {
  return (
    <motion.header
      animate="visible"
      className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      initial="hidden"
      variants={fadeUp}
    >
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          <span className="h-2 w-2 rounded-full bg-primary-accent" />
          Sistema
        </span>
        <h1 className="mt-3 text-[28px] font-bold leading-tight text-text-primary">Configuración</h1>
        <p className="mt-1.5 text-sm font-medium text-text-secondary">
          Ajusta los parámetros de tu sistema de préstamos.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="h-11 rounded-full border border-primary-border bg-white px-6 text-sm font-bold text-text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6FAF7]"
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.2)] transition hover:-translate-y-0.5 hover:bg-primary"
          type="button"
        >
          <Check className="h-4 w-4" />
          Guardar cambios
        </button>
      </div>
    </motion.header>
  );
}

function SettingsTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <motion.nav
      animate="visible"
      className="mb-6 overflow-x-auto rounded-2xl border border-border-soft bg-white p-2 shadow-sm"
      custom={1}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="flex min-w-max items-center gap-4">
        {tabs.map((tab) => (
          <button
            className={`h-11 rounded-[14px] px-5 text-sm font-bold transition ${
              activeTab === tab ? 'bg-primary-soft text-primary shadow-sm' : 'text-text-secondary hover:bg-[#F6FAF7]'
            }`}
            key={tab}
            onClick={() => onTabChange(tab)}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}

function CardTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-primary-soft text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        <p className="mt-1 text-sm font-medium text-text-secondary">{subtitle}</p>
      </div>
    </div>
  );
}

function LogoUploader() {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-[18px] border border-dashed border-[#B8EBC9] bg-[#F7FCF9] p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-5">
        <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[18px] bg-[#B8DCC5] text-xl font-bold text-primary">
          WM
        </div>
        <div>
          <p className="text-base font-bold text-text-primary">Logo de la empresa</p>
          <p className="mt-1 text-sm font-medium text-text-secondary">
            PNG o SVG, recomendado 512×512px. Máximo 2MB.
          </p>
        </div>
      </div>

      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-primary-border bg-white px-6 text-sm font-bold text-text-primary shadow-sm transition hover:bg-[#F6FAF7]">
        <Upload className="h-4 w-4" />
        Subir logo
        <input className="hidden" type="file" />
      </label>
    </div>
  );
}

function FormInput({
  label,
  value,
  helper,
  className = '',
  multiline = false,
  prefix,
  suffix,
}: {
  label: string;
  value: string;
  helper?: string;
  className?: string;
  multiline?: boolean;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-text-secondary">{label}</span>
      {multiline ? (
        <textarea
          className="h-[96px] w-full resize-none rounded-[10px] border border-primary-border bg-white px-4 py-3 text-sm font-medium text-text-primary shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-primary focus:ring-2 focus:ring-[#DDEBE3]"
          defaultValue={value}
        />
      ) : (
        <div className="flex h-11 w-full items-center rounded-[10px] border border-primary-border bg-white px-4 text-sm font-medium text-text-primary shadow-[0_3px_8px_rgba(40,92,67,0.06)] transition focus-within:border-primary focus-within:ring-2 focus-within:ring-[#DDEBE3]">
          {prefix && <span className="mr-3 shrink-0 text-text-secondary">{prefix}</span>}
          <input
            className="h-full min-w-0 flex-1 bg-transparent outline-none"
            defaultValue={value}
          />
          {suffix && <span className="ml-3 shrink-0 text-text-secondary">{suffix}</span>}
        </div>
      )}
      {helper && <span className="mt-2 block text-sm font-medium text-text-subtle">{helper}</span>}
    </label>
  );
}

function FormSelect({
  label,
  value,
  options = [value],
  helper,
}: {
  label: string;
  value: string;
  options?: string[];
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-text-secondary">{label}</span>
      <div className="relative">
        <select
          className="h-11 w-full appearance-none rounded-[10px] border border-primary-border bg-white px-4 pr-10 text-sm font-medium text-text-primary shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-primary focus:ring-2 focus:ring-[#DDEBE3]"
          defaultValue={value}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
      </div>
      {helper && <span className="mt-2 block text-sm font-medium text-text-subtle">{helper}</span>}
    </label>
  );
}

function ToggleSwitch({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      aria-checked={checked}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? 'bg-[#18191D] shadow-[0_5px_12px_rgba(0,0,0,0.16)]' : 'bg-[#E1E3E6] shadow-[0_4px_10px_rgba(23,61,44,0.08)]'
      }`}
      onClick={() => setChecked((current) => !current)}
      role="switch"
      type="button"
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.18)] transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function CompanyInfoCard() {
  return (
    <SectionCard className="p-6" index={2}>
      <CardTitle
        icon={<Building2 className="h-6 w-6" />}
        subtitle="Datos que aparecerán en recibos, contratos y reportes."
        title="Información de la empresa"
      />

      <LogoUploader />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput label="Nombre comercial" value="" />
        <FormInput label="RNC / Identificación" value="" />
        <FormInput label="Correo de contacto" value="" />
        <FormInput label="Teléfono" value="" />
        <FormInput
          className="md:col-span-2"
          helper="Aparece en facturas y contratos."
          label="Dirección"
          multiline
          value=""
        />
      </div>
    </SectionCard>
  );
}

function LocalizationCard() {
  return (
    <SectionCard className="p-6" index={3}>
      <CardTitle
        icon={<Cloud className="h-6 w-6" />}
        subtitle="Idioma, moneda y formato regional."
        title="Localización"
      />

      <div className="space-y-5">
        <FormSelect label="Idioma" options={[]} value="" />
        <FormSelect label="Moneda principal" options={[]} value="" />
        <FormSelect label="Zona horaria" options={[]} value="" />
        <FormSelect label="Formato de fecha" options={[]} value="" />
      </div>
    </SectionCard>
  );
}

function SwitchRow({
  title,
  description,
  defaultChecked,
  bordered = true,
}: {
  title: string;
  description: string;
  defaultChecked: boolean;
  bordered?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-border-soft' : ''}`}>
      <div>
        <p className="text-base font-bold text-text-primary">{title}</p>
        <p className="mt-1 text-sm font-medium text-text-secondary">{description}</p>
      </div>
      <ToggleSwitch defaultChecked={defaultChecked} />
    </div>
  );
}

function DefaultLoanParametersCard() {
  return (
    <SectionCard className="p-6 lg:p-7" index={2}>
      <CardTitle
        icon={<Percent className="h-6 w-6" />}
        subtitle="Valores aplicados al crear un préstamo nuevo."
        title="Parámetros por defecto"
      />

      <div className="grid grid-cols-1 gap-x-7 gap-y-5 md:grid-cols-2">
        <FormInput
          helper="Porcentaje aplicado al capital cada mes."
          label="Tasa de interés mensual"
          suffix="%"
          value=""
        />
        <FormInput label="Mora por día de atraso" suffix="%" value="" />
        <FormInput label="Plazo mínimo (meses)" value="" />
        <FormInput label="Plazo máximo (meses)" value="" />
        <FormInput label="Monto mínimo" prefix="RD$" value="" />
        <FormInput label="Monto máximo" prefix="RD$" value="" />
        <FormSelect
          label="Frecuencia de pago por defecto"
          options={[]}
          value=""
        />
        <FormSelect
          label="Método de cálculo"
          options={[]}
          value=""
        />
      </div>

      <div className="mt-4">
        <SwitchRow
          defaultChecked={false}
          description="Préstamos menores al monto mínimo se aprueban sin revisión."
          title="Aprobación automática"
        />
        <SwitchRow
          defaultChecked={false}
          description="Solicitar al menos un garante por cada préstamo nuevo."
          title="Requerir garante"
        />
        <SwitchRow
          bordered={false}
          defaultChecked={false}
          description="Crear automáticamente la tabla de cuotas al aprobar."
          title="Generar amortización al crear"
        />
      </div>
    </SectionCard>
  );
}

function LoanProductsCard() {
  return (
    <SectionCard className="p-6 lg:p-7" index={3}>
      <CardTitle
        icon={<CreditCard className="h-6 w-6" />}
        subtitle="Plantillas reutilizables al crear préstamos."
        title="Productos de préstamo"
      />

      <div className="space-y-4">
        <p className="py-6 text-center text-sm font-medium text-text-secondary">No hay productos configurados</p>
      </div>

      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#B8EBC9] bg-[#F7FCF9] text-base font-bold text-primary transition hover:bg-primary-soft"
        onClick={() => undefined}
        type="button"
      >
        <Plus className="h-5 w-5" />
        Nuevo producto
      </button>
    </SectionCard>
  );
}

function SettingsGeneralTab() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <CompanyInfoCard />
      <LocalizationCard />
    </motion.div>
  );
}

function SettingsLoansTab() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <DefaultLoanParametersCard />
      <LoanProductsCard />
    </motion.div>
  );
}

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
              <h2 className="text-lg font-bold text-text-primary">Nuevo usuario</h2>
              <button onClick={onClose} type="button" className="rounded-full p-1 text-text-secondary hover:bg-page">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-[12px] bg-state-danger-bg p-3 text-sm text-state-danger">{error}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-text-primary">
                  <UserRound className="h-4 w-4 text-primary-accent" />
                  Nombre completo
                </label>
                <input
                  className="w-full rounded-[12px] border border-primary-border px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  required
                  value={form.name}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Mail className="h-4 w-4 text-primary-accent" />
                  Correo electrónico
                </label>
                <input
                  className="w-full rounded-[12px] border border-primary-border px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  required
                  type="email"
                  value={form.email}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-text-primary">
                  <KeyRound className="h-4 w-4 text-primary-accent" />
                  Contraseña
                </label>
                <input
                  className="w-full rounded-[12px] border border-primary-border px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  required
                  type="password"
                  value={form.password}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-text-primary">
                  <ShieldCheck className="h-4 w-4 text-primary-accent" />
                  Rol
                </label>
                <select
                  className="w-full rounded-[12px] border border-primary-border px-4 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-[#285C43]/10"
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  value={form.role}
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="COLLECTOR">Cobrador</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 rounded-full bg-page py-2.5 text-sm font-bold text-text-secondary transition hover:bg-primary-soft"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className={`flex-1 rounded-full py-2.5 text-sm font-bold text-white transition ${
                  saving ? 'bg-text-secondary' : 'bg-primary-accent shadow-[0_8px_16px_rgba(90,154,122,0.22)] hover:-translate-y-0.5'
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

const roleBadgeColors: Record<string, { bg: string; text: string }> = {
  ADMIN: { bg: '#FFE8D8', text: '#9F3F25' },
  COLLECTOR: { bg: '#E7F4EC', text: '#3E8A61' },
};

const statusStyles = {
  Activo: { bg: '#E7F4EC', text: '#285C43', dot: '#2F7654' },
  Inactivo: { bg: '#F0ECE5', text: '#8D7A5F', dot: '#CDBA97' },
} as const;

function RoleBadge({ role }: { role: string }) {
  const style = roleBadgeColors[role] ?? roleBadgeColors.ADMIN;

  return (
    <span
      className="inline-flex min-w-max items-center rounded-full px-3 py-1 text-sm font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const status = active ? 'Activo' : 'Inactivo';
  const style = statusStyles[status];

  return (
    <span
      className="inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.dot }} />
      {status}
    </span>
  );
}

function SettingsUsersRolesTab() {
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

  const activeCount = users.filter((u) => u.active).length;

  const rolesMap: Record<string, { count: number; users: UserItem[] }> = {};
  for (const u of users) {
    if (!rolesMap[u.role]) rolesMap[u.role] = { count: 0, users: [] };
    rolesMap[u.role].count++;
    rolesMap[u.role].users.push(u);
  }

  const roleDot: Record<string, string> = {
    ADMIN: '#B8DCC5',
    COLLECTOR: '#D8E9FF',
  };

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    COLLECTOR: 'Cobrador',
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={load} />

      <SectionCard className="p-6 lg:p-7" index={2}>
        <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <CardTitle
            icon={<UsersRound className="h-6 w-6" />}
            subtitle="Personas con acceso al sistema."
            title="Miembros del equipo"
          />
        </div>

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-text-secondary">{users.length} miembros · {activeCount} activos</p>
          {isAdmin && (
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.2)] transition hover:-translate-y-0.5 hover:bg-primary"
              onClick={() => setShowCreate(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </button>
          )}
        </div>

        {users.length === 0 ? (
          <p className="py-12 text-center text-sm font-medium text-text-secondary">No hay usuarios registrados</p>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-border-soft">
            <div className="hidden grid-cols-[minmax(220px,1.6fr)_minmax(160px,1fr)_minmax(120px,0.9fr)_100px] bg-[#F3F8F5] px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-text-secondary md:grid">
              <span>Miembro</span>
              <span>Rol</span>
              <span>Estado</span>
              <span className="text-right">Acciones</span>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="grid gap-4 border-t border-border-soft bg-white px-5 py-4 md:grid-cols-[minmax(220px,1.6fr)_minmax(160px,1fr)_minmax(120px,0.9fr)_100px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary shadow-[0_6px_14px_rgba(40,92,67,0.12)]">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold leading-tight text-text-primary">{u.name}</p>
                    <p className="mt-1 truncate text-sm font-medium text-text-secondary">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary md:hidden">Rol</span>
                  <RoleBadge role={u.role} />
                </div>

                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary md:hidden">Estado</span>
                  <StatusBadge active={u.active} />
                </div>

                <div className="flex items-center justify-end gap-4 text-text-secondary">
                  {isAdmin && (
                    <>
                      <button
                        aria-label={`${u.active ? 'Desactivar' : 'Activar'} ${u.name}`}
                        className={`rounded-full p-1.5 transition hover:bg-primary-soft ${
                          u.active ? 'hover:text-primary' : 'hover:text-primary'
                        }`}
                        onClick={() => handleToggle(u.id)}
                        type="button"
                      >
                        {u.active ? <ShieldX className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                      </button>
                      <button
                        aria-label={`Eliminar ${u.name}`}
                        className="rounded-full p-1.5 transition hover:bg-[#FFE3D2] hover:text-state-danger"
                        onClick={() => handleToggle(u.id)}
                        type="button"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard className="p-6 lg:p-7" index={3}>
        <CardTitle
          icon={<ShieldCheck className="h-6 w-6" />}
          subtitle="Define qué puede hacer cada tipo de usuario."
          title="Roles y permisos"
        />

        <div className="space-y-4">
          {Object.entries(rolesMap).map(([role, { count }]) => (
            <div
              key={role}
              className="rounded-[18px] border border-border-soft bg-white p-5 shadow-[0_5px_18px_rgba(40,92,67,0.025)]"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: roleDot[role] ?? '#ccc' }} />
                  <p className="truncate text-base font-bold text-text-primary">{roleLabel[role] ?? role}</p>
                </div>
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary-soft px-2 text-sm font-bold text-primary">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}

const notificationChannels: {
  title: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  enabled: boolean;
}[] = [];

const internalAlerts: {
  title: string;
  detail: string;
  enabled: boolean;
}[] = [];

function NotificationChannelItem({
  channel,
}: {
  channel: (typeof notificationChannels)[number];
}) {
  const Icon = channel.icon;

  return (
    <div className="flex min-h-[92px] items-center gap-4 rounded-[18px] border border-border-soft bg-white px-4 py-4 shadow-[0_5px_18px_rgba(40,92,67,0.025)]">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px]"
        style={{ backgroundColor: channel.iconBg, color: channel.iconColor }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-text-primary">{channel.title}</p>
        <p className="mt-1 truncate text-sm font-medium text-text-secondary">{channel.detail}</p>
      </div>
      <ToggleSwitch defaultChecked={channel.enabled} />
    </div>
  );
}

function NotificationChannelsCard() {
  return (
    <SectionCard className="p-6 lg:p-7" index={2}>
      <CardTitle
        icon={<Bell className="h-6 w-6" />}
        subtitle="Cómo se entregan los avisos al equipo y a los clientes."
        title="Canales activos"
      />

      <div className="space-y-4">
        {notificationChannels.map((channel) => (
          <NotificationChannelItem channel={channel} key={channel.title} />
        ))}
      </div>
    </SectionCard>
  );
}

function InternalAlertItem({
  alert,
  bordered = true,
}: {
  alert: (typeof internalAlerts)[number];
  bordered?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-border-soft' : ''}`}>
      <div>
        <p className="text-base font-bold text-text-primary">{alert.title}</p>
        <p className="mt-1 text-sm font-medium text-text-secondary">{alert.detail}</p>
      </div>
      <ToggleSwitch defaultChecked={alert.enabled} />
    </div>
  );
}

function InternalAlertsCard() {
  return (
    <SectionCard className="p-6 lg:p-7" index={3}>
      <CardTitle
        icon={<UsersRound className="h-6 w-6" />}
        subtitle="Avisos que recibe tu equipo dentro del sistema."
        title="Alertas internas"
      />

      <div>
        {internalAlerts.map((alert, index) => (
          <InternalAlertItem
            alert={alert}
            bordered={index < internalAlerts.length - 1}
            key={alert.title}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 border-t border-border-soft pt-6 md:grid-cols-2">
        <FormSelect
          helper="Días antes de la fecha de cuota."
          label="Recordatorio de pago al cliente"
          options={[]}
          value=""
        />
        <FormInput
          helper="Para resúmenes y alertas programadas."
          label="Hora de envío diario"
          value=""
        />
      </div>
    </SectionCard>
  );
}

function SettingsNotificationsTab() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.85fr)]"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <NotificationChannelsCard />
      <InternalAlertsCard />
    </motion.div>
  );
}

const securityOptions: {
  title: string;
  detail: string;
  enabled: boolean;
}[] = [];

function SecurityOptionItem({
  option,
  bordered = true,
}: {
  option: (typeof securityOptions)[number];
  bordered?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-border-soft' : ''}`}>
      <div>
        <p className="text-base font-bold text-text-primary">{option.title}</p>
        <p className="mt-1 text-sm font-medium text-text-secondary">{option.detail}</p>
      </div>
      <ToggleSwitch defaultChecked={option.enabled} />
    </div>
  );
}

function AccessAuthenticationCard() {
  return (
    <SectionCard className="p-6 lg:p-7" index={2}>
      <CardTitle
        icon={<KeyRound className="h-6 w-6" />}
        subtitle="Controla cómo inician sesión los usuarios."
        title="Acceso y autenticación"
      />

      <div>
        {securityOptions.map((option, index) => (
          <SecurityOptionItem
            bordered={index < securityOptions.length - 1}
            key={option.title}
            option={option}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 border-t border-border-soft pt-6 md:grid-cols-2">
        <FormSelect
          label="Longitud mínima de contraseña"
          options={[]}
          value=""
        />
        <FormSelect
          label="Caducidad de contraseña"
          options={[]}
          value=""
        />
      </div>
    </SectionCard>
  );
}

function BackupsCard() {
  return (
    <SectionCard className="p-6 lg:p-7" index={3}>
      <CardTitle
        icon={<ShieldCheck className="h-6 w-6" />}
        subtitle="Resguarda tu información de forma automática."
        title="Respaldos"
      />

      <p className="py-6 text-center text-sm font-medium text-text-secondary">No hay respaldos configurados</p>

      <div className="space-y-5">
        <FormSelect
          label="Frecuencia"
          options={[]}
          value=""
        />
        <FormSelect
          label="Retención"
          options={[]}
          value=""
        />
      </div>

      <button
        className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-full border border-primary-border bg-white text-base font-bold text-text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6FAF7] hover:shadow-md"
        onClick={() => undefined}
        type="button"
      >
        <Download className="h-5 w-5" />
        Descargar copia ahora
      </button>
    </SectionCard>
  );
}

function SettingsSecurityTab() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <AccessAuthenticationCard />
      <BackupsCard />
    </motion.div>
  );
}

function EmptySettingsTab({ tab }: { tab: string }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border-soft bg-white p-6 text-sm font-medium text-text-muted shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {tab}
    </motion.div>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Seguridad');

  return (
    <main className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <SettingsHeader />
      <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'General' && <SettingsGeneralTab key="general" />}
      {activeTab === 'Préstamos' && <SettingsLoansTab key="loans" />}
      {activeTab === 'Usuarios y roles' && <SettingsUsersRolesTab key="users-roles" />}
      {activeTab === 'Notificaciones' && <SettingsNotificationsTab key="notifications" />}
      {activeTab === 'Seguridad' && <SettingsSecurityTab key="security" />}
      {activeTab !== 'General' &&
        activeTab !== 'Préstamos' &&
        activeTab !== 'Usuarios y roles' &&
        activeTab !== 'Notificaciones' &&
        activeTab !== 'Seguridad' && (
        <EmptySettingsTab key={activeTab} tab={activeTab} />
      )}
    </main>
  );
}
