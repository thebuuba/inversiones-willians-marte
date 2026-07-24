import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./portfolios-page.tsx', import.meta.url), 'utf8');

test('shows a newly created portfolio without navigating or keeping the stale list cache', () => {
  assert.match(source, /setCreatedPortfolios/);
  assert.match(source, /invalidateCache\('portfolios:with-loans'\)/);
  assert.doesNotMatch(source, /router\.push\(`\/carteras\/\$\{portfolio\.id\}`\)/);
});

test('requires confirmation and refreshes the list after deleting a portfolio', () => {
  const start = source.indexOf('async function handleDelete');
  const handler = source.slice(start, source.indexOf('\n  return (', start));

  assert.match(source, /window\.confirm/);
  assert.match(source, /await deletePortfolio\(portfolio\.id\)/);
  assert.match(source, /user\?\.role === 'ADMIN'/);
  assert.match(source, /setDeletedPortfolioIds/);
  assert.ok(
    handler.indexOf('setDeletedPortfolioIds') <
      handler.indexOf('await deletePortfolio(portfolio.id)'),
  );
  assert.match(source, /restored\.delete\(portfolio\.id\)/);
});

test('animates portfolio insertion, removal, and grid reordering', () => {
  assert.match(source, /<AnimatePresence initial=\{false\} mode="popLayout">/);
  assert.match(source, /<motion\.article/);
  assert.match(source, /layout="position"/);
  assert.match(source, /forwardRef<HTMLElement, PortfolioCardProps>/);
  assert.match(source, /delay: Math\.min\(index \* 0\.045, 0\.2\)/);
  assert.match(source, /<MotionConfig reducedMotion="user">/);
});
