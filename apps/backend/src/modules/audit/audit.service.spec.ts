import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { prisma } from '@inversiones/database';
import type { PortfolioScope } from '../../common/portfolio-scope';

const adminScope: PortfolioScope = { userId: 'admin', isAdmin: true, portfolioIds: [] };

jest.mock('@inversiones/database', () => ({
  prisma: {
    auditLog: { create: jest.fn(), findMany: jest.fn() },
    client: { findUnique: jest.fn() },
    loan: { findMany: jest.fn() },
  },
}));

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService],
    }).compile();
    service = module.get(AuditService);
  });

  afterEach(() => jest.clearAllMocks());

  it('adds a linkable loan number to recent payment audit entries', async () => {
    jest.mocked(prisma.auditLog.findMany).mockResolvedValue([
      {
        id: 'audit-payment',
        action: 'PAYMENT_CREATED',
        entityType: 'Payment',
        entityId: 'payment-1',
        newValues: { loanId: 'loan-1', amount: 500 },
        createdAt: new Date('2026-06-05T10:00:00Z'),
        user: { id: 'user-1', name: 'Rosa' },
      },
    ] as any);
    jest.mocked(prisma.loan.findMany).mockResolvedValue([{ id: 'loan-1', loanNumber: 12 }] as any);

    const result = await service.findAll();

    expect(result[0]).toEqual(expect.objectContaining({ loanId: 'loan-1', loanNumber: 12 }));
  });

  it('merges reconstructed client activity with audit-backed events newest first', async () => {
    jest.mocked(prisma.client.findUnique).mockResolvedValue({
      id: 7,
      createdAt: new Date('2026-06-01T10:00:00Z'),
      createdBy: { name: 'Ana' },
      loans: [
        {
          id: 'loan-1',
          loanNumber: 12,
          createdAt: new Date('2026-06-02T10:00:00Z'),
          createdBy: { name: 'Luis' },
          payments: [
            {
              id: 'payment-1',
              amount: 500,
              createdAt: new Date('2026-06-04T10:00:00Z'),
              receivedBy: { name: 'Marta' },
            },
          ],
        },
      ],
      documents: [
        {
          id: 'doc-1',
          name: 'Cédula',
          createdAt: new Date('2026-06-03T10:00:00Z'),
          uploadedBy: { name: 'Pedro' },
        },
      ],
    } as any);
    jest.mocked(prisma.auditLog.findMany).mockResolvedValue([
      {
        id: 'audit-1',
        action: 'CLIENT_UPDATED',
        entityType: 'Client',
        entityId: '7',
        newValues: { changes: [{ field: 'phone', before: '809', after: '829' }] },
        createdAt: new Date('2026-06-05T10:00:00Z'),
        user: { name: 'Rosa' },
      },
    ] as any);

    const result = await service.findClientHistory(adminScope, 7);

    expect(result.map((event) => event.id)).toEqual([
      'audit:audit-1',
      'payment:payment-1',
      'document:doc-1',
      'loan:loan-1',
      'client:7',
    ]);
    expect(result[0]).toEqual(
      expect.objectContaining({
        type: 'Cliente',
        title: 'Cliente actualizado',
        detail: 'Teléfono: 809 → 829',
        author: 'Rosa',
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        type: 'Pago',
        title: 'Pago registrado en Préstamo #12',
        amount: 500,
      }),
    );
  });
});
