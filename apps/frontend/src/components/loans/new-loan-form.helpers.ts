export type LoanCalculationFields = {
  amount: string;
  interestRate: string;
  term: string;
  termUnit: LoanTermUnit;
  amortizationType: string;
  paymentFrequency: string;
  firstPaymentDate: string;
  customPayment?: string;
};

export type AmortizationType = 'SIMPLE' | 'INDEFINITE' | 'NO_INTEREST';
export type LoanTermUnit = 'months' | 'fortnights' | 'weeks';
export type LoanPaymentFrequency = 'MONTHLY' | 'FORTNIGHTLY' | 'WEEKLY';

export function parseNumber(value: string): number {
  const parsed = Number(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseStrictNumber(value: string): number | null {
  const trimmedValue = value.trim();
  if (!/^(?:\d+\.?\d*|\.\d+)$/.test(trimmedValue)) return null;

  const parsed = Number(trimmedValue);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeLoanTerm(term: string, _termUnit: LoanTermUnit): number {
  void _termUnit;
  const parsedTerm = parseStrictNumber(term);
  if (parsedTerm === null) return 0;

  return Math.round(parsedTerm);
}

export function getPeriodicInterestRate(monthlyRate: number, frequency: LoanPaymentFrequency): number {
  if (frequency === 'FORTNIGHTLY') return monthlyRate / 2;
  if (frequency === 'WEEKLY') return monthlyRate / 4;
  return monthlyRate;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function addMonthsPreservingEndOfMonth(date: Date, months: number): Date {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + months, day);
  if (next.getDate() !== day) next.setDate(0);
  return next;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function buildLocalDate(year: number, month: number, day: number): Date {
  return new Date(year, month, Math.min(day, daysInMonth(year, month)));
}

function addFortnightByMonthHalves(date: Date, fortnights: number): Date {
  let year = date.getFullYear();
  let month = date.getMonth();
  const day = date.getDate();

  if (day <= 15) {
    month += Math.floor(fortnights / 2);
    const targetDay = fortnights % 2 === 0 ? day : day + 15;
    return buildLocalDate(year, month, targetDay);
  }

  const firstHalfDay = day - 15;
  const monthOffset = Math.ceil(fortnights / 2);
  month += monthOffset;
  const targetDay = fortnights % 2 === 1 ? firstHalfDay : day;
  year += Math.floor(month / 12);
  month %= 12;

  return buildLocalDate(year, month, targetDay);
}

export function getInstallmentIsoDate(firstPaymentDate: string, installmentNumber: number, frequency: LoanPaymentFrequency): string {
  const start = parseIsoDate(firstPaymentDate);
  if (!start || installmentNumber <= 0) return firstPaymentDate || '—';

  const offset = installmentNumber - 1;
  if (frequency === 'MONTHLY') return toIsoDate(addMonthsPreservingEndOfMonth(start, offset));
  if (frequency === 'FORTNIGHTLY') return toIsoDate(addFortnightByMonthHalves(start, offset));

  const next = new Date(start);
  next.setDate(start.getDate() + offset * 7);
  return toIsoDate(next);
}

export function canCalculateLoan(fields: LoanCalculationFields): boolean {
  const amount = parseStrictNumber(fields.amount);
  const interestRate = parseStrictNumber(fields.interestRate);
  const term = normalizeLoanTerm(fields.term, fields.termUnit);
  const firstPaymentDate = fields.firstPaymentDate.trim();
  const parsedFirstPaymentDate = new Date(`${firstPaymentDate}T00:00:00Z`);
  const customPayment = parseStrictNumber(fields.customPayment ?? '');

  const isIndefinite = fields.amortizationType === 'INDEFINITE';
  const hasRateOrCustomPayment = (interestRate !== null && interestRate >= 0) || (customPayment !== null && customPayment > 0);

  return (
    amount !== null &&
    amount > 0 &&
    hasRateOrCustomPayment &&
    (isIndefinite || term > 0) &&
    fields.amortizationType.trim().length > 0 &&
    fields.paymentFrequency.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(firstPaymentDate) &&
    !Number.isNaN(parsedFirstPaymentDate.getTime()) &&
    parsedFirstPaymentDate.toISOString().startsWith(firstPaymentDate)
  );
}

export function solveRate(principal: number, payment: number, months: number): number {
  if (payment <= 0 || principal <= 0 || months <= 0) return 0;

  let low = 0.000001;
  let high = 0.5;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const onePlusR = 1 + mid;
    const onePlusR_n = Math.pow(onePlusR, months);
    const calcPayment = principal * mid * onePlusR_n / (onePlusR_n - 1);

    if (calcPayment > payment) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round(((low + high) / 2) * 10000) / 10000;
}

function roundToNearestHundred(value: number): number {
  return Math.round(value / 100) * 100;
}

export function computeSchedule(principal: number, periodicRate: number, months: number, amortizationType: AmortizationType = 'SIMPLE', customPayment?: string) {
  if (months <= 0) {
    return { schedule: [], totalPayment: 0, totalPrincipal: 0, totalInterest: 0, payment: 0 };
  }

  const rate = periodicRate / 100;
  const useCustomPayment = customPayment && parseNumber(customPayment) > 0;

  if (amortizationType === 'NO_INTEREST') {
    const payment = months > 0 ? principal / months : 0;
    let balance = principal;
    const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

    for (let i = 1; i <= months; i++) {
      const princ = Math.min(payment, balance);
      balance -= princ;
      schedule.push({
        number: i,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(princ * 100) / 100,
        interest: 0,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
      });
    }

    return { schedule, totalPayment: principal, totalPrincipal: principal, totalInterest: 0, payment: Math.round(payment * 100) / 100 };
  }

  if (amortizationType === 'INDEFINITE') {
    const rawInterest = principal * rate;
    const roundedPayment = useCustomPayment ? Math.round(rawInterest * 100) / 100 : roundToNearestHundred(rawInterest);
    const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [
      {
        number: 1,
        payment: roundedPayment,
        principal: 0,
        interest: roundedPayment,
        balance: Math.round(principal * 100) / 100,
      },
    ];

    return { schedule, totalPayment: roundedPayment, totalPrincipal: 0, totalInterest: roundedPayment, payment: roundedPayment };
  }

  if (useCustomPayment) {
    const payment = parseNumber(customPayment);
    let balance = principal;
    let totalInterest = 0;
    let totalPayment = 0;
    const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

    for (let i = 1; i <= months; i++) {
      const interestDue = balance * rate;
      const interest = Math.min(payment, interestDue);
      const princ = Math.min(Math.max(payment - interest, 0), balance);
      const installmentPayment = interest + princ;
      balance -= princ;
      totalInterest += interest;
      totalPayment += installmentPayment;
      schedule.push({
        number: i,
        payment: Math.round(installmentPayment * 100) / 100,
        principal: Math.round(princ * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
      });
    }

    return {
      schedule,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalPrincipal: principal,
      totalInterest: Math.round(totalInterest * 100) / 100,
      payment,
    };
  }

  const fixedInterest = principal * rate;
  const principalPartPerInstallment = principal / months;
  const rawPayment = principalPartPerInstallment + fixedInterest;
  const payment = roundToNearestHundred(rawPayment);
  const adjustedPrincipalPart = payment - fixedInterest;
  let balance = principal;
  let totalInterest = 0;
  const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

  for (let i = 1; i < months; i++) {
    balance -= adjustedPrincipalPart;
    totalInterest += fixedInterest;
    schedule.push({
      number: i,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(adjustedPrincipalPart * 100) / 100,
      interest: Math.round(fixedInterest * 100) / 100,
      balance: Math.round(Math.max(balance, 0) * 100) / 100,
    });
  }

  const lastPrincipalPart = balance;
  totalInterest += fixedInterest;
  schedule.push({
    number: months,
    payment: Math.round((lastPrincipalPart + fixedInterest) * 100) / 100,
    principal: Math.round(lastPrincipalPart * 100) / 100,
    interest: Math.round(fixedInterest * 100) / 100,
    balance: 0,
  });

  const totalPayment = Math.round((principal + totalInterest) * 100) / 100;
  return { schedule, totalPayment, totalPrincipal: principal, totalInterest: Math.round(totalInterest * 100) / 100, payment: Math.round(payment * 100) / 100 };
}
