'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  identification: string;
  _count: { loans: number };
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/clients', { params: { search } }).then((res) => setClients(res.data.data));
  }, [search]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-ink">Clientes</h1>
          <p className="mt-1 text-sm text-ink-secondary">Gestión de clientes</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, teléfono o cédula..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-border px-3 py-2 text-sm placeholder-ink-muted focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
      />

      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-ink">{client.name}</p>
                <p className="text-sm text-ink-secondary">
                  {client.phone} - {client.identification}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{client._count.loans} préstamos</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
