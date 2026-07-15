import { LoanPayoffService } from './loan-payoff.service';

describe('LoanPayoffService', () => {
  const service = new LoanPayoffService();

  it('prorates indefinite loan interest after a capital addition', () => {
    const quote = service.quote(
      {
        id: 'loan-1',
        principal: 8000,
        interestRate: 120,
        interestType: 'INDEFINITE',
        paymentFreq: 'MONTHLY',
        startDate: new Date('2026-05-25T00:00:00.000Z'),
        schedule: [],
        capitalMovements: [{ amount: 3000, effectiveDate: new Date('2026-06-20T00:00:00.000Z') }],
      },
      new Date('2026-06-25T00:00:00.000Z'),
    );

    expect(quote).toMatchObject({
      capitalOutstanding: 8000,
      earnedInterest: 600,
      dailyInterest: 26.67,
      daysGenerated: 30,
      totalToPay: 8600,
    });
  });

  it('does not charge the current indefinite interest twice after it was paid', () => {
    const dueDate = new Date('2026-06-25T00:00:00.000Z');
    const quote = service.quote(
      {
        id: 'loan-1',
        principal: 5000,
        interestRate: 120,
        interestType: 'INDEFINITE',
        paymentFreq: 'MONTHLY',
        startDate: new Date('2026-05-25T00:00:00.000Z'),
        schedule: [
          {
            id: 's1',
            dueDate,
            amount: 500,
            principalPart: 0,
            interestPart: 500,
            paidAmount: 500,
          },
        ],
        payments: [
          {
            paymentDate: dueDate,
            allocations: [{ scheduleId: 's1', amount: 500, type: 'INTEREST' }],
          },
        ],
      },
      dueDate,
    );

    expect(quote.earnedInterest).toBe(0);
    expect(quote.totalToPay).toBe(5000);
  });

  it('does not charge generated interest until it rounds near RD$50', () => {
    const quote = service.quote(
      {
        id: 'loan-1',
        principal: 5000,
        interestRate: 120,
        interestType: 'INDEFINITE',
        paymentFreq: 'MONTHLY',
        startDate: new Date('2026-05-25T00:00:00.000Z'),
        schedule: [],
      },
      new Date('2026-05-26T00:00:00.000Z'),
    );

    expect(quote.earnedInterest).toBe(0);
    expect(quote.totalToPay).toBe(5000);
  });

  it('discounts unearned interest for fixed loans paid early', () => {
    const quote = service.quote(
      {
        id: 'loan-1',
        principal: 120000,
        interestRate: 120,
        interestType: 'FIXED',
        paymentFreq: 'MONTHLY',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        schedule: [
          {
            id: 's1',
            dueDate: new Date('2026-02-01T00:00:00.000Z'),
            amount: 22000,
            principalPart: 10000,
            interestPart: 12000,
            paidAmount: 22000,
          },
          {
            id: 's2',
            dueDate: new Date('2026-03-01T00:00:00.000Z'),
            amount: 22000,
            principalPart: 10000,
            interestPart: 12000,
            paidAmount: 0,
          },
          {
            id: 's3',
            dueDate: new Date('2026-04-01T00:00:00.000Z'),
            amount: 22000,
            principalPart: 10000,
            interestPart: 12000,
            paidAmount: 0,
          },
        ],
        payments: [
          {
            allocations: [
              { scheduleId: 's1', amount: 12000, type: 'INTEREST' },
              { scheduleId: 's1', amount: 10000, type: 'PRINCIPAL' },
            ],
          },
        ],
      },
      new Date('2026-02-16T00:00:00.000Z'),
    );

    expect(quote.capitalOutstanding).toBe(110000);
    expect(quote.earnedInterest).toBe(6450);
    expect(quote.unearnedInterestDiscount).toBe(17550);
    expect(quote.totalToPay).toBe(116450);
  });
});
