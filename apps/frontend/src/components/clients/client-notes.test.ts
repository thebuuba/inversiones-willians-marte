import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countClientNotes,
  formatClientNotesPreview,
  hasClientNotes,
  parseClientNotes,
} from './client-notes.ts';

test('detects saved JSON notes', () => {
  const notes = JSON.stringify([
    { id: 1, text: 'Llamar', author: 'Ana', date: 'hoy' },
    { id: 2, text: 'Revisar', author: 'Ana', date: 'hoy' },
  ]);
  assert.equal(hasClientNotes(notes), true);
  assert.equal(countClientNotes(notes), 2);
  assert.equal(formatClientNotesPreview(notes), 'Llamar · Revisar');
});

test('treats plain legacy notes as one note', () => {
  assert.equal(hasClientNotes('cliente prefiere pagos lunes'), true);
  assert.equal(parseClientNotes('cliente prefiere pagos lunes')[0]?.text, 'cliente prefiere pagos lunes');
});

test('ignores empty notes', () => {
  assert.equal(hasClientNotes(''), false);
  assert.equal(hasClientNotes('[]'), false);
});
