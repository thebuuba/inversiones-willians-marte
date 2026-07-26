import { prisma } from '@inversiones/database';
import { NotificationsService } from './notifications.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    task: { findMany: jest.fn() },
    notificationRead: { findMany: jest.fn() },
  },
}));

describe('NotificationsService', () => {
  it('combines assigned tasks and collection alerts while preserving read state', async () => {
    jest.mocked(prisma.task.findMany).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Llamar al proveedor',
        description: null,
        dueDate: new Date('2026-07-26T12:00:00Z'),
        priority: 'HIGH',
        createdById: 'boss-1',
        createdBy: { id: 'boss-1', name: 'Encargado' },
        createdAt: new Date('2026-07-25T12:00:00Z'),
      } as any,
    ]);
    jest
      .mocked(prisma.notificationRead.findMany)
      .mockResolvedValue([{ key: 'collection:loan-1:URGENT' }] as any);
    const reports = {
      collectionPriorities: jest.fn().mockResolvedValue([
        {
          loanId: 'loan-1',
          clientName: 'Ana Pérez',
          suggestedAction: 'Contactar hoy',
          daysOverdue: 20,
          level: 'URGENT',
          lastContactAt: null,
        },
      ]),
    };

    const items = await new NotificationsService(reports as any).findAll('collector-1');

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assignedToId: 'collector-1', status: { not: 'COMPLETED' } },
      }),
    );
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'TASK', read: false, title: 'Llamar al proveedor' }),
        expect.objectContaining({ kind: 'COLLECTION', read: true, title: 'Contactar a Ana Pérez' }),
      ]),
    );
  });
});
