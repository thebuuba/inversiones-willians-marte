import {
  calculateIndefiniteInterest,
  calculateProratedIndefiniteInterest,
} from './indefinite-loan';

describe('indefinite loan calculations', () => {
  it('rounds the recurring interest payment to a whole hundred', () => {
    expect(calculateIndefiniteInterest(39404, 18, 'MONTHLY')).toBe(600);
  });

  it('prorates capital additions inside the current period', () => {
    expect(
      calculateProratedIndefiniteInterest({
        currentPrincipal: 8000,
        annualRate: 120,
        frequency: 'MONTHLY',
        periodStart: new Date('2026-05-25T00:00:00.000Z'),
        periodEnd: new Date('2026-06-25T00:00:00.000Z'),
        capitalMovements: [{ amount: 3000, effectiveDate: new Date('2026-06-20T00:00:00.000Z') }],
      }),
    ).toBe(500);
  });
});
