import { Injectable } from '@nestjs/common';
import { prisma } from '@inversiones/database';
import type { GlobalSearchResult, GlobalSearchRole } from '@inversiones/shared';
import {
  clientWhereVisible,
  loanWhereVisible,
  type PortfolioScope,
} from '../../common/portfolio-scope';

const RESULT_LIMIT = 5;

function loanNumberFrom(query: string): number | undefined {
  const match = query.match(/^(?:pr[eé]stamo\s*#?\s*|#\s*)?(\d+)$/i);
  return match ? Number(match[1]) : undefined;
}

function appendRole(roles: GlobalSearchRole[], role: GlobalSearchRole, condition: boolean) {
  return condition ? [...roles, role] : roles;
}

@Injectable()
export class SearchService {
  async search(scope: PortfolioScope, query: string): Promise<GlobalSearchResult[]> {
    const loanNumber = loanNumberFrom(query);
    const personSearch = [
      { firstName: { contains: query, mode: 'insensitive' as const } },
      { lastName: { contains: query, mode: 'insensitive' as const } },
      { identification: { contains: query } },
      { phone: { contains: query } },
    ];
    const loanScopeWhere = loanWhereVisible(scope);
    const clientScopeWhere = clientWhereVisible(scope);

    const [clients, loans, investors] = await Promise.all([
      prisma.client.findMany({
        where: {
          active: true,
          AND: [...(clientScopeWhere ? [clientScopeWhere] : []), { OR: personSearch }],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          identification: true,
          phone: true,
          _count: { select: { loans: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: RESULT_LIMIT,
      }),
      prisma.loan.findMany({
        where: {
          AND: [
            ...(loanScopeWhere ? [loanScopeWhere] : []),
            {
              OR: [
                ...(loanNumber === undefined ? [] : [{ loanNumber }]),
                { client: { OR: personSearch } },
              ],
            },
          ],
        },
        select: {
          id: true,
          loanNumber: true,
          status: true,
          client: {
            select: { firstName: true, lastName: true, identification: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: RESULT_LIMIT,
      }),
      prisma.investor.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { cedula: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        select: { id: true, name: true, code: true, cedula: true, phone: true },
        orderBy: { createdAt: 'desc' },
        take: RESULT_LIMIT,
      }),
    ]);

    const clientIds = clients.flatMap((client) =>
      client.identification ? [client.identification] : [],
    );
    const investorIds = investors.flatMap((investor) => (investor.cedula ? [investor.cedula] : []));
    const [matchingInvestors, matchingBorrowers] = await Promise.all([
      clientIds.length
        ? prisma.investor.findMany({
            where: { cedula: { in: clientIds } },
            select: { cedula: true },
          })
        : [],
      investorIds.length
        ? prisma.client.findMany({
            where: { identification: { in: investorIds }, loans: { some: {} } },
            select: { identification: true },
          })
        : [],
    ]);
    const investorCedulas = new Set(
      matchingInvestors.flatMap(({ cedula }) => (cedula ? [cedula] : [])),
    );
    const borrowerCedulas = new Set(
      matchingBorrowers.flatMap(({ identification }) => (identification ? [identification] : [])),
    );

    return [
      ...loans.map((loan) => ({
        id: `loan:${loan.id}`,
        kind: 'LOAN' as const,
        title: `Préstamo #${loan.loanNumber}`,
        description: `${loan.client.firstName} ${loan.client.lastName} · ${loan.status}`,
        href: `/prestamos/${loan.id}`,
        roles: ['LOAN'] as GlobalSearchRole[],
      })),
      ...clients.map((client) => ({
        id: `client:${client.id}`,
        kind: 'CLIENT' as const,
        title: `${client.firstName} ${client.lastName}`,
        description: client.identification ?? client.phone ?? 'Cliente registrado',
        href: `/clientes/${client.id}`,
        roles: appendRole(
          appendRole(['CLIENT'], 'BORROWER', client._count.loans > 0),
          'INVESTOR',
          Boolean(client.identification && investorCedulas.has(client.identification)),
        ),
      })),
      ...investors.map((investor) => ({
        id: `investor:${investor.id}`,
        kind: 'INVESTOR' as const,
        title: investor.name,
        description: `${investor.code}${investor.cedula ? ` · ${investor.cedula}` : ''}`,
        href: `/inversionistas/${investor.id}`,
        roles: appendRole(
          ['INVESTOR'],
          'BORROWER',
          Boolean(investor.cedula && borrowerCedulas.has(investor.cedula)),
        ),
      })),
    ];
  }
}
