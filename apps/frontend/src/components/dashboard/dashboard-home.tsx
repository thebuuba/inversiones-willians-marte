'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  CalendarDays,
  ContactRound,
  FileBarChart2,
  Landmark,
  FolderOpen,
  MoreHorizontal,
  Phone,
  Plus,
  ReceiptText,
  UserRoundPlus,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useClientCache } from '@/lib/use-client-cache';
import { getLoanStatusBadgeClass } from '@/lib/loan-status-visuals';
import {
  getAudit,
  getDashboardOverview,
  type CollectionPriority,
  type PortfolioGroup,
  type UpcomingPayment,
} from '@/lib/api/dashboard';
import { getLoans, type LoanListItem } from '@/lib/api/loans';
import { getClient } from '@/lib/api/clients';
import { CircleProgress } from '@/components/ui/circle-progress';
import { formatDop } from '@/lib/currency';
import { formatRelativeDate, formatShortDate } from '@/lib/date-format';
import { toDashboardAuditRow } from './dashboard-audit';

function money(value: number) {
  return formatDop(value, { decimals: 2 });
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getDueTodayTotal(payments: UpcomingPayment[], now = new Date()): number {
  const today = localDateKey(now);
  return payments.reduce(
    (sum, payment) =>
      sum + (localDateKey(new Date(payment.dueDate)) === today ? payment.amount : 0),
    0,
  );
}

export function getAgingBuckets(priorities: CollectionPriority[]) {
  const buckets = [
    { label: '1-30', min: 1, max: 30, amount: 0, count: 0 },
    { label: '31-60', min: 31, max: 60, amount: 0, count: 0 },
    { label: '61-90', min: 61, max: 90, amount: 0, count: 0 },
    { label: '90+', min: 91, max: Infinity, amount: 0, count: 0 },
  ];
  for (const item of priorities) {
    const bucket = buckets.find(
      (entry) => item.daysOverdue >= entry.min && item.daysOverdue <= entry.max,
    );
    if (bucket) {
      bucket.amount += item.overdueAmount;
      bucket.count += 1;
    }
  }
  return buckets.map(({ label, amount, count }) => ({ label, amount, count }));
}

function detailedAgingBuckets(priorities: CollectionPriority[]) {
  const ranges = [
    { label: '1-15 días', min: 1, max: 15 },
    { label: '16-30 días', min: 16, max: 30 },
    { label: '31-60 días', min: 31, max: 60 },
    { label: '61-90 días', min: 61, max: 90 },
    { label: '91-180 días', min: 91, max: 180 },
    { label: '+180 días', min: 181, max: Infinity },
  ];
  return ranges.map((range) => ({
    label: range.label,
    amount: priorities
      .filter((item) => item.daysOverdue >= range.min && item.daysOverdue <= range.max)
      .reduce((sum, item) => sum + item.overdueAmount, 0),
  }));
}

export const portfolioStatusConfig: Record<string, { label: string; color: string }> = {
  CURRENT: { label: 'A tiempo', color: '#41c889' },
  PENDING: { label: 'Pendientes', color: '#f59e0b' },
  LATE: { label: 'Atrasados', color: '#faac38' },
  EXPIRED: { label: 'Vencidos', color: '#f43f5e' },
  PAID: { label: 'Pagados', color: '#419fec' },
  WRITTEN_OFF: { label: 'Castigados', color: '#64748b' },
};
const portfolioStatusOrder = ['CURRENT', 'PENDING', 'LATE', 'EXPIRED', 'PAID', 'WRITTEN_OFF'];
export function getPortfolioStatusData(portfolio: PortfolioGroup[]) {
  return [...portfolio]
    .sort((a, b) => portfolioStatusOrder.indexOf(a.status) - portfolioStatusOrder.indexOf(b.status))
    .map((group) => ({
      name: portfolioStatusConfig[group.status]?.label ?? group.status,
      value: group.count,
      color: portfolioStatusConfig[group.status]?.color ?? '#cbd5e1',
    }));
}

function recentLoanStatusLabel(loan: LoanListItem) {
  if (loan.status === 'PAID') return 'Pagado';
  return {
    CURRENT: 'Al día',
    PENDING: 'Pendiente',
    LATE: 'Atrasado',
    EXPIRED: 'Vencido',
  }[loan.collectionStatus];
}

function recentLoanNextPayment(loan: LoanListItem) {
  if (loan.collectionStatus === 'LATE' || loan.collectionStatus === 'EXPIRED') return 'Vencido';
  return loan.nextPaymentDate ? formatShortDate(loan.nextPaymentDate) : '—';
}

const quickLinks = [
  { label: 'Registrar pago', href: '/prestamos/cobrar', icon: Banknote, color: 'bg-[#0ab487]' },
  { label: 'Nuevo cliente', href: '/clientes/nuevo', icon: UserRoundPlus, color: 'bg-[#8052e8]' },
  { label: 'Solicitudes', href: '/solicitudes', icon: ClipboardList, color: 'bg-[#f3647b]' },
  { label: 'Recibos', href: '/recibos', icon: ReceiptText, color: 'bg-[#f3b51b]' },
  { label: 'Caja', href: '/caja', icon: Wallet, color: 'bg-[#079cdb]' },
  { label: 'Simulador', href: '/simulador', icon: Landmark, color: 'bg-[#8192ac]' },
  { label: 'Reportes', href: '/reportes', icon: FileBarChart2, color: 'bg-[#6254e8]' },
];
const optionalQuickLinks = [
  { label: 'Clientes', href: '/clientes', icon: ContactRound, color: 'bg-[#3e96e7]' },
  { label: 'Agenda', href: '/agenda', icon: CalendarDays, color: 'bg-[#eea232]' },
  { label: 'Carteras', href: '/carteras', icon: FolderOpen, color: 'bg-[#6479bb]' },
];

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl bg-card shadow-card ${className}`}
    >
      {children}
    </section>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold text-text-primary">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
    </div>
  );
}

export function DashboardHome() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: overview } = useClientCache('dashboard-overview', getDashboardOverview, 60_000);
  const { data: recentLoans } = useClientCache(
    'dashboard-recent-loans',
    () => getLoans(undefined, undefined, 5),
    60_000,
  );
  const { data: audit } = useClientCache(
    'dashboard-audit',
    user?.role === 'ADMIN' ? getAudit : async () => [],
    60_000,
  );
  const [period, setPeriod] = useState<7 | 14 | 30>(30);
  const [priorityTab, setPriorityTab] = useState<'Vencidos' | 'Hoy' | 'Semana'>('Vencidos');
  const [selectedRecentLoanId, setSelectedRecentLoanId] = useState<string | null>(null);
  const [recentClientPhotos, setRecentClientPhotos] = useState<Record<number, string>>({});
  const [extraQuickLinks, setExtraQuickLinks] = useState<string[]>([]);
  useEffect(() => {
    const ids = [...new Set(recentLoans?.data.map((loan) => loan.clientId) ?? [])];
    if (ids.length === 0) return;
    let active = true;
    Promise.allSettled(ids.map((id) => getClient(id))).then((results) => {
      if (!active) return;
      setRecentClientPhotos((current) => {
        const next = { ...current };
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.photo) {
            next[ids[index]] = result.value.photo;
          }
        });
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, [recentLoans]);
  useEffect(() => {
    const stored = localStorage.getItem('dashboard-quick-links');
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed))
          queueMicrotask(() =>
            setExtraQuickLinks(parsed.filter((item): item is string => typeof item === 'string')),
          );
      } catch {
        /* Ignore a damaged local preference. */
      }
    }
  }, []);
  function toggleQuickLink(href: string) {
    setExtraQuickLinks((current) => {
      const next = current.includes(href)
        ? current.filter((item) => item !== href)
        : [...current, href];
      localStorage.setItem('dashboard-quick-links', JSON.stringify(next));
      return next;
    });
  }
  const visibleQuickLinks = [
    ...quickLinks,
    ...optionalQuickLinks.filter((item) => extraQuickLinks.includes(item.href)),
  ];
  const dash = overview?.dashboard;
  const portfolio = overview?.portfolio ?? [];
  const dailyIncome = (overview?.dailyIncome ?? []).slice(-period);
  const upcoming = overview?.upcomingPayments ?? [];
  const priorities = overview?.collectionPriorities ?? [];
  const agingBuckets = overview?.overdueAging ?? detailedAgingBuckets(priorities);
  const totalLoans = portfolio.reduce((sum, group) => sum + group.count, 0);
  const totalContracted = dash?.totalContracted ?? 0;
  const activeLoans = dash?.activeLoans ?? 0;
  const collected = dash?.collectionsToday ?? 0;
  const dueToday = getDueTodayTotal(upcoming);
  const installmentsDueToday = upcoming.filter(
    (item) => localDateKey(new Date(item.dueDate)) === localDateKey(new Date()),
  ).length;
  const overdue = agingBuckets.reduce((sum, item) => sum + item.amount, 0);
  const overdueLoans =
    overview?.overdueAging?.reduce((sum, item) => sum + item.count, 0) ?? priorities.length;
  const balance = dash?.portfolioBalance ?? 0;
  const portfolioPie = getPortfolioStatusData(portfolio);
  const highlightedRecentLoanId = selectedRecentLoanId ?? recentLoans?.data[2]?.id;
  const displayPie = portfolioPie.length
    ? portfolioPie
    : [{ name: 'Sin datos', value: 1, color: '#e8eef7' }];
  const today = new Date();
  const titleDate = today.toLocaleDateString('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const priorityItems = priorities.slice(0, 3);
  const upcomingInTab = upcoming
    .filter((item) => {
      const due = new Date(item.dueDate);
      const days = Math.round(
        (new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() -
          new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
          86400000,
      );
      return days >= 0 && days <= (priorityTab === 'Hoy' ? 0 : 7);
    })
    .slice(0, 3);
  const metrics = [
    {
      label: 'Saldo cartera',
      value: money(balance),
      detail: `de RD$${new Intl.NumberFormat('es-DO', { notation: 'compact', maximumFractionDigits: 1 }).format(totalContracted)} contratado`,
      icon: Wallet,
      color: '#419fec',
      iconTone: 'bg-white text-primary',
      blue: true,
      percent: totalContracted ? (balance / totalContracted) * 100 : 0,
    },
    {
      label: 'Préstamos activos',
      value: String(activeLoans),
      detail: `de ${totalLoans} en cartera`,
      icon: BriefcaseBusiness,
      color: '#8b5cf6',
      iconTone: 'bg-violet-100 text-violet-600',
      percent: totalLoans ? (activeLoans / totalLoans) * 100 : 0,
    },
    {
      label: 'Cobrado hoy',
      value: money(collected),
      detail: `meta ${money(dueToday)}`,
      icon: Banknote,
      color: '#10b981',
      iconTone: 'bg-emerald-100 text-emerald-600',
      percent: collected + dueToday ? (collected / (collected + dueToday)) * 100 : 0,
    },
    {
      label: 'Por cobrar hoy',
      value: money(dueToday),
      detail: `${installmentsDueToday} ${installmentsDueToday === 1 ? 'cuota pendiente' : 'cuotas pendientes'}`,
      icon: CalendarClock,
      color: '#f59e0b',
      iconTone: 'bg-amber-100 text-amber-600',
      percent: upcoming.length
        ? (installmentsDueToday / upcoming.length) * 100
        : 0,
    },
    {
      label: 'Total vencido',
      value: money(overdue),
      detail: `${overdueLoans} préstamos`,
      icon: ClipboardList,
      color: '#f43f5e',
      iconTone: 'bg-rose-100 text-rose-600',
      percent: totalLoans ? (overdueLoans / totalLoans) * 100 : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-page px-5 pb-10 pt-3 text-text-primary lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm capitalize text-text-secondary">{titleDate}</p>
          <h1 className="mt-1 text-[29px] font-bold leading-tight">
            Hola, {user?.name ?? 'Usuario'}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Aquí tienes un resumen de tu cartera hoy.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/reportes"
            className="flex h-11 items-center gap-2 rounded-xl bg-card px-5 text-sm font-bold shadow-card"
          >
            <FileBarChart2 className="h-4 w-4 text-primary" />
            Ver reportes
          </Link>
          <Link
            href="/prestamos/nuevo"
              className="flex h-11 items-center gap-2 rounded-xl bg-brand-sky px-5 text-sm font-bold text-white shadow-action hover:bg-primary"
          >
            <Plus className="h-4 w-4" />
            Nuevo préstamo
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-card ${metric.blue ? 'bg-brand-sky text-white shadow-[0_20px_25px_-5px_rgba(65,159,236,0.30),0_8px_10px_-6px_rgba(65,159,236,0.30)]' : 'bg-card transition-shadow hover:shadow-md'}`}
          >
            {metric.blue && (
              <>
                <span className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/10" />
                <span className="absolute -bottom-16 right-10 h-28 w-28 rounded-full bg-white/10" />
              </>
            )}
            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl ${metric.iconTone}`}
            >
              <metric.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="relative flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{metric.label}</p>
                <p className="mt-0.5 truncate text-lg font-bold tabular-nums">{metric.value}</p>
                <p
                  className={`truncate text-xs ${metric.blue ? 'text-white/80' : 'text-text-secondary'}`}
                >
                  {metric.detail}
                </p>
              </div>
              <CircleProgress value={metric.percent} color={metric.color} blue={metric.blue} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="mb-4 text-lg font-bold">Accesos rápidos</h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {visibleQuickLinks.map(({ label, href, icon: Icon, color }) => (
                <div
                  key={label}
                  className="flex min-w-0 flex-col items-center gap-2 text-center text-xs text-text-primary"
                >
                  <Link
                    href={href}
                    aria-label={label}
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-card transition-transform hover:-translate-y-0.5"
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${color}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                  <span>{label}</span>
                </div>
              ))}
              <Dialog.Root>
                <div className="flex flex-col items-center gap-2 text-center text-xs text-text-primary">
                  <Dialog.Trigger
                    className="flex h-16 w-16 items-center justify-center rounded-[22px] border-2 border-dashed border-[#d8e1ef] text-text-secondary hover:border-primary hover:text-primary"
                    aria-label="Personalizar accesos rápidos"
                  >
                    <Plus className="h-5 w-5" />
                  </Dialog.Trigger>
                  Agregar
                </div>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 z-50 bg-[#1d2b45]/40" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-card p-6 shadow-modal">
                    <Dialog.Title className="text-lg font-bold text-text-primary">
                      Accesos rápidos
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-text-secondary">
                      Elige los accesos que quieres ver en Inicio.
                    </Dialog.Description>
                    <div className="mt-5 space-y-2">
                      {optionalQuickLinks.map((item) => (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => toggleQuickLink(item.href)}
                          className="flex w-full items-center justify-between rounded-xl border border-border-soft px-4 py-3 text-left text-sm hover:bg-page"
                        >
                          <span>{item.label}</span>
                          <span className="text-primary">
                            {extraQuickLinks.includes(item.href) ? 'Quitar' : 'Agregar'}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Dialog.Close className="mt-5 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white">
                      Listo
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(275px,0.85fr)]">
            <Panel className="min-w-0 p-6">
              <div id="ingresos" className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <Heading
                  title="Ingresos diarios"
                  subtitle="Capital, interés y mora · últimos 30 días"
                />
                <div className="flex rounded-full bg-page p-1">
                  {([7, 14, 30] as const).map((days) => (
                    <button
                      key={days}
                      onClick={() => setPeriod(days)}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${period === days ? 'bg-card text-primary shadow-card' : 'text-text-secondary'}`}
                      type="button"
                    >
                      {days}D
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3 flex gap-4 text-xs text-text-secondary">
                <span>
                  <i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#3e96e7]" /> Capital
                </span>
                <span>
                  <i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#735ee9]" /> Interés
                </span>
                <span>
                  <i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ef5d68]" /> Mora
                </span>
              </div>
              <div className="h-[280px] min-w-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                  initialDimension={{ width: 600, height: 280 }}
                >
                  <AreaChart
                    data={dailyIncome}
                    margin={{ top: 10, right: 0, left: -42, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="incomeCapital" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3e96e7" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#3e96e7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#e9eff8" strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#71819b', fontSize: 11 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value, name) => [
                        money(Number(value)),
                        name === 'capital' ? 'Capital' : name === 'interest' ? 'Interés' : 'Mora',
                      ]}
                    />
                    <Area
                      dataKey="capital"
                      type="monotone"
                      stroke="#3e96e7"
                      strokeWidth={2.5}
                      fill="url(#incomeCapital)"
                    />
                    <Area
                      dataKey="interest"
                      type="monotone"
                      stroke="#735ee9"
                      strokeWidth={2}
                      fill="none"
                    />
                    <Area
                      dataKey="lateFee"
                      type="monotone"
                      stroke="#ef5d68"
                      strokeWidth={2}
                      fill="none"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel className="p-6">
              <Heading title="Estado de cartera" subtitle="Distribución por estatus" />
              <div className="relative my-4 h-[200px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                  initialDimension={{ width: 320, height: 200 }}
                >
                  <PieChart>
                    <Pie
                      data={displayPie}
                      dataKey="value"
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={4}
                      cornerRadius={8}
                      strokeWidth={0}
                    >
                      {displayPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-text-secondary">Total</span>
                  <strong className="text-3xl font-extrabold text-text-primary">{totalLoans}</strong>
                </div>
              </div>
              <div className="space-y-2">
                {portfolioPie.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center gap-3 rounded-xl bg-surface-muted-ui/60 px-3 py-2 text-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: entry.color }}
                    />
                    <span className="flex-1 font-semibold">{entry.name}</span>
                    <span className="text-xs text-text-secondary">
                      {totalLoans ? Math.round((entry.value / totalLoans) * 100) : 0}%
                    </span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <Heading title="Préstamos recientes" />
              <Link href="/prestamos" className="text-sm font-semibold text-primary">
                Ver todos
              </Link>
            </div>
            <Panel className="overflow-x-auto">
              <table className="w-full min-w-[690px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[31%]" />
                  <col className="w-[17%]" />
                  <col className="w-[17%]" />
                  <col className="w-[16%]" />
                  <col className="w-[14%]" />
                  <col className="w-[5%]" />
                </colgroup>
                <thead>
                  <tr className="text-xs font-bold text-text-secondary">
                    <th className="px-5 py-4 font-bold">Cliente</th>
                    <th className="px-3 py-4 font-bold">Monto</th>
                    <th className="px-3 py-4 font-bold">Balance</th>
                    <th className="px-3 py-4 font-bold">Próximo pago</th>
                    <th className="px-3 py-4 font-bold">Estado</th>
                    <th className="px-3 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {(recentLoans?.data ?? []).map((loan) => (
                    <tr
                      key={loan.id}
                      className={`cursor-pointer transition-colors ${loan.id === highlightedRecentLoanId ? 'bg-primary-soft' : 'hover:bg-surface-muted-ui/60'} focus-visible:bg-primary-soft focus-visible:outline-primary`}
                      role="link"
                      tabIndex={0}
                      aria-label={`Abrir préstamo ${loan.loanNumber} de ${loan.client.firstName} ${loan.client.lastName}`}
                      onMouseEnter={() => setSelectedRecentLoanId(loan.id)}
                      onMouseLeave={() => setSelectedRecentLoanId(null)}
                      onClick={() => router.push(`/prestamos/${loan.id}`)}
                      onKeyDown={(event) => {
                        if (
                          event.target === event.currentTarget &&
                          (event.key === 'Enter' || event.key === ' ')
                        ) {
                          event.preventDefault();
                          router.push(`/prestamos/${loan.id}`);
                        }
                      }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 bg-cover bg-center text-xs font-bold text-violet-700"
                            style={recentClientPhotos[loan.clientId] ? { backgroundImage: `url(${recentClientPhotos[loan.clientId]})` } : undefined}
                            aria-hidden="true"
                          >
                            {!recentClientPhotos[loan.clientId] && (
                              <>{loan.client.firstName.charAt(0)}{loan.client.lastName.charAt(0)}</>
                            )}
                          </span>
                          <div>
                            <Link
                              href={`/prestamos/${loan.id}`}
                              className={`block truncate font-bold ${loan.id === highlightedRecentLoanId ? 'text-primary' : 'text-text-primary'}`}
                            >
                              {loan.client.firstName} {loan.client.lastName}
                            </Link>
                            <p className="text-xs text-text-secondary">
                              Préstamo #{loan.loanNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className={`px-3 py-3 ${loan.id === highlightedRecentLoanId ? 'text-primary' : 'text-text-secondary'}`}>{money(loan.principal)}</td>
                      <td className={`px-3 py-3 font-bold ${loan.id === highlightedRecentLoanId ? 'text-primary' : ''}`}>{money(loan.balance)}</td>
                      <td className={`px-3 py-3 ${loan.id === highlightedRecentLoanId ? 'text-primary' : 'text-text-secondary'}`}>
                        {recentLoanNextPayment(loan)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${getLoanStatusBadgeClass(recentLoanStatusLabel(loan))}`}
                        >
                          {recentLoanStatusLabel(loan)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <details
                          className="group relative inline-block"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <summary
                            aria-label={`Acciones del préstamo ${loan.loanNumber}`}
                            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-text-secondary hover:bg-primary-soft"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </summary>
                          <div className="absolute bottom-full right-0 z-20 mb-1 w-40 rounded-xl border border-border-soft bg-card p-1 text-left shadow-card">
                            <Link
                              href={`/prestamos/${loan.id}`}
                              className="block rounded-lg px-3 py-2 text-xs hover:bg-page"
                            >
                              Ver detalle
                            </Link>
                            {loan.status !== 'PAID' && (
                              <Link
                                href={`/prestamos/cobrar?loanId=${loan.id}`}
                                className="block rounded-lg px-3 py-2 text-xs hover:bg-page"
                              >
                                Registrar pago
                              </Link>
                            )}
                            <Link
                              href={`/prestamos/${loan.id}/editar`}
                              className="block rounded-lg px-3 py-2 text-xs hover:bg-page"
                            >
                              Editar préstamo
                            </Link>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                  {recentLoans?.data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-text-secondary">
                        Todavía no hay préstamos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Panel>
          </section>

          <Panel className="p-6">
            <div className="mb-5 flex items-start justify-between">
              <Heading title="Mora por antigüedad" subtitle="Monto vencido por días de atraso" />
              <div className="text-right text-xs text-text-secondary">
                Total vencido
                <strong className="block text-base text-[#ed405d]">{money(overdue)}</strong>
              </div>
            </div>
            <div className="h-[230px] min-w-0">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={0}
                initialDimension={{ width: 700, height: 230 }}
              >
                <BarChart data={agingBuckets} margin={{ top: 5, right: 0, left: -40, bottom: 0 }}>
                  <CartesianGrid stroke="#e9eff8" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#71819b', fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip formatter={(value) => money(Number(value))} />
                  <Bar dataKey="amount" radius={[11, 11, 0, 0]} maxBarSize={44}>
                    {agingBuckets.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={
                          index === 5
                            ? '#ef5d68'
                            : ['#a8d5fb', '#9accf6', '#84bff2', '#a0cef8', '#67adeb'][index]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

        </div>

        <aside className="min-w-0">
          <Panel className="p-6">
            <div className="flex items-start justify-between">
              <Heading title="Cobros prioritarios" subtitle="Casos ordenados por urgencia" />
              <span className="rounded-full bg-[#ffe6ec] px-2.5 py-1 text-xs font-bold text-[#d42d52]">
                {overdueLoans}
              </span>
            </div>
            <div className="my-5 flex gap-1 text-xs font-semibold">
              {(['Vencidos', 'Hoy', 'Semana'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`rounded-full px-3 py-1.5 ${priorityTab === tab ? 'bg-[#e6f2ff] text-[#2386d9]' : 'text-text-secondary'}`}
                  onClick={() => setPriorityTab(tab)}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="space-y-5">
              {priorityTab === 'Vencidos' &&
                priorityItems.map((item) => (
                  <div
                    key={item.loanId}
                    className="relative border-l border-border-soft pl-5 before:absolute before:-left-[7px] before:top-1 before:h-3 before:w-3 before:rounded-full before:bg-[#ee4765]"
                  >
                    <div className="flex justify-between gap-2 text-sm">
                      <Link href={`/prestamos/${item.loanId}`} className="font-semibold">
                        {item.clientName}
                      </Link>
                      <strong className="whitespace-nowrap text-[#e73357]">
                        {money(item.overdueAmount)}
                      </strong>
                    </div>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      Préstamo #{item.loanNumber} · {item.daysOverdue} días de atraso
                    </p>
                    <div className="mt-2 flex items-center gap-2 rounded-full bg-page px-3 py-2 text-xs text-text-primary">
                      <span className="truncate">{item.suggestedAction}</span>
                      {item.phone && (
                        <a
                          aria-label={`Llamar a ${item.clientName}`}
                          href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}
                          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-card"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Link
                        aria-label={`Abrir préstamo ${item.loanNumber}`}
                        href={`/prestamos/${item.loanId}`}
                        className="flex h-7 w-5 shrink-0 items-center justify-center text-text-secondary"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              {priorityTab !== 'Vencidos' &&
                upcomingInTab.map((item) => (
                  <div
                    key={item.id}
                    className="relative border-l border-border-soft pl-5 before:absolute before:-left-[7px] before:top-1 before:h-3 before:w-3 before:rounded-full before:bg-[#3e96e7]"
                  >
                    <div className="flex justify-between gap-2 text-sm">
                      <Link href={`/prestamos/${item.loanId}`} className="font-semibold">
                        {item.clientName}
                      </Link>
                      <strong className="whitespace-nowrap text-primary">
                        {money(item.amount)}
                      </strong>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                      Vence{' '}
                      {formatShortDate(item.dueDate)}
                    </p>
                    <div className="mt-2 flex items-center justify-between rounded-full bg-page px-3 py-2 text-xs text-text-primary">
                      <span>Ver préstamo</span>
                      {item.phone && (
                        <a
                          aria-label={`Llamar a ${item.clientName}`}
                          href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}
                          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary shadow-card"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Link
                        aria-label={`Abrir préstamo de ${item.clientName}`}
                        href={`/prestamos/${item.loanId}`}
                      >
                        <ChevronRight className="h-4 w-4 text-text-secondary" />
                      </Link>
                    </div>
                  </div>
                ))}
              {(priorityTab === 'Vencidos' ? priorityItems.length : upcomingInTab.length) === 0 && (
                <p className="py-6 text-sm text-text-secondary">No hay cobros en este grupo.</p>
              )}
            </div>
            <div className="mt-6 border-t border-border-soft pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold">Actividad reciente</h3>
                <Link href="/actividad" className="text-xs font-semibold text-primary">
                  Ver todo
                </Link>
              </div>
              <div className="space-y-4">
                {(audit ?? [])
                  .slice(0, 4)
                  .map(toDashboardAuditRow)
                  .map((row) => (
                    <div key={row.id} className="flex gap-3 text-xs">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{row.action}</p>
                        <p className="truncate text-text-secondary">
                          {row.actor} · {row.reference}
                        </p>
                      </div>
                      <time className="shrink-0 text-primary" dateTime={row.createdAt}>
                        {formatRelativeDate(row.createdAt)}
                      </time>
                    </div>
                  ))}
                {(audit ?? []).length === 0 && (
                  <p className="text-xs text-text-secondary">No hay actividad reciente.</p>
                )}
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
