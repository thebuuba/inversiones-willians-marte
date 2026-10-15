'use client';

import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { InvestorInvestmentDetail, InvestorPaymentItem } from '@inversiones/shared';
import { InvestorPaymentForm } from './register-investor-payment-page';
import { PaymentReceiptModal } from './payment-receipt-modal';

interface InvestorPaymentDialogProps {
  investmentId: string | null;
  onClose: () => void;
  onPaid: () => void;
}

export function InvestorPaymentDialog({
  investmentId,
  onClose,
  onPaid,
}: InvestorPaymentDialogProps) {
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const [receipt, setReceipt] = useState<{
    payment: InvestorPaymentItem;
    investment: InvestorInvestmentDetail;
  } | null>(null);

  function handlePaid(payment: InvestorPaymentItem, investment: InvestorInvestmentDetail) {
    setReceipt({ payment, investment });
    onClose();
    onPaid();
  }

  return (
    <>
      <Dialog.Root
        open={!!investmentId}
        onOpenChange={(open) => {
          if (!open && !busy && !uncertain) onClose();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
          <Dialog.Content
            onOpenAutoFocus={() => {
              opener.current =
                document.activeElement instanceof HTMLElement ? document.activeElement : null;
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              if (!receipt) opener.current?.focus();
            }}
            onEscapeKeyDown={(event) => {
              if (busy || uncertain) event.preventDefault();
            }}
            onPointerDownOutside={(event) => event.preventDefault()}
            className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-panel bg-card p-5 shadow-modal sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-xl font-extrabold">Pagar intereses</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-text-secondary">
                  Revisa el monto. El recibo se abre al registrar el pago.
                </Dialog.Description>
              </div>
              <Dialog.Close
                disabled={busy || uncertain}
                aria-label="Cerrar pago"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-surface-subtle disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            {investmentId && (
              <InvestorPaymentForm
                key={investmentId}
                embedded
                investmentId={investmentId}
                onClose={onClose}
                onBusyChange={setBusy}
                onUncertainChange={setUncertain}
                onPaid={handlePaid}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root
        open={!!receipt}
        onOpenChange={(open) => {
          if (!open) setReceipt(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Content
            className="fixed inset-0 z-50"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus();
            }}
          >
            <Dialog.Title className="sr-only">Recibo del pago</Dialog.Title>
            <Dialog.Description className="sr-only">
              Pago registrado. Puedes imprimir o descargar el recibo.
            </Dialog.Description>
            {receipt?.investment.investor && (
              <PaymentReceiptModal
                newlyCreated
                payment={receipt.payment}
                investor={receipt.investment.investor}
                investment={receipt.investment}
                onClose={() => setReceipt(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
