import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ClientsService {
  constructor(private audit: AuditService) {}

  async create(dto: CreateClientDto, userId: string) {
    return prisma.client.create({
      data: { ...dto, createdById: userId },
    });
  }

  async findAll(search?: string, take = 50, skip = 0) {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { identification: { contains: search } },
          ],
        }
      : {};

    const fullWhere = { ...where, active: true };

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where: fullWhere,
        include: { _count: { select: { loans: true } } },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.client.count({ where: fullWhere }),
    ]);

    return { data, total };
  }

  async findBasic(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        identification: true,
        phone: true,
        active: true,
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async findOne(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        loans: {
          include: {
            product: true,
            portfolio: { select: { id: true, name: true } },
            schedule: {
              select: { dueDate: true, status: true, amount: true, paidAmount: true },
              orderBy: { dueDate: 'asc' },
            },
            _count: { select: { payments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: number, dto: UpdateClientDto, userId?: string) {
    const previous = await this.findOne(id);
    const updated = await prisma.client.update({ where: { id }, data: dto });

    if (userId) {
      const changes = Object.entries(dto)
        .filter(([field, value]) => field !== 'notes' && previous[field as keyof typeof previous] !== value)
        .map(([field, value]) => ({ field, before: previous[field as keyof typeof previous] ?? null, after: value ?? null }));

      if (changes.length > 0) {
        await this.audit.log({ userId, clientId: id, entityType: 'Client', entityId: String(id), action: 'CLIENT_UPDATED', newValues: { changes } });
      }

      if (dto.notes !== undefined && dto.notes !== previous.notes) {
        await this.logNoteChanges(id, userId, previous.notes, dto.notes);
      }
    }

    return updated;
  }

  private async logNoteChanges(clientId: number, userId: string, previousNotes?: string | null, nextNotes?: string | null) {
    const parse = (value?: string | null) => {
      try {
        const notes = value ? JSON.parse(value) : [];
        return Array.isArray(notes) ? notes : [];
      } catch {
        return [];
      }
    };
    const previous = parse(previousNotes);
    const next = parse(nextNotes);
    const previousById = new Map(previous.map((note: any) => [note.id, note]));
    const nextById = new Map(next.map((note: any) => [note.id, note]));

    for (const note of next) {
      const oldNote = previousById.get(note.id);
      if (!oldNote) {
        await this.audit.log({ userId, clientId, entityType: 'ClientNote', entityId: String(note.id), action: 'NOTE_CREATED' });
      } else if (oldNote.text !== note.text) {
        await this.audit.log({ userId, clientId, entityType: 'ClientNote', entityId: String(note.id), action: 'NOTE_UPDATED' });
      }
    }
    for (const note of previous) {
      if (!nextById.has(note.id)) {
        await this.audit.log({ userId, clientId, entityType: 'ClientNote', entityId: String(note.id), action: 'NOTE_DELETED' });
      }
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return prisma.client.update({ where: { id }, data: { active: false } });
  }
}
