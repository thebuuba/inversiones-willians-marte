import assert from 'node:assert/strict';
import test from 'node:test';
import type { LoanRequestItem } from '@inversiones/shared';
import { requestAmount, requestInitials, requestName } from './request-display.ts';

test('shows clear placeholders for a request with no applicant data', () => {
  const request = { firstName: null, lastName: null, amount: null } as LoanRequestItem;
  assert.equal(requestName(request), 'Sin nombre');
  assert.equal(requestInitials(request), '?');
  assert.equal(requestAmount(request), 'Monto sin indicar');
});
