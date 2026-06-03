import assert from 'node:assert/strict';
import test from 'node:test';
import { getInvestorNameValidationError, getApiErrorMessage } from './investor-form.helpers.ts';

test('requires a real investor name before saving', () => {
  assert.equal(getInvestorNameValidationError('', ''), 'Completa nombres y apellidos antes de guardar.');
  assert.equal(getInvestorNameValidationError('Juan', ''), null);
});

test('reads backend errors returned by the global exception filter', () => {
  assert.equal(
    getApiErrorMessage({ response: { data: { error: ['name must be longer than or equal to 2 characters'] } } }, 'fallback'),
    'name must be longer than or equal to 2 characters',
  );
  assert.equal(getApiErrorMessage({}, 'fallback'), 'fallback');
});
