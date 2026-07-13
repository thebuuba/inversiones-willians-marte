import { normalizePagination } from './pagination';

describe('normalizePagination', () => {
  it('uses safe defaults for malformed query numbers', () => {
    expect(normalizePagination(Number.NaN, Number.NaN)).toEqual({ take: 50, skip: 0 });
  });

  it('clamps oversized, negative, and fractional values', () => {
    expect(normalizePagination(1000.9, -20.8)).toEqual({ take: 100, skip: 0 });
  });
});
