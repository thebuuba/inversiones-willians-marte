import { centsToDecimal, moneyToCents } from './money';

describe('money helpers', () => {
  it('converts decimal values to integer cents without binary equality checks', () => {
    expect(moneyToCents(0.1)).toBe(10);
    expect(moneyToCents('1234.56')).toBe(123456);
    expect(moneyToCents({ toString: () => '19.9900000000' })).toBe(1999);
  });

  it('converts cents back to two-decimal money values', () => {
    expect(centsToDecimal(123456)).toBe(1234.56);
  });
});
