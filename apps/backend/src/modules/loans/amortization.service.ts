import { Injectable } from '@nestjs/common';
import { InterestTypeEnum } from '@inversiones/shared';
import type { InterestType, PaymentFrequency } from '@inversiones/shared';
import { AmortizationRow } from './dto/create-loan.dto';
import { calculateIndefiniteInterest } from './indefinite-loan';

@Injectable()
export class AmortizationService {
  private roundToNearestHundred(value: number): number {
    return Math.round(value / 100) * 100;
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private roundAllocation(value: number, payment: number): number {
    return Number.isInteger(payment) ? Math.round(value) : this.roundMoney(value);
  }

  private createRoundedFinalRow(params: {
    installment: number;
    dueDate: Date;
    principalPart: number;
    interestPart: number;
  }): AmortizationRow {
    const principalPart = this.roundMoney(Math.max(0, params.principalPart));
    const exactAmount = principalPart + params.interestPart;
    const minimumRoundedAmount = Math.ceil(principalPart / 100) * 100;
    const amount = Math.max(this.roundToNearestHundred(exactAmount), minimumRoundedAmount);

    return {
      installment: params.installment,
      dueDate: new Date(params.dueDate),
      amount,
      principalPart,
      interestPart: this.roundMoney(amount - principalPart),
      balanceAfter: 0,
    };
  }

  private createRow(params: {
    installment: number;
    dueDate: Date;
    amount: number;
    principalPart: number;
    interestPart: number;
    balanceAfter: number;
  }): AmortizationRow {
    return {
      installment: params.installment,
      dueDate: new Date(params.dueDate),
      amount: this.roundMoney(params.amount),
      principalPart: this.roundMoney(params.principalPart),
      interestPart: this.roundMoney(params.interestPart),
      balanceAfter: this.roundMoney(Math.max(0, params.balanceAfter)),
    };
  }

  private calculateBalanceBasedSchedule(params: {
    principal: number;
    periodicRate: number;
    term: number;
    startDate: Date;
    paymentFrequency: PaymentFrequency;
    rawInstallment: number;
  }): AmortizationRow[] {
    const { principal, periodicRate, term, startDate, paymentFrequency, rawInstallment } = params;
    const schedule: AmortizationRow[] = [];
    const roundedInstallment = this.roundToNearestHundred(rawInstallment);
    let balance = principal;
    let dueDate = new Date(startDate);

    for (let i = 1; i < term; i++) {
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      const interestPart = balance * periodicRate;
      const principalPart = roundedInstallment - interestPart;

      if (principalPart < 0) {
        const safePrincipal = Math.max(balance * 0.01, 0);
        balance -= safePrincipal;
        schedule.push(
          this.createRow({
            installment: i,
            dueDate,
            amount: safePrincipal + interestPart,
            principalPart: safePrincipal,
            interestPart,
            balanceAfter: balance,
          }),
        );
      } else {
        balance -= principalPart;
        schedule.push(
          this.createRow({
            installment: i,
            dueDate,
            amount: roundedInstallment,
            principalPart,
            interestPart,
            balanceAfter: balance,
          }),
        );
      }
    }

    const lastInterestPart = balance * periodicRate;
    dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
    schedule.push(
      this.createRoundedFinalRow({
        installment: term,
        dueDate,
        principalPart: this.roundMoney(balance),
        interestPart: this.roundMoney(lastInterestPart),
      }),
    );

    return schedule;
  }

  private calculateCustomPaymentSchedule(params: {
    principal: number;
    periodicRate: number;
    term: number;
    startDate: Date;
    paymentFrequency: PaymentFrequency;
    customPayment: number;
  }): AmortizationRow[] {
    const { principal, periodicRate, term, startDate, paymentFrequency, customPayment } = params;
    const schedule: AmortizationRow[] = [];
    let balance = principal;
    let dueDate = new Date(startDate);

    for (let i = 1; i < term; i++) {
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      const interestPart = Math.min(
        customPayment,
        this.roundAllocation(balance * periodicRate, customPayment),
      );
      const principalPart = Math.min(Math.max(customPayment - interestPart, 0), balance);
      balance -= principalPart;

      schedule.push(
        this.createRow({
          installment: i,
          dueDate,
          amount: interestPart + principalPart,
          principalPart,
          interestPart,
          balanceAfter: balance,
        }),
      );
    }

    const finalInterestPart = this.roundAllocation(balance * periodicRate, customPayment);
    dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
    schedule.push(
      this.createRoundedFinalRow({
        installment: term,
        dueDate,
        principalPart: this.roundMoney(balance),
        interestPart: this.roundMoney(finalInterestPart),
      }),
    );

    return schedule;
  }

  private calculateZeroRateSchedule(params: {
    principal: number;
    term: number;
    startDate: Date;
    paymentFrequency: PaymentFrequency;
  }): AmortizationRow[] {
    const roundedInstallment = this.roundToNearestHundred(params.principal / params.term);
    let remainingPrincipal = params.principal;
    let dueDate = new Date(params.startDate);

    return Array.from({ length: params.term }, (_, index) => {
      dueDate = this.addPaymentInterval(dueDate, params.paymentFrequency);
      const principalPart =
        index === params.term - 1
          ? remainingPrincipal
          : Math.min(roundedInstallment, remainingPrincipal);
      remainingPrincipal -= principalPart;

      return {
        installment: index + 1,
        dueDate: new Date(dueDate),
        amount: principalPart,
        principalPart,
        interestPart: 0,
        balanceAfter: remainingPrincipal,
      };
    });
  }

  calculate(params: {
    principal: number;
    interestRate: number;
    interestType: InterestType;
    paymentFrequency: PaymentFrequency;
    term: number;
    startDate: Date;
    customPayment?: number;
  }): AmortizationRow[] {
    const {
      principal,
      interestRate,
      interestType,
      paymentFrequency,
      term,
      startDate,
      customPayment,
    } = params;
    const schedule: AmortizationRow[] = [];
    const periodicRate = this.getPeriodicRate(interestRate, paymentFrequency);

    let dueDate = new Date(startDate);

    if (customPayment && customPayment > 0 && interestType !== InterestTypeEnum.INDEFINITE) {
      schedule.push(
        ...this.calculateCustomPaymentSchedule({
          principal,
          periodicRate,
          term,
          startDate,
          paymentFrequency,
          customPayment,
        }),
      );
    } else if (interestType === InterestTypeEnum.FLAT) {
      const totalInterest = principal * (periodicRate * term);
      const totalAmount = principal + totalInterest;
      const rawInstallment = totalAmount / term;
      const roundedInstallment = this.roundToNearestHundred(rawInstallment);
      const interestPerInstallment = totalInterest / term;
      const principalPerInstallment = roundedInstallment - interestPerInstallment;
      let balance = principal;

      for (let i = 1; i < term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        balance -= principalPerInstallment;

        schedule.push({
          installment: i,
          dueDate: new Date(dueDate),
          amount: this.roundMoney(roundedInstallment),
          principalPart: this.roundMoney(principalPerInstallment),
          interestPart: this.roundMoney(interestPerInstallment),
          balanceAfter: this.roundMoney(Math.max(0, balance)),
        });
      }

      const lastPrincipalPart = balance;
      const lastInterestPart = interestPerInstallment;
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      schedule.push(
        this.createRoundedFinalRow({
          installment: term,
          dueDate,
          principalPart: this.roundMoney(lastPrincipalPart),
          interestPart: this.roundMoney(lastInterestPart),
        }),
      );
    } else if (interestType === InterestTypeEnum.REDUCING) {
      if (periodicRate === 0) {
        return this.calculateZeroRateSchedule({
          principal,
          term,
          startDate,
          paymentFrequency,
        });
      }
      const rawInstallment =
        (principal * (periodicRate * Math.pow(1 + periodicRate, term))) /
        (Math.pow(1 + periodicRate, term) - 1);
      schedule.push(
        ...this.calculateBalanceBasedSchedule({
          principal,
          periodicRate,
          term,
          startDate,
          paymentFrequency,
          rawInstallment,
        }),
      );
    } else if (interestType === InterestTypeEnum.COMPOUND) {
      const totalAmount = principal * Math.pow(1 + periodicRate, term);
      const rawInstallment = totalAmount / term;
      schedule.push(
        ...this.calculateBalanceBasedSchedule({
          principal,
          periodicRate,
          term,
          startDate,
          paymentFrequency,
          rawInstallment,
        }),
      );
    } else if (interestType === InterestTypeEnum.FIXED) {
      const fixedInterest = principal * periodicRate;
      const principalPartPerInstallment = principal / term;
      const rawInstallment = principalPartPerInstallment + fixedInterest;
      const minimumInstallment = Math.ceil(principalPartPerInstallment / 100) * 100;
      const roundedInstallment = Math.max(
        this.roundToNearestHundred(rawInstallment),
        minimumInstallment,
      );
      const regularPrincipalPart = this.roundMoney(principalPartPerInstallment);
      let balance = principal;

      for (let i = 1; i < term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        balance -= regularPrincipalPart;

        schedule.push({
          installment: i,
          dueDate: new Date(dueDate),
          amount: this.roundMoney(roundedInstallment),
          principalPart: regularPrincipalPart,
          interestPart: this.roundMoney(roundedInstallment - regularPrincipalPart),
          balanceAfter: this.roundMoney(Math.max(0, balance)),
        });
      }

      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      const lastPrincipalPart = this.roundMoney(balance);
      schedule.push({
        installment: term,
        dueDate: new Date(dueDate),
        amount: this.roundMoney(roundedInstallment),
        principalPart: lastPrincipalPart,
        interestPart: this.roundMoney(roundedInstallment - lastPrincipalPart),
        balanceAfter: 0,
      });
    } else if (interestType === InterestTypeEnum.INDEFINITE) {
      const interestAmount = calculateIndefiniteInterest(principal, interestRate, paymentFrequency);
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      schedule.push({
        installment: 1,
        dueDate: new Date(dueDate),
        amount: this.roundMoney(interestAmount),
        principalPart: 0,
        interestPart: this.roundMoney(interestAmount),
        balanceAfter: this.roundMoney(principal),
      });
    }

    return schedule;
  }

  private getPeriodicRate(annualRate: number, frequency: PaymentFrequency): number {
    const rate = annualRate / 100;
    switch (frequency) {
      case 'DAILY':
        return rate / 360;
      case 'WEEKLY':
        return rate / 52;
      case 'BIWEEKLY':
        return rate / 26;
      case 'MONTHLY':
        return rate / 12;
      case 'QUARTERLY':
        return rate / 4;
      default:
        return rate / 12;
    }
  }

  private addPaymentInterval(date: Date, frequency: PaymentFrequency): Date {
    const d = new Date(date);
    switch (frequency) {
      case 'DAILY':
        d.setUTCDate(d.getUTCDate() + 1);
        break;
      case 'WEEKLY':
        d.setUTCDate(d.getUTCDate() + 7);
        break;
      case 'BIWEEKLY':
        d.setUTCDate(d.getUTCDate() + 14);
        break;
      case 'MONTHLY':
        return this.addUtcMonthsClamped(d, 1);
      case 'QUARTERLY':
        return this.addUtcMonthsClamped(d, 3);
    }
    return d;
  }

  private addUtcMonthsClamped(date: Date, months: number): Date {
    const day = date.getUTCDate();
    const result = new Date(date);
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months);
    const lastDayOfTargetMonth = new Date(
      Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
    ).getUTCDate();
    result.setUTCDate(Math.min(day, lastDayOfTargetMonth));
    return result;
  }
}
