import { Injectable } from '@nestjs/common';
import { InterestTypeEnum } from '@inversiones/shared';
import type { InterestType, PaymentFrequency } from '@inversiones/shared';
import { AmortizationRow } from '../dto/create-loan.dto';

@Injectable()
export class AmortizationService {
  calculate(params: {
    principal: number;
    interestRate: number;
    interestType: InterestType;
    paymentFrequency: PaymentFrequency;
    term: number;
    startDate: Date;
  }): AmortizationRow[] {
    const { principal, interestRate, interestType, paymentFrequency, term, startDate } = params;
    const schedule: AmortizationRow[] = [];
    const periodicRate = this.getPeriodicRate(interestRate, paymentFrequency);

    let balance = principal;
    let dueDate = new Date(startDate);

    if (interestType === InterestTypeEnum.FLAT) {
      const totalInterest = principal * (periodicRate * term);
      const totalAmount = principal + totalInterest;
      const installmentAmount = totalAmount / term;
      const interestPartPerInstallment = totalInterest / term;
      const principalPartPerInstallment = principal / term;

      for (let i = 1; i <= term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        balance -= principalPartPerInstallment;

        schedule.push({
          installment: i,
          dueDate: new Date(dueDate),
          amount: Math.round(installmentAmount * 100) / 100,
          principalPart: Math.round(principalPartPerInstallment * 100) / 100,
          interestPart: Math.round(interestPartPerInstallment * 100) / 100,
          balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
        });
      }
    } else if (interestType === InterestTypeEnum.REDUCING) {
      const installmentAmount =
        (principal * (periodicRate * Math.pow(1 + periodicRate, term))) /
        (Math.pow(1 + periodicRate, term) - 1);

      for (let i = 1; i <= term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        const interestPart = balance * periodicRate;
        const principalPart = installmentAmount - interestPart;
        balance -= principalPart;

        schedule.push({
          installment: i,
          dueDate: new Date(dueDate),
          amount: Math.round(installmentAmount * 100) / 100,
          principalPart: Math.round(principalPart * 100) / 100,
          interestPart: Math.round(interestPart * 100) / 100,
          balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
        });
      }
    } else if (interestType === InterestTypeEnum.COMPOUND) {
      const totalAmount = principal * Math.pow(1 + periodicRate, term);
      const installmentAmount = totalAmount / term;

      for (let i = 1; i <= term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        const interestPart = balance * periodicRate;
        const principalPart = installmentAmount - interestPart;
        balance -= principalPart;

        schedule.push({
          installment: i,
          dueDate: new Date(dueDate),
          amount: Math.round(installmentAmount * 100) / 100,
          principalPart: Math.round(principalPart * 100) / 100,
          interestPart: Math.round(interestPart * 100) / 100,
          balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
        });
      }
    } else if (interestType === InterestTypeEnum.FIXED) {
      const fixedInterest = principal * periodicRate;
      const principalPartPerInstallment = principal / term;
      const installmentAmount = principalPartPerInstallment + fixedInterest;

      for (let i = 1; i <= term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        balance -= principalPartPerInstallment;

        schedule.push({
          installment: i,
          dueDate: new Date(dueDate),
          amount: Math.round(installmentAmount * 100) / 100,
          principalPart: Math.round(principalPartPerInstallment * 100) / 100,
          interestPart: Math.round(fixedInterest * 100) / 100,
          balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
        });
      }
    }

    return schedule;
  }

  private getPeriodicRate(annualRate: number, frequency: PaymentFrequency): number {
    const rate = annualRate / 100;
    switch (frequency) {
      case 'DAILY': return rate / 360;
      case 'WEEKLY': return rate / 52;
      case 'BIWEEKLY': return rate / 26;
      case 'MONTHLY': return rate / 12;
      case 'QUARTERLY': return rate / 4;
      default: return rate / 12;
    }
  }

  private addPaymentInterval(date: Date, frequency: PaymentFrequency): Date {
    const d = new Date(date);
    switch (frequency) {
      case 'DAILY': d.setDate(d.getDate() + 1); break;
      case 'WEEKLY': d.setDate(d.getDate() + 7); break;
      case 'BIWEEKLY': d.setDate(d.getDate() + 14); break;
      case 'MONTHLY': d.setMonth(d.getMonth() + 1); break;
      case 'QUARTERLY': d.setMonth(d.getMonth() + 3); break;
    }
    return d;
  }
}
