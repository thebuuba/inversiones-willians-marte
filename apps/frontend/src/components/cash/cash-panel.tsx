'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Calendar,
  ChevronDown,
  CreditCard,
  Plus,
  Repeat2,
  Search,
  Wallet,
} from 'lucide-react';
import { MovementModal, type MovementFormValues } from './movement-modal';
import { createPayment } from '@/lib/api/payments';
import { getStaggerDelay } from '@/lib/animation';
import { invalidateCache, invalidateCachePrefix } from '@/lib/use-client-cache';
import { formatDop, formatSignedDop, parseCurrencyInput } from '@/lib/currency';

type MovementType = 'in' | 'out';

export interface Movement {
  type: MovementType;
  name: string;
  code: string;
  description: string;
  amount: string;
  time: string;
  avatar?: string;
  initials?: string;
  tags: Array<{ label: string; tone: 'green' | 'orange' | 'blue' | 'purple' | 'yellow' | 'gray'; icon?: 'cash' | 'transfer' | 'card' }>;
}

export interface MovementGroup {
  date: string;
  count: string;
  income: string;
  expense: string;
  movements: Movement[];
}

interface CashTotals {
  balance: number;
  income: number;
  expense: number;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1], delay: getStaggerDelay(index, 0.055) },
  }),
};

const emptyTotals: CashTotals = {
  balance: 0,
  income: 0,
  expense: 0,
};

function formatCurrency(value: number, options: { signed?: boolean; negative?: boolean } = {}) {
  if (options.signed) {
    return formatSignedDop(value, { negative: options.negative });
  }

  return formatDop(value);
}

function parseCurrency(value: string) {
  return parseCurrencyInput(value);
}

function categoryTone(category: string): Movement['tags'][number]['tone'] {
  const tones: Record<string, Movement['tags'][number]['tone']> = {
    'Pago de préstamo': 'green',
    Desembolso: 'orange',
    'Gasto operativo': 'blue',
    'Ingreso de inversionista': 'purple',
    'Retiro de socio': 'yellow',
  };

  return tones[category] ?? 'green';
}

function paymentIcon(method: string): Movement['tags'][number]['icon'] {
  if (method === 'Transferencia') return 'transfer';
  if (method === 'Tarjeta') return 'card';
  return 'cash';
}

function updateGroupAmount(amount: string, delta: number, negative = false) {
  const current = parseCurrency(amount);
  return formatCurrency(current + delta, { signed: true, negative });
}

