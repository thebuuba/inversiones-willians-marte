export function getLoanTypeLabel(interestType: string, interestRate: number) {
  if (interestType === 'INDEFINITE') return 'Indefinido';
  return interestRate <= 0 ? 'Sin intereses' : 'Tasa fija';
}
