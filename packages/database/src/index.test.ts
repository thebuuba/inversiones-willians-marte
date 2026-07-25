import assert from 'node:assert/strict';
import test from 'node:test';
import { allowsSelfSignedCertificate } from './index';

test('allows self-signed certificates only when explicitly requested', () => {
  assert.equal(allowsSelfSignedCertificate('postgresql://localhost/db?sslmode=no-verify'), true);
  assert.equal(allowsSelfSignedCertificate('postgresql://localhost/db?sslmode=require'), false);
  assert.equal(allowsSelfSignedCertificate('postgresql://localhost/db'), false);
});
