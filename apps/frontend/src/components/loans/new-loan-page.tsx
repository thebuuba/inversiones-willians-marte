'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  Pencil,
  Search,
  UserRound,
} from 'lucide-react';

type WizardStep = 1 | 2 | 3;
type LoanTypeId = 'french' | 'absolute' | 'open' | 'free';

const loanTypes = [
  {
    id: 'french',
    title: 'Sistema Francés',
    description: 'Cuota fija con amortización creciente',
  },
  {
    id: 'absolute',
    title: 'Préstamo Absoluto',
    description: 'Interés fijo sobre capital inicial',
  },
  {
    id: 'open',
    title: 'Plazo Abierto',
    description: 'Sin fecha fija · cuota mínima mensual',
  },
  {
    id: 'free',
    title: 'Sin Intereses',
    description: 'Capital dividido en cuotas iguales',
  },
] satisfies Array<{ id: LoanTypeId; title: string; description: string }>;

function parseNumber(value: string) {
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return `RD$${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value)}`;
}

function LoanWizardStepper({ step }: { step: WizardStep }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {[1, 2, 3].map((item, index) => {
        const completed = item < step;
        const active = item === step;

        return (
          <div className="flex items-center gap-3" key={item}>
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                completed
                  ? 'bg-[#B8DCC5] text-[#2F7654]'
                  : active
                    ? 'bg-[#2F7654] text-white shadow-[0_10px_20px_rgba(47,118,84,0.18)]'
                    : 'bg-[#EEF3EF] text-[#B9C8BD]'
              }`}
            >
              {completed ? <Check className="h-5 w-5" /> : item}
            </span>
            {index < 2 && (
              <span className={`h-px w-12 ${completed ? 'bg-[#5FA37D]' : 'bg-[#E4ECE7]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClientSearchInput() {
  return (
    <div className="flex h-[50px] items-center gap-3.5 rounded-[12px] border border-[#DDEBE3] bg-white px-5 shadow-[0_4px_12px_rgba(40,92,67,0.06)] transition focus-within:border-[#B8DCC5] focus-within:ring-2 focus-within:ring-[#EAF6EF]">
      <Search className="h-5 w-5 shrink-0 text-[#A7B5AD]" />
      <input
        className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-[#173D2C] outline-none placeholder:text-[#7A8A80]"
        placeholder="Buscar por nombre, cédula o ID..."
        type="text"
      />
    </div>
  );
}

function ClientSelectorCard({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      className={`mt-5 flex min-h-[86px] w-full items-center gap-4 rounded-[18px] border px-5 text-left transition ${
        selected
          ? 'border-[#5FA37D] bg-[#EAF6EF] shadow-[0_10px_24px_rgba(95,163,125,0.1)]'
          : 'border-[#EDF2EF] bg-white hover:-translate-y-0.5 hover:border-[#DDEBE3] hover:shadow-[0_10px_24px_rgba(40,92,67,0.045)]'
      }`}
      onClick={onSelect}
      type="button"
      whileTap={{ scale: 0.995 }}
    >
      <div
        aria-label="María González Pérez"
        className="h-12 w-12 shrink-0 rounded-full border-[3px] border-white bg-cover bg-center shadow-[0_7px_18px_rgba(40,92,67,0.14)]"
        role="img"
        style={{ backgroundImage: 'url(https://i.pravatar.cc/96?img=32)' }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold leading-tight text-[#173D2C]">María González Pérez</p>
        <p className="mt-1 text-sm font-medium text-[#7A8A80]">CL-0142 · 402-1234567-8</p>
      </div>
      <span className="shrink-0 rounded-full bg-[#E7F4EC] px-3 py-1.5 text-xs font-bold text-[#2F7654]">
        2 activos
      </span>
    </motion.button>
  );
}

function LoanPreviewPlaceholder() {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-[360px] items-center justify-center rounded-[22px] border border-dashed border-[#DDEBE3] bg-white px-6 text-center"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
    >
      <div>
        <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-[22px] bg-[#EAF6EF] text-[#4F9B76]">
          <UserRound className="h-9 w-9" strokeWidth={2} />
        </div>
        <h2 className="mt-6 text-lg font-bold text-[#173D2C]">Selecciona un cliente</h2>
        <p className="mt-2 text-sm font-medium text-[#7A8A80]">Busca y selecciona el solicitante del préstamo.</p>
      </div>
    </motion.section>
  );
}

function ContinueButton({ enabled, onClick }: { enabled: boolean; onClick: () => void }) {
  return (
    <button
      className={`inline-flex h-14 items-center justify-center gap-3 rounded-full px-8 text-sm font-bold transition ${
        enabled
          ? 'bg-[#2F7654] text-white shadow-[0_14px_26px_rgba(47,118,84,0.22)] hover:-translate-y-0.5 hover:bg-[#285C43]'
          : 'cursor-not-allowed bg-[#EEF3EF] text-[#B9C8BD]'
      }`}
      disabled={!enabled}
      onClick={onClick}
      type="button"
    >
      Continuar
      <ChevronDown className="h-5 w-5 -rotate-90" />
    </button>
  );
}

function NewLoanStepOne({
  selectedClient,
  onSelectClient,
}: {
  selectedClient: boolean;
  onSelectClient: () => void;
}) {
  return (
    <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.75fr)]">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[22px] border border-[#DDEBE3] bg-white p-6 shadow-[0_8px_24px_rgba(40,92,67,0.035)] lg:p-8"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="mb-6 text-lg font-bold text-[#173D2C]">Seleccionar cliente</h2>
        <ClientSearchInput />
        <ClientSelectorCard selected={selectedClient} onSelect={onSelectClient} />
      </motion.section>

      <LoanPreviewPlaceholder />
    </div>
  );
}

function LoanTypeOption({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-[92px] items-start gap-4 rounded-[18px] border px-5 py-5 text-left transition hover:-translate-y-0.5 ${
        active
          ? 'border-[#5FA37D] bg-[#EAF6EF] shadow-[0_8px_18px_rgba(95,163,125,0.08)]'
          : 'border-[#EDF2EF] bg-white shadow-[0_5px_14px_rgba(40,92,67,0.025)] hover:border-[#DDEBE3]'
      }`}
      onClick={onClick}
      type="button"
    >
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${active ? 'bg-[#5FA37D]' : 'bg-[#C7CCC9]'}`} />
      <span>
        <span className={`block text-base font-bold ${active ? 'text-[#2F7654]' : 'text-[#173D2C]'}`}>{title}</span>
        <span className="mt-2 block text-sm font-medium text-[#7A8A80]">{description}</span>
      </span>
    </button>
  );
}

function LoanTypeSelector({
  selectedType,
  onSelectType,
}: {
  selectedType: LoanTypeId;
  onSelectType: (type: LoanTypeId) => void;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] border border-[#DDEBE3] bg-white p-6 shadow-[0_8px_24px_rgba(40,92,67,0.035)] lg:p-8"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="mb-7 text-xl font-bold text-[#173D2C]">Tipo de préstamo</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {loanTypes.map((type) => (
          <LoanTypeOption
            active={selectedType === type.id}
            description={type.description}
            key={type.id}
            onClick={() => onSelectType(type.id)}
            title={type.title}
          />
        ))}
      </div>
    </motion.section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  prefix,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-[#6F8076]">{label}</span>
      <div className="flex h-[52px] items-center rounded-[10px] border border-[#DDEBE3] bg-white px-4 text-base font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] transition focus-within:border-[#4F9B76] focus-within:ring-2 focus-within:ring-[#EAF6EF]">
        {prefix && <span className="mr-3 shrink-0 text-[#7A8A80]">{prefix}</span>}
        <input
          className="h-full min-w-0 flex-1 bg-transparent outline-none"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      </div>
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  className = '',
}: {
  label?: string;
  value: string;
  options: string[];
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-2 block text-sm font-bold text-[#6F8076]">{label}</span>}
      <div className="relative">
        <select
          className="h-[52px] w-full appearance-none rounded-[10px] border border-[#DDEBE3] bg-white px-4 pr-9 text-base font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
          defaultValue={value}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A7B5AD]" />
      </div>
    </label>
  );
}

function LoanParametersForm({
  amount,
  rate,
  term,
  onAmountChange,
  onRateChange,
  onTermChange,
}: {
  amount: string;
  rate: string;
  term: string;
  onAmountChange: (value: string) => void;
  onRateChange: (value: string) => void;
  onTermChange: (value: string) => void;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] border border-[#DDEBE3] bg-white p-6 shadow-[0_8px_24px_rgba(40,92,67,0.035)] lg:p-8"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
    >
      <h2 className="mb-7 text-xl font-bold text-[#173D2C]">Parámetros del préstamo</h2>
      <div className="space-y-6">
        <TextInput label="Monto a desembolsar" onChange={onAmountChange} prefix="RD$" value={amount} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <span className="mb-2 block text-sm font-bold text-[#6F8076]">Tasa de interés</span>
            <div className="grid grid-cols-[minmax(0,1fr)_145px] gap-3">
              <TextInput label="" onChange={onRateChange} value={rate} />
              <SelectInput options={['% mensual', '% anual']} value="% mensual" />
            </div>
          </div>
          <div>
            <span className="mb-2 block text-sm font-bold text-[#6F8076]">Plazo</span>
            <div className="grid grid-cols-[minmax(0,1fr)_135px] gap-3">
              <TextInput label="" onChange={onTermChange} value={term} />
              <SelectInput options={['Meses', 'Semanas']} value="Meses" />
            </div>
          </div>
        </div>

        <SelectInput
          className="max-w-[460px]"
          label="Frecuencia de pago"
          options={['Mensual', 'Quincenal', 'Semanal']}
          value="Mensual"
        />

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-[#6F8076]">Descripción / propósito</span>
          <textarea
            className="h-[104px] w-full resize-none rounded-[10px] border border-[#DDEBE3] bg-white px-4 py-4 text-base font-medium text-[#173D2C] shadow-[0_3px_8px_rgba(40,92,67,0.06)] outline-none transition placeholder:text-[#8F9691] focus:border-[#4F9B76] focus:ring-2 focus:ring-[#EAF6EF]"
            placeholder="Ej. Capital de trabajo para negocio familiar..."
          />
        </label>
      </div>
    </motion.section>
  );
}

function SelectedClientCard() {
  return (
    <div className="flex min-h-[92px] items-center gap-4 rounded-[20px] border border-[#EDF2EF] bg-white px-5 shadow-[0_8px_24px_rgba(40,92,67,0.035)]">
      <div
        aria-label="María González Pérez"
        className="h-14 w-14 shrink-0 rounded-full border-[3px] border-white bg-cover bg-center shadow-[0_7px_18px_rgba(40,92,67,0.14)]"
        role="img"
        style={{ backgroundImage: 'url(https://i.pravatar.cc/96?img=32)' }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold leading-tight text-[#173D2C]">María González Pérez</p>
        <p className="mt-1 text-sm font-medium text-[#7A8A80]">CL-0142</p>
      </div>
      <button className="rounded-full p-2 text-[#A7B5AD] transition hover:bg-[#EAF6EF] hover:text-[#173D2C]" type="button">
        <Pencil className="h-5 w-5" />
      </button>
    </div>
  );
}

function LoanSummaryPanel({
  amount,
  payment,
  interest,
  total,
  term,
  selectedType,
}: {
  amount: number;
  payment: number;
  interest: number;
  total: number;
  term: number;
  selectedType: (typeof loanTypes)[number];
}) {
  const interestPercent = amount > 0 ? (interest / amount) * 100 : 0;

  return (
    <div className="space-y-7">
      <SelectedClientCard />

      <section className="rounded-[22px] border border-[#B8EBC9] bg-[#F1FAF5] p-7">
        <div className="mb-6 flex items-center gap-3 text-[#2F7654]">
          <Calculator className="h-5 w-5" />
          <h2 className="text-lg font-bold">Resumen del préstamo</h2>
        </div>

        <div className="space-y-5 text-base">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#5C6D63]">Capital</span>
            <span className="font-bold text-[#173D2C]">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#5C6D63]">Cuota</span>
            <span className="font-bold text-[#2F7654]">{formatCurrency(payment)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#5C6D63]">Total intereses</span>
            <span className="font-bold text-[#B45B38]">{formatCurrency(interest)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#5C6D63]">Total a pagar</span>
            <span className="font-bold text-[#173D2C]">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#5C6D63]">Duración</span>
            <span className="font-bold text-[#173D2C]">{term} meses</span>
          </div>
        </div>

        <div className="mt-7 rounded-[18px] border border-[#B8EBC9] bg-white/55 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7A8A80]">INTERÉS TOTAL GENERADO</p>
          <p className="mt-3 text-[32px] font-bold leading-none text-[#2F7654]">{formatCurrency(interest)}</p>
          <p className="mt-2 text-sm font-medium text-[#5C6D63]">{interestPercent.toFixed(1)}% sobre el capital</p>
        </div>
      </section>

      <section className="rounded-[18px] border border-[#B8EBC9] bg-[#EAF6EF] p-5">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 shrink-0 rounded-full bg-[#5FA37D]" />
          <p className="text-base font-bold text-[#2F7654]">{selectedType.title}</p>
        </div>
        <p className="mt-3 text-sm font-medium text-[#7A8A80]">{selectedType.description}</p>
      </section>
    </div>
  );
}

function NewLoanStepTwo({
  selectedType,
  onSelectType,
  amount,
  rate,
  term,
  onAmountChange,
  onRateChange,
  onTermChange,
}: {
  selectedType: LoanTypeId;
  onSelectType: (type: LoanTypeId) => void;
  amount: string;
  rate: string;
  term: string;
  onAmountChange: (value: string) => void;
  onRateChange: (value: string) => void;
  onTermChange: (value: string) => void;
}) {
  const summary = useMemo(() => {
    const principal = parseNumber(amount);
    const monthlyRate = parseNumber(rate) / 100;
    const months = Math.max(1, Math.round(parseNumber(term)));
    const payment =
      monthlyRate > 0
        ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
        : principal / months;
    const total = payment * months;

    return {
      principal,
      months,
      payment,
      total,
      interest: Math.max(0, total - principal),
    };
  }, [amount, rate, term]);

  const currentType = loanTypes.find((type) => type.id === selectedType) ?? loanTypes[0];

  return (
    <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.75fr)]">
      <div className="space-y-8">
        <LoanTypeSelector selectedType={selectedType} onSelectType={onSelectType} />
        <LoanParametersForm
          amount={amount}
          onAmountChange={onAmountChange}
          onRateChange={onRateChange}
          onTermChange={onTermChange}
          rate={rate}
          term={term}
        />
      </div>

      <LoanSummaryPanel
        amount={summary.principal}
        interest={summary.interest}
        payment={summary.payment}
        selectedType={currentType}
        term={summary.months}
        total={summary.total}
      />
    </div>
  );
}

function Header({ step }: { step: WizardStep }) {
  return (
    <>
      {step === 1 && (
        <Link
          className="inline-flex items-center gap-3 text-sm font-bold text-[#5C6D63] transition hover:text-[#173D2C]"
          href="/inicio"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Link>
      )}

      <div className={`${step === 1 ? 'mt-8' : ''} grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end`}>
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F4EC] px-3 py-1 text-sm font-bold text-[#2F7654]">
            <span className="h-2 w-2 rounded-full bg-[#5FA37D]" />
            Nuevo préstamo
          </span>
          <h1 className="mt-6 text-[36px] font-bold leading-none text-[#173D2C] sm:text-[42px]">
            Crear préstamo
          </h1>
          <p className="mt-4 max-w-[720px] text-base font-medium leading-7 text-[#7A8A80]">
            Configura los parámetros y revisa el cálculo antes de confirmar.
          </p>
        </div>
        <LoanWizardStepper step={step} />
      </div>
    </>
  );
}

function WizardActions({
  step,
  selectedClient,
  onBack,
  onContinue,
  onShowAmortization,
}: {
  step: WizardStep;
  selectedClient: boolean;
  onBack: () => void;
  onContinue: () => void;
  onShowAmortization: () => void;
}) {
  if (step === 1) {
    return (
      <div className="sticky bottom-0 -mx-5 mt-8 flex justify-end bg-[#F6FAF7]/92 px-5 py-4 backdrop-blur-sm lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
        <ContinueButton enabled={selectedClient} onClick={onContinue} />
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 -mx-5 mt-8 flex flex-col justify-between gap-4 bg-[#F6FAF7]/92 px-5 py-4 backdrop-blur-sm sm:flex-row lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
      <button
        className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-[#DDEBE3] bg-white px-8 text-sm font-bold text-[#173D2C] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6FAF7] hover:shadow-md"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft className="h-5 w-5" />
        Atrás
      </button>
      <button
        className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#2F7654] px-9 text-sm font-bold text-white shadow-[0_14px_26px_rgba(47,118,84,0.22)] transition hover:-translate-y-0.5 hover:bg-[#285C43]"
        onClick={onShowAmortization}
        type="button"
      >
        Ver tabla de amortización
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

export function NewLoanPage() {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedClient, setSelectedClient] = useState(false);
  const [selectedType, setSelectedType] = useState<LoanTypeId>('french');
  const [amount, setAmount] = useState('50000');
  const [rate, setRate] = useState('2.5');
  const [term, setTerm] = useState('12');

  return (
    <main className="min-h-screen bg-[#F6FAF7] px-5 py-7 font-sans text-[#173D2C] lg:px-9 lg:py-8">
      <div className="mx-auto max-w-[1720px]">
        <Header step={step} />

        {step === 1 ? (
          <NewLoanStepOne selectedClient={selectedClient} onSelectClient={() => setSelectedClient(true)} />
        ) : (
          <NewLoanStepTwo
            amount={amount}
            onAmountChange={setAmount}
            onRateChange={setRate}
            onSelectType={setSelectedType}
            onTermChange={setTerm}
            rate={rate}
            selectedType={selectedType}
            term={term}
          />
        )}

        <WizardActions
          onBack={() => setStep(1)}
          onContinue={() => setStep(2)}
          onShowAmortization={() => setStep(3)}
          selectedClient={selectedClient}
          step={step}
        />
      </div>
    </main>
  );
}
