import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentCapturePage } from './document-capture-page.tsx';

test('offers separate camera and file-picker controls on mobile', () => {
  const html = renderToStaticMarkup(createElement(DocumentCapturePage, { token: 'capture-token' }));

  assert.match(html, />Tomar foto</);
  assert.match(html, />Elegir foto o archivo</);
  assert.match(html, /accept="image\/\*" capture="environment"/);
  assert.match(html, /accept="image\/\*,\.pdf,\.doc,\.docx,\.xls,\.xlsx"/);
});
