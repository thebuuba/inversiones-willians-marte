import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import type { UserRole } from '@inversiones/shared';

export type ScopeUser = {
  id: string;
  role: UserRole;
};

export interface PortfolioScope {
  userId: string;
  isAdmin: boolean;
  portfolioIds: string[];
}

export async function resolvePortfolioScope(user: ScopeUser): Promise<PortfolioScope> {
  if (user.role === 'ADMIN') {
    return { userId: user.id, isAdmin: true, portfolioIds: [] };
  }

  const assignments = await prisma.userPortfolio.findMany({
    where: { userId: user.id },
    select: { portfolioId: true },
  });

  return {
    userId: user.id,
    isAdmin: false,
    portfolioIds: assignments.map((assignment) => assignment.portfolioId),
  };
}

export function loanWhereVisible(scope: PortfolioScope) {
  if (scope.isAdmin) return undefined;
  return {
    OR: [{ portfolioId: { in: scope.portfolioIds } }, { createdById: scope.userId }],
  };
}

export function clientWhereVisible(scope: PortfolioScope) {
  if (scope.isAdmin) return undefined;
  return {
    OR: [
      { loans: { some: { portfolioId: { in: scope.portfolioIds } } } },
      { createdById: scope.userId },
    ],
  };
}

function isVisibleLoan(
  loan: { portfolioId: string | null; createdById: string },
  scope: PortfolioScope,
) {
  if (scope.isAdmin) return true;
  if (loan.createdById === scope.userId) return true;
  return loan.portfolioId !== null && scope.portfolioIds.includes(loan.portfolioId);
}

export async function assertLoanAccess(scope: PortfolioScope, loanId: string): Promise<void> {
  if (scope.isAdmin) return;
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    select: { id: true, portfolioId: true, createdById: true },
  });
  if (!loan) throw new NotFoundException('Loan not found');
  if (!isVisibleLoan(loan, scope)) throw new ForbiddenException('You cannot access this loan');
}

export async function assertClientAccess(scope: PortfolioScope, clientId: number): Promise<void> {
  if (scope.isAdmin) return;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, createdById: true, loans: { select: { portfolioId: true } } },
  });
  if (!client) throw new NotFoundException('Client not found');

  if (client.createdById === scope.userId) return;
  if (
    client.loans.some(
      (loan) => loan.portfolioId !== null && scope.portfolioIds.includes(loan.portfolioId),
    )
  ) {
    return;
  }
  throw new ForbiddenException('You cannot access this client');
}
