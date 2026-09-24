import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { prisma } from '@inversiones/database';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuditService } from '../audit/audit.service';
import type { PortfolioScope } from '../../common/portfolio-scope';

const adminScope: PortfolioScope = { userId: 'admin', isAdmin: true, portfolioIds: [] };

jest.mock('@inversiones/database', () => ({
  prisma: {
    client: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    systemSettings: { findUnique: jest.fn() },
    $queryRaw: jest.fn(),
  },
  Prisma: {
    empty: '',
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
  },
}));

describe('ClientsService', () => {
  let service: ClientsService;
  const audit = { log: jest.fn() };

  const mockClient = {
    id: 'client-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '809-555-0101',
    identification: '001-1234567-8',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.mocked(prisma.$queryRaw).mockResolvedValue([]);
    jest.mocked(prisma.systemSettings.findUnique).mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientsService, { provide: AuditService, useValue: audit }],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a client', async () => {
      const dto: CreateClientDto = { firstName: 'juan', lastName: 'pérez', phone: '809-555-0101' };
      jest.mocked(prisma.client.create).mockResolvedValue(mockClient as any);

      const result = await service.create(dto, 'user-1');
      expect(result).toEqual(mockClient);
      expect(prisma.client.create).toHaveBeenCalledWith({
        data: { ...dto, firstName: 'Juan', lastName: 'Pérez', createdById: 'user-1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated active clients', async () => {
      jest
        .mocked(prisma.client.findMany)
        .mockResolvedValue([{ ...mockClient, firstName: 'alexauris', lastName: 'diaz' }] as any);
      jest.mocked(prisma.client.count).mockResolvedValue(1);

      const result = await service.findAll(adminScope);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(
        expect.objectContaining({ firstName: 'Alexauris', lastName: 'Diaz' }),
      );
      expect(result.total).toBe(1);
      expect(result.stats).toEqual({
        total: 1,
        active: 1,
        current: 1,
        overdue: 1,
        withoutLoans: 1,
        recent: 1,
        previousRecent: 1,
      });
      expect(result.data[0]).toEqual(
        expect.objectContaining({ balance: 0, loanStatus: 'NO_LOANS' }),
      );
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ AND: expect.arrayContaining([{ active: true }]) }),
        }),
      );
    });

    it('should search clients by name', async () => {
      jest.mocked(prisma.client.findMany).mockResolvedValue([mockClient] as any);
      jest.mocked(prisma.client.count).mockResolvedValue(1);

      const result = await service.findAll(adminScope, 'Juan');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.client.count).toHaveBeenCalledWith({ where: { active: true } });
    });

    it('sums open balances and marks a client late when an unpaid installment passed grace', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 10);
      jest.mocked(prisma.client.findMany).mockResolvedValue([
        {
          ...mockClient,
          _count: { loans: 2 },
          loans: [
            {
              status: 'ACTIVE',
              balance: 1200,
              interestType: 'FLAT',
              endDate: null,
              schedule: [{ dueDate, status: 'PENDING' }],
            },
            { status: 'PAID', balance: 0, interestType: 'FLAT', endDate: null, schedule: [] },
          ],
        },
      ] as any);
      jest.mocked(prisma.client.count).mockResolvedValue(1);

      const result = await service.findAll(adminScope, undefined, 7, 0, 'OVERDUE');

      expect(result.data[0]).toEqual(
        expect.objectContaining({ balance: 1200, loanStatus: 'OVERDUE' }),
      );
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ loans: { some: expect.any(Object) } }),
            ]),
          }),
        }),
      );
    });

    it('scopes client metrics and loan summaries to the collector portfolio', async () => {
      jest.mocked(prisma.client.findMany).mockResolvedValue([]);
      jest.mocked(prisma.client.count).mockResolvedValue(0);
      const scope: PortfolioScope = {
        userId: 'collector-1',
        isAdmin: false,
        portfolioIds: ['portfolio-1'],
      };

      await service.findAll(scope);

      expect(prisma.client.count).toHaveBeenCalledWith({
        where: expect.objectContaining({ active: true, OR: expect.any(Array) }),
      });
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            loans: expect.objectContaining({
              where: expect.objectContaining({ OR: expect.any(Array) }),
            }),
          }),
        }),
      );
    });

    it('uses bounded defaults when pagination query values are malformed', async () => {
      jest.mocked(prisma.client.findMany).mockResolvedValue([]);
      jest.mocked(prisma.client.count).mockResolvedValue(0);

      await service.findAll(adminScope, undefined, Number.NaN, Number.NaN);

      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50, skip: 0 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      jest
        .mocked(prisma.client.findUnique)
        .mockResolvedValue({ ...mockClient, firstName: 'maria', lastName: 'jacquez' } as any);

      const result = await service.findOne(adminScope, 1);
      expect(result).toBeDefined();
      expect(result).toEqual(expect.objectContaining({ firstName: 'Maria', lastName: 'Jacquez' }));
      expect(result.loans).toEqual([]);
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should throw NotFoundException when client not found', async () => {
      jest.mocked(prisma.client.findUnique).mockResolvedValue(null);

      await expect(service.findOne(adminScope, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBasic', () => {
    it('should format old lowercase client names', async () => {
      jest
        .mocked(prisma.client.findUnique)
        .mockResolvedValue({ ...mockClient, firstName: 'maria', lastName: 'jacquez' } as any);

      await expect(service.findBasic(adminScope, 1)).resolves.toEqual(
        expect.objectContaining({ firstName: 'Maria', lastName: 'Jacquez' }),
      );
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      jest.mocked(prisma.client.findUnique).mockResolvedValue(mockClient as any);
      jest
        .mocked(prisma.client.update)
        .mockResolvedValue({ ...mockClient, phone: '809-555-0202' } as any);

      const dto: UpdateClientDto = { phone: '809-555-0202' };
      const result = await service.update(adminScope, 1, dto);
      expect(result.phone).toBe('809-555-0202');
    });

    it('formats updated client names', async () => {
      jest.mocked(prisma.client.findUnique).mockResolvedValue(mockClient as any);
      jest.mocked(prisma.client.update).mockResolvedValue(mockClient as any);

      await service.update(adminScope, 1, { firstName: 'roberto', lastName: 'lopez' });

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { firstName: 'Roberto', lastName: 'Lopez' },
      });
    });

    it('should log changed fields and summarized note actions', async () => {
      const previousNotes = JSON.stringify([
        { id: 1, text: 'Anterior' },
        { id: 2, text: 'Eliminar' },
      ]);
      const nextNotes = JSON.stringify([
        { id: 1, text: 'Actualizada' },
        { id: 3, text: 'Nueva' },
      ]);
      jest
        .mocked(prisma.client.findUnique)
        .mockResolvedValue({ ...mockClient, notes: previousNotes, loans: [] } as any);
      jest
        .mocked(prisma.client.update)
        .mockResolvedValue({ ...mockClient, phone: '809-555-0202', notes: nextNotes } as any);

      await service.update(adminScope, 1, { phone: '809-555-0202', notes: nextNotes }, 'user-1');

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLIENT_UPDATED',
          clientId: 1,
          newValues: {
            changes: [{ field: 'phone', before: '809-555-0101', after: '809-555-0202' }],
          },
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'NOTE_UPDATED', clientId: 1 }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'NOTE_CREATED', clientId: 1 }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'NOTE_DELETED', clientId: 1 }),
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete a client', async () => {
      jest.mocked(prisma.client.update).mockResolvedValue({ ...mockClient, active: false } as any);

      const result = await service.remove(adminScope, 1, 'user-1');
      expect(result.active).toBe(false);
      expect(audit.log).toHaveBeenCalledWith({
        userId: 'user-1',
        clientId: 1,
        entityType: 'Client',
        entityId: '1',
        action: 'CLIENT_DELETED',
        oldValues: { active: true },
        newValues: { active: false },
      });
    });
  });
});
