import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { prisma, Prisma } from '@inversiones/database';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { getInvestmentPeriodStatus } from '../investments/investment-period-status';
import { formatPersonName } from '../../common/text/name-case';

@Injectable()
export class InvestorsService {
  private readonly logger = new Logger(InvestorsService.name);

  async create(dto: CreateInvestorDto, userId: string) {
    try {
      return await this.createWithRetry(dto, userId);
    } catch (error) {
      this.handlePrismaError(error, 'Error al guardar el inversionista');
    }
  }

  private async createWithRetry(
    dto: CreateInvestorDto,
    userId: string,
    attempt = 1,
  ): Promise<unknown> {
    const code = await this.nextInvestorCode();
    try {
      const investor = await prisma.$transaction(async (tx) => {
        const created = await tx.investor.create({
          data: {
            name: formatPersonName(dto.name),
            email: dto.email,
            phone: dto.phone,
            phone2: dto.phone2,
            cedula: dto.cedula,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
            nationality: dto.nationality,
            type: dto.type ?? 'individual',
            photo: dto.photo,
            capital: dto.capital,
            monthlyPayment: dto.monthlyPayment,
            rate: dto.rate,
            startDate: dto.startDate ? new Date(dto.startDate) : null,
            term: dto.term,
            bank: dto.bank,
            notes: dto.notes,
            code,
            createdById: userId,
          },
        });

        await tx.investorInvestment.create({
          data: {
            investorId: created.id,
            code: `${created.code}-01`,
            capital: dto.capital,
            monthlyPayment: dto.monthlyPayment,
            rate: dto.rate,
            startDate: dto.startDate ? new Date(dto.startDate) : null,
            term: dto.term,
            notes: dto.notes,
            createdById: userId,
          },
        });

        return created;
      });
      return this.findOne(investor.id);
    } catch (error) {
      if (
        attempt < 3 &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return this.createWithRetry(dto, userId, attempt + 1);
      }
      throw error;
    }
  }

  private async nextInvestorCode(): Promise<string> {
    const lastInvestor = await prisma.investor.findFirst({
      where: { code: { startsWith: 'INV-' } },
      orderBy: { code: 'desc' },
      select: { code: true },
    });
    const lastSequence = Number(lastInvestor?.code.match(/^INV-(\d+)$/)?.[1] ?? 0);
    return `INV-${String(lastSequence + 1).padStart(4, '0')}`;
  }

  async findAll(take = 100, skip = 0) {
    const investors = await prisma.investor.findMany({
      include: this.investorInclude(),
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return investors.map((investor) => this.decorateInvestor(investor));
  }

  async findOne(id: string) {
    const investor = await prisma.investor.findUnique({
      where: { id },
      include: this.investorInclude(),
    });
    if (!investor) throw new NotFoundException('Investor not found');
    return this.decorateInvestor(investor);
  }

  async update(id: string, dto: UpdateInvestorDto) {
    try {
      await this.findOne(id);
      await prisma.$transaction(async (tx) => {
        await tx.investor.update({
          where: { id },
          data: {
            name: dto.name === undefined ? undefined : formatPersonName(dto.name),
            email: dto.email,
            phone: dto.phone,
            phone2: dto.phone2,
            cedula: dto.cedula,
            birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
            nationality: dto.nationality,
            type: dto.type,
            photo: dto.photo,
            capital: dto.capital,
            monthlyPayment: dto.monthlyPayment,
            rate: dto.rate,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            term: dto.term,
            bank: dto.bank,
            notes: dto.notes,
          },
        });

        const firstInvestment = await tx.investorInvestment.findFirst({
          where: { investorId: id },
          orderBy: { createdAt: 'asc' },
        });
        if (firstInvestment) {
          await tx.investorInvestment.update({
            where: { id: firstInvestment.id },
            data: {
              capital: dto.capital,
              monthlyPayment: dto.monthlyPayment,
              rate: dto.rate,
              startDate: dto.startDate ? new Date(dto.startDate) : undefined,
              term: dto.term,
              notes: dto.notes,
            },
          });
        }
      });
      return this.findOne(id);
    } catch (error) {
      this.handlePrismaError(error, 'Error al actualizar el inversionista');
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);
      return await prisma.$transaction(async (tx) => {
        await tx.investorPayment.deleteMany({ where: { investorId: id } });
        await tx.investorInvestmentMovement.deleteMany({
          where: { investment: { investorId: id } },
        });
        await tx.investorInvestment.deleteMany({ where: { investorId: id } });
        await tx.document.updateMany({ where: { investorId: id }, data: { investorId: null } });
        return tx.investor.delete({ where: { id } });
      });
    } catch (error) {
      this.handlePrismaError(error, 'Error al eliminar el inversionista');
    }
  }

  private handlePrismaError(error: unknown, fallbackMessage: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException(
            'Ya existe un inversionista con ese código. Intenta de nuevo.',
          );
        case 'P2003':
          throw new BadRequestException('Referencia inválida (usuario no encontrado)');
        case 'P2025':
          throw new NotFoundException('Registro no encontrado');
      }
    }
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException ||
      error instanceof InternalServerErrorException
    ) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    this.logger.error(
      `Error en operación de inversionista: ${errorMessage}`,
      error instanceof Error ? error.stack : undefined,
    );
    throw new InternalServerErrorException(fallbackMessage);
  }

  private investorInclude() {
    return {
      investments: {
        include: {
          payments: {
            orderBy: [{ periodYear: 'desc' as const }, { periodMonth: 'desc' as const }],
            take: 200,
          },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 100,
      },
    };
  }

  private decorateInvestor(
    investor: Prisma.InvestorGetPayload<{
      include: ReturnType<InvestorsService['investorInclude']>;
    }>,
  ) {
    const activeInvestments = investor.investments.filter(
      (investment) => investment.status === 'ACTIVE',
    );
    const totalCapital = activeInvestments.reduce(
      (sum, investment) => sum + Number(investment.capital),
      0,
    );
    const totalMonthlyReturn = activeInvestments.reduce(
      (sum, investment) => sum + Number(investment.monthlyPayment),
      0,
    );
    const primaryInvestment = activeInvestments[0] ?? investor.investments[0];

    return {
      ...investor,
      capital: totalCapital,
      monthlyPayment: totalMonthlyReturn,
      rate: primaryInvestment ? Number(primaryInvestment.rate) : Number(investor.rate),
      startDate: primaryInvestment?.startDate ?? investor.startDate,
      term: primaryInvestment?.term ?? investor.term,
      totalCapital,
      totalMonthlyReturn,
      activeInvestments: activeInvestments.length,
      investments: investor.investments.map((investment) => ({
        ...investment,
        ...getInvestmentPeriodStatus(
          investment.startDate,
          investment.payments,
          new Date(),
          investment.monthlyPayment,
        ),
        capital: Number(investment.capital),
        monthlyPayment: Number(investment.monthlyPayment),
        rate: Number(investment.rate),
      })),
    };
  }
}
