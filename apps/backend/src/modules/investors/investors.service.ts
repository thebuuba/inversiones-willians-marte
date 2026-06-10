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
      return await prisma.investor.create({
        data: {
          name: dto.name,
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

  async findAll() {
    return prisma.investor.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const investor = await prisma.investor.findUnique({ where: { id } });
    if (!investor) throw new NotFoundException('Investor not found');
    return investor;
  }

  async update(id: string, dto: UpdateInvestorDto) {
    try {
      await this.findOne(id);
      return await prisma.investor.update({
        where: { id },
        data: {
          name: dto.name,
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
    } catch (error) {
      this.handlePrismaError(error, 'Error al actualizar el inversionista');
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);
      return await prisma.$transaction(async (tx) => {
        await tx.investorPayment.deleteMany({ where: { investorId: id } });
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
}
