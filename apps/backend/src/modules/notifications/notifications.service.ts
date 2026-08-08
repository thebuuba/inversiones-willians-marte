import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import type { NotificationItem, TaskPriority } from '@inversiones/shared';
import { ReportsService } from '../reports/reports.service';
import { resolvePortfolioScope, type ScopeUser } from '../../common/portfolio-scope';

const priorityRank: Record<TaskPriority, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

@Injectable()
export class NotificationsService {
  constructor(private readonly reports: ReportsService) {}

  async findAll(user: ScopeUser) {
    const scope = await resolvePortfolioScope(user);
    const [tasks, priorities] = await Promise.all([
      prisma.task.findMany({
        where: { assignedToId: user.id, status: { not: 'COMPLETED' } },
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 50,
      }),
      this.reports.collectionPriorities(scope),
    ]);

    const now = new Date();
    const items: NotificationItem[] = [
      ...tasks.map((task) => {
        const due = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : 'sin-fecha';
        const dueToday = task.dueDate ? task.dueDate.getTime() <= now.getTime() : false;
        const source =
          task.createdById === user.id ? 'Tarea personal' : `Asignada por ${task.createdBy.name}`;
        return {
          key: `task:${task.id}:${dueToday ? due : 'asignada'}`,
          kind: 'TASK' as const,
          title: task.title,
          description: `${source}${task.dueDate ? ` · ${dueToday ? 'Vence hoy o está atrasada' : `Para ${task.dueDate.toLocaleDateString('es-DO')}`}` : ''}`,
          href: '/agenda',
          createdAt: (task.dueDate ?? task.createdAt).toISOString(),
          read: false,
          priority: task.priority,
        };
      }),
      ...priorities.map((item) => ({
        key: `collection:${item.loanId}:${item.level}`,
        kind: 'COLLECTION' as const,
        title: `Contactar a ${item.clientName}`,
        description: `${item.suggestedAction} · ${item.daysOverdue} días de atraso`,
        href: `/prestamos/${item.loanId}`,
        createdAt: item.lastContactAt?.toISOString() ?? now.toISOString(),
        read: false,
        priority: item.level,
      })),
    ];

    const reads = await prisma.notificationRead.findMany({
      where: { userId: user.id, key: { in: items.map((item) => item.key) } },
      select: { key: true },
    });
    const readKeys = new Set(reads.map((read) => read.key));

    return items
      .map((item) => ({ ...item, read: readKeys.has(item.key) }))
      .sort(
        (a, b) =>
          Number(a.read) - Number(b.read) ||
          priorityRank[b.priority] - priorityRank[a.priority] ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async markRead(userId: string, keys: string[]) {
    const uniqueKeys = [...new Set(keys.filter(Boolean))];
    if (uniqueKeys.length === 0) return { marked: 0 };

    await prisma.$transaction(
      uniqueKeys.map((key) =>
        prisma.notificationRead.upsert({
          where: { userId_key: { userId, key } },
          create: { userId, key },
          update: { readAt: new Date() },
        }),
      ),
    );
    return { marked: uniqueKeys.length };
  }
}
