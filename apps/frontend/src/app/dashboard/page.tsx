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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => setData(res.data.data));
  }, []);

  if (!data) return <div className="p-6 text-gray-500">Cargando...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Préstamos Activos"
          value={data.activeLoans}
          subtitle={`${data.overdueLoans} vencidos`}
        />
        <MetricCard
          title="Clientes Registrados"
          value={data.totalClients}
        />
        <MetricCard
          title="Cobrado Hoy"
          value={`RD$${data.collectionsToday.toLocaleString()}`}
        />
        <MetricCard
          title="Saldo Cartera"
          value={`RD$${data.portfolioBalance.toLocaleString()}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Capital Total"
          value={`RD$${data.totalPrincipal.toLocaleString()}`}
        />
        <MetricCard
          title="Préstamos Vencidos"
          value={data.overdueLoans}
          subtitle="requieren atención"
        />
      </div>

      {data.overdueLoans > 0 && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm font-medium text-red-800">
            ⚠️ Hay {data.overdueLoans} préstamo(s) vencido(s) que requieren atención
          </p>
        </div>
      )}
    </div>
  );
}
