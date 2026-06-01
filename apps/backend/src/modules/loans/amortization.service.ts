import { Injectable } from '@nestjs/common';
import { InterestTypeEnum } from '@inversiones/shared';
import type { InterestType, PaymentFrequency } from '@inversiones/shared';
import { AmortizationRow } from './dto/create-loan.dto';

@Injectable()
export class AmortizationService {
  private roundToNearestHundred(value: number): number {
    return Math.round(value / 100) * 100;
  }

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

    let dueDate = new Date(startDate);

    if (interestType === InterestTypeEnum.FLAT) {
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
          amount: Math.round(roundedInstallment * 100) / 100,
          principalPart: Math.round(principalPerInstallment * 100) / 100,
          interestPart: Math.round(interestPerInstallment * 100) / 100,
          balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
        });
      }

      const lastPrincipalPart = balance;
      const lastInterestPart = interestPerInstallment;
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      schedule.push({
        installment: term,
        dueDate: new Date(dueDate),
        amount: Math.round((lastPrincipalPart + lastInterestPart) * 100) / 100,
        principalPart: Math.round(lastPrincipalPart * 100) / 100,
        interestPart: Math.round(lastInterestPart * 100) / 100,
        balanceAfter: 0,
      });
    } else if (interestType === InterestTypeEnum.REDUCING) {
      const rawInstallment =
        (principal * (periodicRate * Math.pow(1 + periodicRate, term))) /
        (Math.pow(1 + periodicRate, term) - 1);
      const roundedInstallment = this.roundToNearestHundred(rawInstallment);
      let balance = principal;

      for (let i = 1; i < term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        const interestPart = balance * periodicRate;
        const principalPart = roundedInstallment - interestPart;

        if (principalPart < 0) {
          const safePrincipal = Math.max(balance * 0.01, 0);
          balance -= safePrincipal;
          schedule.push({
            installment: i,
            dueDate: new Date(dueDate),
            amount: Math.round((safePrincipal + interestPart) * 100) / 100,
            principalPart: Math.round(safePrincipal * 100) / 100,
            interestPart: Math.round(interestPart * 100) / 100,
            balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
          });
        } else {
          balance -= principalPart;
          schedule.push({
            installment: i,
            dueDate: new Date(dueDate),
            amount: Math.round(roundedInstallment * 100) / 100,
            principalPart: Math.round(principalPart * 100) / 100,
            interestPart: Math.round(interestPart * 100) / 100,
            balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
          });
        }
      }

      const lastInterestPart = balance * periodicRate;
      const lastAmount = balance + lastInterestPart;
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      schedule.push({
        installment: term,
        dueDate: new Date(dueDate),
        amount: Math.round(lastAmount * 100) / 100,
        principalPart: Math.round(balance * 100) / 100,
        interestPart: Math.round(lastInterestPart * 100) / 100,
        balanceAfter: 0,
      });
    } else if (interestType === InterestTypeEnum.COMPOUND) {
      const totalAmount = principal * Math.pow(1 + periodicRate, term);
      const rawInstallment = totalAmount / term;
      const roundedInstallment = this.roundToNearestHundred(rawInstallment);
      let balance = principal;

      for (let i = 1; i < term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        const interestPart = balance * periodicRate;
        const principalPart = roundedInstallment - interestPart;

        if (principalPart < 0) {
          const safePrincipal = Math.max(balance * 0.01, 0);
          balance -= safePrincipal;
          schedule.push({
            installment: i,
            dueDate: new Date(dueDate),
            amount: Math.round((safePrincipal + interestPart) * 100) / 100,
            principalPart: Math.round(safePrincipal * 100) / 100,
            interestPart: Math.round(interestPart * 100) / 100,
            balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
          });
        } else {
          balance -= principalPart;
          schedule.push({
            installment: i,
            dueDate: new Date(dueDate),
            amount: Math.round(roundedInstallment * 100) / 100,
            principalPart: Math.round(principalPart * 100) / 100,
            interestPart: Math.round(interestPart * 100) / 100,
            balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
          });
        }
      }

      const lastInterestPart = balance * periodicRate;
      const lastAmount = balance + lastInterestPart;
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      schedule.push({
        installment: term,
        dueDate: new Date(dueDate),
        amount: Math.round(lastAmount * 100) / 100,
        principalPart: Math.round(balance * 100) / 100,
        interestPart: Math.round(lastInterestPart * 100) / 100,
        balanceAfter: 0,
      });
    } else if (interestType === InterestTypeEnum.FIXED) {
      const fixedInterest = principal * periodicRate;
      const principalPartPerInstallment = principal / term;
      const rawInstallment = principalPartPerInstallment + fixedInterest;
      const roundedInstallment = this.roundToNearestHundred(rawInstallment);

      const principalPartDiff = roundedInstallment - fixedInterest;
      const adjustedPrincipalPart = principalPartDiff > 0 ? principalPartDiff : principalPartPerInstallment;
      let balance = principal;

      for (let i = 1; i < term; i++) {
        dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
        balance -= adjustedPrincipalPart;

        schedule.push({
          installment: i,
          dueDate: new Date(dueDate),
          amount: Math.round(roundedInstallment * 100) / 100,
          principalPart: Math.round(adjustedPrincipalPart * 100) / 100,
          interestPart: Math.round(fixedInterest * 100) / 100,
          balanceAfter: Math.round(Math.max(0, balance) * 100) / 100,
        });
      }

      const lastPrincipalPart = balance;
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      schedule.push({
        installment: term,
        dueDate: new Date(dueDate),
        amount: Math.round((lastPrincipalPart + fixedInterest) * 100) / 100,
        principalPart: Math.round(lastPrincipalPart * 100) / 100,
        interestPart: Math.round(fixedInterest * 100) / 100,
        balanceAfter: 0,
      });
    } else if (interestType === InterestTypeEnum.INDEFINITE) {
      const interestAmount = principal * periodicRate;
      dueDate = this.addPaymentInterval(dueDate, paymentFrequency);
      schedule.push({
        installment: 1,
        dueDate: new Date(dueDate),
        amount: Math.round(interestAmount * 100) / 100,
        principalPart: 0,
        interestPart: Math.round(interestAmount * 100) / 100,
        balanceAfter: Math.round(principal * 100) / 100,
      });
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
