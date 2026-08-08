import assert from 'node:assert/strict';
import test from 'node:test';
import { parseThemePreference, themeScript } from './theme';

test('defaults to light without following the operating system theme', () => {
  assert.equal(parseThemePreference(null), 'light');
  assert.equal(parseThemePreference('system'), 'light');
  assert.equal(parseThemePreference('light'), 'light');
  assert.doesNotMatch(themeScript, /prefers-color-scheme|matchMedia/);
});

test('keeps an explicit dark preference', () => {
  assert.equal(parseThemePreference('dark'), 'dark');
  assert.match(themeScript, /localStorage\.getItem\('theme'\) === 'dark'/);
});
