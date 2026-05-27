'use client';

import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Building2,
  Bell,
  Check,
  ChevronDown,
  Cloud,
  CreditCard,
  Download,
  Edit3,
  KeyRound,
  Mail,
  MessageCircle,
  Percent,
  Smartphone,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  UsersRound,
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
      className={`rounded-[18px] border border-[#DDEBE3] bg-white shadow-[0_7px_22px_rgba(40,92,67,0.035)] ${className}`}
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
      className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end"
      initial="hidden"
      variants={fadeUp}
    >
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F4EC] px-3 py-1 text-xs font-bold text-[#285C43]">
          <span className="h-2 w-2 rounded-full bg-[#5FA37D]" />
          Sistema
        </span>
        <h1 className="mt-3 text-[30px] font-bold leading-tight text-[#173D2C]">Configuración</h1>
        <p className="mt-1.5 text-sm font-medium text-[#7A8A80]">
          Ajusta los parámetros de tu sistema de préstamos.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="h-11 rounded-full border border-[#DDEBE3] bg-white px-6 text-sm font-bold text-[#173D2C] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6FAF7]"
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[#285C43] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1F4A36]"
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
      className="mb-6 overflow-x-auto rounded-[18px] border border-[#DDEBE3] bg-white p-2 shadow-[0_7px_22px_rgba(40,92,67,0.035)]"
      custom={1}
      initial="hidden"
      variants={fadeUp}
    >
      <div className="flex min-w-max items-center gap-4">
        {tabs.map((tab) => (
          <button
            className={`h-11 rounded-[14px] px-5 text-sm font-bold transition ${
              activeTab === tab ? 'bg-[#E7F4EC] text-[#285C43] shadow-sm' : 'text-[#5C6D63] hover:bg-[#F6FAF7]'
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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#E7F4EC] text-[#4F9B76]">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#173D2C]">{title}</h2>
        <p className="mt-1 text-sm font-medium text-[#7A8A80]">{subtitle}</p>
      </div>
    </div>
  );
}

function LogoUploader() {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-[18px] border border-dashed border-[#B8EBC9] bg-[#F7FCF9] p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-5">
        <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-[18px] bg-[#B8DCC5] text-xl font-bold text-[#285C43]">
          WM
        </div>
        <div>
          <p className="text-base font-bold text-[#173D2C]">Logo de la empresa</p>
          <p className="mt-1 text-sm font-medium text-[#7A8A80]">
            PNG o SVG, recomendado 512×512px. Máximo 2MB.
          </p>
        </div>
      </div>

      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#DDEBE3] bg-white px-6 text-sm font-bold text-[#173D2C] shadow-sm transition hover:bg-[#F6FAF7]">
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
      <span className="mb-2 block text-sm font-bold text-[#5C6D63]">{label}</span>
      {multiline ? (
        <textarea
          className="h-[96px] w-full resize-none rounded-[10px] border border-[#DDEBE3] bg-white px-4 py-3 text-sm font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#DDEBE3]"
          defaultValue={value}
        />
      ) : (
        <div className="flex h-11 w-full items-center rounded-[10px] border border-[#DDEBE3] bg-white px-4 text-sm font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] transition focus-within:border-[#4F9B76] focus-within:ring-2 focus-within:ring-[#DDEBE3]">
          {prefix && <span className="mr-3 shrink-0 text-[#7A8A80]">{prefix}</span>}
          <input
            className="h-full min-w-0 flex-1 bg-transparent outline-none"
            defaultValue={value}
          />
          {suffix && <span className="ml-3 shrink-0 text-[#7A8A80]">{suffix}</span>}
        </div>
      )}
      {helper && <span className="mt-2 block text-sm font-medium text-[#A7B5AD]">{helper}</span>}
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
      <span className="mb-2 block text-sm font-bold text-[#5C6D63]">{label}</span>
      <div className="relative">
        <select
          className="h-11 w-full appearance-none rounded-[10px] border border-[#DDEBE3] bg-white px-4 pr-10 text-sm font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#DDEBE3]"
          defaultValue={value}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A7B5AD]" />
      </div>
      {helper && <span className="mt-2 block text-sm font-medium text-[#A7B5AD]">{helper}</span>}
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
        <FormInput label="Nombre comercial" value="Willians Marte Préstamos" />
        <FormInput label="RNC / Identificación" value="1-30-12345-6" />
        <FormInput label="Correo de contacto" value="admin@empresa.com" />
        <FormInput label="Teléfono" value="+1 (809) 555-0142" />
        <FormInput
          className="md:col-span-2"
          helper="Aparece en facturas y contratos."
          label="Dirección"
          multiline
          value="Av. 27 de Febrero #245, Santo Domingo, RD"
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
        <FormSelect label="Idioma" value="Español" />
        <FormSelect label="Moneda principal" value="RD$ — Peso Dominicano" />
        <FormSelect label="Zona horaria" value="(GMT-4) Santo Domingo" />
        <FormSelect label="Formato de fecha" value="DD/MM/AAAA" />
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
    <div className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-[#EDF2EF]' : ''}`}>
      <div>
        <p className="text-base font-bold text-[#173D2C]">{title}</p>
        <p className="mt-1 text-sm font-medium text-[#7A8A80]">{description}</p>
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
          value="2.5"
        />
        <FormInput label="Mora por día de atraso" suffix="%" value="0.50" />
        <FormInput label="Plazo mínimo (meses)" value="1" />
        <FormInput label="Plazo máximo (meses)" value="24" />
        <FormInput label="Monto mínimo" prefix="RD$" value="5,000" />
        <FormInput label="Monto máximo" prefix="RD$" value="500,000" />
        <FormSelect
          label="Frecuencia de pago por defecto"
          options={['Mensual', 'Quincenal', 'Semanal', 'Diario']}
          value="Mensual"
        />
        <FormSelect
          label="Método de cálculo"
          options={['Sistema francés (cuota fija)', 'Interés simple', 'Saldo insoluto']}
          value="Sistema francés (cuota fija)"
        />
      </div>

      <div className="mt-4">
        <SwitchRow
          defaultChecked={false}
          description="Préstamos menores al monto mínimo se aprueban sin revisión."
          title="Aprobación automática"
        />
        <SwitchRow
          defaultChecked
          description="Solicitar al menos un garante por cada préstamo nuevo."
          title="Requerir garante"
        />
        <SwitchRow
          bordered={false}
          defaultChecked
          description="Crear automáticamente la tabla de cuotas al aprobar."
          title="Generar amortización al crear"
        />
      </div>
    </SectionCard>
  );
}

function LoanProductItem({
  color,
  title,
  detail,
  enabled,
}: {
  color: string;
  title: string;
  detail: string;
  enabled: boolean;
}) {
  return (
    <div className="flex min-h-[88px] items-center gap-4 rounded-[18px] border border-[#EDF2EF] bg-white px-4 py-3.5 shadow-[0_5px_18px_rgba(40,92,67,0.025)]">
      <div className="h-12 w-12 shrink-0 rounded-[14px]" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-[#173D2C]">{title}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#7A8A80]">{detail}</p>
      </div>
      <ToggleSwitch defaultChecked={enabled} />
    </div>
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
        <LoanProductItem
          color="#B8DCC5"
          detail="2.5% mensual · 1–24 meses"
          enabled
          title="Préstamo Personal"
        />
        <LoanProductItem
          color="#FFE3D2"
          detail="3.2% mensual · 3–36 meses"
          enabled
          title="Préstamo Comercial"
        />
        <LoanProductItem
          color="#FFF4C8"
          detail="4.0% mensual · 1–6 meses"
          enabled
          title="Préstamo Express"
        />
        <LoanProductItem
          color="#D8E9FF"
          detail="1.5% mensual · 12–120 meses"
          enabled={false}
          title="Préstamo Hipotecario"
        />
      </div>

      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#B8EBC9] bg-[#F7FCF9] text-base font-bold text-[#2F7D57] transition hover:bg-[#EAF6EF]"
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

const roleStyles = {
  Administrador: { bg: '#B8DCC5', text: '#173D2C' },
  'Gestor de cobros': { bg: '#FFE3D2', text: '#173D2C' },
  Asesor: { bg: '#D8E9FF', text: '#173D2C' },
  Contabilidad: { bg: '#E8DDF6', text: '#173D2C' },
} as const;

const statusStyles = {
  Activo: { bg: '#E7F4EC', text: '#2F7D57', dot: '#5FA37D' },
  Inactivo: { bg: '#F0ECE5', text: '#8D7A5F', dot: '#CDBA97' },
} as const;

const members = [
  {
    name: 'Willians Marte',
    email: 'willians@empresa.com',
    role: 'Administrador',
    status: 'Activo',
    avatar: 'https://i.pravatar.cc/96?img=11',
  },
  {
    name: 'María Rodríguez',
    email: 'maria@empresa.com',
    role: 'Gestor de cobros',
    status: 'Activo',
    avatar: 'https://i.pravatar.cc/96?img=32',
  },
  {
    name: 'Carlos Pérez',
    email: 'carlos@empresa.com',
    role: 'Asesor',
    status: 'Activo',
    avatar: 'https://i.pravatar.cc/96?img=12',
  },
  {
    name: 'Ana Núñez',
    email: 'ana@empresa.com',
    role: 'Contabilidad',
    status: 'Inactivo',
    avatar: 'https://i.pravatar.cc/96?img=5',
  },
] satisfies Array<{
  name: string;
  email: string;
  role: keyof typeof roleStyles;
  status: keyof typeof statusStyles;
  avatar: string;
}>;

const permissions = [
  {
    role: 'Administrador',
    count: 1,
    dot: '#B8DCC5',
    permissions: ['Acceso total', 'Configuración', 'Usuarios'],
  },
  {
    role: 'Gestor de cobros',
    count: 3,
    dot: '#FFE3D2',
    permissions: ['Cobros', 'Clientes', 'Reportes'],
  },
  {
    role: 'Asesor',
    count: 5,
    dot: '#D8E9FF',
    permissions: ['Crear préstamos', 'Ver clientes'],
  },
  {
    role: 'Contabilidad',
    count: 2,
    dot: '#E8DDF6',
    permissions: ['Caja', 'Reportes', 'Documentos'],
  },
];

function RoleBadge({ role }: { role: keyof typeof roleStyles }) {
  const style = roleStyles[role];

  return (
    <span
      className="inline-flex min-w-max items-center rounded-full px-3 py-1 text-sm font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {role}
    </span>
  );
}

function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
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

function TeamMemberRow({ member }: { member: (typeof members)[number] }) {
  return (
    <div className="grid gap-4 border-t border-[#EDF2EF] bg-white px-5 py-4 md:grid-cols-[minmax(220px,1.6fr)_minmax(160px,1fr)_minmax(120px,0.9fr)_100px] md:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className="h-11 w-11 shrink-0 rounded-full bg-cover bg-center shadow-[0_6px_14px_rgba(40,92,67,0.12)]"
          style={{ backgroundImage: `url(${member.avatar})` }}
        />
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-tight text-[#173D2C]">{member.name}</p>
          <p className="mt-1 truncate text-sm font-medium text-[#7A8A80]">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:block">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#8CA096] md:hidden">Rol</span>
        <RoleBadge role={member.role} />
      </div>

      <div className="flex items-center justify-between gap-3 md:block">
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#8CA096] md:hidden">Estado</span>
        <StatusBadge status={member.status} />
      </div>

      <div className="flex items-center justify-end gap-4 text-[#7A8A80]">
        <button
          aria-label={`Editar ${member.name}`}
          className="rounded-full p-1.5 transition hover:bg-[#EAF6EF] hover:text-[#285C43]"
          type="button"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        <button
          aria-label={`Eliminar ${member.name}`}
          className="rounded-full p-1.5 transition hover:bg-[#FFE3D2] hover:text-[#B45B38]"
          type="button"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function TeamMembersCard() {
  return (
    <SectionCard className="p-6 lg:p-7" index={2}>
      <div className="mb-8 flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <CardTitle
          icon={<UsersRound className="h-6 w-6" />}
          subtitle="Personas con acceso al sistema."
          title="Miembros del equipo"
        />
      </div>

      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm font-medium text-[#7A8A80]">4 miembros · 3 activos</p>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2F7654] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(40,92,67,0.2)] transition hover:-translate-y-0.5 hover:bg-[#285C43]"
          onClick={() => undefined}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Invitar miembro
        </button>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#EDF2EF]">
        <div className="hidden grid-cols-[minmax(220px,1.6fr)_minmax(160px,1fr)_minmax(120px,0.9fr)_100px] bg-[#F3F8F5] px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8CA096] md:grid">
          <span>Miembro</span>
          <span>Rol</span>
          <span>Estado</span>
          <span className="text-right">Acciones</span>
        </div>
        {members.map((member) => (
          <TeamMemberRow key={member.email} member={member} />
        ))}
      </div>
    </SectionCard>
  );
}

function RolePermissionItem({
  role,
  count,
  dot,
  permissions: rolePermissions,
}: {
  role: string;
  count: number;
  dot: string;
  permissions: string[];
}) {
  return (
    <div className="rounded-[18px] border border-[#EDF2EF] bg-white p-5 shadow-[0_5px_18px_rgba(40,92,67,0.025)]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
          <p className="truncate text-base font-bold text-[#173D2C]">{role}</p>
        </div>
        <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#E7F4EC] px-2 text-sm font-bold text-[#2F7D57]">
          {count}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {rolePermissions.map((permission) => (
          <span
            className="rounded-full border border-[#DDEBE3] bg-white px-3 py-1 text-xs font-bold text-[#6F8076]"
            key={permission}
          >
            {permission}
          </span>
        ))}
      </div>
    </div>
  );
}

function RolePermissionsCard() {
  return (
    <SectionCard className="p-6 lg:p-7" index={3}>
      <CardTitle
        icon={<ShieldCheck className="h-6 w-6" />}
        subtitle="Define qué puede hacer cada tipo de usuario."
        title="Roles y permisos"
      />

      <div className="space-y-4">
        {permissions.map((item) => (
          <RolePermissionItem
            count={item.count}
            dot={item.dot}
            key={item.role}
            permissions={item.permissions}
            role={item.role}
          />
        ))}
      </div>

      <button
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#B8EBC9] bg-[#F7FCF9] text-base font-bold text-[#2F7D57] transition hover:bg-[#EAF6EF]"
        onClick={() => undefined}
        type="button"
      >
        <Plus className="h-5 w-5" />
        Crear rol
      </button>
    </SectionCard>
  );
}

function SettingsUsersRolesTab() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <TeamMembersCard />
      <RolePermissionsCard />
    </motion.div>
  );
}

const notificationChannels = [
  {
    title: 'Correo electrónico',
    detail: 'smtp.empresa.com · admin@empresa.com',
    icon: Mail,
    iconBg: '#D8E9FF',
    iconColor: '#3F7FBD',
    enabled: true,
  },
  {
    title: 'WhatsApp Business',
    detail: 'Conectado · +1 (809) 555-0142',
    icon: MessageCircle,
    iconBg: '#B8DCC5',
    iconColor: '#2F7654',
    enabled: true,
  },
  {
    title: 'SMS',
    detail: 'Proveedor: Twilio',
    icon: Smartphone,
    iconBg: '#FFE3D2',
    iconColor: '#C96F4A',
    enabled: false,
  },
  {
    title: 'Push (app móvil)',
    detail: 'Notificaciones en dispositivos.',
    icon: Bell,
    iconBg: '#FFF4C8',
    iconColor: '#A98219',
    enabled: true,
  },
];

const internalAlerts = [
  {
    title: 'NUEVO PRÉSTAMO CREADO',
    detail: 'Notifica al administrador y al asesor responsable.',
    enabled: true,
  },
  {
    title: 'Pago recibido',
    detail: 'Confirmación inmediata al gestor de cobros.',
    enabled: true,
  },
  {
    title: 'Préstamo en mora (3+ días)',
    detail: 'Alerta diaria con el listado consolidado.',
    enabled: true,
  },
  {
    title: 'Cierre diario de caja',
    detail: 'Resumen automático al finalizar la jornada.',
    enabled: false,
  },
  {
    title: 'Nuevo cliente registrado',
    detail: 'Útil al activar campañas de bienvenida.',
    enabled: false,
  },
  {
    title: 'Documento próximo a vencer',
    detail: 'Avisa 7 días antes del vencimiento.',
    enabled: true,
  },
];

function NotificationChannelItem({
  channel,
}: {
  channel: (typeof notificationChannels)[number];
}) {
  const Icon = channel.icon;

  return (
    <div className="flex min-h-[92px] items-center gap-4 rounded-[18px] border border-[#EDF2EF] bg-white px-4 py-4 shadow-[0_5px_18px_rgba(40,92,67,0.025)]">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px]"
        style={{ backgroundColor: channel.iconBg, color: channel.iconColor }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-[#173D2C]">{channel.title}</p>
        <p className="mt-1 truncate text-sm font-medium text-[#7A8A80]">{channel.detail}</p>
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
    <div className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-[#EDF2EF]' : ''}`}>
      <div>
        <p className="text-base font-bold text-[#173D2C]">{alert.title}</p>
        <p className="mt-1 text-sm font-medium text-[#7A8A80]">{alert.detail}</p>
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

      <div className="mt-6 grid grid-cols-1 gap-5 border-t border-[#EDF2EF] pt-6 md:grid-cols-2">
        <FormSelect
          helper="Días antes de la fecha de cuota."
          label="Recordatorio de pago al cliente"
          options={['3 días antes', '1 día antes', '5 días antes', '7 días antes']}
          value="3 días antes"
        />
        <FormInput
          helper="Para resúmenes y alertas programadas."
          label="Hora de envío diario"
          value="08:30 a.m."
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

const securityOptions = [
  {
    title: 'Autenticación en dos pasos (2FA)',
    detail: 'Solicita un código adicional al iniciar sesión.',
    enabled: true,
  },
  {
    title: 'Inicio de sesión con Google',
    detail: 'Permite acceso con cuentas corporativas.',
    enabled: false,
  },
  {
    title: 'Bloqueo por intentos fallidos',
    detail: 'Bloquea la cuenta tras 5 intentos incorrectos.',
    enabled: true,
  },
  {
    title: 'Cierre automático de sesión',
    detail: 'Cierra sesiones inactivas tras 30 minutos.',
    enabled: true,
  },
];

function SecurityOptionItem({
  option,
  bordered = true,
}: {
  option: (typeof securityOptions)[number];
  bordered?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-6 py-6 ${bordered ? 'border-b border-[#EDF2EF]' : ''}`}>
      <div>
        <p className="text-base font-bold text-[#173D2C]">{option.title}</p>
        <p className="mt-1 text-sm font-medium text-[#7A8A80]">{option.detail}</p>
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

      <div className="mt-6 grid grid-cols-1 gap-5 border-t border-[#EDF2EF] pt-6 md:grid-cols-2">
        <FormSelect
          label="Longitud mínima de contraseña"
          options={['8 caracteres', '10 caracteres', '12 caracteres']}
          value="8 caracteres"
        />
        <FormSelect
          label="Caducidad de contraseña"
          options={['90 días', '60 días', '30 días', 'Nunca']}
          value="90 días"
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

      <div className="mb-6 flex items-center gap-4 rounded-[18px] bg-[#EAF6EF] p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5FA37D] text-white">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-bold text-[#2F7D57]">Respaldo activo</p>
          <p className="mt-1 text-sm font-medium text-[#5C6D63]">Último respaldo: hoy, 03:00 AM</p>
        </div>
      </div>

      <div className="space-y-5">
        <FormSelect
          label="Frecuencia"
          options={['Diaria', 'Semanal', 'Mensual']}
          value="Diaria"
        />
        <FormSelect
          label="Retención"
          options={['30 días', '60 días', '90 días', '1 año']}
          value="30 días"
        />
      </div>

      <button
        className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[#DDEBE3] bg-white text-base font-bold text-[#173D2C] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6FAF7] hover:shadow-md"
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
      className="rounded-[18px] border border-[#DDEBE3] bg-white p-6 text-sm font-medium text-[#7A8A80] shadow-[0_7px_22px_rgba(40,92,67,0.035)]"
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
    <main className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
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
