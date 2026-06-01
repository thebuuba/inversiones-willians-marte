import { Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PanelHeader } from '@/components/ui/panel-header';

export default function RecordatoriosPage() {
  return (
    <div className="min-h-screen bg-page p-6 lg:p-8">
      <div className="space-y-6">
        <PanelHeader title="Recordatorios" description="Gestión de recordatorios y notificaciones" />

        <Card>
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Bell className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Recordatorios</h2>
            <p className="mt-2 text-sm text-text-secondary">No hay recordatorios configurados todavía.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
