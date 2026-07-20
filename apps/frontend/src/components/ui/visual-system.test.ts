import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

const css = readFileSync(new URL('../../app/globals.css', import.meta.url), 'utf8');

function cssVar(name: string) {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  assert.ok(match, `Missing --${name}`);
  return match[1];
}

function luminance(hex: string) {
  const values = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255);
  const [r, g, b] = values.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

test('exposes the supported button variants', () => {
  assert.deepEqual(Object.keys(buttonVariants), ['primary', 'secondary', 'outline', 'ghost', 'danger', 'soft']);
});

test('keeps explicit density variants for compact default and comfortable screens', () => {
  assert.match(controlDensities.compact, /h-\[42px\]/);
  assert.match(controlDensities.default, /h-11/);
  assert.match(controlDensities.comfortable, /h-\[52px\]/);
  assert.match(buttonSizes.default, /h-11/);
});

test('does not draw a rectangular outline over custom form focus styles', () => {
  assert.match(
    css,
    /:where\(input, select, textarea\)\.outline-none:focus-visible\s*{\s*outline: none !important;/,
  );
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
  assert.equal(getStatusTone('Aprobada'), 'success');
  assert.equal(getStatusTone('Atrasado'), 'danger');
  assert.equal(getStatusTone('Vencido'), 'danger');
  assert.equal(getStatusTone('Rechazado'), 'danger');
  assert.equal(getStatusTone('Rechazada'), 'danger');
  assert.equal(getStatusTone('Pendiente'), 'warning');
  assert.equal(getStatusTone('Pausado'), 'warning');
  assert.equal(getStatusTone('En revisión'), 'info');
  assert.equal(getStatusTone('Pagado'), 'neutral');
  assert.equal(getStatusTone('Inactivo'), 'neutral');
  assert.equal(getStatusTone('Retirado'), 'neutral');
});

test('keeps sidebar order', () => {
  assert.deepEqual(
    navItems.map((item) => item.href),
    ['/inicio', '/clientes', '/prestamos', '/solicitudes', '/agenda', '/caja', '/inversionistas', '/documentos', '/carteras', '/configuracion'],
  );
});

test('keeps semantic text colors readable on their backgrounds', () => {
  for (const [foreground, background] of [
    ['text-primary', 'card'],
    ['text-secondary', 'card'],
    ['primary', 'card'],
    ['primary-accent', 'card'],
    ['state-success', 'state-success-bg'],
    ['state-warning', 'state-warning-bg'],
    ['state-danger', 'state-danger-bg'],
    ['state-info', 'state-info-bg'],
    ['state-neutral', 'state-neutral-bg'],
    ['text-inverse', 'primary'],
    ['text-inverse', 'primary-accent'],
  ]) {
    assert.ok(
      contrast(cssVar(foreground), cssVar(background)) >= 4.5,
      `${foreground} on ${background} is below AA contrast`,
    );
  }
});
