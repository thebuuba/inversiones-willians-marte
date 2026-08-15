'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useClientCache } from '@/lib/use-client-cache';
import { getStaggerDelay } from '@/lib/animation';
import { loanStatusVisuals } from '@/lib/loan-status-visuals';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarClock,
  ChevronRight,
  DollarSign,
  Plus,
  Wallet,
} from 'lucide-react';
import {
  getAudit,
  getDashboardOverview,
  type CollectionPriority,
  type InvestmentPriority,
  type PortfolioGroup,
  type UpcomingPayment,
} from '@/lib/api/dashboard';
import { formatDop } from '@/lib/currency';
import { investmentPaymentStatusVisuals } from '@/lib/investment-payment-status';
import { toDashboardAuditRow, type AuditTone } from './dashboard-audit';

function formatCurrency(n: number): string {
  return formatDop(n, { decimals: 2 });
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDueTodayTotal(payments: UpcomingPayment[], now = new Date()): number {
  const todayKey = getLocalDateKey(now);
  return payments.reduce((sum, payment) => {
    const due = new Date(payment.dueDate);
    return getLocalDateKey(due) === todayKey ? sum + payment.amount : sum;
  }, 0);
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
    if (!bucket) continue;
    bucket.amount += item.overdueAmount;
    bucket.count += 1;
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    amount: bucket.amount,
    count: bucket.count,
  }));
}

export function getInvestmentDueLabel(item: InvestmentPriority): string {
  if (item.paymentStatus === 'UPCOMING') {
    return item.daysUntilDue === 1 ? 'En 1 día' : `En ${item.daysUntilDue} días`;
  }
  if (item.daysUntilDue === 0) return 'Vence hoy';
  const elapsedDays = Math.abs(item.daysUntilDue);
  if (item.paymentStatus === 'PENDING') {
    return elapsedDays === 1 ? 'Pendiente hace 1 día' : `Pendiente hace ${elapsedDays} días`;
  }
  return elapsedDays === 1 ? '1 día de atraso' : `${elapsedDays} días de atraso`;
}

const today = new Date().toLocaleDateString('es-DO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export const portfolioStatusConfig: Record<string, { label: string; color: string }> = {
  CURRENT: { label: 'A tiempo', color: loanStatusVisuals.CURRENT.color },
  PENDING: { label: 'Pendientes', color: loanStatusVisuals.PENDING.color },
  LATE: { label: 'Atrasados', color: loanStatusVisuals.LATE.color },
  EXPIRED: { label: 'Vencidos', color: loanStatusVisuals.EXPIRED.color },
  PAID: { label: 'Pagados', color: loanStatusVisuals.PAID.color },
  WRITTEN_OFF: { label: 'Castigados', color: loanStatusVisuals.WRITTEN_OFF.color },
};

const portfolioStatusOrder = ['CURRENT', 'PENDING', 'LATE', 'EXPIRED', 'PAID', 'WRITTEN_OFF'];

export function getPortfolioStatusData(portfolio: PortfolioGroup[]) {
  return [...portfolio]
    .sort((a, b) => {
      const aIndex = portfolioStatusOrder.indexOf(a.status);
      const bIndex = portfolioStatusOrder.indexOf(b.status);
      return (
        (aIndex === -1 ? portfolioStatusOrder.length : aIndex) -
        (bIndex === -1 ? portfolioStatusOrder.length : bIndex)
      );
    })
    .map((group) => ({
      name: portfolioStatusConfig[group.status]?.label ?? group.status,
      value: group.count,
      color: portfolioStatusConfig[group.status]?.color ?? '#ccc',
    }));
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: getStaggerDelay(index, 0.06) },
  }),
};

async function getEmptyAudit() {
  return [];
}

