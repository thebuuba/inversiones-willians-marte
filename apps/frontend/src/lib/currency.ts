interface FormatDopOptions {
  decimals?: number;
  space?: boolean;
}

export function formatDop(value: number | string, options: FormatDopOptions = {}): string {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const decimals = options.decimals ?? 0;
  const formatted = safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `RD$${options.space ? ' ' : ''}${formatted}`;
}

export function formatSignedDop(value: number | string, options: FormatDopOptions & { negative?: boolean } = {}): string {
  return `${options.negative ? '−' : '+'}${formatDop(value, options)}`;
}

export function parseCurrencyInput(value: string): number {
  return Number(value.replace(/[^\d.]/g, '')) || 0;
}
