export function calculateMonthlyInterest(capital: number, portfolioRate: number): number | null {
  if (!Number.isFinite(capital) || !Number.isFinite(portfolioRate) || capital <= 0 || portfolioRate <= 0) {
    return null;
  }

  return capital * (portfolioRate / 300);
}

export function formatDopCurrency(value: number): string {
  return `RD$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}
