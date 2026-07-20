import { Suspense } from 'react';
import { RegisterInvestorPaymentPage } from '@/components/investors/register-investor-payment-page';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-page font-sans">
          <p className="text-sm font-medium text-text-subtle">Cargando...</p>
        </div>
      }
    >
      <RegisterInvestorPaymentPage />
    </Suspense>
  );
}
