import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import manifest from '../app/manifest.ts';

test('pwa manifest uses installable standalone settings', () => {
  const data = manifest();

  assert.equal(data.name, 'Inversiones Willians Marte');
  assert.equal(data.short_name, 'Inversiones');
  assert.equal(data.start_url, '/inicio');
  assert.equal(data.display, 'standalone');
  assert.equal(data.background_color, '#F3F4F6');
  assert.equal(data.theme_color, '#5a9a7a');
  assert.equal(data.icons?.some((icon) => icon.src === '/icons/icon-192.png' && icon.sizes === '192x192'), true);
  assert.equal(data.icons?.some((icon) => icon.src === '/icons/icon-512.png' && icon.sizes === '512x512'), true);
});

test('service worker keeps api requests out of shell cache', async () => {
  const sw = await readFile(new URL('../../public/sw.js', import.meta.url), 'utf8');

  assert.match(sw, /const CACHE_NAME = 'inversiones-shell-v1'/);
  assert.match(sw, /'\/offline'/);
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/);
});
