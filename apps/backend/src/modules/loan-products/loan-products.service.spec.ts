import { prisma } from '@inversiones/database';
import { LoanProductsService } from './loan-products.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    loanProduct: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('LoanProductsService', () => {
  let service: LoanProductsService;

  beforeEach(() => {
    service = new LoanProductsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes an audit event when a product is deactivated', async () => {
    jest.mocked(prisma.loanProduct.findUnique).mockResolvedValue({
      id: 'product-1',
      name: 'Personal',
      active: true,
    } as any);
    jest
      .mocked(prisma.loanProduct.update)
      .mockResolvedValue({ id: 'product-1', active: false } as any);

    await service.remove('product-1', 'admin-1');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        action: 'LOAN_PRODUCT_DELETED',
        entityType: 'LoanProduct',
        entityId: 'product-1',
        oldValues: { active: true, name: 'Personal' },
        newValues: { active: false },
      }),
    });
  });
});
