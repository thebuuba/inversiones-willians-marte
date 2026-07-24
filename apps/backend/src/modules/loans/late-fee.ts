import { prisma } from '@inversiones/database';

const DAY_MS = 86_400_000;

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateLateFee(params: {
  installmentAmount: number;
  dueDate: Date;
  asOfDate: Date;
  graceDays: number;
  mode: string;
  calculation: string;
  value: number;
}): number {
  const elapsedDays = Math.floor((utcDay(params.asOfDate) - utcDay(params.dueDate)) / DAY_MS);
  const lateDays = Math.max(0, elapsedDays - params.graceDays);
  if (lateDays === 0) return 0;

  const base =
    params.calculation === 'AMOUNT'
      ? params.value
      : params.installmentAmount * (params.value / 100);
  return Math.round(base * (params.mode === 'DAILY' ? lateDays : 1) * 100) / 100;
}

export async function syncLoanLateFees(loanId: string, asOfDate = new Date()): Promise<void> {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      schedule: {
        include: { lateFees: true },
      },
    },
  });
  if (!loan?.lateFeeEnabled) return;

  for (const schedule of loan.schedule) {
    if (schedule.status === 'PAID' || schedule.status === 'CANCELLED') continue;
    const amount = calculateLateFee({
      installmentAmount: Number(schedule.amount),
      dueDate: schedule.dueDate,
      asOfDate,
      graceDays: loan.lateFeeGraceDays,
      mode: loan.lateFeeMode,
      calculation: loan.lateFeeCalculation,
      value: Number(loan.lateFeeValue),
    });
    if (amount === 0) continue;

    const existing = schedule.lateFees[0];
    if (existing?.paid) continue;
    await prisma.lateFee.upsert({
      where: { scheduleId: schedule.id },
      update: {
        amount,
        calculatedDate: asOfDate,
        paid: Number(existing?.paidAmount ?? 0) >= amount,
      },
      create: {
        loanId,
        scheduleId: schedule.id,
        amount,
        calculatedDate: asOfDate,
      },
    });
  }
}
