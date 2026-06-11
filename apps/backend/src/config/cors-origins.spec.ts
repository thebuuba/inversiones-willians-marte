import { parseCorsOrigins } from './cors-origins';

describe('parseCorsOrigins', () => {
  it('uses localhost frontend as the default origin', () => {
    expect(parseCorsOrigins(undefined)).toEqual(['http://localhost:3001']);
  });

  it('supports multiple comma-separated frontend origins', () => {
    expect(parseCorsOrigins('http://localhost:3001, http://192.168.1.16:3001')).toEqual([
      'http://localhost:3001',
      'http://192.168.1.16:3001',
    ]);
  });
});
