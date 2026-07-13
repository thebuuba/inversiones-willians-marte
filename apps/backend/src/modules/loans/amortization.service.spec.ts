import { Test, TestingModule } from '@nestjs/testing';
import { AmortizationService } from './amortization.service';

describe('AmortizationService', () => {
  let service: AmortizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmortizationService],
    }).compile();

    service = module.get<AmortizationService>(AmortizationService);
  });

  const baseParams = {
    principal: 10000,
    interestRate: 12,
    paymentFrequency: 'MONTHLY' as const,
    term: 12,
    startDate: new Date('2026-01-01'),
  };

  describe('FLAT interest', () => {
    it('should calculate correct flat amortization schedule', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'FLAT' });

      expect(schedule).toHaveLength(12);
      expect(schedule[0].installment).toBe(1);
      expect(schedule[11].installment).toBe(12);

      const totalPrincipal = schedule.reduce((sum, r) => sum + r.principalPart, 0);
      const totalInterest = schedule.reduce((sum, r) => sum + r.interestPart, 0);

      expect(totalPrincipal).toBeCloseTo(baseParams.principal, 0);
      expect(totalInterest).toBeCloseTo(1200, 0);
    });

    it('each installment (except last) should have same amount in flat rate', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'FLAT' });
      const amounts = schedule.map((r) => r.amount);

      for (let i = 1; i < amounts.length - 1; i++) {
        expect(amounts[i]).toBeCloseTo(amounts[0], 1);
      }
    });
  });

  describe('REDUCING interest', () => {
    it('creates a finite no-interest schedule when the reducing rate is zero', () => {
      const schedule = service.calculate({
        ...baseParams,
        principal: 1000,
        interestRate: 0,
        term: 3,
        interestType: 'REDUCING',
      });

      expect(schedule).toHaveLength(3);
      expect(schedule.every((row) => Number.isFinite(row.amount))).toBe(true);
      expect(schedule.reduce((sum, row) => sum + row.amount, 0)).toBe(1000);
      expect(schedule.at(-1)?.balanceAfter).toBe(0);
    });

    it('should calculate reducing balance schedule', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'REDUCING' });

      expect(schedule).toHaveLength(12);
      expect(schedule[0].balanceAfter).toBeLessThan(baseParams.principal);
    });

    it('interest part should decrease over time', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'REDUCING' });

      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].interestPart).toBeLessThanOrEqual(schedule[i - 1].interestPart);
      }
    });

    it('total paid should be greater than principal', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'REDUCING' });
      const totalPaid = schedule.reduce((sum, r) => sum + r.amount, 0);

      expect(totalPaid).toBeGreaterThan(baseParams.principal);
    });
  });

  describe('COMPOUND interest', () => {
    it('should calculate compound interest schedule', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'COMPOUND' });

      expect(schedule).toHaveLength(12);
      expect(schedule[0].balanceAfter).toBeLessThan(baseParams.principal);
    });
  });

  describe('FIXED interest', () => {
    it('should calculate fixed interest schedule', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'FIXED' });

      expect(schedule).toHaveLength(12);
      const fixedInterestPerInstallment = (baseParams.principal * (12 / 100)) / 12;

      schedule.forEach((row) => {
        expect(row.interestPart).toBeCloseTo(fixedInterestPerInstallment, 0);
      });
    });

    it('each installment should have same interest part', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'FIXED' });
      const interests = schedule.map((r) => r.interestPart);

      for (let i = 1; i < interests.length; i++) {
        expect(interests[i]).toBeCloseTo(interests[0], 1);
      }
    });
  });

  describe('custom payments', () => {
    it('keeps regular custom payments and adjusts the final installment to close the balance', () => {
      const schedule = service.calculate({
        principal: 30000,
        interestRate: 48,
        interestType: 'FIXED',
        paymentFrequency: 'MONTHLY',
        term: 12,
        startDate: new Date('2026-08-09'),
        customPayment: 2000,
      });

      expect(schedule).toHaveLength(12);
      expect(schedule.slice(0, -1).map((row) => row.amount)).toEqual(
        Array.from({ length: 11 }, () => 2000),
      );
      expect(schedule[2]).toMatchObject({
        amount: 2000,
        interestPart: 1135,
        principalPart: 865,
        balanceAfter: 27503,
      });
      expect(schedule[11].amount).toBeGreaterThan(2000);
      expect(schedule[11].balanceAfter).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('calculates date-only monthly installments independently of the server timezone', () => {
      const schedule = service.calculate({
        principal: 1000,
        interestRate: 0,
        interestType: 'REDUCING',
        paymentFrequency: 'MONTHLY',
        term: 2,
        startDate: new Date('2026-01-01'),
      });

      expect(schedule.map((row) => row.dueDate.toISOString().slice(0, 10))).toEqual([
        '2026-02-01',
        '2026-03-01',
      ]);
    });

    it('should handle 1-term loan', () => {
      const schedule = service.calculate({
        ...baseParams,
        interestType: 'FLAT',
        term: 1,
      });

      expect(schedule).toHaveLength(1);
      expect(schedule[0].balanceAfter).toBe(0);
    });

    it('should handle daily frequency', () => {
      const schedule = service.calculate({
        ...baseParams,
        interestType: 'FLAT',
        paymentFrequency: 'DAILY',
        term: 30,
      });

      expect(schedule).toHaveLength(30);
    });

    it('should handle weekly frequency', () => {
      const schedule = service.calculate({
        ...baseParams,
        interestType: 'FLAT',
        paymentFrequency: 'WEEKLY',
        term: 4,
      });

      expect(schedule).toHaveLength(4);
    });
  });
});
