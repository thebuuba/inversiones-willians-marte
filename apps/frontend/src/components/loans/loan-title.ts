export function getLoanTitle(loan: { loanNumber: number; portfolio?: { name?: string | null } | null }) {
  return loan.portfolio?.name?.trim() || `Préstamo #${loan.loanNumber}`;
}
