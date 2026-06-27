import { Injectable } from '@nestjs/common';
import type { AllocationType, InterestType, PaymentFrequency } from '@inversiones/shared';

type Money = number | { toString(): string };

type ScheduleLike = {
  id: string;
  dueDate: Date;
  amount: Money;
  principalPart: Money;
  interestPart: Money;
  paidAmount?: Money | null;
};

type AllocationLike = {
  amount: Money;
  type: AllocationType;
  scheduleId: string;
};

type PaymentLike = {
  allocations?: AllocationLike[];
};

type CapitalMovementLike = {
  amount: Money;
  effectiveDate: Date;
};

export type PayoffLoanLike = {
  id: string;
  principal: Money;
  interestRate: Money;
  interestType: InterestType;
  paymentFreq: PaymentFrequency;
  startDate: Date;
  schedule: ScheduleLike[];
  payments?: PaymentLike[];
  lateFees?: Array<{ amount: Money; paid: boolean }>;
  capitalMovements?: CapitalMovementLike[];
};

export type PayoffQuote = {
  payoffDate: string;
  capitalOutstanding: number;
  earnedInterest: number;
  unearnedInterestDiscount: number;
  fees: number;
  totalToPay: number;
  dailyInterest: number;
  daysGenerated: number;
};

@Injectable()
export class LoanPayoffService {
  quote(loan: PayoffLoanLike, payoffDate: Date): PayoffQuote {
    return loan.interestType === 'INDEFINITE'
      ? this.quoteIndefinite(loan, payoffDate)
      : this.quoteScheduled(loan, payoffDate);
  }

  private quoteIndefinite(loan: PayoffLoanLike, payoffDate: Date): PayoffQuote {
    const periodStart = this.periodStart(loan.startDate, payoffDate, loan.paymentFreq);
    const movements = (loan.capitalMovements ?? []).filter(
      (movement) => movement.effectiveDate <= payoffDate,
    );
    const capitalOutstanding = this.round(
      this.money(loan.principal) + movements.reduce((sum, movement) => sum + this.money(movement.amount), 0),
    );

    const segments = [
      {
        amount: this.money(loan.principal) + movements
          .filter((movement) => movement.effectiveDate <= periodStart)
          .reduce((sum, movement) => sum + this.money(movement.amount), 0),
        from: periodStart,
      },
      ...movements
        .filter((movement) => movement.effectiveDate > periodStart)
        .map((movement) => ({ amount: this.money(movement.amount), from: movement.effectiveDate })),
    ];

    const dailyRate = this.periodicRate(this.money(loan.interestRate), loan.paymentFreq) / this.periodDays(loan.paymentFreq);
    const earnedInterest = this.roundToNearestFifty(
      segments.reduce((sum, segment) => {
        const days = Math.min(this.periodDays(loan.paymentFreq), this.daysBetween(segment.from, payoffDate));
        return sum + segment.amount * dailyRate * days;
      }, 0),
    );
    const daysGenerated = Math.min(this.periodDays(loan.paymentFreq), this.daysBetween(periodStart, payoffDate));
    const dailyInterest = this.round(capitalOutstanding * dailyRate);
    const fees = this.unpaidFees(loan);

    return this.makeQuote(payoffDate, capitalOutstanding, earnedInterest, 0, fees, dailyInterest, daysGenerated);
  }

