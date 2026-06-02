import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';

export interface HistoryEvent {
  id: string;
  type: 'Cliente' | 'Préstamo' | 'Pago' | 'Documento' | 'Nota';
  title: string;
  detail?: string;
  amount?: number;
  author: string;
  createdAt: Date;
}

const clientFieldLabels: Record<string, string> = {
  firstName: 'Nombre',
  lastName: 'Apellido',
  phone: 'Teléfono',
  altPhone: 'Teléfono alternativo',
  email: 'Correo',
  identification: 'Cédula',
  address: 'Dirección',
  birthDate: 'Fecha de nacimiento',
  gender: 'Género',
  maritalStatus: 'Estado civil',
  nationality: 'Nacionalidad',
  dependents: 'Dependientes',
  active: 'Estado',
};

@Injectable()
export class AuditService {
  async log(params: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    clientId?: number;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        clientId: params.clientId,
        oldValues: (params.oldValues ?? undefined) as any,
        newValues: (params.newValues ?? undefined) as any,
      },
    });
  }

  async findAll(entityType?: string, entityId?: string) {
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    return prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
  }

  async findClientHistory(clientId: number): Promise<HistoryEvent[]> {
    const [client, audits] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        include: {
          createdBy: { select: { name: true } },
          loans: {
            include: {
              createdBy: { select: { name: true } },
              payments: { include: { receivedBy: { select: { name: true } } } },
            },
          },
          documents: { include: { uploadedBy: { select: { name: true } } } },
        },
      }),
      prisma.auditLog.findMany({
        where: { clientId },
        include: { user: { select: { name: true } } },
      }),
    ]);

    if (!client) return [];

    const events: HistoryEvent[] = [{
      id: `client:${client.id}`,
      type: 'Cliente',
      title: 'Cliente creado',
      author: client.createdBy.name,
      createdAt: client.createdAt,
    }];

    for (const loan of client.loans) {
      events.push({
        id: `loan:${loan.id}`,
        type: 'Préstamo',
        title: `Préstamo #${loan.loanNumber} creado`,
        author: loan.createdBy.name,
        createdAt: loan.createdAt,
      });
      for (const payment of loan.payments) {
        events.push({
          id: `payment:${payment.id}`,
          type: 'Pago',
          title: `Pago registrado en Préstamo #${loan.loanNumber}`,
          amount: Number(payment.amount),
          author: payment.receivedBy.name,
          createdAt: payment.createdAt,
        });
      }
    }

    for (const document of client.documents) {
      events.push({
        id: `document:${document.id}`,
        type: 'Documento',
        title: `Documento subido: ${document.name}`,
        author: document.uploadedBy.name,
        createdAt: document.createdAt,
      });
    }

    events.push(...audits.map((audit) => this.mapAuditEvent(audit)));
    return events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private mapAuditEvent(audit: any): HistoryEvent {
    const type = audit.action.startsWith('NOTE_') ? 'Nota' : audit.action.startsWith('DOCUMENT_') ? 'Documento' : 'Cliente';
    const titles: Record<string, string> = {
      CLIENT_UPDATED: 'Cliente actualizado',
      DOCUMENT_DELETED: `Documento eliminado: ${audit.newValues?.name ?? 'Documento'}`,
      NOTE_CREATED: 'Nota creada',
      NOTE_UPDATED: 'Nota actualizada',
      NOTE_DELETED: 'Nota eliminada',
    };
    const changes = Array.isArray(audit.newValues?.changes) ? audit.newValues.changes : [];
    const detail = changes.length > 0
      ? changes.map((change: any) => `${clientFieldLabels[change.field] ?? change.field}: ${change.before ?? '—'} → ${change.after ?? '—'}`).join(' · ')
      : undefined;

    return {
      id: `audit:${audit.id}`,
      type,
      title: titles[audit.action] ?? audit.action,
      detail,
      author: audit.user?.name ?? 'Sistema',
      createdAt: audit.createdAt,
    };
  }
}
