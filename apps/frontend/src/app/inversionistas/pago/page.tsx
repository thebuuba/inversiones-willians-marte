import { Suspense } from 'react';
import { RegisterInvestorPaymentPage } from '@/components/investors/register-investor-payment-page';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] font-sans">
          <p className="text-sm font-medium text-neutral-400">Cargando...</p>
        </div>
      }
    >
      <RegisterInvestorPaymentPage />
    </Suspense>
  );
}
