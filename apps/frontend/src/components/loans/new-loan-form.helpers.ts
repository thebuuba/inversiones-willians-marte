export type LoanCalculationFields = {
  amount: string;
  interestRate: string;
  term: string;
  termUnit: LoanTermUnit;
  amortizationType: string;
  paymentFrequency: string;
  firstPaymentDate: string;
};

export type AmortizationType = 'SIMPLE' | 'INDEFINITE' | 'NO_INTEREST';
export type LoanTermUnit = 'months' | 'fortnights' | 'weeks';

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

export function normalizeLoanTerm(term: string, termUnit: LoanTermUnit): number {
  const parsedTerm = parseStrictNumber(term);
  if (parsedTerm === null) return 0;

  if (termUnit === 'weeks') return Math.round(parsedTerm / 4);
  if (termUnit === 'fortnights') return Math.round(parsedTerm / 2.17);
  return parsedTerm;
}

export function canCalculateLoan(fields: LoanCalculationFields): boolean {
  const amount = parseStrictNumber(fields.amount);
  const interestRate = parseStrictNumber(fields.interestRate);
  const term = normalizeLoanTerm(fields.term, fields.termUnit);
  const firstPaymentDate = fields.firstPaymentDate.trim();
  const parsedFirstPaymentDate = new Date(`${firstPaymentDate}T00:00:00Z`);

  const isIndefinite = fields.amortizationType === 'INDEFINITE';

  return (
    amount !== null &&
    amount > 0 &&
    interestRate !== null &&
    interestRate >= 0 &&
    (isIndefinite || term > 0) &&
    fields.amortizationType.trim().length > 0 &&
    fields.paymentFrequency.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(firstPaymentDate) &&
    !Number.isNaN(parsedFirstPaymentDate.getTime()) &&
    parsedFirstPaymentDate.toISOString().startsWith(firstPaymentDate)
  );
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
    const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

    for (let i = 1; i <= months; i++) {
      const interest = balance * rate;
      const princ = Math.min(payment - interest, balance);
      balance -= princ;
      totalInterest += interest;
      schedule.push({
        number: i,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(princ * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
      });
    }

    return {
      schedule,
      totalPayment: Math.round((principal + totalInterest) * 100) / 100,
      totalPrincipal: principal,
      totalInterest: Math.round(totalInterest * 100) / 100,
      payment,
    };
  }

  const rawPayment = rate > 0
    ? principal * rate * Math.pow(1 + rate, months) / (Math.pow(1 + rate, months) - 1)
    : months > 0 ? principal / months : 0;

  const payment = roundToNearestHundred(rawPayment);
  let balance = principal;
  let totalInterest = 0;
  const schedule: { number: number; payment: number; principal: number; interest: number; balance: number }[] = [];

  for (let i = 1; i < months; i++) {
    const interest = balance * rate;
    const princ = payment - interest;

    if (princ < 0) {
      const safePrincipal = Math.max(balance * 0.01, 0);
      balance -= safePrincipal;
      totalInterest += interest;
      schedule.push({
        number: i,
        payment: Math.round((safePrincipal + interest) * 100) / 100,
        principal: Math.round(safePrincipal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
      });
    } else {
      balance -= princ;
      totalInterest += interest;
      schedule.push({
        number: i,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(princ * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(Math.max(balance, 0) * 100) / 100,
      });
    }
  }

  const lastInterest = balance * rate;
  const lastPayment = balance + lastInterest;
  totalInterest += lastInterest;

  schedule.push({
    number: months,
    payment: Math.round(lastPayment * 100) / 100,
    principal: Math.round(balance * 100) / 100,
    interest: Math.round(lastInterest * 100) / 100,
    balance: 0,
  });

  const totalPayment = Math.round((principal + totalInterest) * 100) / 100;
  return { schedule, totalPayment, totalPrincipal: principal, totalInterest: Math.round(totalInterest * 100) / 100, payment: Math.round(payment * 100) / 100 };
}
