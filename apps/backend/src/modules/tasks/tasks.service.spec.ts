import { prisma } from '@inversiones/database';
import { TasksService } from './tasks.service';

jest.mock('@inversiones/database', () => ({
  prisma: {
    task: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    service = new TasksService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('writes an audit event when a task is deleted', async () => {
    jest.mocked(prisma.task.findUnique).mockResolvedValue({ id: 'task-1', title: 'Cobrar' } as any);
    jest.mocked(prisma.task.delete).mockResolvedValue({ id: 'task-1' } as any);

    await service.remove('task-1', 'admin-1');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin-1',
        action: 'TASK_DELETED',
        entityType: 'Task',
        entityId: 'task-1',
        oldValues: { title: 'Cobrar' },
      }),
    });
  });
});
