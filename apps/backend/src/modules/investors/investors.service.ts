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
import {
  getInvestmentPeriodStatus,
  investmentBusinessDate,
} from '../investments/investment-period-status';
import { paymentReference } from '../investor-payments/payment-reference';
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
            monthlyPayment: Math.round(dto.capital * dto.rate) / 100,
            rate: dto.rate,
            startDate: dto.startDate ? new Date(dto.startDate) : investmentBusinessDate(new Date()),
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
            monthlyPayment: Math.round(dto.capital * dto.rate) / 100,
            rate: dto.rate,
            startDate: dto.startDate ? new Date(dto.startDate) : investmentBusinessDate(new Date()),
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
    const year = Number(
      new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'America/Santo_Domingo' }).format(
        new Date(),
      ),
    );
    const where = { investorId: { in: investors.map((investor) => investor.id) } };
    const [allPayments, yearPayments] = await Promise.all([
      prisma.investorPayment.groupBy({ by: ['investorId'], where, _sum: { amount: true } }),
      prisma.investorPayment.groupBy({
        by: ['investorId'],
        where: {
          ...where,
          paymentDate: {
            gte: new Date(`${year}-01-01T00:00:00-04:00`),
            lt: new Date(`${year + 1}-01-01T00:00:00-04:00`),
          },
        },
        _sum: { amount: true },
      }),
    ]);
    const totals = new Map(
      allPayments.map((payment) => [payment.investorId, Number(payment._sum.amount ?? 0)]),
    );
    const yearTotals = new Map(
      yearPayments.map((payment) => [payment.investorId, Number(payment._sum.amount ?? 0)]),
    );
    return investors.map((investor) => ({
      ...this.decorateInvestor(investor),
      totalGainsPaid: totals.get(investor.id) ?? 0,
      yearGainsPaid: yearTotals.get(investor.id) ?? 0,
    }));
  }

  async findOne(id: string) {
    const investor = await prisma.investor.findUnique({
      where: { id },
      include: this.investorInclude(),
    });
    if (!investor) throw new NotFoundException('Investor not found');
    const payments = await prisma.investorPayment.aggregate({
      where: { investorId: id },
      _sum: { amount: true },
    });
    return {
      ...this.decorateInvestor(investor),
      totalGainsPaid: Number(payments._sum.amount ?? 0),
    };
  }

  async update(id: string, dto: UpdateInvestorDto) {
    try {
      await this.findOne(id);
      await prisma.$transaction(
        async (tx) => {
          const firstInvestment = await tx.investorInvestment.findFirst({
            where: { investorId: id },
            orderBy: { createdAt: 'asc' },
            include: {
              payments: { select: { id: true }, take: 1 },
              movements: { select: { id: true }, take: 1 },
            },
          });
          const financialChange =
            firstInvestment &&
            ((dto.capital !== undefined && dto.capital !== Number(firstInvestment.capital)) ||
              (dto.rate !== undefined && dto.rate !== Number(firstInvestment.rate)) ||
              (dto.monthlyPayment !== undefined &&
                dto.monthlyPayment !== Number(firstInvestment.monthlyPayment)) ||
              (dto.startDate !== undefined &&
                dto.startDate.slice(0, 10) !==
                  firstInvestment.startDate?.toISOString().slice(0, 10)));
          if (
            financialChange &&
            ((firstInvestment.payments?.length ?? 0) > 0 ||
              (firstInvestment.movements?.length ?? 0) > 0)
          ) {
            throw new BadRequestException(
              'Esta inversión tiene historial. Registra un aporte o una nueva inversión para conservar sus condiciones anteriores',
            );
          }
          const monthlyPayment =
            firstInvestment && financialChange
              ? Math.round(
                  (dto.capital ?? Number(firstInvestment.capital)) *
                    (dto.rate ?? Number(firstInvestment.rate)),
                ) / 100
              : undefined;
          await tx.investor.update({
            where: { id },
            data: {
              ...dto,
              name: dto.name === undefined ? undefined : formatPersonName(dto.name),
              birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
              startDate: dto.startDate ? new Date(dto.startDate) : undefined,
              monthlyPayment,
            },
          });
          if (firstInvestment) {
            await tx.investorInvestment.update({
              where: { id: firstInvestment.id },
              data: {
                capital: dto.capital,
                rate: dto.rate,
                monthlyPayment,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                term: dto.term,
                notes: dto.notes,
              },
            });
          }
        },
        { isolationLevel: 'Serializable' },
      );
      return this.findOne(id);
    } catch (error) {
      this.handlePrismaError(error, 'Error al actualizar el inversionista');
    }
  }
  async remove(id: string, userId: string) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const investor = await tx.investor.findUnique({
            where: { id },
            select: { id: true, code: true },
          });
          if (!investor) throw new NotFoundException('Investor not found');

          const investmentCount = await tx.investorInvestment.count({ where: { investorId: id } });
          const paymentCount = await tx.investorPayment.count({ where: { investorId: id } });
          const movementCount = await tx.investorInvestmentMovement.count({
            where: { investment: { investorId: id } },
          });
          if (investmentCount > 0 || paymentCount > 0 || movementCount > 0) {
            throw new BadRequestException(
              'No se puede eliminar un inversionista con inversiones registradas, historial de pagos o movimientos de capital',
            );
          }

          await tx.document.updateMany({ where: { investorId: id }, data: { investorId: null } });
          const deleted = await tx.investor.delete({ where: { id } });
          await tx.auditLog.create({
            data: {
              userId,
              action: 'INVESTOR_DELETED',
              entityType: 'Investor',
              entityId: id,
              oldValues: { code: investor.code },
            },
          });
          return deleted;
        },
        { isolationLevel: 'Serializable' },
      );
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
          movements: true,
          payments: {
            orderBy: [{ periodYear: 'desc' as const }, { periodMonth: 'desc' as const }],
          },
        },
        orderBy: { createdAt: 'desc' as const },
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
      totalGainsPaid: investor.investments.reduce(
        (sum, investment) =>
          sum +
          (investment.payments ?? []).reduce((paid, payment) => paid + Number(payment.amount), 0),
        0,
      ),
      totalCapital,
      totalMonthlyReturn,
      activeInvestments: activeInvestments.length,
      investments: investor.investments.map((investment) => ({
        ...investment,
        payments: (investment.payments ?? []).map((payment) => ({
          ...payment,
          reference: paymentReference(payment.reference),
        })),
        ...getInvestmentPeriodStatus(
          investment.startDate ??
            (investment.createdAt ? investmentBusinessDate(investment.createdAt) : null),
          investment.payments,
          new Date(),
          investment.monthlyPayment,
          { rate: investment.rate, capital: investment.capital, movements: investment.movements },
        ),
        capital: Number(investment.capital),
        monthlyPayment: Number(investment.monthlyPayment),
        rate: Number(investment.rate),
      })),
    };
  }
}
