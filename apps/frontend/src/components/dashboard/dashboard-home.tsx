'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
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
  List,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';

const monthlyCollections = [
  { month: 'Feb', cobrado: 42, esperado: 48 },
  { month: 'Mar', cobrado: 53, esperado: 52 },
  { month: 'Abr', cobrado: 49, esperado: 56 },
  { month: 'May', cobrado: 61, esperado: 58 },
  { month: 'Jun', cobrado: 70, esperado: 63 },
  { month: 'Jul', cobrado: 67, esperado: 68 },
  { month: 'Ago', cobrado: 82, esperado: 76 },
  { month: 'Sep', cobrado: 90, esperado: 82 },
];

const portfolioStatus = [
  { name: 'Al día', value: 68, color: '#7CC99B' },
  { name: 'Próximos', value: 18, color: '#A9D9C6' },
  { name: 'Retrasados', value: 9, color: '#F7C49E' },
  { name: 'Vencidos', value: 5, color: '#A9D8F2' },
];

const weeklyMovement = [
  { day: 'Lun', nuevos: 9, cerrados: 3 },
  { day: 'Mar', nuevos: 15, cerrados: 6 },
  { day: 'Mié', nuevos: 12, cerrados: 9 },
  { day: 'Jue', nuevos: 18, cerrados: 6 },
  { day: 'Vie', nuevos: 24, cerrados: 12 },
  { day: 'Sáb', nuevos: 12, cerrados: 3 },
  { day: 'Dom', nuevos: 6, cerrados: 0 },
];

const metrics = [
  {
    title: 'PRÉSTAMOS ACTIVOS',
    value: '248',
    note: 'vs mes anterior',
    badge: '+12',
    trend: 'up',
    icon: BriefcaseBusiness,
    iconBg: '#E7F4EC',
    iconColor: '#5FA37D',
  },
  {
    title: 'CLIENTES REGISTRADOS',
    value: '586',
    note: 'este mes',
    badge: '+24',
    trend: 'up',
    icon: Users,
    iconBg: '#FFE8D8',
    iconColor: '#C96F4A',
  },
  {
    title: 'COBRADO HOY',
    value: 'RD$48,520',
    note: 'vs ayer',
    badge: '+8.2%',
    trend: 'up',
    icon: DollarSign,
    iconBg: '#FFF2B8',
    iconColor: '#A98219',
  },
  {
    title: 'SALDO CARTERA',
    value: 'RD$1.24M',
    note: 'vs mes anterior',
    badge: '-2.1%',
    trend: 'down',
    icon: Wallet,
    iconBg: '#CFE4FF',
    iconColor: '#4E7CAD',
  },
];

const alerts = [
  {
    title: '12 préstamos vencidos',
    detail: 'RD$184,500 en mora total',
    action: 'Ver lista →',
    icon: AlertTriangle,
    bg: '#FFF7EF',
    border: '#F7D6BD',
    text: '#C96F4A',
  },
  {
    title: '8 cobros para hoy',
    detail: 'RD$28,400 esperados',
    action: 'Ver agenda →',
    icon: Clock3,
    bg: '#FFFBEA',
    border: '#F7E7AE',
    text: '#A98219',
  },
  {
    title: '5 solicitudes pendientes',
    detail: 'Esperan aprobación',
    action: 'Revisar →',
    icon: ShieldCheck,
    bg: '#F3FAF6',
    border: '#DDEBE3',
    text: '#5FA37D',
  },
];

const auditRows = [
  { name: 'María González', action: 'Aprobó préstamo', ref: 'PRES-2024-0142', amount: 'RD$45,000', time: 'Hace 5 min', icon: CheckCircle2, bg: '#E7F4EC', color: '#5FA37D' },
  { name: 'Carlos Reyes', action: 'Registró cobro', ref: 'Cliente #387', amount: 'RD$2,800', time: 'Hace 18 min', icon: DollarSign, bg: '#FFF2B8', color: '#A98219' },
  { name: 'Administrador', action: 'Modificó cliente', ref: 'Juan Pérez', amount: '', time: 'Hace 42 min', icon: Edit3, bg: '#DBEAFE', color: '#4E7CAD' },
  { name: 'Laura Méndez', action: 'Rechazó solicitud', ref: 'PRES-2024-0141', amount: 'RD$120,000', time: 'Hace 1 h', icon: AlertTriangle, bg: '#FFE8D8', color: '#C96F4A' },
  { name: 'Carlos Reyes', action: 'Generó reporte', ref: 'Cartera mensual', amount: '', time: 'Hace 2 h', icon: FileText, bg: '#E9DDFB', color: '#8A63C7' },
  { name: 'María González', action: 'Creó cliente', ref: 'Ana Rodríguez', amount: '', time: 'Hace 3 h', icon: UserPlus, bg: '#E7F4EC', color: '#5FA37D' },
];