function ShellCard({ children, className = '', index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <motion.section
      animate="visible"
      className={`rounded-2xl border border-neutral-100 bg-white shadow-sm ${className}`}
      custom={index}
      initial="hidden"
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

function Header({ onNewMovement }: { onNewMovement: () => void }) {
  return (
    <motion.header
      animate="visible"
      className="mb-5 flex flex-col justify-between gap-4 2xl:flex-row 2xl:items-end"
      initial="hidden"
      variants={fadeUp}
    >
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F4EC] px-3 py-1 text-xs font-bold text-[#173D2C]">
          <span className="h-2 w-2 rounded-full bg-[#5FA37D]" />
          Movimientos en vivo
        </span>
        <h1 className="mt-3 text-[28px] font-bold leading-tight text-[#173D2C]">Caja</h1>
        <p className="mt-1.5 text-sm text-[#7E9086]">Controla las entradas y salidas de dinero del negocio.</p>
      </div>
      <button
        className="flex h-11 items-center gap-2 rounded-full bg-[#5a9a7a] px-6 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)] transition hover:-translate-y-0.5"
        onClick={onNewMovement}
        type="button"
      >
        <Plus className="h-4 w-4" />
        Nuevo movimiento
      </button>
    </motion.header>
  );
}

function SummaryCard({
  variant,
  icon,
  title,
  value,
  detail,
  progress,
  index,
}: {
  variant: 'balance' | 'income' | 'expense';
  icon: ReactNode;
  title: string;
  value: string;
  detail: ReactNode;
  progress?: number;
  index: number;
}) {
  const isBalance = variant === 'balance';
  const tone = variant === 'expense' ? '#C96F4A' : '#5FA37D';

  return (
    <ShellCard
      className={`${isBalance ? 'bg-gradient-to-br from-[#E7F4EC] to-[#D2E8D9] p-5 xl:col-span-1' : 'p-5'}`}
      index={index}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{ backgroundColor: isBalance ? '#FFFFFF' : variant === 'expense' ? '#FFE3D2' : '#B8DCC5', color: tone }}
        >
          {icon}
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.09em] text-[#6F8076]">{title}</p>
      </div>
      <p className="mt-6 text-[28px] font-bold leading-none text-[#173D2C]">{value}</p>
      <div className="mt-4 text-sm font-medium text-[#6F8076]">{detail}</div>
      {!isBalance && (
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#EEF3EF]">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress ?? 48}%`, backgroundColor: tone }}
          />
        </div>
      )}
    </ShellCard>
  );
}

function FilterBar() {
  return (
    <ShellCard className="mb-5 p-3.5" index={4}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex shrink-0 items-center gap-4">
          {['Todos', 'Entradas', 'Salidas'].map((tab) => (
            <button
              className={`h-9 rounded-[12px] px-4 text-sm font-semibold transition hover:-translate-y-0.5 ${
                tab === 'Todos' ? 'bg-[#E7F4EC] text-[#173D2C] shadow-[0_8px_18px_rgba(40,92,67,0.05)]' : 'text-[#5C6D63]'
              }`}
              key={tab}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex h-10 flex-1 items-center gap-3 rounded-full border border-[#DDEBE3] bg-[#F8FBF9] px-4 text-[#A9CDBB] xl:ml-auto xl:max-w-[380px]">
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm">Buscar por persona o concepto...</span>
        </div>
        <button className="flex h-10 items-center justify-between rounded-full border border-[#DDEBE3] bg-white px-4 text-sm font-semibold text-[#173D2C] shadow-sm transition hover:bg-[#F3FAF6] xl:w-[235px]">
          Todas las categorías
          <ChevronDown className="h-4 w-4 text-[#A9CDBB]" />
        </button>
      </div>
    </ShellCard>
  );
}

function Tag({ label, tone, icon }: Movement['tags'][number]) {
  const styles = {
    green: 'bg-[#E7F4EC] text-[#173D2C]',
    orange: 'bg-[#FFE3D2] text-[#C96F4A]',
    blue: 'bg-[#D8E9FF] text-[#3F7FBD]',
    purple: 'bg-[#E8DDF6] text-[#6F55A5]',
    yellow: 'bg-[#FFF4C8] text-[#A98219]',
    gray: 'bg-[#F3FAF6] text-[#5C6D63] border border-[#DDEBE3]',
  }[tone];

  const Icon = icon === 'transfer' ? Repeat2 : icon === 'card' ? CreditCard : icon === 'cash' ? Banknote : null;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

function Avatar({ movement }: { movement: Movement }) {
  if (movement.avatar) {
    return (
      <div
        className="h-8 w-8 shrink-0 rounded-full bg-cover bg-center shadow-[0_5px_12px_rgba(40,92,67,0.1)]"
        style={{ backgroundImage: `url(${movement.avatar})` }}
      />
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3FAF6] text-xs font-bold text-[#5C6D63]">
      {movement.initials}
    </div>
  );
}

function TransactionItem({ movement }: { movement: Movement }) {
  const isIncome = movement.type === 'in';
  const DirectionIcon = isIncome ? ArrowDownLeft : ArrowUpRight;

  return (
    <motion.div
      className="grid min-h-[76px] grid-cols-[1fr_auto] items-center gap-4 border-b border-[#EDF2EF] px-5 py-3.5 last:border-b-0 hover:bg-[#F8FBF9]"
      whileHover={{ y: -1 }}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
            isIncome ? 'bg-[#E7F4EC] text-[#173D2C]' : 'bg-[#FFE3D2] text-[#C96F4A]'
          }`}
        >
          <DirectionIcon className="h-4 w-4" />
        </div>
        <Avatar movement={movement} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-[#173D2C]">{movement.name}</h3>
            <span className="text-[#A9CDBB]">·</span>
            <span className="text-xs text-[#A9CDBB]">{movement.code}</span>
          </div>
          <p className="mt-0.5 text-xs text-[#7E9086]">{movement.description}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {movement.tags.map((tag) => (
              <Tag key={`${movement.code}-${tag.label}`} {...tag} />
            ))}
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-base font-bold ${isIncome ? 'text-[#173D2C]' : 'text-[#A65B3D]'}`}>{movement.amount}</p>
        <p className="mt-1 text-xs text-[#A9B8AE]">{movement.time}</p>
      </div>
    </motion.div>
  );
}

function TransactionGroup({ group, index }: { group: MovementGroup; index: number }) {
  return (
    <motion.section animate="visible" custom={index} initial="hidden" variants={fadeUp}>
      <div className="mb-3 flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 text-[#7E9086]" />
          <p className="text-sm font-bold text-[#173D2C]">
            {group.date}
            <span className="px-2 text-[#A9CDBB]">·</span>
            <span className="font-medium text-[#A9B8AE]">{group.count}</span>
          </p>
        </div>
        <div className="flex items-center gap-5 text-sm font-bold">
          <span className="text-[#173D2C]">{group.income}</span>
          <span className="text-[#A65B3D]">{group.expense}</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
        {group.movements.map((movement) => (
          <TransactionItem key={movement.code} movement={movement} />
        ))}
      </div>
    </motion.section>
  );
}

export function CashPanel() {
  const [groups, setGroups] = useState<MovementGroup[]>([]);
  const [totals, setTotals] = useState<CashTotals>(emptyTotals);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateMovement = useCallback(async (values: MovementFormValues) => {
    const amount = parseCurrency(values.amount);
    const isIncome = values.type === 'in';
    const isLoanPayment = values.category === 'Pago de préstamo' && values.clientId && values.loanId;

    if (isLoanPayment) {
      try {
        await createPayment({
          loanId: values.loanId!,
          clientId: values.clientId!,
          amount,
          paymentDate: new Date().toISOString(),
          paymentMethod: values.method,
          notes: values.description,
        });
        invalidateCachePrefix('loans:');
        invalidateCachePrefix('clients:');
        invalidateCache('dashboard');
        invalidateCache('portfolio');
        invalidateCache('monthlyCollections');
        invalidateCache('upcomingPayments');
      } catch {
        return;
      }
      setIsModalOpen(false);
      return;
    }

    const nextCodeNumber = groups.reduce((max, group) => {
      return group.movements.reduce((movementMax, movement) => {
        const codeNumber = Number(movement.code.replace(/\D/g, '')) || 0;
        return Math.max(movementMax, codeNumber);
      }, max);
    }, 0) + 1;

    const newMovement: Movement = {
      type: values.type,
      name: values.person,
      code: `MOV-${nextCodeNumber}`,
      description: values.description || 'Movimiento registrado en caja',
      amount: formatCurrency(amount, { signed: true, negative: !isIncome }),
      time: 'Ahora',
      initials: values.person
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join(''),
      tags: [
        { label: values.category, tone: categoryTone(values.category) },
        { label: values.method, tone: 'gray', icon: paymentIcon(values.method) },
      ],
    };

    setGroups((currentGroups) =>
      currentGroups.map((group, index) => {
        if (index !== 0) return group;

        const nextMovements = [newMovement, ...group.movements];

        return {
          ...group,
          count: `${nextMovements.length} movimientos`,
          income: isIncome ? updateGroupAmount(group.income, amount) : group.income,
          expense: isIncome ? group.expense : updateGroupAmount(group.expense, amount, true),
          movements: nextMovements,
        };
      }),
    );

    setTotals((currentTotals) => ({
      balance: isIncome ? currentTotals.balance + amount : currentTotals.balance - amount,
      income: isIncome ? currentTotals.income + amount : currentTotals.income,
      expense: isIncome ? currentTotals.expense : currentTotals.expense + amount,
    }));

    setIsModalOpen(false);
  }, [groups]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <Header onNewMovement={() => setIsModalOpen(true)} />

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SummaryCard
          detail={
            <span className="inline-flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              RD$0 hoy
            </span>
          }
          icon={<Wallet className="h-5 w-5" />}
          index={1}
          title="SALDO ACTUAL"
          value={formatCurrency(totals.balance)}
          variant="balance"
        />
        <SummaryCard
          detail={
            <span>
              Hoy <strong className="text-[#173D2C]">+RD$0</strong>
            </span>
          }
          icon={<ArrowDownLeft className="h-5 w-5" />}
          index={2}
          progress={47}
          title="ENTRADAS"
          value={formatCurrency(totals.income)}
          variant="income"
        />
        <SummaryCard
          detail={
            <span>
              Hoy <strong className="text-[#A65B3D]">−RD$0</strong>
            </span>
          }
          icon={<ArrowUpRight className="h-5 w-5" />}
          index={3}
          progress={53}
          title="SALIDAS"
          value={formatCurrency(totals.expense)}
          variant="expense"
        />
      </div>

      <FilterBar />

      <div className="space-y-6">
        {groups.map((group, index) => (
          <TransactionGroup group={group} index={index + 5} key={group.date} />
        ))}
      </div>

      <MovementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateMovement}
      />
    </div>
  );
}
