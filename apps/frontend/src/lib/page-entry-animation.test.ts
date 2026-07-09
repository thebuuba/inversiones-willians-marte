import assert from 'node:assert/strict';
import test from 'node:test';
import {
  pageEntryHeaderClassName,
  pageEntryStatCardClassName,
  pageEntryTableClassName,
} from './page-entry-animation.ts';

test('provides the dashboard page entry choreography classes', () => {
  assert.equal(pageEntryHeaderClassName, 'animate-fade-in-up');

  assert.equal(
    pageEntryStatCardClassName(0),
    'opacity-0 animate-fade-in-up [animation-delay:0ms] [animation-fill-mode:forwards]',
  );
  assert.equal(
    pageEntryStatCardClassName(1),
    'opacity-0 animate-fade-in-up [animation-delay:60ms] [animation-fill-mode:forwards]',
  );
  assert.equal(
    pageEntryStatCardClassName(2),
    'opacity-0 animate-fade-in-up [animation-delay:120ms] [animation-fill-mode:forwards]',
  );
  assert.equal(
    pageEntryStatCardClassName(3),
    'opacity-0 animate-fade-in-up [animation-delay:180ms] [animation-fill-mode:forwards]',
  );

  assert.equal(
    pageEntryTableClassName,
    'opacity-0 animate-fade-in-up [animation-delay:260ms] [animation-fill-mode:forwards]',
  );
});