const upcomingPayments = [
  { tag: 'HOY', name: 'Pedro Martínez', date: 'Hoy', amount: 'RD$3,500', warm: true },
  { tag: 'HOY', name: 'Sofía Hernández', date: 'Hoy', amount: 'RD$1,800', warm: true },
  { tag: 'MAÑ', name: 'Roberto Díaz', date: 'Mañana', amount: 'RD$5,200' },
  { tag: 'MAÑ', name: 'Carmen Rivera', date: 'Mañana', amount: 'RD$2,400' },
  { tag: 'OCT 12', name: 'Luis Castillo', date: '12 Oct', amount: 'RD$4,100' },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 },
  }),
};

function Card({ children, className = '', index = 0 }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <motion.section
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`rounded-[18px] border border-[#DDEBE3] bg-white shadow-[0_7px_22px_rgba(40,92,67,0.035)] ${className}`}
    >
      {children}
    </motion.section>
  );
}

function DotLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-[#5FA37D]">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
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
        <p className="mt-1 text-sm text-[#A9CDBB]">{subtitle}</p>
      </div>
      {right}
    </div>
  );
}

export function DashboardHome() {
  return (
    <div className="min-h-screen bg-[#F6FAF7] p-5 font-sans text-[#173D2C]">
      <div className="mb-5 flex flex-col items-start justify-between gap-4 2xl:flex-row 2xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#DDEBE3] bg-[#E7F4EC] px-3.5 py-1.5 text-xs font-bold text-[#5FA37D]">
              <span className="h-2 w-2 rounded-full bg-[#5FA37D]" />
              En línea
            </span>
            <span className="text-sm text-[#A9CDBB]">lunes, 25 de mayo</span>
          </div>
          <h1 className="text-[28px] font-bold leading-tight text-[#173D2C]">
            Hola, Administrador 👋
          </h1>
          <p className="mt-1.5 text-base text-[#7A8A80]">Aquí tienes un resumen de tu cartera hoy.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-11 rounded-full border border-[#DDEBE3] bg-white px-5 text-sm font-bold text-[#5FA37D] shadow-sm">
            Ver reportes
          </button>
          <Link
            className="flex h-11 items-center gap-2 rounded-full bg-[#5FA37D] px-5 text-sm font-bold text-white shadow-[0_12px_22px_rgba(95,163,125,0.22)]"
            href="/prestamos/nuevo"
          >
            <Plus className="h-4 w-4" />
            Nuevo préstamo
          </Link>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const Trend = metric.trend === 'up' ? TrendingUp : TrendingDown;

          return (
            <Card key={metric.title} className="min-h-[148px] p-5" index={index}>
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                  style={{ backgroundColor: metric.iconBg, color: metric.iconColor }}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                    metric.trend === 'up'
                      ? 'bg-[#E7F4EC] text-[#5FA37D]'
                      : 'bg-[#FFE8D8] text-[#C96F4A]'
                  }`}
                >
                  <Trend className="h-3.5 w-3.5" />
                  {metric.badge}
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#7A8A80]">{metric.title}</p>
              <p className="mt-1.5 text-[24px] font-bold leading-tight text-[#173D2C]">
                {metric.value}
              </p>
              <p className="mt-1.5 text-sm text-[#A9CDBB]">{metric.note}</p>
            </Card>
          );
        })}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6" index={4}>
          <SectionHeader
            title="Cobros mensuales"
            subtitle="Ingresos vs proyección · últimos 9 meses"
            right={
              <div className="flex items-center gap-3 pt-1">
                <DotLegend color="#7CC99B" label="Cobrado" />
                <DotLegend color="#B8E0CF" label="Esperado" />
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
              <AreaChart data={monthlyCollections} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cobradoGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#7CC99B" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#7CC99B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#DDEBE3" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6F7280', fontSize: 13 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ stroke: '#DDEBE3', strokeDasharray: '4 6' }}
                  contentStyle={{
                    border: '1px solid #DDEBE3',
                    borderRadius: 16,
                    boxShadow: '0 12px 28px rgba(40,92,67,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cobrado"
                  stroke="#7CC99B"
                  strokeWidth={3}
                  fill="url(#cobradoGradient)"
                  isAnimationActive
                  animationDuration={1400}
                />
                <Line
                  type="monotone"
                  dataKey="esperado"
                  stroke="#B8E0CF"
                  strokeWidth={3}
                  strokeDasharray="6 7"
                  dot={false}
                  isAnimationActive
                  animationDuration={1300}
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
                  data={portfolioStatus}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  startAngle={0}
                  endAngle={360}
                  isAnimationActive
                  animationDuration={1200}
                >
                  {portfolioStatus.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="#FFFFFF" strokeWidth={4} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm text-[#A9CDBB]">Total</span>
              <span className="text-[24px] font-bold text-[#173D2C]">100%</span>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {portfolioStatus.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-sm font-semibold text-[#5FA37D]">
                <span className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
                <span className="font-bold text-[#173D2C]">{entry.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-6" index={6}>
          <SectionHeader
            title="Movimiento semanal"
            subtitle="Préstamos abiertos vs cerrados"
            right={
              <div className="flex items-center gap-3 pt-1">
                <DotLegend color="#7CC99B" label="Nuevos" />
                <DotLegend color="#F7B17E" label="Cerrados" />
              </div>
            }
          />
          <div className="h-[230px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 720, height: 230 }}
            >
              <BarChart data={weeklyMovement} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#DDEBE3" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6F7280', fontSize: 13 }}
                  dy={10}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(231,244,236,0.45)' }}
                  contentStyle={{ border: '1px solid #DDEBE3', borderRadius: 16 }}
                />
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
            right={
              <span className="rounded-full bg-[#FFE8D8] px-2.5 py-1 text-sm font-bold text-[#C96F4A]">
                3
              </span>
            }
          />
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;

              return (
                <div
                  key={alert.title}
                  className="rounded-[16px] border p-3.5"
                  style={{ backgroundColor: alert.bg, borderColor: alert.border }}
                >
                  <div className="flex items-start gap-4">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: alert.text }} />
                    <div>
                      <p className="text-sm font-bold" style={{ color: alert.text }}>{alert.title}</p>
                      <p className="mt-1 text-xs text-[#A9CDBB]">{alert.detail}</p>
                      <p className="mt-1 text-xs font-bold" style={{ color: alert.text }}>{alert.action}</p>
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
          <SectionHeader
            title="Auditoría reciente"
            subtitle="Últimas acciones registradas en el sistema"
            right={<button className="pt-1.5 text-sm font-bold text-[#5FA37D]">Ver historial completo</button>}
          />
          <div>
            {auditRows.map((row, index) => {
              const Icon = row.icon;

              return (
                <div
                  key={`${row.name}-${row.time}`}
                  className={`flex items-center gap-3.5 py-3.5 ${index !== auditRows.length - 1 ? 'border-b border-[#EDF2EF]' : ''}`}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: row.bg, color: row.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-sm font-bold text-[#173D2C]">{row.name}</span>
                      <span className="text-sm text-[#A9CDBB]">{row.action}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-[#DDEBE3] bg-[#F3FAF6] px-2.5 py-0.5 font-mono text-xs font-bold text-[#5FA37D]">
                        {row.ref}
                      </span>
                      {row.amount && <span className="text-sm font-bold text-[#173D2C]">{row.amount}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm text-[#A9CDBB]">{row.time}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6" index={9}>
          <SectionHeader title="Próximos cobros" subtitle="Agenda de los próximos días" />
          <div className="space-y-3">
            {upcomingPayments.map((payment) => (
              <div
                key={`${payment.name}-${payment.amount}`}
                className={`flex items-center gap-3 rounded-[16px] border p-3 ${
                  payment.warm ? 'border-[#F7D6BD] bg-[#FFF7EF]' : 'border-[#DDEBE3] bg-[#F3FAF6]'
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[11px] font-bold ${
                    payment.warm ? 'bg-[#FFB174] text-white' : 'bg-white text-[#5FA37D]'
                  }`}
                >
                  {payment.tag}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#173D2C]">{payment.name}</p>
                  <p className="mt-0.5 text-xs text-[#A9CDBB]">{payment.date}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#173D2C]">{payment.amount}</span>
              </div>
            ))}
            <button className="mt-3 h-11 w-full rounded-[16px] bg-[#F3FAF6] text-sm font-bold text-[#5FA37D]">
              Ver agenda completa
            </button>
          </div>
        </Card>
      </div>

      <button className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF6A00] text-white shadow-[0_12px_24px_rgba(255,106,0,0.28)]">
        <List className="h-6 w-6" strokeWidth={3} />
      </button>
    </div>
  );
}
