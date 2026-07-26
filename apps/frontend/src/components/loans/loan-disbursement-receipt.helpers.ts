const UNITS = [
  '',
  'uno',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
  'veintiuno',
  'veintidós',
  'veintitrés',
  'veinticuatro',
  'veinticinco',
  'veintiséis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
];

const TENS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function underThousand(value: number): string {
  if (value === 100) return 'cien';
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const parts = hundreds ? [HUNDREDS[hundreds]] : [];
  if (remainder < 30) {
    if (remainder) parts.push(UNITS[remainder]);
  } else {
    const tens = Math.floor(remainder / 10);
    const units = remainder % 10;
    parts.push(`${TENS[tens]}${units ? ` y ${UNITS[units]}` : ''}`);
  }
  return parts.join(' ');
}

function integerToWords(value: number): string {
  if (value === 0) return 'cero';
  const millions = Math.floor(value / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1_000);
  const remainder = value % 1_000;
  const parts: string[] = [];

  if (millions) {
    parts.push(millions === 1 ? 'un millón' : `${integerToWords(millions)} millones`);
  }
  if (thousands) {
    parts.push(thousands === 1 ? 'mil' : `${underThousand(thousands)} mil`);
  }
  if (remainder) parts.push(underThousand(remainder));
  return parts.join(' ');
}

function apocopate(value: string): string {
  return value.replace(/veintiuno$/, 'veintiún').replace(/ y uno$/, ' y un').replace(/uno$/, 'un');
}

export function amountToSpanishWords(amount: number): string {
  const centsValue = Math.round(amount * 100);
  const pesos = Math.floor(centsValue / 100);
  const cents = centsValue % 100;
  const words = apocopate(integerToWords(pesos));
  return `${words} ${pesos === 1 ? 'peso' : 'pesos'} con ${String(cents).padStart(2, '0')}/100`;
}

export type ReceiptCopy = 'company' | 'client';

export function receiptCopyLabel(copy: ReceiptCopy): string {
  return copy === 'company' ? 'ORIGINAL - EMPRESA' : 'COPIA - CLIENTE';
}
