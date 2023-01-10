import test from 'node:test';
import assert from 'node:assert';
import { install } from '@sinonjs/fake-timers';
import { createRateLimit } from '../src';

test('rateLimit executes only set jobs within time window', async () => {
  const clock = install();
  const rateLimit = createRateLimit(1, 100);

  const check: string[] = [];

  rateLimit.push(() => {
    check.push('One');
  });
  rateLimit
    .push(async () => {
      throw new Error('Nope');
    })
    .catch((e) => {
      assert.equal(e.message, 'Nope');
      check.push('Two');
    });
  rateLimit.push(() => {
    check.push('Three');
  });

  assert.deepEqual(check, ['One']);
  assert.deepEqual(rateLimit.length, 3);

  await clock.tickAsync(100);
  assert.deepEqual(check, ['One', 'Two']);
  assert.deepEqual(rateLimit.length, 2);

  clock.tick(100);
  assert.deepEqual(check, ['One', 'Two', 'Three']);
  assert.deepEqual(rateLimit.length, 1);

  clock.tick(100);
  assert.deepEqual(check, ['One', 'Two', 'Three']);
  assert.deepEqual(rateLimit.length, 0);

  clock.uninstall();
});

test('queue can be cleared', async () => {
  const clock = install();
  const rateLimit = createRateLimit(1, 100);

  const check: string[] = [];

  rateLimit.push(() => {
    check.push('One');
  });
  rateLimit.push(async () => {
    check.push('Two');
  });
  rateLimit.push(() => {
    check.push('Three');
  });

  rateLimit.clear();
  clock.tick(150);

  assert.deepEqual(check, ['One']);
  assert.deepEqual(rateLimit.length, 0);

  clock.uninstall();
});
