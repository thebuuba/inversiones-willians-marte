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
  ChevronDown,
  FileText,
  ImageIcon,
  Loader2,
  MapPin,
  Phone,
  QrCode,
  Save,
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
      className={`rounded-[24px] border border-primary-border bg-white shadow-[0_8px_24px_rgba(40,92,67,0.045)] ${className}`}
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
        className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-primary-border bg-white px-7 text-sm font-bold text-[#3F4542] shadow-[0_5px_14px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:shadow-md"
        href={cancelHref}
      >
        <X className="h-5 w-5" />
        Cancelar
      </Link>
      <button
        className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-primary-accent px-7 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.24)] transition hover:-translate-y-0.5 hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={saving}
        onClick={onSave}
        type="button"
      >
        <Save className="h-5 w-5" />
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
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#7A7F7D]">
        {label}
      </span>
      <input
        className="h-[52px] w-full rounded-[14px] border border-primary-border bg-white px-4 text-sm font-medium text-text-primary shadow-[0_4px_10px_rgba(40,92,67,0.07)] outline-none transition placeholder:text-text-muted focus:border-primary-accent focus:ring-4 focus:ring-primary-soft"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {helper && <span className="mt-2 block text-sm font-medium text-[#9C9F9D]">{helper}</span>}
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
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#7A7F7D]">
        {label}
      </span>
      <div className="relative">
        <select
          className="h-[52px] w-full appearance-none rounded-[14px] border border-primary-border bg-white px-4 pr-12 text-sm font-medium text-text-primary shadow-[0_4px_10px_rgba(40,92,67,0.07)] outline-none transition focus:border-primary-accent focus:ring-4 focus:ring-primary-soft"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9DA5A0]" />
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
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#7A7F7D]">
        {label}
      </span>
      <textarea
        className="min-h-[116px] w-full resize-y rounded-[14px] border border-primary-border bg-white px-4 py-4 text-sm font-medium text-text-primary shadow-[0_4px_10px_rgba(40,92,67,0.07)] outline-none transition placeholder:text-text-muted focus:border-primary-accent focus:ring-4 focus:ring-primary-soft"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function CardHeader({
  icon,
  iconBg = '#EAF6EF',
  iconColor = '#285C43',
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
        <h2 className="text-xl font-bold leading-tight text-text-primary">{title}</h2>
        {subtitle && <p className="mt-1 text-sm font-medium text-text-secondary">{subtitle}</p>}
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
    <PageCard className="p-7" index={1}>
      <CardHeader icon={<Camera className="h-5 w-5" />} title="Fotografía del cliente" />

      {value ? (
        <div className="relative">
          <div
            aria-label="Foto del cliente"
            className="aspect-square w-full rounded-[22px] bg-[#F7FCF9] bg-contain bg-center bg-no-repeat"
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
          className={`flex aspect-square w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed px-6 text-center transition ${
            dragging
              ? 'border-primary-accent bg-primary-soft'
              : 'border-[#B8EBC9] bg-[#F7FCF9] hover:border-primary-accent'
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
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-primary shadow-[0_7px_18px_rgba(40,92,67,0.1)]">
            <ImageIcon className="h-7 w-7" />
          </span>
          <span className="mt-5 text-base font-bold text-[#3F4542]">Arrastra una foto aquí</span>
          <span className="mt-4 text-sm font-medium text-text-secondary">o haz click para subir</span>
        </button>
      )}

      <input
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />

      <div className="mt-6 grid gap-3">
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] border border-[#B8EBC9] bg-white text-sm font-bold text-primary-accent shadow-[0_5px_12px_rgba(40,92,67,0.08)] transition hover:-translate-y-0.5 hover:bg-[#F7FCF9] disabled:opacity-50"
          disabled={processing}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <Upload className="h-5 w-5" />
          {processing ? 'Procesando...' : value ? 'Cambiar foto' : 'Subir foto'}
        </button>
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-[12px] bg-primary-accent text-sm font-bold text-white shadow-[0_10px_20px_rgba(47,118,84,0.2)] transition hover:-translate-y-0.5 hover:bg-primary disabled:opacity-50"
          disabled={creatingQr}
          onClick={() => void handleCreateQr()}
          type="button"
        >
          {creatingQr ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <QrCode className="h-5 w-5" />
          )}
          {creatingQr ? 'Generando...' : 'Tomar con celular'}
        </button>
      </div>

      {qrDataUrl ? (
        <div className="mt-5 rounded-[18px] border border-[#D7EADF] bg-[#F4FBF7] p-4 text-center">
          <p className="text-sm font-bold text-text-primary">Escanea para abrir la cámara</p>
          <div className="mx-auto mt-3 w-fit rounded-[14px] bg-white p-3 shadow-[0_8px_20px_rgba(40,92,67,0.08)]">
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
          <p className="mt-2 break-all text-[10px] text-[#8A9690]">{captureUrl}</p>
        </div>
      ) : null}

      {captureReceived ? (
        <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          Fotografía recibida desde el celular.
        </p>
      ) : null}

      {captureError ? (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {captureError}
        </p>
      ) : null}

      {!value ? (
        <>
          <p className="mt-6 text-sm font-medium leading-7 text-text-secondary">
            Formatos aceptados: JPG, PNG y WebP · Tamaño máximo 5 MB. Una foto clara del rostro
            ayuda a verificar la identidad del cliente.
          </p>
        </>
      ) : null}
      {error ? (
        <p
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </PageCard>
  );
}

function RequiredFieldsNotice() {
  return (
    <motion.aside
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] border border-[#E8EDE9] bg-[#F5F7F6] p-7 text-sm font-medium leading-7 text-text-secondary"
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1], delay: 0.11 }}
    >
      Todos los campos son opcionales. Completa solo la información disponible del cliente.
    </motion.aside>
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

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        <StyledInput
          label="Nombres"
          placeholder="María Isabel"
          value={values.firstName}
          onChange={(v) => onChange('firstName', v)}
        />
        <StyledInput
          label="Apellidos"
          placeholder="González Pérez"
          value={values.lastName}
          onChange={(v) => onChange('lastName', v)}
        />
        <StyledInput
          label="Cédula / Documento"
          placeholder="000-000000-0"
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
          options={['', 'Soltero/a', 'Casado/a', 'Unión libre']}
          value={values.maritalStatus}
          onChange={(v) => onChange('maritalStatus', v)}
        />
        <StyledInput
          label="Nacionalidad"
          placeholder="Dominicana"
          value={values.nationality}
          onChange={(v) => onChange('nationality', v)}
        />
        <StyledInput
          helper="Personas a cargo"
          label="Dependientes"
          placeholder="0"
          type="number"
          value={values.dependents}
          onChange={(v) => onChange('dependents', v)}
        />
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
        iconBg="#D8E9FF"
        iconColor="#2F5F91"
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
        <div className="md:col-span-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-[#7A7F7D]">
              Dirección
            </span>
            <div className="flex items-start gap-3 rounded-[14px] border border-primary-border bg-white px-4 shadow-[0_4px_10px_rgba(40,92,67,0.07)] transition focus-within:border-primary-accent focus-within:ring-4 focus-within:ring-primary-soft">
              <MapPin className="mt-4 h-5 w-5 shrink-0 text-[#9DA5A0]" />
              <input
                className="h-[52px] w-full bg-transparent text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
                placeholder="Calle, número, sector, ciudad"
                value={values.address}
                onChange={(e) => onChange('address', e.target.value)}
              />
            </div>
          </label>
        </div>
      </div>
    </PageCard>
  );
}

function AdditionalNotesCard({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <PageCard className="p-7" index={3}>
      <CardHeader
        icon={<FileText className="h-6 w-6" />}
        title="Notas adicionales"
        subtitle="Observaciones internas sobre el cliente."
      />
      <StyledTextarea
        label="Comentarios"
        placeholder="Información relevante para evaluar al cliente..."
        value={value}
        onChange={onChange}
      />
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
          className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <Link
              className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-primary-accent transition hover:text-text-primary"
              href={returnHref}
            >
              <ArrowLeft className="h-4 w-4" />
              {isEditing ? 'Volver al cliente' : 'Volver a clientes'}
            </Link>
            <h1 className="mt-5 text-[36px] font-bold leading-none text-text-primary">
              {isEditing ? 'Editar cliente' : 'Agregar cliente'}
            </h1>
            <p className="mt-3 max-w-[760px] text-sm font-medium text-[#6F7280]">
              {isEditing
                ? 'Actualiza la información del cliente.'
                : 'Completa la información para registrar un nuevo cliente en tu cartera de préstamos.'}
            </p>
          </div>
          <FormHeaderActions cancelHref={returnHref} onSave={handleSave} saving={saving} />
        </motion.header>

        {error && (
          <div className="mb-6 rounded-[16px] border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-[24px] border border-primary-border bg-white p-7 text-sm font-bold text-text-secondary">
            Cargando cliente...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-7 xl:grid-cols-[390px_minmax(0,1fr)]">
            <div className="space-y-7">
              <ClientPhotoUploader
                clientId={clientId}
                value={form.photo}
                onChange={(v) => updateField('photo', v)}
              />
              <RequiredFieldsNotice />
            </div>

            <div className="space-y-7">
              <PersonalInfoCard values={form} onChange={updateField} />
              <ContactInfoCard values={form} onChange={updateField} />
              <AdditionalNotesCard value={form.notes} onChange={(v) => updateField('notes', v)} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
