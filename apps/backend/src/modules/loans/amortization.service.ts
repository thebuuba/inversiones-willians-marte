import { Injectable } from '@nestjs/common';
import { InterestTypeEnum } from '@inversiones/shared';
import type { InterestType, PaymentFrequency } from '@inversiones/shared';
import { AmortizationRow } from './dto/create-loan.dto';

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
    schedule.push({
      installment: term,
      dueDate: new Date(dueDate),
      amount: this.roundMoney(balance + lastInterestPart),
      principalPart: this.roundMoney(balance),
      interestPart: this.roundMoney(lastInterestPart),
      balanceAfter: 0,
    });

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
    schedule.push({
      installment: term,
      dueDate: new Date(dueDate),
      amount: this.roundMoney(balance + finalInterestPart),
      principalPart: this.roundMoney(balance),
      interestPart: this.roundMoney(finalInterestPart),
      balanceAfter: 0,
    });

    return schedule;
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
      schedule.push({
        installment: term,
        dueDate: new Date(dueDate),
        amount: this.roundMoney(lastPrincipalPart + lastInterestPart),
        principalPart: this.roundMoney(lastPrincipalPart),
        interestPart: this.roundMoney(lastInterestPart),
        balanceAfter: 0,
      });
    } else if (interestType === InterestTypeEnum.REDUCING) {
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
      const roundedInstallment = this.roundToNearestHundred(rawInstallment);

      const principalPartDiff = roundedInstallment - fixedInterest;
      const adjustedPrincipalPart =
        principalPartDiff > 0 ? principalPartDiff : principalPartPerInstallment;
      let balance = principal;

      for (let i = 1; i < term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        balance -= adjustedPrincipalPart;

        schedule.push({
          installment: i,
          dueDate: new Date(dueDate),
          amount: this.roundMoney(roundedInstallment),
          principalPart: this.roundMoney(adjustedPrincipalPart),
          interestPart: this.roundMoney(fixedInterest),
          balanceAfter: this.roundMoney(Math.max(0, balance)),
        });
      }

      const lastPrincipalPart = balance;
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      schedule.push({
        installment: term,
        dueDate: new Date(dueDate),
        amount: this.roundMoney(lastPrincipalPart + fixedInterest),
        principalPart: this.roundMoney(lastPrincipalPart),
        interestPart: this.roundMoney(fixedInterest),
        balanceAfter: 0,
      });
    } else if (interestType === InterestTypeEnum.INDEFINITE) {
      const interestAmount = principal * periodicRate;
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
        d.setDate(d.getDate() + 1);
        break;
      case 'WEEKLY':
        d.setDate(d.getDate() + 7);
        break;
      case 'BIWEEKLY':
        d.setDate(d.getDate() + 14);
        break;
      case 'MONTHLY':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'QUARTERLY':
        d.setMonth(d.getMonth() + 3);
        break;
    }
    return d;
  }
}
