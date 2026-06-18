import assert from 'node:assert/strict';
import test from 'node:test';
import { getClientFormFromClient, getClientPayload } from './client-form.ts';

test('loads existing client values into the edit form', () => {
  const form = getClientFormFromClient({
    id: 1,
    firstName: 'Ana',
    lastName: 'Diaz',
    birthDate: '1990-04-03T00:00:00.000Z',
    dependents: 2,
    phone: '(809) 555-1111',
    createdById: 'u1',
    active: true,
    createdAt: '',
    updatedAt: '',
    loans: [],
  });

  assert.equal(form.firstName, 'Ana');
  assert.equal(form.birthDate, '1990-04-03');
  assert.equal(form.dependents, '2');
  assert.equal(form.phone, '(809) 555-1111');
});

test('builds a clean client payload from form values', () => {
  const payload = getClientPayload({
    firstName: ' Ana ',
    lastName: ' Diaz ',
    identification: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    nationality: '',
    dependents: '',
    phone: ' 809 ',
    altPhone: '',
    email: '',
    address: '',
    notes: '',
    photo: '',
  });

  assert.deepEqual(payload, {
    firstName: 'Ana',
    lastName: 'Diaz',
    identification: undefined,
    phone: '809',
    altPhone: undefined,
    email: undefined,
    address: undefined,
    birthDate: undefined,
    gender: undefined,
    maritalStatus: undefined,
    nationality: undefined,
    dependents: undefined,
    photo: undefined,
    notes: undefined,
  });
});
