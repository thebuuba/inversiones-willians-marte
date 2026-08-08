import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus, prisma } from '@inversiones/database';
import { CreateRequestDto } from './dto/create-request.dto';
import { formatPersonName } from '../../common/text/name-case';
import { normalizePagination } from '../../common/pagination';
import {
  assertClientAccess,
  clientWhereVisible,
  type PortfolioScope,
} from '../../common/portfolio-scope';

const requestInclude = {
  createdBy: { select: { name: true } },
  client: { select: { id: true, firstName: true, lastName: true } },
} as const;

type LoanRequestDetail = Prisma.LoanRequestGetPayload<{ include: typeof requestInclude }>;

@Injectable()
export class RequestsService {
  async create(
    scope: PortfolioScope,
    dto: CreateRequestDto,
    userId: string,
  ): Promise<LoanRequestDetail> {
    if (dto.clientId) await assertClientAccess(scope, dto.clientId);
    return await this.createWithRetry(dto, userId, 1);
  }

  async findAll(scope: PortfolioScope, take = 100, skip = 0) {
    const pagination = normalizePagination(take, skip, 100);
    const clientScope = clientWhereVisible(scope);
    const where = scope.isAdmin
      ? {}
      : {
          OR: [
            { createdById: scope.userId },
            ...(clientScope ? [{ client: { is: clientScope } }] : []),
          ],
        };
    return prisma.loanRequest.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: pagination.take,
      skip: pagination.skip,
    });
  }

  async findOne(scope: PortfolioScope, id: string) {
    await this.assertRequestAccess(scope, id);
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

  async count(scope: PortfolioScope, status?: string) {
    const where: Prisma.LoanRequestWhereInput = {};
    if (isRequestStatus(status)) where.status = status;
    if (!scope.isAdmin) {
      const clientScope = clientWhereVisible(scope);
      where.OR = [
        { createdById: scope.userId },
        ...(clientScope ? [{ client: { is: clientScope } }] : []),
      ];
    }
    return prisma.loanRequest.count({ where });
  }

  async approve(scope: PortfolioScope, id: string, userId: string) {
    await this.assertRequestAccess(scope, id);
    return this.changePendingStatus(id, 'APPROVED', userId);
  }

  async reject(scope: PortfolioScope, id: string, userId: string) {
    await this.assertRequestAccess(scope, id);
    return this.changePendingStatus(id, 'REJECTED', userId);
  }

  private async assertRequestAccess(scope: PortfolioScope, id: string) {
    if (scope.isAdmin) return;
    const request = await prisma.loanRequest.findUnique({
      where: { id },
      select: { id: true, createdById: true, clientId: true },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.createdById === scope.userId) return;
    if (request.clientId !== null) {
      await assertClientAccess(scope, request.clientId);
      return;
    }
    throw new ForbiddenException('You cannot access this request');
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
