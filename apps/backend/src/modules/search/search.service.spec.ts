import { prisma } from '@inversiones/database';
import { SearchService } from './search.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    client: { findMany: jest.fn() },
    loan: { findMany: jest.fn() },
    investor: { findMany: jest.fn() },
  },
}));

describe('SearchService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks a matched investor with a loan as investor and borrower', async () => {
    jest
      .mocked(prisma.client.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ identification: '001-1234567-8' }] as never);
    jest.mocked(prisma.loan.findMany).mockResolvedValue([]);
    jest.mocked(prisma.investor.findMany).mockResolvedValueOnce([
      {
        id: 'investor-1',
        name: 'Ana Pérez',
        code: 'INV-0001',
        cedula: '001-1234567-8',
        phone: null,
      },
    ] as never);

    const results = await new SearchService().search('Ana');

    expect(results).toEqual([
      expect.objectContaining({
        kind: 'INVESTOR',
        href: '/inversionistas/investor-1',
        roles: ['INVESTOR', 'BORROWER'],
      }),
    ]);
  });
});
