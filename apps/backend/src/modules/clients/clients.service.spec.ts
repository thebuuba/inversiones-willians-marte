import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { prisma } from '@inversiones/database';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuditService } from '../audit/audit.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    client: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
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
      const dto: CreateClientDto = { firstName: 'Juan', lastName: 'Pérez', phone: '809-555-0101' };
      jest.mocked(prisma.client.create).mockResolvedValue(mockClient as any);

      const result = await service.create(dto, 'user-1');
      expect(result).toEqual(mockClient);
      expect(prisma.client.create).toHaveBeenCalledWith({
        data: { ...dto, createdById: 'user-1' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated active clients', async () => {
      jest.mocked(prisma.client.findMany).mockResolvedValue([mockClient] as any);
      jest.mocked(prisma.client.count).mockResolvedValue(1);

      const result = await service.findAll();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(prisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
        }),
      );
    });

    it('should search clients by name', async () => {
      jest.mocked(prisma.client.findMany).mockResolvedValue([mockClient] as any);
      jest.mocked(prisma.client.count).mockResolvedValue(1);

      const result = await service.findAll('Juan');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      jest.mocked(prisma.client.findUnique).mockResolvedValue(mockClient as any);

      const result = await service.findOne(1);
      expect(result).toBeDefined();
      expect(result.loans).toEqual([]);
      expect(prisma.client.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should throw NotFoundException when client not found', async () => {
      jest.mocked(prisma.client.findUnique).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a client', async () => {
      jest.mocked(prisma.client.findUnique).mockResolvedValue(mockClient as any);
      jest
        .mocked(prisma.client.update)
        .mockResolvedValue({ ...mockClient, phone: '809-555-0202' } as any);

      const dto: UpdateClientDto = { phone: '809-555-0202' };
      const result = await service.update(1, dto);
      expect(result.phone).toBe('809-555-0202');
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

      await service.update(1, { phone: '809-555-0202', notes: nextNotes }, 'user-1');

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
      jest.mocked(prisma.client.findUnique).mockResolvedValue(mockClient as any);
      jest.mocked(prisma.client.update).mockResolvedValue({ ...mockClient, active: false } as any);

      const result = await service.remove(1, 'user-1');
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
