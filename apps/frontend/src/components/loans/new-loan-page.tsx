'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calculator,
  Check,
  ChevronDown,
  Plus,
  Search,
  UserRound,
} from 'lucide-react';
function fmtCurrency(amount: number) {
  return `RD$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount)}`;
}
import { getLoanProducts, type LoanProductItem } from '@/lib/api/loan-products';
import { createLoan } from '@/lib/api/loans';
import { getClient, getClients } from '@/lib/api/clients';
import type { Client } from '@inversiones/shared';

type WizardStep = 1 | 2 | 3;

const amortizationRows = [
  { number: '1', payment: 'RD$4,874.36', principal: 'RD$3,624.36', interest: 'RD$1,250.00', balance: 'RD$46,375.64' },
  { number: '2', payment: 'RD$4,874.36', principal: 'RD$3,714.97', interest: 'RD$1,159.39', balance: 'RD$42,660.68' },
  { number: '3', payment: 'RD$4,874.36', principal: 'RD$3,807.84', interest: 'RD$1,066.52', balance: 'RD$38,852.84' },
  { number: '4', payment: 'RD$4,874.36', principal: 'RD$3,903.04', interest: 'RD$971.32', balance: 'RD$34,949.80' },
  { number: '5', payment: 'RD$4,874.36', principal: 'RD$4,000.61', interest: 'RD$873.75', balance: 'RD$30,949.19' },
  { number: '6', payment: 'RD$4,874.36', principal: 'RD$4,100.63', interest: 'RD$773.73', balance: 'RD$26,848.57' },
  { number: '7', payment: 'RD$4,874.36', principal: 'RD$4,203.15', interest: 'RD$671.21', balance: 'RD$22,645.42' },
  { number: '8', payment: 'RD$4,874.36', principal: 'RD$4,308.23', interest: 'RD$566.13', balance: 'RD$18,337.19' },
  { number: '9', payment: 'RD$4,874.36', principal: 'RD$4,415.94', interest: 'RD$458.42', balance: 'RD$13,921.25' },
  { number: '10', payment: 'RD$4,874.36', principal: 'RD$4,526.34', interest: 'RD$348.03', balance: 'RD$9,394.91' },
  { number: '11', payment: 'RD$4,874.36', principal: 'RD$4,639.50', interest: 'RD$234.87', balance: 'RD$4,755.41' },
  { number: '12', payment: 'RD$4,874.36', principal: 'RD$4,755.41', interest: 'RD$118.89', balance: 'RD$0.00' },
];

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
    <div className="flex items-center justify-end gap-2.5">
      {[1, 2, 3].map((item, index) => {
        const completed = item < step;
        const active = item === step;

        return (
          <div className="flex items-center gap-2.5" key={item}>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                completed
                  ? 'bg-[#B8DCC5] text-[#2F7654]'
                  : active
                    ? 'bg-[#2F7654] text-white shadow-[0_10px_20px_rgba(47,118,84,0.18)]'
                    : 'bg-[#EEF3EF] text-[#B9C8BD]'
              }`}
            >
              {completed ? <Check className="h-[18px] w-[18px]" /> : item}
            </span>
            {index < 2 && (
              <span className={`h-px w-10 ${completed ? 'bg-[#5FA37D]' : 'bg-[#E4ECE7]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClientSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative mb-5">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A9CDBB]" />
      <input
        className="h-[52px] w-full rounded-[16px] border border-[#DDEBE3] bg-[#F8FBF9] pl-14 pr-5 text-base font-medium text-[#173D2C] outline-none transition placeholder:text-[#A0AFA8] focus:border-[#285C43] focus:bg-white focus:shadow-[0_0_0_4px_rgba(95,163,125,0.12)]"
        placeholder="Buscar cliente por nombre, cédula o teléfono…"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ClientSelectorCard() {
  return (
    <div className="w-full rounded-[16px] border border-dashed border-[#A9CDBB] bg-[#F7FBF9] p-5 text-left">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#285C43] text-white">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#173D2C]">Seleccionar cliente</p>
          <p className="mt-1 text-sm text-[#7A8A80]">Escribe el nombre, cédula o teléfono arriba</p>
        </div>
      </div>
    </div>
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

function SelectedClientPreview({ client }: { client: Client }) {
  const fullName = `${client.firstName} ${client.lastName}`;

  return (
    <motion.aside
      animate={{ opacity: 1, x: 0 }}
      className="rounded-[22px] border border-[#DDEBE3] bg-white p-6 shadow-[0_8px_24px_rgba(40,92,67,0.035)] lg:p-8"
      initial={{ opacity: 0, x: 18 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#EAF6EF]">
          <UserRound className="h-6 w-6 text-[#5FA37D]" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[#7A8A80]">CLIENTE SELECCIONADO</h2>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative h-[70px] w-[70px] shrink-0">
          <div className="flex h-full w-full items-center justify-center rounded-[18px] border-[3px] border-white bg-[#EAF6EF] shadow-[0_8px_18px_rgba(40,92,67,0.12)]">
            <UserRound className="h-8 w-8 text-[#5FA37D]" />
          </div>
          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-white bg-[#5FA37D]" />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight text-[#173D2C]">{fullName}</p>
          <p className="mt-1.5 text-sm font-medium text-[#7A8A80]">{client.identification ?? '—'}</p>
          <p className="mt-0.5 text-sm font-medium text-[#7A8A80]">{client.phone ?? '—'}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-[14px] bg-[#DDEBE3] px-4 py-2.5 text-xs font-bold text-[#5FA37D]">
        <Check className="h-4 w-4" />
        Cliente verificado
      </div>
    </motion.aside>
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
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const shownClients = results.length > 0 ? results : selectedClient ? [selectedClient] : [];

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(() => {
      getClients(query).then(setResults);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.75fr)]">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[22px] border border-[#DDEBE3] bg-white p-6 shadow-[0_8px_24px_rgba(40,92,67,0.035)] lg:p-8"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="mb-6 text-lg font-bold text-[#173D2C]">Seleccionar cliente</h2>
        <ClientSearchInput value={query} onChange={setQuery} />
        {shownClients.length > 0 && (
          <div className="mb-4 space-y-2">
            {shownClients.map((client) => (
              <button
                key={client.id}
                className={`w-full rounded-[14px] border p-4 text-left text-sm transition ${
                  selectedClient?.id === client.id
                    ? 'border-[#5FA37D] bg-[#EAF6EF]'
                    : 'border-[#DDEBE3] bg-white hover:bg-[#F6FAF7]'
                }`}
                onClick={() => onSelectClient(client)}
                type="button"
              >
                <p className="font-bold text-[#173D2C]">{client.firstName} {client.lastName}</p>
                <p className="mt-1 text-[#777D7A]">{client.identification ?? '—'} · {client.phone ?? '—'}</p>
              </button>
            ))}
          </div>
        )}
        <ClientSelectorCard />
        <Link
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-dashed border-[#A9CDBB] bg-white text-sm font-bold text-[#5FA37D] transition hover:bg-[#F7FBF9] hover:-translate-y-0.5"
          href="/clientes/nuevo"
        >
          <Plus className="h-5 w-5" />
          Agregar cliente
        </Link>
      </motion.section>

      {selectedClient ? <SelectedClientPreview client={selectedClient} /> : <LoanPreviewPlaceholder />}
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
  products,
  selectedProduct,
  onSelectProduct,
}: {
  products: LoanProductItem[];
  selectedProduct: LoanProductItem | null;
  onSelectProduct: (product: LoanProductItem) => void;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[22px] border border-[#DDEBE3] bg-white p-6 shadow-[0_8px_24px_rgba(40,92,67,0.035)] lg:p-8"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className="mb-7 text-xl font-bold text-[#173D2C]">Producto de préstamo</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {products.map((product) => (
          <LoanTypeOption
            active={selectedProduct?.id === product.id}
            description={`${product.interestRate}% · ${product.paymentFrequency === 'MONTHLY' ? 'Mensual' : product.paymentFrequency}`}
            key={product.id}
            onClick={() => onSelectProduct(product)}
            title={product.name}
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
  term,
  onAmountChange,
  onTermChange,
  selectedProduct,
}: {
  amount: string;
  term: string;
  onAmountChange: (value: string) => void;
  onTermChange: (value: string) => void;
  selectedProduct: LoanProductItem | null;
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
            <TextInput label="" value={selectedProduct ? `${selectedProduct.interestRate}%` : '—'} onChange={() => {}} />
          </div>
          <div>
            <span className="mb-2 block text-sm font-bold text-[#6F8076]">Plazo</span>
            <div className="grid grid-cols-[minmax(0,1fr)_135px] gap-3">
              <TextInput label="" onChange={onTermChange} value={term} />
              <SelectInput options={['meses']} value="meses" />
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

function SelectedClientCard({ client }: { client: Client }) {
  const fullName = `${client.firstName} ${client.lastName}`;
  return (
    <div className="flex min-h-[92px] items-center gap-4 rounded-[20px] border border-[#EDF2EF] bg-white px-5 shadow-[0_8px_24px_rgba(40,92,67,0.035)]">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[#EAF6EF] shadow-[0_7px_18px_rgba(40,92,67,0.14)]">
        <UserRound className="h-7 w-7 text-[#5FA37D]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold leading-tight text-[#173D2C]">{fullName}</p>
        <p className="mt-1 text-sm font-medium text-[#7A8A80]">{client.identification ?? '—'}</p>
      </div>
    </div>
  );
}

function LoanSummaryPanel({
  amount,
  payment,
  interest,
  total,
  term,
  selectedProduct,
  selectedClient,
}: {
  amount: number;
  payment: number;
  interest: number;
  total: number;
  term: number;
  selectedProduct: LoanProductItem | null;
  selectedClient: Client | null;
}) {
  const interestPercent = amount > 0 ? (interest / amount) * 100 : 0;

  return (
    <div className="space-y-7">
      {selectedClient && <SelectedClientCard client={selectedClient} />}

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

      {selectedProduct && (
        <section className="rounded-[18px] border border-[#B8EBC9] bg-[#EAF6EF] p-5">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-full bg-[#5FA37D]" />
            <p className="text-base font-bold text-[#2F7654]">{selectedProduct.name}</p>
          </div>
          <p className="mt-3 text-sm font-medium text-[#7A8A80]">
            {selectedProduct.interestRate}% · {selectedProduct.paymentFrequency === 'MONTHLY' ? 'Mensual' : selectedProduct.paymentFrequency}
          </p>
        </section>
      )}
    </div>
  );
}

function NewLoanStepTwo({
  selectedProduct,
  onSelectProduct,
  amount,
  term,
  onAmountChange,
  onTermChange,
  products,
  selectedClient,
}: {
  selectedProduct: LoanProductItem | null;
  onSelectProduct: (product: LoanProductItem) => void;
  amount: string;
  term: string;
  onAmountChange: (value: string) => void;
  onTermChange: (value: string) => void;
  products: LoanProductItem[];
  selectedClient: Client | null;
}) {
  const rate = selectedProduct ? String(selectedProduct.interestRate) : '0';

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

  const currentProduct = selectedProduct;

  return (
    <div className="mt-9 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.75fr)]">
      <div className="space-y-8">
        <LoanTypeSelector products={products} selectedProduct={selectedProduct} onSelectProduct={onSelectProduct} />
        <LoanParametersForm
          amount={amount}
          onAmountChange={onAmountChange}
          onTermChange={onTermChange}
          term={term}
          selectedProduct={selectedProduct}
        />
      </div>

      <LoanSummaryPanel
        amount={summary.principal}
        interest={summary.interest}
        payment={summary.payment}
        selectedClient={selectedClient}
        selectedProduct={currentProduct}
        term={summary.months}
        total={summary.total}
      />
    </div>
  );
}

function SummaryMetricCard({
  label,
  value,
  helper,
  highlight = false,
}: {
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[136px] rounded-[22px] border border-[#DDEBE3] bg-white p-6 shadow-[0_8px_24px_rgba(40,92,67,0.035)]"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A7B5AD]">{label}</p>
      <p className={`mt-4 text-[30px] font-bold leading-none ${highlight ? 'text-[#B45B38]' : 'text-[#173D2C]'}`}>
        {value}
      </p>
      {helper && <p className="mt-3 text-sm font-medium text-[#6F8076]">{helper}</p>}
    </motion.section>
  );
}

function LoanSummaryCards({
  amount,
  payment,
  interest,
  total,
  term,
}: {
  amount: number;
  payment: number;
  interest: number;
  total: number;
  term: number;
}) {
  const interestPercent = amount > 0 ? ((interest / amount) * 100).toFixed(1) : '0';
  return (
    <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <SummaryMetricCard label="CAPITAL" value={`RD$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount)}`} />
      <SummaryMetricCard helper="mensual" label="CUOTA" value={`RD$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(payment)}`} />
      <SummaryMetricCard helper={`${interestPercent}% sobre capital`} highlight label="TOTAL INTERESES" value={`RD$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(interest)}`} />
      <SummaryMetricCard helper={`en ${term} ${term === 1 ? 'mes' : 'meses'}`} label="TOTAL A PAGAR" value={`RD$${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(total)}`} />
    </div>
  );
}

function LoanClientSummary({
  client,
  product,
  amount,
  term,
}: {
  client: Client;
  product: LoanProductItem | null;
  amount: string;
  term: string;
}) {
  const fullName = `${client.firstName} ${client.lastName}`;
  const freqLabel = product?.paymentFrequency === 'MONTHLY' ? 'Mensual' : product?.paymentFrequency ?? '';
  const rateLabel = product ? `${product.interestRate}%` : '';
  const pills = [product?.name ?? '', freqLabel, rateLabel].filter(Boolean);

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-[22px] border border-[#DDEBE3] bg-white px-7 py-7 shadow-[0_8px_24px_rgba(40,92,67,0.035)]"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[#EAF6EF] shadow-[0_7px_18px_rgba(40,92,67,0.14)]">
            <UserRound className="h-7 w-7 text-[#5FA37D]" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight text-[#173D2C]">{fullName}</p>
            <p className="mt-1 text-sm font-medium text-[#7A8A80]">{client.identification ?? '—'}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {pills.map((pill, index) => (
            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${
                index === 0 ? 'bg-[#E7F4EC] text-[#2F7654]' : 'bg-[#F3FAF6] text-[#5C6D63]'
              }`}
              key={pill}
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function AmortizationRow({ row, total = false }: { row: { number: number | string; payment: number | string; principal: number | string; interest: number | string; balance: number | string }; total?: boolean }) {
  const fmt = (v: number | string) => (typeof v === 'number' ? fmtCurrency(v) : v);
  return (
    <div
      className={`grid min-w-[980px] grid-cols-[120px_1.2fr_1.2fr_1.2fr_1.2fr] items-center border-t border-[#EDF2EF] px-7 py-5 text-base ${
        total ? 'bg-[#F3FAF6] font-bold' : row.number === '5' ? 'bg-[#F6FAF7]' : 'bg-white'
      }`}
    >
      <span className={total ? 'text-[#6F8076]' : 'font-medium text-[#7A8A80]'}>{row.number}</span>
      <span className="text-right font-bold text-[#173D2C]">{fmt(row.payment)}</span>
      <span className="text-right font-medium text-[#2F7654]">{fmt(row.principal)}</span>
      <span className="text-right font-medium text-[#B45B38]">{fmt(row.interest)}</span>
      <span className={`text-right font-bold ${total ? 'text-[#A7B5AD]' : 'text-[#173D2C]'}`}>{fmt(row.balance)}</span>
    </div>
  );
}

function AmortizationTableCard({
  schedule,
  totalPayment,
  totalPrincipal,
  totalInterest,
  term,
}: {
  schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[];
  totalPayment: number;
  totalPrincipal: number;
  totalInterest: number;
  term: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? schedule : schedule.slice(0, 6);

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 overflow-hidden rounded-[22px] border border-[#DDEBE3] bg-white shadow-[0_8px_24px_rgba(40,92,67,0.035)]"
      initial={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
    >
      <div className="flex items-center justify-between gap-4 px-7 py-6">
        <h2 className="text-lg font-bold text-[#173D2C]">Tabla de amortización</h2>
        <p className="text-sm font-medium text-[#7A8A80]">{term} {term === 1 ? 'mes' : 'meses'} en total</p>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[980px] grid-cols-[120px_1.2fr_1.2fr_1.2fr_1.2fr] bg-[#F3FAF6] px-7 py-5 text-sm font-bold uppercase tracking-[0.08em] text-[#7A8A80]">
          <span>#</span>
          <span className="text-right">CUOTA</span>
          <span className="text-right">CAPITAL</span>
          <span className="text-right">INTERÉS</span>
          <span className="text-right">SALDO</span>
        </div>

        <motion.div layout>
          {visibleRows.map((row) => (
            <AmortizationRow key={row.number} row={row} />
          ))}
        </motion.div>

        <AmortizationRow
          row={{
            number: 'TOTAL',
            payment: totalPayment,
            principal: totalPrincipal,
            interest: totalInterest,
            balance: 0,
          }}
          total
        />
      </div>

      <button
        className="flex h-16 w-full items-center justify-center gap-3 border-t border-[#EDF2EF] bg-white text-base font-medium text-[#4F9B76] transition hover:bg-[#F6FAF7]"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        <ChevronDown className={`h-5 w-5 transition ${expanded ? 'rotate-180' : ''}`} />
        {expanded ? 'Ocultar cuotas restantes' : 'Ver las 6 cuotas restantes'}
      </button>
    </motion.section>
  );
}

function computeSchedule(principal: number, annualRate: number, months: number) {
  const monthlyRate = annualRate / 100 / 12;
  const payment = monthlyRate > 0
    ? principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal / months;

  let balance = principal;
  let totalInterest = 0;
  const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

  for (let i = 1; i <= months; i++) {
    const interest = balance * monthlyRate;
    const princ = payment - interest;
    balance -= princ;
    totalInterest += interest;
    schedule.push({
      number: i,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(princ * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(Math.max(balance, 0) * 100) / 100,
    });
  }

  const totalPayment = Math.round((principal + totalInterest) * 100) / 100;
  return { schedule, totalPayment, totalPrincipal: principal, totalInterest: Math.round(totalInterest * 100) / 100, payment: Math.round(payment * 100) / 100 };
}

function NewLoanStepThree({
  selectedClient,
  selectedProduct,
  amount,
  term,
}: {
  selectedClient: Client | null;
  selectedProduct: LoanProductItem | null;
  amount: string;
  term: string;
}) {
  const parsedAmount = Number.parseFloat(amount) || 0;
  const parsedTerm = Number.parseInt(term, 10) || 1;
  const annualRate = selectedProduct?.interestRate ?? 0;

  const { schedule, totalPayment, totalPrincipal, totalInterest, payment } = useMemo(
    () => computeSchedule(parsedAmount, annualRate, parsedTerm),
    [parsedAmount, annualRate, parsedTerm],
  );

  return (
    <>
      <LoanSummaryCards amount={parsedAmount} interest={totalInterest} payment={payment} term={parsedTerm} total={totalPayment} />
      {selectedClient && <LoanClientSummary client={selectedClient} product={selectedProduct} amount={amount} term={term} />}
      <AmortizationTableCard schedule={schedule} totalPayment={totalPayment} totalPrincipal={totalPrincipal} totalInterest={totalInterest} term={parsedTerm} />
    </>
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
          {step !== 3 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F4EC] px-3 py-1 text-sm font-bold text-[#2F7654]">
              <span className="h-2 w-2 rounded-full bg-[#5FA37D]" />
              Nuevo préstamo
            </span>
          )}
          <h1 className={`${step === 3 ? '' : 'mt-6'} text-[36px] font-bold leading-none text-[#173D2C] sm:text-[42px]`}>
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
  canContinue,
  canConfirm,
  saving,
  onBack,
  onConfirm,
  onContinue,
}: {
  step: WizardStep;
  selectedClient: boolean;
  canContinue: boolean;
  canConfirm: boolean;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onContinue: () => void;
}) {
  if (step === 1) {
    return (
      <div className="sticky bottom-0 -mx-5 mt-8 flex justify-end bg-[#F3F4F6]/92 px-5 py-4 backdrop-blur-sm lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
        <ContinueButton enabled={selectedClient} onClick={onContinue} />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="sticky bottom-0 -mx-5 mt-9 flex flex-col justify-between gap-4 bg-[#F3F4F6]/92 px-5 py-4 backdrop-blur-sm sm:flex-row lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
        <button
          className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-[#DDEBE3] bg-white px-8 text-sm font-bold text-[#173D2C] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F6FAF7] hover:shadow-md"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
          Modificar parámetros
        </button>
        <button
          className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-[#2F7654] px-9 text-sm font-bold text-white shadow-[0_14px_26px_rgba(47,118,84,0.24)] transition hover:-translate-y-0.5 hover:bg-[#285C43] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canConfirm || saving}
          onClick={onConfirm}
          type="button"
        >
          <Check className="h-5 w-5" />
          {saving ? 'Creando...' : 'Confirmar y crear préstamo'}
        </button>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 -mx-5 mt-8 flex flex-col justify-between gap-4 bg-[#F3F4F6]/92 px-5 py-4 backdrop-blur-sm sm:flex-row lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:py-0">
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
        onClick={onContinue}
        type="button"
      >
        Revisar resumen
      </button>
    </div>
  );
}

export function NewLoanPage({ initialClientId }: { initialClientId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [products, setProducts] = useState<LoanProductItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<LoanProductItem | null>(null);
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLoanProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (!initialClientId) return;
    getClient(initialClientId)
      .then(setSelectedClient)
      .catch(() => setSelectedClient(null));
  }, [initialClientId]);

  async function handleCreate() {
    if (!selectedClient || !selectedProduct || !amount || !term) return;
    setSaving(true);
    try {
      const loan = await createLoan({
        clientId: selectedClient.id,
        productId: selectedProduct.id,
        principal: Number(amount),
        term: Number(term),
        startDate: new Date().toISOString(),
      });
      router.push(`/clientes/${selectedClient.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] px-5 py-7 font-sans text-[#173D2C] lg:px-9 lg:py-8">
      <div className="mx-auto max-w-[1720px]">
        <Header step={step} />

        {step === 1 ? (
          <NewLoanStepOne
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
          />
        ) : step === 2 ? (
          <NewLoanStepTwo
            amount={amount}
            onAmountChange={setAmount}
            onSelectProduct={setSelectedProduct}
            onTermChange={setTerm}
            products={products}
            selectedClient={selectedClient}
            selectedProduct={selectedProduct}
            term={term}
          />
        ) : (
          <NewLoanStepThree
            selectedClient={selectedClient}
            selectedProduct={selectedProduct}
            amount={amount}
            term={term}
          />
        )}

        <WizardActions
          onBack={() => setStep(step === 3 ? 2 : 1)}
          onConfirm={handleCreate}
          onContinue={() => setStep(step === 2 ? 3 : 2)}
          selectedClient={!!selectedClient}
          canContinue={!!selectedClient}
          canConfirm={!!selectedClient && !!selectedProduct && !!amount && !!term}
          saving={saving}
          step={step}
        />
      </div>
    </main>
  );
}