  private quoteScheduled(loan: PayoffLoanLike, payoffDate: Date): PayoffQuote {
    const allocations = (loan.payments ?? []).flatMap((payment) => payment.allocations ?? []);
    const paidPrincipal = allocations
      .filter((allocation) => allocation.type === 'PRINCIPAL')
      .reduce((sum, allocation) => sum + this.money(allocation.amount), 0);
    const paidInterestBySchedule = new Map<string, number>();
    for (const allocation of allocations.filter((item) => item.type === 'INTEREST')) {
      paidInterestBySchedule.set(
        allocation.scheduleId,
        (paidInterestBySchedule.get(allocation.scheduleId) ?? 0) + this.money(allocation.amount),
      );
    }

    const schedule = [...loan.schedule].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    const capitalOutstanding = this.round(Math.max(0, this.money(loan.principal) - paidPrincipal));
    const maturedInterest = schedule
      .filter((row) => row.dueDate <= payoffDate)
      .reduce((sum, row) => {
        const paid = paidInterestBySchedule.get(row.id) ?? 0;
        return sum + Math.max(0, this.money(row.interestPart) - paid);
      }, 0);

    const next = schedule.find((row) => row.dueDate > payoffDate);
    const previousDueDate =
      [...schedule].reverse().find((row) => row.dueDate <= payoffDate)?.dueDate ?? loan.startDate;
    const periodDays = next ? Math.max(1, this.daysBetween(previousDueDate, next.dueDate)) : this.periodDays(loan.paymentFreq);
    const daysGenerated = next ? Math.max(0, this.daysBetween(previousDueDate, payoffDate)) : 0;
    const currentInterest = next
      ? this.money(next.interestPart) * Math.min(1, daysGenerated / periodDays)
      : 0;
    const roundedCurrentInterest = this.roundToNearestFifty(currentInterest);
    const earnedInterest = this.round(maturedInterest + roundedCurrentInterest);
    const futureInterest = schedule
      .filter((row) => row.dueDate > payoffDate)
      .reduce((sum, row) => sum + this.money(row.interestPart), 0);
    const unearnedInterestDiscount = this.round(Math.max(0, futureInterest - roundedCurrentInterest));
    const fees = this.unpaidFees(loan);
    const dailyInterest = this.round(next ? this.money(next.interestPart) / periodDays : 0);

    return this.makeQuote(
      payoffDate,
      capitalOutstanding,
      earnedInterest,
      unearnedInterestDiscount,
      fees,
      dailyInterest,
      daysGenerated,
    );
  }

  private makeQuote(
    payoffDate: Date,
    capitalOutstanding: number,
    earnedInterest: number,
    unearnedInterestDiscount: number,
    fees: number,
    dailyInterest: number,
    daysGenerated: number,
  ): PayoffQuote {
    return {
      payoffDate: payoffDate.toISOString().slice(0, 10),
      capitalOutstanding,
      earnedInterest,
      unearnedInterestDiscount,
      fees,
      totalToPay: this.round(capitalOutstanding + earnedInterest + fees),
      dailyInterest,
      daysGenerated,
    };
  }

  private unpaidFees(loan: PayoffLoanLike): number {
    return this.round(
      (loan.lateFees ?? [])
        .filter((fee) => !fee.paid)
        .reduce((sum, fee) => sum + this.money(fee.amount), 0),
    );
  }

  private periodStart(startDate: Date, target: Date, frequency: PaymentFrequency): Date {
    let current = new Date(startDate);
    while (this.addPeriod(current, frequency) < target) current = this.addPeriod(current, frequency);
    return current;
  }

  private addPeriod(date: Date, frequency: PaymentFrequency): Date {
    const next = new Date(date);
    if (frequency === 'DAILY') next.setDate(next.getDate() + 1);
    else if (frequency === 'WEEKLY') next.setDate(next.getDate() + 7);
    else if (frequency === 'BIWEEKLY') next.setDate(next.getDate() + 14);
    else if (frequency === 'QUARTERLY') next.setMonth(next.getMonth() + 3);
    else next.setMonth(next.getMonth() + 1);
    return next;
  }

  private periodDays(frequency: PaymentFrequency): number {
    if (frequency === 'DAILY') return 1;
    if (frequency === 'WEEKLY') return 7;
    if (frequency === 'BIWEEKLY') return 15;
    if (frequency === 'QUARTERLY') return 90;
    return 30;
  }

  private periodicRate(annualRate: number, frequency: PaymentFrequency): number {
    const rate = annualRate / 100;
    if (frequency === 'DAILY') return rate / 360;
    if (frequency === 'WEEKLY') return rate / 52;
    if (frequency === 'BIWEEKLY') return rate / 26;
    if (frequency === 'QUARTERLY') return rate / 4;
    return rate / 12;
  }

  private daysBetween(from: Date, to: Date): number {
    return Math.max(0, Math.floor((this.utcDay(to) - this.utcDay(from)) / 86_400_000));
  }

  private utcDay(date: Date): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  private money(value: Money): number {
    return Number(value);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private roundToNearestFifty(value: number): number {
    return Math.round(value / 50) * 50;
  }
}
