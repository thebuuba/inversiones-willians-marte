'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  getUsers,
  createUser,
  toggleActiveUser,
  getUserPortfolioAssignments,
  updateUserPortfolioAssignments,
  type UserItem,
  type CreateUserInput,
} from '@/lib/api/users';
import { getPortfolios, type PortfolioItem } from '@/lib/api/portfolios';
import { getSettings, updateSettings } from '@/lib/api/settings';
import { useAuth } from '@/lib/auth-context';
import { ThemeSelector } from './theme-selector';
import {
  Building2,
  AtSign,
  Bell,
  Check,
  ChevronDown,
  Cloud,
  CreditCard,
  Download,
  FolderKanban,
  KeyRound,
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

const tabs = [
  'General',
  'Préstamos',
  'Usuarios y roles',
  'Notificaciones',
  'Seguridad',
  'Integraciones',
];

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
      className={`rounded-panel border border-border-soft bg-card shadow-card ${className}`}
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
        <h1 className="mt-3 text-3xl font-bold leading-tight text-text-primary">Configuración</h1>
        <p className="mt-1.5 text-sm font-medium text-text-secondary">
          Ajusta los parámetros de tu sistema de préstamos.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="h-11 rounded-full border border-primary-border bg-card px-6 text-sm font-bold text-text-primary shadow-soft transition hover:bg-surface-subtle"
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-bold text-text-inverse shadow-action transition hover:bg-primary"
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
      className="scrollbar-none mb-6 overflow-x-auto rounded-panel border border-border-soft bg-card p-2 shadow-card"
      custom={1}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="flex min-w-max items-center gap-4">
        {tabs.map((tab) => (
          <button
            className={`h-11 rounded-[14px] px-5 text-sm font-bold transition ${
              activeTab === tab
                ? 'bg-primary-soft text-primary shadow-card'
                : 'text-text-secondary hover:bg-surface-subtle'
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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control-comfortable bg-primary-soft text-primary">
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
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-panel border border-dashed border-border-strong-ui bg-primary-soft p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-5">
        <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-panel bg-primary-border text-xl font-bold text-primary">
          WM
        </div>
        <div>
          <p className="text-base font-bold text-text-primary">Logo de la empresa</p>
          <p className="mt-1 text-sm font-medium text-text-secondary">
            PNG o SVG, recomendado 512×512px. Máximo 2MB.
          </p>
        </div>
      </div>

      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-primary-border bg-card px-6 text-sm font-bold text-text-primary shadow-soft transition hover:bg-surface-subtle">
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
  onChange,
}: {
  label: string;
  value: string;
  helper?: string;
  className?: string;
  multiline?: boolean;
  prefix?: string;
  suffix?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-text-secondary">{label}</span>
      {multiline ? (
        <textarea
          className="h-[96px] w-full resize-none rounded-control border border-primary-border bg-card px-4 py-3 text-sm font-medium text-text-primary shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
          onChange={(event) => onChange?.(event.target.value)}
          value={value}
        />
      ) : (
        <div className="flex h-11 w-full items-center rounded-control border border-primary-border bg-card px-4 text-sm font-medium text-text-primary shadow-soft transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft">
          {prefix && <span className="mr-3 shrink-0 text-text-secondary">{prefix}</span>}
          <input
            className="h-full min-w-0 flex-1 bg-transparent outline-none"
            onChange={(event) => onChange?.(event.target.value)}
            value={value}
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
          className="h-11 w-full appearance-none rounded-control border border-primary-border bg-card px-4 pr-10 text-sm font-medium text-text-primary shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
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
        checked ? 'bg-primary shadow-action' : 'bg-state-neutral-bg shadow-soft'
      }`}
      onClick={() => setChecked((current) => !current)}
      role="switch"
      type="button"
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow-soft transition ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

function CompanyInfoCard() {
  const [company, setCompany] = useState({
    companyName: 'Inversiones Willians Marte',
    companyTaxId: '',
    companyEmail: '',
    companyPhone: '',
    companyAddress: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((settings) =>
        setCompany({
          companyName: settings.companyName,
          companyTaxId: settings.companyTaxId ?? '',
          companyEmail: settings.companyEmail ?? '',
          companyPhone: settings.companyPhone ?? '',
          companyAddress: settings.companyAddress ?? '',
        }),
      )
      .catch(() => undefined);
  }, []);

  function change(field: keyof typeof company) {
    return (value: string) => {
      setCompany((current) => ({ ...current, [field]: value }));
      setSaved(false);
    };
  }

  async function saveCompany() {
    setSaving(true);
    setSaved(false);
    try {
      const settings = await updateSettings(company);
      setCompany({
        companyName: settings.companyName,
        companyTaxId: settings.companyTaxId ?? '',
        companyEmail: settings.companyEmail ?? '',
        companyPhone: settings.companyPhone ?? '',
        companyAddress: settings.companyAddress ?? '',
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard className="p-6" index={2}>
      <CardTitle
        icon={<Building2 className="h-6 w-6" />}
        subtitle="Datos que aparecerán en recibos, contratos y reportes."
        title="Información de la empresa"
      />

      <LogoUploader />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          label="Nombre comercial"
          onChange={change('companyName')}
          value={company.companyName}
        />
        <FormInput
          label="RNC / Identificación"
          onChange={change('companyTaxId')}
          value={company.companyTaxId}
        />
        <FormInput
          label="Correo de contacto"
          onChange={change('companyEmail')}
          value={company.companyEmail}
        />
        <FormInput
          label="Teléfono"
          onChange={change('companyPhone')}
          value={company.companyPhone}
        />
        <FormInput
          className="md:col-span-2"
          helper="Aparece en facturas y contratos."
          label="Dirección"
          multiline
          onChange={change('companyAddress')}
          value={company.companyAddress}
        />
      </div>
      <div className="mt-5 flex items-center justify-end gap-3">
        {saved && (
          <span className="text-sm font-bold text-state-success">Información guardada</span>
        )}
        <button
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-bold text-text-inverse shadow-action transition hover:bg-primary disabled:opacity-60"
          disabled={saving || !company.companyName.trim()}
          onClick={saveCompany}
          type="button"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Guardando...' : 'Guardar empresa'}
        </button>
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
    <div
      className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-border-soft' : ''}`}
    >
      <div>
        <p className="text-base font-bold text-text-primary">{title}</p>
        <p className="mt-1 text-sm font-medium text-text-secondary">{description}</p>
      </div>
      <ToggleSwitch defaultChecked={defaultChecked} />
    </div>
  );
}

function DefaultLoanParametersCard() {
  const [graceDays, setGraceDays] = useState(5);
  const [savingGrace, setSavingGrace] = useState(false);
  const [graceSaved, setGraceSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((settings) => setGraceDays(settings.graceDays))
      .catch(() => undefined);
  }, []);

  async function saveGraceDays() {
    setSavingGrace(true);
    setGraceSaved(false);
    try {
      const settings = await updateSettings(graceDays);
      setGraceDays(settings.graceDays);
      setGraceSaved(true);
    } finally {
      setSavingGrace(false);
    }
  }

  return (
    <SectionCard className="p-6 lg:p-7" index={2}>
      <CardTitle
        icon={<Percent className="h-6 w-6" />}
        subtitle="Valores aplicados al crear un préstamo nuevo."
        title="Parámetros por defecto"
      />

      <div className="mb-6 rounded-panel border border-primary-border bg-primary-soft p-4">
        <label className="block">
          <span className="text-sm font-bold text-text-primary">
            Días de gracia para pagar una cuota
          </span>
          <span className="mt-1 block text-sm font-medium text-text-secondary">
            La cuota queda pendiente desde su vencimiento y pasa a atrasada al superar este plazo.
          </span>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              className="h-11 w-24 rounded-control border border-primary-border bg-card px-4 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              max={30}
              min={0}
              onChange={(event) => {
                setGraceDays(Math.min(30, Math.max(0, Number(event.target.value))));
                setGraceSaved(false);
              }}
              type="number"
              value={graceDays}
            />
            <span className="text-sm font-medium text-text-secondary">días</span>
            <button
              className="ml-auto h-10 rounded-full bg-primary-accent px-5 text-sm font-bold text-white hover:bg-primary disabled:opacity-50"
              disabled={savingGrace}
              onClick={saveGraceDays}
              type="button"
            >
              {savingGrace ? 'Guardando...' : graceSaved ? 'Guardado' : 'Guardar plazo'}
            </button>
          </div>
        </label>
      </div>

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
        <FormSelect label="Frecuencia de pago por defecto" options={[]} value="" />
        <FormSelect label="Método de cálculo" options={[]} value="" />
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
        <p className="py-6 text-center text-sm font-medium text-text-secondary">
          No hay productos configurados
        </p>
      </div>

      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-panel border border-dashed border-border-strong-ui bg-primary-soft text-base font-bold text-primary transition hover:bg-surface-muted-ui"
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
      <div className="space-y-5">
        <ThemeSelector />
        <LocalizationCard />
      </div>
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

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateUserInput>({
    name: '',
    username: '',
    password: '',
    role: 'COLLECTOR',
  });
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
      setForm({ name: '', username: '', password: '', role: 'COLLECTOR' });
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
            className="w-full max-w-md rounded-panel border border-border-soft bg-card p-6 shadow-modal"
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">Nuevo usuario</h2>
              <button
                onClick={onClose}
                type="button"
                className="rounded-full p-1 text-text-secondary hover:bg-page"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-[12px] bg-state-danger-bg p-3 text-sm text-state-danger">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-text-primary">
                  <UserRound className="h-4 w-4 text-primary-accent" />
                  Nombre completo
                </label>
                <input
                  className="h-11 w-full rounded-control border border-primary-border bg-card px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  required
                  value={form.name}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-text-primary">
                  <AtSign className="h-4 w-4 text-primary-accent" />
                  Usuario para iniciar sesión
                </label>
                <input
                  className="h-11 w-full rounded-control border border-primary-border bg-card px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  autoCapitalize="none"
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  pattern="[a-zA-Z0-9._-]+"
                  placeholder="Ej: juan.perez"
                  required
                  value={form.username}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-text-primary">
                  <KeyRound className="h-4 w-4 text-primary-accent" />
                  Contraseña
                </label>
                <input
                  className="h-11 w-full rounded-control border border-primary-border bg-card px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={10}
                  placeholder="Mínimo 10 caracteres"
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
                  className="h-11 w-full rounded-control border border-primary-border bg-card px-4 text-sm text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft"
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
                  saving ? 'bg-text-secondary' : 'bg-primary-accent shadow-action hover:bg-primary'
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

function UserPortfoliosModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getPortfolios(), getUserPortfolioAssignments(user.id)])
      .then(([all, assignments]) => {
        if (!active) return;
        setPortfolios(all);
        setSelected(new Set(assignments));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('No se pudieron cargar las carteras');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.id]);

  function toggle(portfolioId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(portfolioId)) {
        next.delete(portfolioId);
      } else {
        next.add(portfolioId);
      }
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await updateUserPortfolioAssignments(user.id, Array.from(selected));
      onSaved();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error ?? 'Error al guardar carteras');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
      >
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex max-h-[85vh] w-full max-w-md flex-col rounded-panel border border-border-soft bg-card p-6 shadow-modal"
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Carteras de {user.name}</h2>
            <button
              className="rounded-full p-1 text-text-secondary hover:bg-page"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-4 text-sm font-medium text-text-secondary">
            El cobrador solo verá los préstamos, clientes y reportes de estas carteras.
          </p>

          {error && (
            <p className="mb-4 rounded-[12px] bg-state-danger-bg p-3 text-sm text-state-danger">
              {error}
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {loading ? (
              <p className="py-8 text-center text-sm font-medium text-text-secondary">
                Cargando carteras...
              </p>
            ) : portfolios.length === 0 ? (
              <p className="py-8 text-center text-sm font-medium text-text-secondary">
                No hay carteras creadas
              </p>
            ) : (
              <div className="space-y-2">
                {portfolios.map((portfolio) => {
                  const checked = selected.has(portfolio.id);
                  return (
                    <button
                      className={`flex w-full items-center gap-3 rounded-control border px-4 py-3 text-left transition ${
                        checked
                          ? 'border-primary bg-primary-soft'
                          : 'border-primary-border bg-card hover:bg-surface-subtle'
                      }`}
                      key={portfolio.id}
                      onClick={() => toggle(portfolio.id)}
                      type="button"
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                        style={{
                          backgroundColor: checked ? portfolio.color : 'transparent',
                          borderColor: checked ? portfolio.color : 'currentColor',
                        }}
                      >
                        {checked && <Check className="h-3.5 w-3.5 text-white" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-text-primary">
                          {portfolio.name}
                        </span>
                        {portfolio.description && (
                          <span className="mt-0.5 block truncate text-xs font-medium text-text-secondary">
                            {portfolio.description}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-text-secondary">
                        {portfolio._count.loans} préstamos
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
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
                saving || loading
                  ? 'bg-text-secondary'
                  : 'bg-primary-accent shadow-action hover:bg-primary'
              }`}
              disabled={saving || loading}
              onClick={handleSave}
              type="button"
            >
              {saving ? 'Guardando...' : 'Guardar carteras'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const roleBadgeClasses: Record<string, string> = {
  ADMIN: 'bg-state-danger-bg text-state-danger',
  COLLECTOR: 'bg-state-success-bg text-state-success',
};

const statusClasses: Record<string, { container: string; dot: string }> = {
  Activo: { container: 'bg-state-success-bg text-state-success', dot: 'bg-state-success-dot' },
  Inactivo: { container: 'bg-state-neutral-bg text-state-neutral', dot: 'bg-state-neutral-dot' },
} as const;

function RoleBadge({ role }: { role: string }) {
  const classes = roleBadgeClasses[role] ?? roleBadgeClasses.ADMIN;

  return (
    <span
      className={`inline-flex min-w-max items-center rounded-full px-3 py-1 text-sm font-bold ${classes}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  const status = active ? 'Activo' : 'Inactivo';
  const style = statusClasses[status];

  return (
    <span
      className={`inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${style.container}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

function SettingsUsersRolesTab() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [portfoliosFor, setPortfoliosFor] = useState<UserItem | null>(null);
  const isAdmin = user?.role === 'ADMIN';

  function load() {
    getUsers().then((loadedUsers) => {
      setUsers(loadedUsers);
      Promise.all(
        loadedUsers.map(async (u) => [u.id, await getUserPortfolioAssignments(u.id)] as const),
      )
        .then((pairs) => setAssignments(Object.fromEntries(pairs)))
        .catch(() => setAssignments({}));
    });
  }

  useEffect(() => {
    load();
  }, []);

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
      {portfoliosFor && (
        <UserPortfoliosModal
          onClose={() => setPortfoliosFor(null)}
          onSaved={load}
          user={portfoliosFor}
        />
      )}

      <SectionCard className="p-6 lg:p-7" index={2}>
        <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <CardTitle
            icon={<UsersRound className="h-6 w-6" />}
            subtitle="Personas con acceso al sistema."
            title="Miembros del equipo"
          />
        </div>

        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm font-medium text-text-secondary">
            {users.length} miembros · {activeCount} activos
          </p>
          {isAdmin && (
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-accent px-6 text-sm font-bold text-text-inverse shadow-action transition hover:bg-primary"
              onClick={() => setShowCreate(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </button>
          )}
        </div>

        {users.length === 0 ? (
          <p className="py-12 text-center text-sm font-medium text-text-secondary">
            No hay usuarios registrados
          </p>
        ) : (
          <div className="overflow-hidden rounded-panel border border-border-soft">
            <div className="hidden grid-cols-[minmax(220px,1.6fr)_minmax(160px,1fr)_minmax(120px,0.9fr)_100px] bg-surface-subtle px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-text-secondary md:grid">
              <span>Miembro</span>
              <span>Rol</span>
              <span>Estado</span>
              <span className="text-right">Acciones</span>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="grid gap-4 border-t border-border-soft bg-card px-5 py-4 md:grid-cols-[minmax(220px,1.6fr)_minmax(160px,1fr)_minmax(120px,0.9fr)_100px] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary shadow-soft">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold leading-tight text-text-primary">
                      {u.name}
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-text-secondary">
                      @{u.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary md:hidden">
                    Rol
                  </span>
                  <RoleBadge role={u.role} />
                </div>

                <div className="flex items-center justify-between gap-3 md:block">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-secondary md:hidden">
                    Estado
                  </span>
                  <StatusBadge active={u.active} />
                  {isAdmin && u.role === 'COLLECTOR' && (
                    <span className="mt-1 block text-xs font-medium text-text-secondary">
                      {(assignments[u.id] ?? []).length} carteras
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-4 text-text-secondary">
                  {isAdmin && (
                    <>
                      {u.role === 'COLLECTOR' && (
                        <button
                          aria-label={`Asignar carteras a ${u.name}`}
                          className="rounded-full p-1.5 transition hover:bg-primary-soft hover:text-primary"
                          onClick={() => setPortfoliosFor(u)}
                          title="Asignar carteras"
                          type="button"
                        >
                          <FolderKanban className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        aria-label={`${u.active ? 'Desactivar' : 'Activar'} ${u.name}`}
                        className={`rounded-full p-1.5 transition hover:bg-primary-soft ${
                          u.active ? 'hover:text-primary' : 'hover:text-primary'
                        }`}
                        onClick={() => handleToggle(u.id)}
                        type="button"
                      >
                        {u.active ? (
                          <ShieldX className="h-5 w-5" />
                        ) : (
                          <ShieldCheck className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        aria-label={`Eliminar ${u.name}`}
                        className="rounded-full p-1.5 transition hover:bg-state-danger-bg hover:text-state-danger"
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
              className="rounded-panel border border-border-soft bg-card p-5 shadow-card"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: roleDot[role] ?? '#ccc' }}
                  />
                  <p className="truncate text-base font-bold text-text-primary">
                    {roleLabel[role] ?? role}
                  </p>
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

function NotificationChannelItem({ channel }: { channel: (typeof notificationChannels)[number] }) {
  const Icon = channel.icon;

  return (
    <div className="flex min-h-[92px] items-center gap-4 rounded-panel border border-border-soft bg-card px-4 py-4 shadow-card">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control-comfortable"
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
    <div
      className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-border-soft' : ''}`}
    >
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
    <div
      className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-border-soft' : ''}`}
    >
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
        <FormSelect label="Longitud mínima de contraseña" options={[]} value="" />
        <FormSelect label="Caducidad de contraseña" options={[]} value="" />
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

      <p className="py-6 text-center text-sm font-medium text-text-secondary">
        No hay respaldos configurados
      </p>

      <div className="space-y-5">
        <FormSelect label="Frecuencia" options={[]} value="" />
        <FormSelect label="Retención" options={[]} value="" />
      </div>

      <button
        className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-full border border-primary-border bg-card text-base font-bold text-text-primary shadow-soft transition hover:bg-surface-subtle hover:shadow-card"
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
      className="rounded-panel border border-border-soft bg-card p-6 text-sm font-medium text-text-muted shadow-card"
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
        activeTab !== 'Seguridad' && <EmptySettingsTab key={activeTab} tab={activeTab} />}
    </main>
  );
}
