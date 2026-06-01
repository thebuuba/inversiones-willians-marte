import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buttonSizes,
  buttonVariants,
  controlDensities,
  getStatusTone,
  navItems,
  statusToneDots,
  statusTones,
} from './visual-system.ts';

test('exposes the supported button variants', () => {
  assert.deepEqual(Object.keys(buttonVariants), ['primary', 'secondary', 'outline', 'ghost', 'danger', 'soft']);
});

test('keeps explicit density variants for compact default and comfortable screens', () => {
  assert.match(controlDensities.compact, /h-\[42px\]/);
  assert.match(controlDensities.default, /h-11/);
  assert.match(controlDensities.comfortable, /h-\[52px\]/);
  assert.match(buttonSizes.default, /h-11/);
});

test('maps semantic states to tokenized classes', () => {
  assert.match(statusTones.success, /bg-state-success-bg/);
  assert.match(statusTones.warning, /bg-state-warning-bg/);
  assert.match(statusTones.danger, /bg-state-danger-bg/);
  assert.match(statusTones.info, /bg-state-info-bg/);
  assert.match(statusTones.neutral, /bg-state-neutral-bg/);
});

test('maps semantic state dots to static tokenized classes', () => {
  assert.match(statusToneDots.success, /bg-state-success-dot/);
  assert.match(statusToneDots.warning, /bg-state-warning-dot/);
  assert.match(statusToneDots.danger, /bg-state-danger-dot/);
  assert.match(statusToneDots.info, /bg-state-info-dot/);
  assert.match(statusToneDots.neutral, /bg-state-neutral-dot/);
});

test('normalizes Spanish status labels to semantic tones', () => {
  assert.equal(getStatusTone('Al día'), 'success');
  assert.equal(getStatusTone(' Activo '), 'success');
  assert.equal(getStatusTone('Aprobado'), 'success');
  assert.equal(getStatusTone('Atrasado'), 'danger');
  assert.equal(getStatusTone('Vencido'), 'danger');
  assert.equal(getStatusTone('Rechazado'), 'danger');
  assert.equal(getStatusTone('Pendiente'), 'warning');
  assert.equal(getStatusTone('Pagado'), 'neutral');
  assert.equal(getStatusTone('Inactivo'), 'neutral');
});

test('keeps sidebar order and includes reminders before settings', () => {
  assert.deepEqual(
    navItems.map((item) => item.href),
    ['/inicio', '/clientes', '/prestamos', '/solicitudes', '/agenda', '/caja', '/inversionistas', '/documentos', '/recordatorios', '/configuracion'],
  );
});
