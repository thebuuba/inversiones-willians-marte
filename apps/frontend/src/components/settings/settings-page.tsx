'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Building2,
  Check,
  ChevronDown,
  Cloud,
  Upload,
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

function SettingsTabs() {
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
              tab === 'General' ? 'bg-[#E7F4EC] text-[#285C43] shadow-sm' : 'text-[#5C6D63] hover:bg-[#F6FAF7]'
            }`}
            key={tab}
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
}: {
  label: string;
  value: string;
  helper?: string;
  className?: string;
  multiline?: boolean;
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
        <input
          className="h-11 w-full rounded-[10px] border border-[#DDEBE3] bg-white px-4 text-sm font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#DDEBE3]"
          defaultValue={value}
        />
      )}
      {helper && <span className="mt-2 block text-sm font-medium text-[#A7B5AD]">{helper}</span>}
    </label>
  );
}

function FormSelect({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#5C6D63]">{label}</span>
      <div className="relative">
        <select
          className="h-11 w-full appearance-none rounded-[10px] border border-[#DDEBE3] bg-white px-4 pr-10 text-sm font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#DDEBE3]"
          defaultValue={value}
        >
          <option>{value}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A7B5AD]" />
      </div>
    </label>
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

export function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#F6FAF7] p-5 font-sans text-[#173D2C]">
      <SettingsHeader />
      <SettingsTabs />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <CompanyInfoCard />
        <LocalizationCard />
      </div>
    </main>
  );
}
