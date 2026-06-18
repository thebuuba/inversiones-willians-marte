'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useClientCache } from '@/lib/use-client-cache';
import { getStaggerDelay } from '@/lib/animation';
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
} from 'recharts';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  DollarSign,
  Edit3,
  FileText,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import {
  getDashboard,
  getPortfolio,
  getAudit,
  getMonthlyCollections,
  getWeeklyMovement,
  getUpcomingPayments,
} from '@/lib/api/dashboard';
import { formatDop } from '@/lib/currency';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `RD$${(n / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`;
  if (n >= 1_000) return `RD$${(n / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
  return formatDop(n, { decimals: 2 });
}

function formatCurrency(n: number): string {
  return formatDop(n, { decimals: 2 });
}

const today = new Date().toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' });

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Al día', color: '#7CC99B' },
  PAID: { label: 'Pagados', color: '#A9D9C6' },
  OVERDUE: { label: 'Vencidos', color: '#F7C49E' },
  RESTRUCTURED: { label: 'Reestructurados', color: '#A9D8F2' },
  WRITTEN_OFF: { label: 'Castigados', color: '#E0E0E0' },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: getStaggerDelay(index, 0.06) },
  }),
};

function Card({ children, className = '', index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <motion.section
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`rounded-2xl border border-neutral-100 bg-white shadow-sm ${className}`}
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
        <h2 className="text-lg font-bold leading-tight text-[#173D2C]">{title}</h2>
        <p className="mt-1 text-sm text-[#5C6D63]">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

export function DashboardHome() {
  const { user } = useAuth();
  const { data: dash } = useClientCache('dashboard', getDashboard);
  const { data: portfolio } = useClientCache('portfolio', getPortfolio);
  const { data: audit } = useClientCache('audit', getAudit);
  const { data: monthlyCollections } = useClientCache('monthlyCollections', getMonthlyCollections);
  const { data: weeklyMovement } = useClientCache('weeklyMovement', getWeeklyMovement);
  const { data: upcomingPayments } = useClientCache('upcomingPayments', getUpcomingPayments);

  const activeLoans = dash?.activeLoans ?? 0;
  const totalClients = dash?.totalClients ?? 0;
  const collectionsToday = dash?.collectionsToday ?? 0;
  const portfolioBalance = dash?.portfolioBalance ?? 0;
  const overdueLoans = dash?.overdueLoans ?? 0;

  const metricCards = [
    { label: 'Préstamos activos', value: String(activeLoans), icon: BriefcaseBusiness, accent: '#eaf5ed', color: '#2f7654' },
    { label: 'Clientes registrados', value: String(totalClients), icon: Users, accent: '#fde4d4', color: '#9f3f25' },
    { label: 'Cobrado hoy', value: formatCurrency(collectionsToday), icon: DollarSign, accent: '#fef3c7', color: '#7a5a0a' },
    { label: 'Saldo cartera', value: formatCompact(portfolioBalance), icon: Wallet, accent: '#dbeafe', color: '#1d4ed8' },
  ];

  const portfolioSafe = portfolio ?? [];
  const portfolioPie = portfolioSafe.length > 0
    ? portfolioSafe.map((g) => ({
        name: statusConfig[g.status]?.label ?? g.status,
        value: g.count,
        color: statusConfig[g.status]?.color ?? '#ccc',
      }))
    : [{ name: 'Sin datos', value: 1, color: '#E0E0E0' }];

  const portfolioTotal = portfolioPie.reduce((s, e) => s + e.value, 0);

  const alerts = [
    overdueLoans > 0 && {
      title: `${overdueLoans} préstamos vencidos`,
      detail: 'Requieren atención inmediata',
      action: 'Ver lista →',
      icon: AlertTriangle,
      bg: '#FFF7EF',
      border: '#F7D6BD',
      text: '#9F3F25',
    },
    collectionsToday > 0 && {
      title: `${formatCurrency(collectionsToday)} cobrados hoy`,
      detail: 'Pagos registrados el día de hoy',
      action: 'Ver cobros →',
      icon: Clock3,
      bg: '#FFFBEA',
      border: '#F7E7AE',
      text: '#7A5A0A',
    },
    {
      title: 'Sistema operativo',
      detail: 'Todo funcionando correctamente',
      action: '',
      icon: ShieldCheck,
      bg: '#F3FAF6',
      border: '#DDEBE3',
      text: '#2F7654',
    },
  ].filter(Boolean) as Array<{ title: string; detail: string; action: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; bg: string; border: string; text: string }>;

  const auditSafe = audit ?? [];
  const auditRows = auditSafe.map((entry) => ({
    id: entry.id,
    name: entry.performedByName ?? 'Sistema',
    action: entry.action,
    ref: entry.entity,
    amount: entry.details ?? '',
    time: timeAgo(entry.createdAt),
    icon: actionIcon(entry.action),
    bg: actionBg(entry.action),
    color: '#2F7654',
  }));

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-5 font-sans text-[#173D2C]">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 2xl:flex-row 2xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#DDEBE3] bg-[#E7F4EC] px-3.5 py-1.5 text-xs font-bold text-[#2F7654]">
              <span className="h-2 w-2 rounded-full bg-[#2F7654]" />
              En línea
            </span>
            <span className="text-sm text-[#5C6D63]">{today}</span>
          </div>
          <h1 className="text-[28px] font-bold leading-tight text-[#173D2C]">
            Hola, {user?.name ?? 'Usuario'} 👋
          </h1>
          <p className="mt-1.5 text-base text-[#5C6D63]">Aquí tienes un resumen de tu cartera hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-11 rounded-full border border-[#DDEBE3] bg-white px-5 text-sm font-bold text-[#2F7654] shadow-sm">
            Ver reportes
          </button>
          <Link
            className="flex h-11 items-center gap-2 rounded-full bg-[#2f7654] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(90,154,122,0.22)]"
            href="/prestamos/nuevo"
          >
            <Plus className="h-4 w-4" />
            Nuevo préstamo
          </Link>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {metricCards.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-2xl bg-white p-6 shadow-sm border border-neutral-100">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: k.accent, color: k.color }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-500">{k.label}</p>
                  <p className="mt-1 text-xl font-bold text-neutral-900">{k.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6" index={4}>
          <SectionHeader title="Cobros mensuales" subtitle="Ingresos vs proyección · últimos 9 meses" />
          <div className="h-[250px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 720, height: 250 }}>
              <AreaChart data={monthlyCollections ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cobradoGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#7CC99B" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#7CC99B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#DDEBE3" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6F7280', fontSize: 13 }} dy={10} />
                <Tooltip
                  cursor={{ stroke: '#DDEBE3', strokeDasharray: '4 6' }}
                  contentStyle={{ border: '1px solid #DDEBE3', borderRadius: 16, boxShadow: '0 12px 28px rgba(40,92,67,0.08)' }}
                />
                <Area type="monotone" dataKey="collected" stroke="#7CC99B" strokeWidth={3} fill="url(#cobradoGradient)" isAnimationActive animationDuration={1400} />
                <Line type="monotone" dataKey="expected" stroke="#B8E0CF" strokeWidth={3} strokeDasharray="6 7" dot={false} isAnimationActive animationDuration={1300} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6" index={5}>
          <SectionHeader title="Estado de cartera" subtitle="Distribución por estatus" />
          <div className="relative mx-auto h-[184px] min-w-0 max-w-[196px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 196, height: 184 }}>
              <PieChart>
                <Pie data={portfolioPie} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2} startAngle={0} endAngle={360} isAnimationActive animationDuration={1200}>
                  {portfolioPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#FFFFFF" strokeWidth={4} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm text-[#5C6D63]">Total</span>
              <span className="text-[24px] font-bold text-[#173D2C]">{portfolioTotal}</span>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {portfolioPie.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-sm font-semibold text-[#2F7654]">
                <span className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-bold text-[#173D2C]">{entry.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6" index={6}>
          <SectionHeader title="Movimiento semanal" subtitle="Préstamos abiertos vs cerrados" />
          <div className="h-[230px] min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 720, height: 230 }}>
              <BarChart data={weeklyMovement ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#DDEBE3" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6F7280', fontSize: 13 }} dy={10} />
                <Tooltip cursor={{ fill: 'rgba(231,244,236,0.45)' }} contentStyle={{ border: '1px solid #DDEBE3', borderRadius: 16 }} />
                <Bar dataKey="nuevos" fill="#7CC99B" radius={[7, 7, 0, 0]} barSize={34} animationDuration={1100} />
                <Bar dataKey="cerrados" fill="#F7C49E" radius={[7, 7, 0, 0]} barSize={34} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6" index={7}>
          <SectionHeader
            title="Alertas"
            subtitle="Requieren tu atención"
            right={<span className="rounded-full bg-[#FFE8D8] px-2.5 py-1 text-sm font-bold text-[#9F3F25]">{alerts.length}</span>}
          />
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div key={alert.title} className="rounded-[16px] border p-3.5" style={{ backgroundColor: alert.bg, borderColor: alert.border }}>
                  <div className="flex items-start gap-4">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: alert.text }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: alert.text }}>{alert.title}</p>
                      <p className="mt-1 text-xs text-[#5C6D63]">{alert.detail}</p>
                      {alert.action && <p className="mt-1 text-xs font-bold" style={{ color: alert.text }}>{alert.action}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6" index={8}>
          <SectionHeader title="Auditoría reciente" subtitle="Últimas acciones registradas en el sistema" />
          <div>
            {auditRows.length > 0 ? auditRows.map((row, index) => {
              const Icon = row.icon;
              return (
                <div key={row.id ?? `audit-${index}`} className={`flex items-center gap-3.5 py-3.5 ${index !== auditRows.length - 1 ? 'border-b border-[#EDF2EF]' : ''}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: row.bg, color: row.color }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-sm font-bold text-[#173D2C]">{row.name}</span>
                      <span className="text-sm text-[#5C6D63]">{row.action}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-[#DDEBE3] bg-[#F3FAF6] px-2.5 py-0.5 font-mono text-xs font-bold text-[#2F7654]">{row.ref}</span>
                      {row.amount && <span className="text-sm font-bold text-[#173D2C]">{row.amount}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm text-[#5C6D63]">{row.time}</span>
                </div>
              );
            }) : (
              <p className="py-6 text-center text-sm text-[#5C6D63]">No hay actividad reciente</p>
            )}
          </div>
        </Card>

        <Card className="p-6" index={9}>
          <SectionHeader title="Próximos cobros" subtitle="Agenda de los próximos días" />
          <div className="space-y-3">
            {(upcomingPayments ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-[#5C6D63]">No hay cobros próximos</p>
            ) : (upcomingPayments ?? []).map((payment) => {
              const due = new Date(payment.dueDate);
              const today2 = new Date();
              today2.setHours(0, 0, 0, 0);
              const diffDays = Math.floor((due.getTime() - today2.getTime()) / 86400000);
              let tag = due.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
              let warm = false;
              if (diffDays === 0) { tag = 'HOY'; warm = true; }
              else if (diffDays === 1) { tag = 'MAÑ'; warm = true; }

              return (
                <div key={payment.id} className={`flex items-center gap-3 rounded-[16px] border p-3 ${warm ? 'border-[#F7D6BD] bg-[#FFF7EF]' : 'border-[#DDEBE3] bg-[#F3FAF6]'}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[11px] font-bold ${warm ? 'bg-[#9F3F25] text-white' : 'bg-white text-[#2F7654]'}`}>
                    {tag}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#173D2C]">{payment.clientName}</p>
                    <p className="mt-0.5 text-xs text-[#5C6D63]">{due.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-[#173D2C]">{formatCurrency(payment.amount)}</span>
                </div>
              );
            })}
            <button className="mt-3 h-11 w-full rounded-[16px] bg-[#F3FAF6] text-sm font-bold text-[#2F7654]">Ver agenda completa</button>
          </div>
        </Card>
      </div>

    </div>
  );
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

function actionIcon(action: string): React.ComponentType<{ className?: string }> {
  const lower = action.toLowerCase();
  if (lower.includes('aprob') || lower.includes('cre')) return CheckCircle2;
  if (lower.includes('cobro') || lower.includes('pago')) return DollarSign;
  if (lower.includes('modif') || lower.includes('edit')) return Edit3;
  if (lower.includes('rech')) return AlertTriangle;
  if (lower.includes('report') || lower.includes('gener')) return FileText;
  return UserPlus;
}

function actionBg(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes('aprob') || lower.includes('cre')) return '#E7F4EC';
  if (lower.includes('cobro') || lower.includes('pago')) return '#FFF2B8';
  if (lower.includes('modif') || lower.includes('edit')) return '#DBEAFE';
  if (lower.includes('rech')) return '#FFE8D8';
  if (lower.includes('report') || lower.includes('gener')) return '#E9DDFB';
  return '#E7F4EC';
}
