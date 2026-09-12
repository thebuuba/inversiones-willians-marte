import { ForbiddenException } from '@nestjs/common';
import { LoansController } from './loans.controller';
import {
  assertClientAccess,
  assertLoanAccess,
  resolvePortfolioScope,
} from '../../common/portfolio-scope';

jest.mock('../../common/portfolio-scope', () => ({
  assertClientAccess: jest.fn(),
  assertLoanAccess: jest.fn(),
  resolvePortfolioScope: jest.fn(),
}));

describe('LoansController creation scope', () => {
  const loans = { create: jest.fn() };
  const controller = new LoansController(loans as never);
  const collector = { id: 'collector-1', role: 'COLLECTOR' as const };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(resolvePortfolioScope).mockResolvedValue({
      userId: collector.id,
      isAdmin: false,
      portfolioIds: ['portfolio-1'],
    });
    jest.mocked(assertClientAccess).mockResolvedValue();
    jest.mocked(assertLoanAccess).mockResolvedValue();
    loans.create.mockResolvedValue({ id: 'loan-new' });
  });

  it('rejects creating a loan in an unassigned portfolio', async () => {
    await expect(
      controller.create(
        {
          clientId: 1,
          productId: 'product-1',
          principal: 1000,
          term: 1,
          startDate: '2026-09-01',
          portfolioId: 'portfolio-other',
        },
        collector,
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(assertClientAccess).toHaveBeenCalledWith(
      expect.objectContaining({ userId: collector.id }),
      1,
    );
    expect(loans.create).not.toHaveBeenCalled();
  });

  it('validates every source loan before refinancing or re-engagement', async () => {
    await controller.create(
      {
        clientId: 1,
        productId: 'product-1',
        principal: 2000,
        term: 1,
        startDate: '2026-09-01',
        operationType: 'REENGAGEMENT',
        sourceLoanIds: ['loan-a', 'loan-b'],
        portfolioId: 'portfolio-1',
      },
      collector,
    );

    expect(assertLoanAccess).toHaveBeenCalledTimes(2);
    expect(assertLoanAccess).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ userId: collector.id }),
      'loan-a',
    );
    expect(assertLoanAccess).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ userId: collector.id }),
      'loan-b',
    );
    expect(loans.create).toHaveBeenCalledWith(expect.any(Object), collector.id);
  });

  it('allows an assigned portfolio after validating client access', async () => {
    await controller.create(
      {
        clientId: 1,
        productId: 'product-1',
        principal: 1000,
        term: 1,
        startDate: '2026-09-01',
        portfolioId: 'portfolio-1',
      },
      collector,
    );

    expect(assertClientAccess).toHaveBeenCalledTimes(1);
    expect(loans.create).toHaveBeenCalledTimes(1);
  });
});
