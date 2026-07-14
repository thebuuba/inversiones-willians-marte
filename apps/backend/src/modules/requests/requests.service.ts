import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus, prisma } from '@inversiones/database';
import { CreateRequestDto } from './dto/create-request.dto';
import { formatPersonName } from '../../common/text/name-case';
import { normalizePagination } from '../../common/pagination';

const requestInclude = {
  createdBy: { select: { name: true } },
  client: { select: { id: true, firstName: true, lastName: true } },
} as const;

type LoanRequestDetail = Prisma.LoanRequestGetPayload<{ include: typeof requestInclude }>;

@Injectable()
export class RequestsService {
  async create(dto: CreateRequestDto, userId: string): Promise<LoanRequestDetail> {
    return await this.createWithRetry(dto, userId, 1);
  }

  async findAll(take = 100, skip = 0) {
    const pagination = normalizePagination(take, skip, 100);
    return prisma.loanRequest.findMany({
      include: {
        createdBy: { select: { name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: pagination.take,
      skip: pagination.skip,
    });
  }

  async findOne(id: string) {
    const request = await prisma.loanRequest.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async count(status?: string) {
    const where: Prisma.LoanRequestWhereInput = {};
    if (isRequestStatus(status)) where.status = status;
    return prisma.loanRequest.count({ where });
  }

  async approve(id: string, userId: string) {
    return this.changePendingStatus(id, 'APPROVED', userId);
  }

  async reject(id: string, userId: string) {
    return this.changePendingStatus(id, 'REJECTED', userId);
  }

  private async createWithRetry(
    dto: CreateRequestDto,
    userId: string,
    attempt: number,
  ): Promise<LoanRequestDetail> {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const count = await tx.loanRequest.count();
          const code = `SOL-${String(count + 1).padStart(4, '0')}`;
          const request = await tx.loanRequest.create({
            data: {
              ...dto,
              firstName: formatPersonName(dto.firstName),
              lastName: formatPersonName(dto.lastName),
              amount: dto.amount,
              code,
              createdById: userId,
              clientId: dto.clientId ?? null,
            },
            include: requestInclude,
          });
          await tx.auditLog.create({
            data: {
              userId,
              action: 'LOAN_REQUEST_CREATED',
              entityType: 'LoanRequest',
              entityId: request.id,
              clientId: request.clientId,
              newValues: { code, amount: dto.amount, status: request.status },
            },
          });
          return request;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if ((error.code === 'P2002' || error.code === 'P2034') && attempt < 3) {
          return await this.createWithRetry(dto, userId, attempt + 1);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('No se pudo reservar un código de solicitud único');
        }
      }
      throw error;
    }
  }

  private async changePendingStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    userId: string,
  ): Promise<LoanRequestDetail> {
    return prisma.$transaction(async (tx) => {
      const changed = await tx.loanRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status },
      });
      if (changed.count === 0) {
        const existing = await tx.loanRequest.findUnique({ where: { id }, select: { id: true } });
        if (!existing) throw new NotFoundException('Request not found');
        throw new BadRequestException('Only pending requests can change status');
      }

      const request = await tx.loanRequest.findUniqueOrThrow({
        where: { id },
        include: requestInclude,
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: status === 'APPROVED' ? 'LOAN_REQUEST_APPROVED' : 'LOAN_REQUEST_REJECTED',
          entityType: 'LoanRequest',
          entityId: id,
          clientId: request.clientId,
          oldValues: { status: 'PENDING' },
          newValues: { status },
        },
      });
      return request;
    });
  }
}

function isRequestStatus(value: string | undefined): value is RequestStatus {
  return (
    value === 'PENDING' || value === 'UNDER_REVIEW' || value === 'APPROVED' || value === 'REJECTED'
  );
}
