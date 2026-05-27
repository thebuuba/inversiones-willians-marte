'use client';

import Link from 'next/link';
import { useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  ChevronDown,
  FileText,
  ImageIcon,
  Phone,
  Save,
  Upload,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: index * 0.055 },
  }),
};

function PageCard({ children, className = '', index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <motion.section
      animate="visible"
      className={`rounded-[24px] border border-[#DDEBE3] bg-white shadow-[0_8px_24px_rgba(40,92,67,0.045)] ${className}`}
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function FormHeaderActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
      <Link
        className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[#DDEBE3] bg-white px-7 text-sm font-bold text-[#3F4542] shadow-[0_5px_14px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:shadow-md"
        href="/clientes"
      >
        <X className="h-5 w-5" />
        Cancelar
      </Link>
      <button
        className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[#B8EBC9] bg-[#EAF6EF] px-7 text-sm font-bold text-[#4F9B76] shadow-[0_5px_14px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:bg-[#DFF1E7] hover:shadow-md"
        type="button"
      >
        <UserPlus className="h-5 w-5" />
        Guardar y nuevo cliente
      </button>
      <button
        className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-[#5FA37D] px-7 text-sm font-bold text-white shadow-[0_12px_22px_rgba(95,163,125,0.24)] transition hover:-translate-y-0.5 hover:bg-[#285C43]"
        type="button"
      >
        <Save className="h-5 w-5" />
        Guardar cliente
      </button>
    </div>
  );
}

function StyledInput({
  label,
  placeholder,
  required = false,
  helper,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  required?: boolean;
  helper?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#7A7F7D]">
        {label} {required && <span className="text-[#5FA37D]">*</span>}
      </span>
      <input
        className="h-[52px] w-full rounded-[14px] border border-[#DDEBE3] bg-white px-4 text-sm font-medium text-[#173D2C] shadow-[0_4px_10px_rgba(40,92,67,0.07)] outline-none transition placeholder:text-[#7E808A] focus:border-[#5FA37D] focus:ring-4 focus:ring-[#EAF6EF]"
        placeholder={placeholder}
        type={type}
      />
      {helper && <span className="mt-2 block text-sm font-medium text-[#9C9F9D]">{helper}</span>}
    </label>
  );
}

function StyledSelect({
  label,
  options,
  required = false,
}: {
  label: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#7A7F7D]">
        {label} {required && <span className="text-[#5FA37D]">*</span>}
      </span>
      <div className="relative">
        <select className="h-[52px] w-full appearance-none rounded-[14px] border border-[#DDEBE3] bg-white px-4 pr-12 text-sm font-medium text-[#151918] shadow-[0_4px_10px_rgba(40,92,67,0.07)] outline-none transition focus:border-[#5FA37D] focus:ring-4 focus:ring-[#EAF6EF]">
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9DA5A0]" />
      </div>
    </label>
  );
}

function StyledTextarea({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#7A7F7D]">{label}</span>
      <textarea
        className="min-h-[116px] w-full resize-y rounded-[14px] border border-[#DDEBE3] bg-white px-4 py-4 text-sm font-medium text-[#173D2C] shadow-[0_4px_10px_rgba(40,92,67,0.07)] outline-none transition placeholder:text-[#7E808A] focus:border-[#5FA37D] focus:ring-4 focus:ring-[#EAF6EF]"
        placeholder={placeholder}
      />
    </label>
  );
}

function CardHeader({
  icon,
  iconBg = '#EAF6EF',
  iconColor = '#4F9B76',
  title,
  subtitle,
}: {
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-7 flex items-center gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold leading-tight text-[#151918]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm font-medium text-[#777D7A]">{subtitle}</p>}
      </div>
    </div>
  );
}

function ClientPhotoUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  function handleFile(file?: File) {
    if (!file) return;
    setFileName(file.name);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0]);
  }

  return (
    <PageCard className="p-7" index={1}>
      <CardHeader icon={<Camera className="h-5 w-5" />} title="Fotografía del cliente" />

      <button
        className={`flex h-[280px] w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed px-6 text-center transition ${
          dragging ? 'border-[#5FA37D] bg-[#EAF6EF]' : 'border-[#B8EBC9] bg-[#F7FCF9] hover:border-[#5FA37D]'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDrop={handleDrop}
        type="button"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#4F9B76] shadow-[0_7px_18px_rgba(40,92,67,0.1)]">
          <ImageIcon className="h-7 w-7" />
        </span>
        <span className="mt-5 text-base font-bold text-[#3F4542]">{fileName || 'Arrastra una foto aquí'}</span>
        <span className="mt-4 text-sm font-medium text-[#777D7A]">o haz click para subir</span>
        <input accept="image/jpeg,image/png" className="hidden" onChange={handleChange} ref={inputRef} type="file" />
      </button>

      <button
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-[#B8EBC9] bg-white text-sm font-bold text-[#5FA37D] shadow-[0_5px_12px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:bg-[#F7FCF9]"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Upload className="h-5 w-5" />
        Subir foto
      </button>

      <p className="mt-6 text-sm font-medium leading-7 text-[#777D7A]">
        Formatos aceptados: JPG, PNG · Tamaño máximo 5 MB. Una foto clara del rostro ayuda a verificar la identidad del cliente.
      </p>
    </PageCard>
  );
}

function RequiredFieldsNotice() {
  return (
    <motion.aside
      animate="visible"
      className="rounded-[22px] border border-[#D2E8D9] bg-[#EAF6EF] p-7 text-sm font-medium leading-7 text-[#5FA37D]"
      custom={2}
      initial="hidden"
      variants={fadeUp}
    >
      Los campos marcados con * son obligatorios para crear el perfil del cliente.
    </motion.aside>
  );
}

function PersonalInfoCard() {
  return (
    <PageCard className="p-7" index={1}>
      <CardHeader
        icon={<UserRound className="h-6 w-6" />}
        title="Datos personales"
        subtitle="Información básica del cliente."
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <StyledInput label="Nombres" placeholder="María Isabel" required />
        <StyledInput label="Apellidos" placeholder="González Pérez" required />
        <StyledInput label="Cédula / Documento" placeholder="402-1234567-8" required />
        <StyledInput label="Fecha de nacimiento" placeholder="dd/mm/aaaa" required />
        <StyledSelect label="Género" options={['Selecciona', 'Femenino', 'Masculino', 'Otro']} />
        <StyledSelect label="Estado civil" options={['Selecciona', 'Soltero/a', 'Casado/a', 'Unión libre']} />
        <StyledInput label="Nacionalidad" placeholder="Dominicana" />
        <StyledInput helper="Personas a cargo" label="Dependientes" placeholder="0" type="number" />
      </div>
    </PageCard>
  );
}

function ContactInfoCard() {
  return (
    <PageCard className="p-7" index={2}>
      <CardHeader
        icon={<Phone className="h-6 w-6" />}
        iconBg="#D8E9FF"
        iconColor="#3F7FBD"
        title="Información de contacto"
        subtitle="Cómo localizar al cliente."
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <StyledInput label="Teléfono móvil" placeholder="+1 (809) 555-0142" required />
        <StyledInput label="Teléfono alternativo" placeholder="+1 (829) 555-0000" />
        <div className="md:col-span-2">
          <StyledInput label="Correo electrónico" placeholder="cliente@correo.com" required type="email" />
        </div>
      </div>
    </PageCard>
  );
}

function AdditionalNotesCard() {
  return (
    <PageCard className="p-7" index={3}>
      <CardHeader
        icon={<FileText className="h-6 w-6" />}
        title="Notas adicionales"
        subtitle="Observaciones internas sobre el cliente."
      />
      <StyledTextarea label="Comentarios" placeholder="Información relevante para evaluar al cliente..." />
    </PageCard>
  );
}

export function AddClientPage() {
  return (
    <main className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C] lg:p-7">
      <div className="mx-auto max-w-[1640px]">
        <motion.header
          animate="visible"
          className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"
          initial="hidden"
          variants={fadeUp}
        >
          <div>
            <Link
              className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-[#5FA37D] transition hover:text-[#173D2C]"
              href="/clientes"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a clientes
            </Link>
            <h1 className="mt-5 text-[36px] font-bold leading-none text-[#151918]">Agregar cliente</h1>
            <p className="mt-3 max-w-[760px] text-sm font-medium text-[#6F7280]">
              Completa la información para registrar un nuevo cliente en tu cartera de préstamos.
            </p>
          </div>
          <FormHeaderActions />
        </motion.header>

        <div className="grid grid-cols-1 gap-7 xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="space-y-7">
            <ClientPhotoUploader />
            <RequiredFieldsNotice />
          </div>

          <div className="space-y-7">
            <PersonalInfoCard />
            <ContactInfoCard />
            <AdditionalNotesCard />
          </div>
        </div>
      </div>
    </main>
  );
}
