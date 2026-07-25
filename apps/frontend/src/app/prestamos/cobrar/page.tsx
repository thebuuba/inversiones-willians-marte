import { Suspense } from 'react';
import { RegisterLoanPaymentPage } from '@/components/loans/register-loan-payment-page';

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-page text-sm font-semibold text-text-muted">
          Cargando pantalla de cobros...
        </main>
      }
    >
      <RegisterLoanPaymentPage />
    </Suspense>
  );
}
