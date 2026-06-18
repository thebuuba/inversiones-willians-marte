import { formatPersonName } from './name-case';

describe('formatPersonName', () => {
  it('formats names as title case words', () => {
    expect(formatPersonName('roberto lopez')).toBe('Roberto Lopez');
    expect(formatPersonName('  mARía   núñez-garcia ')).toBe('María Núñez-Garcia');
  });
});
