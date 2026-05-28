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

    it('each installment should have same amount in flat rate', () => {
      const schedule = service.calculate({ ...baseParams, interestType: 'FLAT' });
      const amounts = schedule.map((r) => r.amount);

      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i]).toBeCloseTo(amounts[0], 1);
      }
    });
  });

  describe('REDUCING interest', () => {
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

  describe('edge cases', () => {
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