function Card({
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
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`rounded-panel border border-border-soft bg-card shadow-card ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold leading-tight text-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

export function DashboardHome() {
  const { user } = useAuth();
  const { data: overview } = useClientCache('dashboard-overview', getDashboardOverview, 60_000);
  const { data: audit } = useClientCache(
    user?.role === 'ADMIN' ? 'audit' : 'audit-unavailable',
    user?.role === 'ADMIN' ? getAudit : getEmptyAudit,
    60_000,
  );
  const dash = overview?.dashboard;
  const portfolio = overview?.portfolio;
  const dailyIncome = overview?.dailyIncome ?? [];
  const upcomingPayments = overview?.upcomingPayments;
  const collectionPriorities = overview?.collectionPriorities ?? [];
  const investmentPriorities = overview?.investmentPriorities ?? [];

  const activeLoans = dash?.activeLoans ?? 0;
  const collectionsToday = dash?.collectionsToday ?? 0;
  const portfolioBalance = dash?.portfolioBalance ?? 0;
  const dueToday = getDueTodayTotal(upcomingPayments ?? []);
  const overdueTotal = collectionPriorities.reduce((sum, item) => sum + item.overdueAmount, 0);
  const agingBuckets = getAgingBuckets(collectionPriorities);

  const metricCards = [
    {
      label: 'Préstamos activos',
      value: String(activeLoans),
      icon: BriefcaseBusiness,
      tone: 'bg-primary-soft text-primary',
    },
    {
      label: 'Cobrado hoy',
      value: formatCurrency(collectionsToday),
      icon: DollarSign,
      tone: 'bg-state-warning-bg text-state-warning',
    },
    {
      label: 'Por cobrar hoy',
      value: formatCurrency(dueToday),
      icon: CalendarClock,
      tone: 'bg-primary-soft text-primary',
    },
    {
      label: 'Total vencido',
      value: formatCurrency(overdueTotal),
      icon: AlertTriangle,
      tone: 'bg-state-danger-bg text-state-danger',
    },
    {
      label: 'Saldo cartera',
      value: formatCurrency(portfolioBalance),
      icon: Wallet,
      tone: 'bg-state-info-bg text-state-info',
    },
  ];

  const portfolioSafe = portfolio ?? [];
  const portfolioPie =
    portfolioSafe.length > 0
      ? getPortfolioStatusData(portfolioSafe)
      : [{ name: 'Sin datos', value: 1, color: '#E0E0E0' }];

  const portfolioTotal = portfolioPie.reduce((s, e) => s + e.value, 0);

  const auditSafe = audit ?? [];
  const auditRows = auditSafe.slice(0, 4).map(toDashboardAuditRow);

  return (
    <div className="min-h-screen bg-page p-5 font-sans text-text-primary">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 2xl:flex-row 2xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-sm text-text-secondary">{today}</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-text-primary">
            Hola, {user?.name ?? 'Usuario'} 👋
          </h1>
          <p className="mt-1.5 text-base text-text-secondary">
            Aquí tienes un resumen de tu cartera hoy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-11 rounded-full border border-primary-border bg-card px-5 text-sm font-bold text-primary-accent shadow-card">
            Ver reportes
          </button>
          <Link
            className="flex h-11 items-center gap-2 rounded-full bg-primary-accent px-5 text-sm font-bold text-white shadow-action"
            href="/prestamos/nuevo"
          >
            <Plus className="h-4 w-4" />
            Nuevo préstamo
          </Link>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {metricCards.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-panel bg-card p-4 shadow-card border border-border-soft sm:p-6"
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14 ${k.tone}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-muted">{k.label}</p>
                  <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">{k.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6" index={4}>
          <SectionHeader
            title="Ingresos diarios"
            subtitle="Capital, interés y mora · últimos 30 días"
            right={
              <div className="hidden items-center gap-4 text-xs font-semibold text-text-secondary sm:flex">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary-accent" />
                  Capital
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-state-info-dot" />
                  Interés
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-state-danger-dot" />
                  Mora
                </span>
              </div>
            }
          />
          <div className="h-[250px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 720, height: 250 }}
            >
              <AreaChart data={dailyIncome} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="capitalGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#5A9A7A" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#5A9A7A" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="interestGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#5AAFC7" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#5AAFC7" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="var(--border-strong)"
                  strokeDasharray="4 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={62}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  tickFormatter={(value) =>
                    Number(value).toLocaleString('es-DO', { notation: 'compact' })
                  }
                />
                <Tooltip
                  cursor={{ stroke: 'var(--border-strong)', strokeDasharray: '4 6' }}
                  contentStyle={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 16,
                    color: 'var(--text-primary)',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'capital' ? 'Capital' : name === 'interest' ? 'Interés' : 'Mora',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="capital"
                  stroke="#5A9A7A"
                  strokeWidth={3}
                  fill="url(#capitalGradient)"
                  dot={false}
                  isAnimationActive
                  animationDuration={1200}
                />
                <Area
                  type="monotone"
                  dataKey="interest"
                  stroke="#5AAFC7"
                  strokeWidth={2.5}
                  fill="url(#interestGradient)"
                  dot={false}
                  isAnimationActive
                  animationDuration={1100}
                />
                <Line
                  type="monotone"
                  dataKey="lateFee"
                  stroke="#E67C73"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6" index={5}>
          <SectionHeader title="Estado de cartera" subtitle="Distribución por estatus" />
          <div className="relative mx-auto h-[184px] min-w-0 max-w-[196px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 196, height: 184 }}
            >
              <PieChart>
                <Pie
                  data={portfolioPie}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  startAngle={0}
                  endAngle={360}
                  isAnimationActive
                  animationDuration={1200}
                >
                  {portfolioPie.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      stroke="var(--card)"
                      strokeWidth={4}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm text-text-secondary">Total</span>
              <span className="text-2xl font-bold text-text-primary">{portfolioTotal}</span>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {portfolioPie.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between text-sm font-semibold text-primary-accent"
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}
                </span>
                <span className="font-bold text-text-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6" index={6}>
          <SectionHeader title="Mora por antigüedad" subtitle="Monto vencido por días de atraso" />
          <div className="h-[230px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 720, height: 230 }}
            >
              <BarChart data={agingBuckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  stroke="var(--border-strong)"
                  strokeDasharray="4 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: 'var(--surface-muted-ui)' }}
                  contentStyle={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: 16,
                    color: 'var(--text-primary)',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                  formatter={(value, name, props) => [
                    name === 'amount' ? formatCurrency(Number(value)) : value,
                    name === 'amount' ? `${props.payload.count} préstamos` : name,
                  ]}
                />
                <Bar
                  dataKey="amount"
                  fill="#F7A184"
                  radius={[7, 7, 0, 0]}
                  barSize={44}
                  animationDuration={1100}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6" index={7}>
          <SectionHeader
            title="Cobros prioritarios"
            subtitle="Casos ordenados por urgencia"
            right={
              <span className="rounded-full bg-state-danger-bg px-2.5 py-1 text-sm font-bold text-state-danger">
                {collectionPriorities.length}
              </span>
            }
          />
          <div className="divide-y divide-border-soft">
            {collectionPriorities.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-secondary">
                No hay préstamos vencidos
              </p>
            ) : (
              collectionPriorities.slice(0, 4).map((item) => (
                <Link
                  key={item.loanId}
                  className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  href={`/prestamos/${item.loanId}`}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${priorityDots[item.level]}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-text-primary">
                        {item.clientName}
                      </p>
                      <span className="shrink-0 text-xs font-bold text-state-danger">
                        {formatCurrency(item.overdueAmount)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">
                      Préstamo #{item.loanNumber} · {item.reasons[0]}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-primary-accent">
                      {item.suggestedAction}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-5" index={8}>
          <div className="mb-2">
            <h2 className="text-base font-bold text-text-primary">Auditoría reciente</h2>
            <p className="mt-0.5 text-xs text-text-secondary">Últimos movimientos del sistema</p>
          </div>
          <div className="divide-y divide-border-soft">
            {auditRows.length > 0 ? (
              auditRows.map((row, index) => {
                return (
                  <article
                    key={row.id ?? `audit-${index}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${auditToneDots[row.tone]}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm leading-5 text-text-secondary">
                        <span className="font-bold text-text-primary">{row.actor}</span>{' '}
                        {row.action}
                      </p>
                    </div>
                    <div className="col-start-2 min-w-0 sm:col-start-2">
                      {row.loanHref ? (
                        <Link
                          className="inline-flex max-w-full items-center gap-1 text-xs font-bold text-primary-accent transition hover:text-primary focus-visible:rounded-sm"
                          href={row.loanHref}
                        >
                          <span className="truncate">{row.reference}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="block truncate text-xs font-medium text-text-secondary">
                          {row.reference}
                        </span>
                      )}
                    </div>
                    <time
                      className="col-start-2 text-xs font-medium text-text-secondary sm:col-start-auto sm:row-start-1"
                      dateTime={row.createdAt}
                    >
                      {timeAgo(row.createdAt)}
                    </time>
                  </article>
                );
              })
            ) : (
              <div className="rounded-control-comfortable bg-surface-subtle px-4 py-5 text-center">
                <p className="text-sm font-bold text-text-primary">
                  {user?.role === 'ADMIN' ? 'No hay actividad reciente' : 'Auditoría restringida'}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6" index={9}>
          <SectionHeader title="Próximos cobros" subtitle="Agenda de los próximos días" />
          <div className="space-y-3">
            {(upcomingPayments ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-text-secondary">No hay cobros próximos</p>
            ) : (
              (upcomingPayments ?? []).map((payment) => {
                const due = new Date(payment.dueDate);
                const today2 = new Date();
                today2.setHours(0, 0, 0, 0);
                const diffDays = Math.floor((due.getTime() - today2.getTime()) / 86400000);
                let tag = due.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
                let warm = false;
                if (diffDays === 0) {
                  tag = 'HOY';
                  warm = true;
                } else if (diffDays === 1) {
                  tag = 'MAÑ';
                  warm = true;
                }

                return (
                  <div
                    key={payment.id}
                    className={`flex items-center gap-3 rounded-[16px] border p-3 ${warm ? 'border-state-danger-dot bg-state-danger-bg' : 'border-primary-border bg-surface-muted-ui'}`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-xs font-bold ${warm ? 'bg-state-danger text-white' : 'bg-card text-primary-accent'}`}
                    >
                      {tag}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text-primary">
                        {payment.clientName}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {due.toLocaleDateString('es-DO', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-text-primary">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                );
              })
            )}
            <button className="mt-3 h-11 w-full rounded-[16px] bg-surface-muted-ui text-sm font-bold text-primary-accent">
              Ver agenda completa
            </button>
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-6" index={10}>
        <SectionHeader
          title="Orden de pagos de inversiones"
          subtitle="Inversiones que requieren atención, ordenadas por urgencia"
          right={
            <span className="rounded-full bg-state-info-bg px-2.5 py-1 text-sm font-bold text-state-info">
              {investmentPriorities.length}
            </span>
          }
        />
        <div className="divide-y divide-border-soft">
          {investmentPriorities.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-secondary">
              No hay pagos de inversiones próximos o vencidos
            </p>
          ) : (
            investmentPriorities.map((item) => {
              const statusVisual = investmentPaymentStatusVisuals[item.paymentStatus];
              return (
                <Link
                  key={item.investmentId}
                  className="group grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 transition-colors hover:bg-surface-subtle focus-visible:rounded-control-comfortable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent sm:grid-cols-[minmax(0,1.4fr)_minmax(150px,0.8fr)_auto_auto_auto] sm:px-3"
                  href={`/inversiones/${item.investmentId}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-text-primary">
                      {item.investorName}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-text-secondary">
                      {item.investmentCode}
                    </p>
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <p className="text-xs font-semibold text-text-secondary">
                      {new Date(item.dueDate).toLocaleDateString('es-DO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-text-primary">
                      {getInvestmentDueLabel(item)}
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-sm font-bold tabular-nums text-text-primary md:block">
                    {formatCurrency(item.amount)}
                  </span>
                  <span
                    className={`inline-flex min-h-7 min-w-[88px] items-center justify-center rounded-[5px] px-2.5 py-1 text-[11px] font-bold uppercase ${statusVisual.className}`}
                  >
                    {statusVisual.label}
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="hidden h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 sm:block"
                  />
                  <p className="col-span-2 text-xs font-semibold text-text-secondary sm:hidden">
                    {getInvestmentDueLabel(item)} · {formatCurrency(item.amount)}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

function timeAgo(dateString: string): string {
  const timestamp = new Date(dateString).getTime();
  if (!Number.isFinite(timestamp)) return 'Fecha desconocida';
  const diff = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

const auditToneDots: Record<AuditTone, string> = {
  success: 'bg-state-success-dot',
  warning: 'bg-state-warning-dot',
  danger: 'bg-state-danger-dot',
  info: 'bg-state-info-dot',
  neutral: 'bg-state-neutral-dot',
};

const priorityDots = {
  URGENT: 'bg-state-danger-dot',
  HIGH: 'bg-state-warning-dot',
  MEDIUM: 'bg-state-info-dot',
} as const;
