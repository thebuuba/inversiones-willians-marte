'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import { createClient, getClient, updateClient } from '@/lib/api/clients';
import { cropClientPhotoToFace } from '@/lib/face-crop';
import {
  closeClientPhotoCaptureSession,
  createClientPhotoCaptureSession,
  getCapturedClientPhoto,
  getClientPhotoCaptureStatus,
} from '@/lib/api/client-photo-capture';
import { buildMobileCaptureUrl } from '@/lib/mobile-capture-url';
import { cn } from '@/lib/utils';
import { MAX_COMPRESSED_CLIENT_PHOTO_BYTES, validateClientPhoto } from './client-photo';
import { invalidateCache, invalidateCachePrefix } from '@/lib/use-client-cache';
import {
  getClientFormFromClient,
  getClientPayload,
  getEmptyClientForm,
  type ClientFormState,
} from './client-form';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  BriefcaseBusiness,
  FileText,
  ImageIcon,
  CreditCard,
  Loader2,
  MapPin,
  Minus,
  Phone,
  Plus,
  QrCode,
  Save,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from 'lucide-react';

function maskCedula(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
}

function formatLocal(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (value.startsWith('+1')) {
    const local = digits.startsWith('1') ? digits.slice(1) : digits;
    const formatted = formatLocal(local.slice(0, 10));
    return formatted ? `+1 ${formatted}` : '+1';
  }
  return formatLocal(digits.slice(0, 10));
}

const provinces = [
  '',
  'Distrito Nacional',
  'Santo Domingo',
  'Santiago',
  'La Vega',
  'San Cristóbal',
  'Puerto Plata',
  'Duarte',
  'La Altagracia',
  'San Pedro de Macorís',
  'La Romana',
  'Espaillat',
  'Monseñor Nouel',
  'Samaná',
  'María Trinidad Sánchez',
  'Sánchez Ramírez',
  'Valverde',
  'Monte Cristi',
  'Dajabón',
  'Santiago Rodríguez',
  'San José de Ocoa',
  'Azua',
  'Peravia',
  'Barahona',
  'Baoruco',
  'Independencia',
  'Pedernales',
  'San Juan',
  'Elías Piña',
  'El Seibo',
  'Hato Mayor',
  'Monte Plata',
  'Hermanas Mirabal',
];

function PageCard({
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
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-panel bg-card shadow-card', className)}
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: index * 0.055 }}
    >
      {children}
    </motion.section>
  );
}

function FormHeaderActions({
  cancelHref,
  onSave,
  saving,
}: {
  cancelHref: string;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
      <Link
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[18px] bg-card px-5 text-sm font-bold text-text-primary shadow-card transition hover:bg-surface-subtle"
        href={cancelHref}
      >
        <X className="h-4 w-4" />
        Cancelar
      </Link>
      <button
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[18px] bg-brand-sky px-5 text-sm font-bold text-white shadow-action transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
        disabled={saving}
        onClick={onSave}
        type="button"
      >
        <Save className="h-4 w-4" />
        {saving ? 'Guardando...' : 'Guardar cliente'}
      </button>
    </div>
  );
}

function StyledInput({
  label,
  placeholder,
  helper,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  helper?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-[18px] border-0 bg-surface-subtle px-4 text-sm font-medium text-text-primary shadow-card outline-none transition placeholder:text-text-muted focus:ring-2 focus:ring-brand-sky"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {helper && <span className="mt-1.5 block text-xs text-text-secondary">{helper}</span>}
    </label>
  );
}

function StyledSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
        {label}
      </span>
      <div className="relative">
        <select
          className="h-11 w-full rounded-[18px] border-0 bg-surface-subtle px-4 text-sm font-medium text-text-primary shadow-card outline-none transition focus:ring-2 focus:ring-brand-sky"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option || 'Seleccionar'}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function StyledTextarea({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
        {label}
      </span>
      <textarea
        className="min-h-[110px] w-full resize-y rounded-[18px] border-0 bg-surface-subtle px-4 py-3 text-sm font-medium text-text-primary shadow-card outline-none transition placeholder:text-text-muted focus:ring-2 focus:ring-brand-sky"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function CardHeader({
  icon,
  iconBg = 'var(--primary-soft)',
  iconColor = 'var(--primary)',
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
    <div className="mb-6 flex items-center gap-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <h2 className="text-base font-extrabold leading-tight text-text-primary">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}

function ClientPhotoUploader({
  value,
  onChange,
  clientId,
}: {
  value: string;
  onChange: (value: string) => void;
  clientId?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [captureToken, setCaptureToken] = useState('');
  const [captureUrl, setCaptureUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [creatingQr, setCreatingQr] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [captureReceived, setCaptureReceived] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!captureToken) return;
    let active = true;
    let receivingPhoto = false;

    async function pollCapture() {
      try {
        const session = await getClientPhotoCaptureStatus(captureToken);
        if (!active || !session.photoReady || receivingPhoto) return;
        receivingPhoto = true;
        const photo = await getCapturedClientPhoto(captureToken);
        if (!active) return;
        onChangeRef.current(photo);
        setCaptureReceived(true);
        setCaptureError('');
        setQrDataUrl('');
        setCaptureUrl('');
        setCaptureToken('');
      } catch (captureStatusError) {
        receivingPhoto = false;
        const status =
          typeof captureStatusError === 'object' &&
          captureStatusError !== null &&
          'response' in captureStatusError
            ? (captureStatusError.response as { status?: number } | undefined)?.status
            : undefined;
        if (active && (status === 404 || status === 410)) {
          setCaptureError('El enlace expiró. Genera un QR nuevo.');
          setCaptureToken('');
        }
      }
    }

    void pollCapture();
    const interval = window.setInterval(() => void pollCapture(), 1500);
    return () => {
      active = false;
      window.clearInterval(interval);
      closeClientPhotoCaptureSession(captureToken).catch(() => undefined);
    };
  }, [captureToken]);

  async function handleFile(file?: File) {
    if (!file) return;
    const validationError = validateClientPhoto(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setProcessing(true);
    setError('');
    try {
      const compressed = await cropClientPhotoToFace(file);
      if (compressed.size > MAX_COMPRESSED_CLIENT_PHOTO_BYTES) {
        setError(
          'No se pudo reducir la fotografía lo suficiente. Selecciona una imagen más pequeña.',
        );
        setProcessing(false);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        onChangeRef.current(reader.result as string);
        setProcessing(false);
      };
      reader.onerror = () => {
        setError('No se pudo leer la fotografía seleccionada.');
        setProcessing(false);
      };
      reader.readAsDataURL(compressed);
    } catch (processingError) {
      setError(
        processingError instanceof Error
          ? processingError.message
          : 'No se pudo procesar la fotografía seleccionada.',
      );
      setProcessing(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
    event.target.value = '';
  }

  function handleRemove() {
    onChangeRef.current('');
    setError('');
    setCaptureReceived(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleCreateQr() {
    setCreatingQr(true);
    setCaptureError('');
    setCaptureReceived(false);
    let nextToken = '';
    try {
      if (captureToken) {
        await closeClientPhotoCaptureSession(captureToken).catch(() => undefined);
      }
      const session = await createClientPhotoCaptureSession(clientId);
      nextToken = session.token;
      const nextCaptureUrl = await buildMobileCaptureUrl(
        `/captura-foto-cliente/${encodeURIComponent(session.token)}`,
      );
      const nextQrDataUrl = await QRCode.toDataURL(nextCaptureUrl, {
        margin: 1,
        width: 240,
        color: { dark: '#173D2C', light: '#FFFFFF' },
      });
      setCaptureToken(session.token);
      setCaptureUrl(nextCaptureUrl);
      setQrDataUrl(nextQrDataUrl);
    } catch {
      if (nextToken) {
        await closeClientPhotoCaptureSession(nextToken).catch(() => undefined);
      }
      setCaptureError('No se pudo generar el QR. Intenta nuevamente.');
    } finally {
      setCreatingQr(false);
    }
  }

  return (
    <PageCard className="p-5" index={1}>
      <CardHeader icon={<Camera className="h-5 w-5" />} title="Fotografía del cliente" />

      {value ? (
        <div className="relative">
          <div
            aria-label="Foto del cliente"
            className="aspect-square w-full rounded-[20px] bg-primary-soft bg-contain bg-center bg-no-repeat"
            role="img"
            style={{ backgroundImage: `url(${value})` }}
          />
          <button
            aria-label="Eliminar fotografía"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
            onClick={handleRemove}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <button
          className={`flex aspect-square w-full flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-3 text-center transition ${
            dragging
              ? 'border-primary-accent bg-primary-soft'
              : 'border-[#bedfff] bg-[#f6fbff] hover:border-brand-sky'
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
          <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-card text-brand-sky shadow-card">
            <ImageIcon className="h-6 w-6" />
          </span>
          <span className="mt-3 text-sm font-bold text-text-primary">Arrastra una foto aquí</span>
          <span className="mt-1 text-xs text-text-secondary">o haz clic para subir</span>
        </button>
      )}

      <input
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-card text-sm font-bold text-text-primary shadow-card transition hover:bg-primary-soft disabled:opacity-50"
          disabled={processing}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Upload className="h-4 w-4 text-brand-sky" />
          {processing ? 'Procesando...' : 'Subir'}
        </button>
        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-brand-sky text-sm font-bold text-white shadow-action transition hover:bg-primary disabled:opacity-50"
          disabled={creatingQr}
          onClick={() => void handleCreateQr()}
          type="button"
        >
          {creatingQr ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <QrCode className="h-4 w-4" />
          )}
          {creatingQr ? 'Generando...' : 'Celular'}
        </button>
      </div>

      {qrDataUrl ? (
        <div className="mt-5 rounded-panel border border-primary-border bg-surface-muted-ui p-4 text-center">
          <p className="text-sm font-bold text-text-primary">Escanea para abrir la cámara</p>
          <div className="mx-auto mt-3 w-fit rounded-control-comfortable bg-card p-3 shadow-soft">
            <Image
              alt="QR para tomar la fotografía del cliente"
              className="h-40 w-40"
              height={160}
              src={qrDataUrl}
              unoptimized
              width={160}
            />
          </div>
          <p className="mt-3 text-xs font-medium leading-5 text-text-secondary">
            Usa un teléfono conectado a la misma red. La foto aparecerá aquí automáticamente.
          </p>
          <p className="mt-2 break-all text-xs text-text-subtle">{captureUrl}</p>
        </div>
      ) : null}

      {captureReceived ? (
        <p className="mt-4 flex items-center gap-2 rounded-control-comfortable border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Fotografía recibida desde el celular.
        </p>
      ) : null}

      {captureError ? (
        <p
          className="mt-4 rounded-control-comfortable border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {captureError}
        </p>
      ) : null}

      {!value ? (
        <>
          <p className="mt-3 text-xs leading-5 text-text-secondary">
            JPG, PNG o WebP · máx. 5 MB. Una foto clara del rostro ayuda a verificar la identidad
            del cliente.
          </p>
        </>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-control-comfortable border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </PageCard>
  );
}

function ClientPreview({
  values,
  isEditing,
  clientId,
}: {
  values: ClientFormState;
  isEditing: boolean;
  clientId?: number;
}) {
  return (
    <PageCard className="relative overflow-hidden bg-brand-sky p-5 text-white" index={2}>
      <span className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-16 right-12 h-24 w-24 rounded-full bg-white/10" />
      <p className="relative text-xs font-extrabold uppercase tracking-[0.08em] text-white/80">
        Vista previa
      </p>
      <div className="relative mt-3 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-white text-lg font-bold text-brand-sky shadow-card">
          {values.photo ? (
            <span
              className="h-full w-full rounded-[18px] bg-cover bg-center"
              style={{ backgroundImage: `url(${values.photo})` }}
            />
          ) : values.firstName ? (
            values.firstName[0].toUpperCase()
          ) : (
            '?'
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-extrabold">
            {`${values.firstName} ${values.lastName}`.trim() || 'Nuevo cliente'}
          </p>
          <p className="text-xs text-white/80">
            {isEditing ? `ID ${clientId}` : 'ID se asignará al guardar'}
          </p>
        </div>
      </div>
      <div className="relative mt-4 space-y-1 text-xs text-white/80">
        <p>
          <CreditCard className="mr-2 inline h-3.5 w-3.5" />
          {values.identification || 'Cédula pendiente'}
        </p>
        <p>
          <Phone className="mr-2 inline h-3.5 w-3.5" />
          {values.phone || 'Teléfono pendiente'}
        </p>
      </div>
    </PageCard>
  );
}

function ProfileProgress({ values }: { values: ClientFormState }) {
  const sections = [
    ['Datos personales', !!(values.firstName && values.lastName)],
    ['Contacto', !!(values.phone || values.email || values.address)],
    ['Información laboral', !!(values.incomeType || values.occupation || values.monthlyIncome)],
    ['Garante y referencia', !!(values.guarantorName || values.referenceName)],
    ['Notas', !!(values.notes || values.tags?.length)],
  ] as const;
  const percent = Math.round(
    (sections.filter(([, complete]) => complete).length / sections.length) * 100,
  );
  const ids = ['personal', 'contacto', 'laboral', 'garante', 'notas'];
  return (
    <PageCard className="p-5" index={3}>
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-slate-200 text-xs font-bold text-text-primary">
          {percent}%
        </div>
        <div>
          <h2 className="font-extrabold">Perfil completado</h2>
          <p className="text-xs text-text-secondary">Mientras más completo, mejor evaluación.</p>
        </div>
      </div>
      <nav aria-label="Secciones del formulario" className="mt-5 space-y-4">
        {sections.map(([title, complete], index) => (
          <a
            className="flex items-center gap-3 text-sm text-text-secondary hover:text-brand-sky"
            href={`#${ids[index]}`}
            key={title}
          >
            <CheckCircle2
              className={`h-5 w-5 ${complete ? 'text-emerald-500' : 'text-slate-200'}`}
            />
            {title}
          </a>
        ))}
      </nav>
    </PageCard>
  );
}

function PersonalInfoCard({
  values,
  onChange,
}: {
  values: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
}) {
  return (
    <PageCard className="p-7" index={1}>
      <CardHeader
        icon={<UserRound className="h-6 w-6" />}
        title="Datos personales"
        subtitle="Información básica del cliente."
      />

      <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
        <StyledInput
          label="Nombres *"
          placeholder="María Isabel"
          value={values.firstName}
          onChange={(v) => onChange('firstName', v)}
        />
        <StyledInput
          label="Apellidos *"
          placeholder="González Pérez"
          value={values.lastName}
          onChange={(v) => onChange('lastName', v)}
        />
        <StyledInput
          label="Cédula / Documento"
          placeholder="000-000000-0"
          helper="Se valida que no esté registrada"
          value={values.identification}
          onChange={(v) => onChange('identification', maskCedula(v))}
        />
        <StyledInput
          label="Fecha de nacimiento"
          placeholder=""
          type="date"
          value={values.birthDate}
          onChange={(v) => onChange('birthDate', v)}
        />
        <StyledSelect
          label="Género"
          options={['', 'Femenino', 'Masculino', 'Otro']}
          value={values.gender}
          onChange={(v) => onChange('gender', v)}
        />
        <StyledSelect
          label="Estado civil"
          options={['', 'Soltero/a', 'Casado/a', 'Unión libre', 'Divorciado/a', 'Viudo/a']}
          value={values.maritalStatus}
          onChange={(v) => onChange('maritalStatus', v)}
        />
        <StyledInput
          label="Nacionalidad"
          placeholder="Dominicana"
          value={values.nationality}
          onChange={(v) => onChange('nationality', v)}
        />
        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
            Dependientes
          </span>
          <div className="flex gap-2">
            <button
              aria-label="Quitar dependiente"
              className="h-11 w-11 shrink-0 rounded-[16px] bg-card shadow-card"
              onClick={() =>
                onChange('dependents', String(Math.max(0, Number(values.dependents || 0) - 1)))
              }
              type="button"
            >
              <Minus className="mx-auto h-4 w-4" />
            </button>
            <input
              aria-label="Dependientes"
              className="h-11 min-w-0 flex-1 rounded-[18px] border-0 bg-surface-subtle text-center text-sm shadow-card"
              min={0}
              onChange={(event) => onChange('dependents', event.target.value)}
              type="number"
              value={values.dependents || '0'}
            />
            <button
              aria-label="Agregar dependiente"
              className="h-11 w-11 shrink-0 rounded-[16px] bg-card shadow-card"
              onClick={() => onChange('dependents', String(Number(values.dependents || 0) + 1))}
              type="button"
            >
              <Plus className="mx-auto h-4 w-4" />
            </button>
          </div>
          <span className="mt-1.5 block text-xs text-text-secondary">Personas a cargo</span>
        </div>
      </div>
    </PageCard>
  );
}

function ContactInfoCard({
  values,
  onChange,
}: {
  values: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
}) {
  return (
    <PageCard className="p-7" index={2}>
      <CardHeader
        icon={<Phone className="h-6 w-6" />}
        iconBg="#d8faeb"
        iconColor="#009a6c"
        title="Información de contacto"
        subtitle="Cómo localizar al cliente."
      />

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <StyledInput
          label="Teléfono móvil"
          placeholder="(809) 555-0142"
          value={values.phone}
          onChange={(v) => onChange('phone', maskPhone(v))}
        />
        <StyledInput
          label="Teléfono alternativo"
          placeholder="(809) 555-0000"
          value={values.altPhone}
          onChange={(v) => onChange('altPhone', maskPhone(v))}
        />
        <div className="md:col-span-2">
          <StyledInput
            label="Correo electrónico"
            placeholder="cliente@correo.com"
            type="email"
            value={values.email}
            onChange={(v) => onChange('email', v)}
          />
        </div>
        <div>
          <label className="block">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
              Dirección
            </span>
            <div className="flex items-start gap-3 rounded-[18px] bg-surface-subtle px-4 shadow-card focus-within:ring-2 focus-within:ring-brand-sky">
              <MapPin className="mt-3.5 h-4 w-4 shrink-0 text-text-subtle" />
              <input
                className="h-11 w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
                placeholder="Calle, número, sector"
                value={values.address}
                onChange={(e) => onChange('address', e.target.value)}
              />
            </div>
          </label>
        </div>
        <StyledSelect
          label="Ciudad / Provincia"
          options={provinces}
          value={values.city || ''}
          onChange={(v) => onChange('city', v)}
        />
      </div>
    </PageCard>
  );
}

function WorkInfoCard({
  values,
  onChange,
}: {
  values: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
}) {
  return (
    <PageCard className="p-7" index={3}>
      <div id="laboral" className="scroll-mt-6">
        <div className="flex items-start justify-between">
          <CardHeader
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            iconBg="#eee8ff"
            iconColor="#7650df"
            title="Información laboral"
            subtitle="Ayuda a evaluar la capacidad de pago."
          />
          <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs text-text-secondary">
            Opcional
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
              Tipo de ingreso
            </span>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {['Empleado', 'Independiente', 'Negocio propio', 'Pensionado'].map((type) => (
                <button
                  aria-pressed={values.incomeType === type}
                  className={`h-11 rounded-[18px] text-sm font-bold ${values.incomeType === type ? 'bg-blue-100 text-brand-sky ring-1 ring-brand-sky' : 'bg-surface-subtle text-text-secondary'}`}
                  key={type}
                  onClick={() => onChange('incomeType', values.incomeType === type ? '' : type)}
                  type="button"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <StyledInput
            label="Ocupación"
            placeholder="Ej. Comerciante"
            value={values.occupation || ''}
            onChange={(v) => onChange('occupation', v)}
          />
          <StyledInput
            label="Lugar de trabajo"
            placeholder="Ej. Colmado La Esquina"
            value={values.workplace || ''}
            onChange={(v) => onChange('workplace', v)}
          />
          <StyledInput
            label="Ingreso mensual"
            placeholder="RD$ 0"
            type="number"
            value={values.monthlyIncome || ''}
            onChange={(v) => onChange('monthlyIncome', v)}
          />
          <StyledSelect
            label="Antigüedad"
            options={[
              '',
              'Menos de 6 meses',
              '6 meses a 1 año',
              '1 a 3 años',
              '3 a 5 años',
              'Más de 5 años',
            ]}
            value={values.workTenure || ''}
            onChange={(v) => onChange('workTenure', v)}
          />
        </div>
      </div>
    </PageCard>
  );
}

function GuarantorCard({
  values,
  onChange,
}: {
  values: ClientFormState;
  onChange: (field: keyof ClientFormState, value: string) => void;
}) {
  return (
    <PageCard className="p-7" index={4}>
      <div id="garante" className="scroll-mt-6">
        <div className="flex items-start justify-between">
          <CardHeader
            icon={<ShieldCheck className="h-5 w-5" />}
            iconBg="#fff2ca"
            iconColor="#d88300"
            title="Garante y referencia"
            subtitle="Contactos de respaldo en caso de atraso."
          />
          <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs text-text-secondary">
            Opcional
          </span>
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
          <StyledInput
            label="Nombre del garante"
            placeholder="Nombre completo"
            value={values.guarantorName || ''}
            onChange={(v) => onChange('guarantorName', v)}
          />
          <StyledSelect
            label="Parentesco"
            options={['', 'Familiar', 'Amigo/a', 'Cónyuge', 'Otro']}
            value={values.guarantorRelation || ''}
            onChange={(v) => onChange('guarantorRelation', v)}
          />
          <StyledInput
            label="Teléfono del garante"
            placeholder="(809) 555-0000"
            value={values.guarantorPhone || ''}
            onChange={(v) => onChange('guarantorPhone', maskPhone(v))}
          />
          <StyledInput
            label="Cédula del garante"
            placeholder="000-000000-0"
            value={values.guarantorIdentification || ''}
            onChange={(v) => onChange('guarantorIdentification', maskCedula(v))}
          />
          <div className="border-t border-border-soft pt-5 md:col-span-2">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <StyledInput
                label="Referencia personal"
                placeholder="Nombre completo"
                value={values.referenceName || ''}
                onChange={(v) => onChange('referenceName', v)}
              />
              <StyledInput
                label="Teléfono de la referencia"
                placeholder="(809) 555-0000"
                value={values.referencePhone || ''}
                onChange={(v) => onChange('referencePhone', maskPhone(v))}
              />
            </div>
          </div>
        </div>
      </div>
    </PageCard>
  );
}

function AdditionalNotesCard({
  value,
  onChange,
  tags,
  onTagsChange,
}: {
  value: string;
  onChange: (value: string) => void;
  tags: string[];
  onTagsChange: (value: string[]) => void;
}) {
  return (
    <PageCard className="p-7" index={5}>
      <div id="notas" className="scroll-mt-6">
        <div className="flex items-start justify-between">
          <CardHeader
            icon={<FileText className="h-6 w-6" />}
            iconBg="#ffe8ee"
            iconColor="#ef4265"
            title="Notas adicionales"
            subtitle="Observaciones internas sobre el cliente."
          />
          <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs text-text-secondary">
            Opcional
          </span>
        </div>
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-text-secondary">
          Etiquetas
        </span>
        <div className="mb-5 flex flex-wrap gap-2">
          {['Referido', 'Cliente recurrente', 'Comerciante', 'Requiere garante', 'Riesgo alto'].map(
            (tag) => (
              <button
                aria-pressed={tags.includes(tag)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tags.includes(tag) ? 'bg-blue-100 text-brand-sky ring-1 ring-brand-sky' : 'bg-surface-subtle text-text-secondary'}`}
                key={tag}
                onClick={() =>
                  onTagsChange(
                    tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag],
                  )
                }
                type="button"
              >
                {tag}
              </button>
            ),
          )}
        </div>
        <StyledTextarea
          label="Comentarios"
          placeholder="Información relevante para evaluar al cliente..."
          value={value}
          onChange={(next) => onChange(next.slice(0, 500))}
        />
        <p className="mt-1 text-xs text-text-secondary">{value.length}/500</p>
      </div>
    </PageCard>
  );
}

export function AddClientPage({ clientId }: { clientId?: number }) {
  const router = useRouter();
  const isEditing = clientId !== undefined;
  const returnHref = isEditing ? `/clientes/${clientId}` : '/clientes';
  const [form, setForm] = useState<ClientFormState>(getEmptyClientForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    getClient(clientId)
      .then((client) => {
        if (active) setForm(getClientFormFromClient(client));
      })
      .catch(() => {
        if (active) setError('No se pudo cargar el cliente.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  function updateField(field: keyof ClientFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
        setError('Completa nombre y apellido con al menos 2 caracteres.');
        return;
      }

      const payload = getClientPayload(form, isEditing);
      const client =
        isEditing && clientId ? await updateClient(clientId, payload) : await createClient(payload);
      invalidateCachePrefix('clients:');
      invalidateCache('dashboard');
      router.push(`/clientes/${client.id}`);
    } catch (err: unknown) {
      let message = 'Error al guardar el cliente. Intenta de nuevo.';
      if (err && typeof err === 'object') {
        if ('response' in err) {
          const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
          if (Array.isArray(data?.message)) message = data.message.join(' ');
          else if (data?.message) message = String(data.message);
          else if (data?.error) message = String(data.error);
        } else if ('request' in err) {
          message =
            'No se pudo conectar con la API. Verifica que el backend esté encendido en localhost:3000.';
        }
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-page p-5 font-sans text-text-primary lg:p-7">
      <div className="mx-auto max-w-[1640px]">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <Link
              className="inline-flex h-9 items-center gap-2 rounded-full bg-card px-3 text-sm font-semibold text-text-secondary shadow-card transition hover:text-brand-sky"
              href={returnHref}
            >
              <ArrowLeft className="h-4 w-4" />
              {isEditing ? 'Volver al cliente' : 'Volver a clientes'}
            </Link>
            <h1 className="mt-6 text-[30px] font-extrabold leading-none text-text-primary">
              {isEditing ? 'Editar cliente' : 'Agregar cliente'}
            </h1>
            <p className="mt-2 max-w-[760px] text-sm text-text-secondary">
              {isEditing ? (
                'Actualiza la información del cliente.'
              ) : (
                <>
                  Completa la información para registrar un nuevo cliente. Solo los campos con{' '}
                  <span className="text-rose-500">*</span> son obligatorios.
                </>
              )}
            </p>
          </div>
          <FormHeaderActions cancelHref={returnHref} onSave={handleSave} saving={saving} />
        </motion.header>

        {error && (
          <div className="mb-6 rounded-panel border border-state-danger/30 bg-state-danger-bg px-5 py-3 text-sm font-medium text-state-danger">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-panel border border-border-soft bg-card p-7 text-sm font-bold text-text-secondary shadow-card">
            Cargando cliente...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="space-y-5 xl:sticky xl:top-5 xl:self-start">
              <ClientPhotoUploader
                clientId={clientId}
                value={form.photo}
                onChange={(v) => updateField('photo', v)}
              />
              <ClientPreview values={form} isEditing={isEditing} clientId={clientId} />
              <ProfileProgress values={form} />
            </div>

            <div className="space-y-6">
              <div id="personal" className="scroll-mt-6">
                <PersonalInfoCard values={form} onChange={updateField} />
              </div>
              <div id="contacto" className="scroll-mt-6">
                <ContactInfoCard values={form} onChange={updateField} />
              </div>
              <WorkInfoCard values={form} onChange={updateField} />
              <GuarantorCard values={form} onChange={updateField} />
              <AdditionalNotesCard
                value={form.notes}
                onChange={(v) => updateField('notes', v)}
                tags={form.tags || []}
                onTagsChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
