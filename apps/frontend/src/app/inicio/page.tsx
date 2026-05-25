'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/ui/card';

interface DashboardData {
  activeLoans: number;
  totalClients: number;
  collectionsToday: number;
  portfolioBalance: number;
  totalPrincipal: number;
  overdueLoans: number;
  totalUsers: number;
}

export default function InicioPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => setData(res.data.data));
  }, []);

  if (!data) return <div className="p-6 text-gray-500">Cargando...</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inicio</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Préstamos Activos"
          value={data.activeLoans}
          subtitle={`${data.overdueLoans} vencidos`}
        />
        <MetricCard title="Clientes Registrados" value={data.totalClients} />
        <MetricCard title="Cobrado Hoy" value={`RD$${data.collectionsToday.toLocaleString()}`} />
        <MetricCard title="Saldo Cartera" value={`RD$${data.portfolioBalance.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MetricCard title="Capital Total" value={`RD$${data.totalPrincipal.toLocaleString()}`} />
        <MetricCard
          title="Préstamos Vencidos"
          value={data.overdueLoans}
          subtitle="requieren atención"
        />
      </div>

      {data.overdueLoans > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            Hay {data.overdueLoans} préstamo(s) vencido(s) que requieren atención
          </p>
        </div>
      )}
    </div>
  );
}
