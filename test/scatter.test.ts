import test from 'node:test';
import assert from 'node:assert';
import { install } from '@sinonjs/fake-timers';
import { createScatter } from '../src';

test('scatter executes jobs after set delay', async () => {
  const clock = install();
  const scatter = createScatter(100);

  const check: string[] = [];

  scatter.push(() => {
    check.push('One');
  });
  scatter.push(() => {
    check.push('Two');
  });
  scatter.onEmpty(() => check.push('Empty'));

  assert.deepEqual(check, ['One']);
  assert.deepEqual(scatter.length, 1);

  clock.tick(100);
  assert.deepEqual(check, ['One', 'Two', 'Empty']);
  assert.deepEqual(scatter.length, 0);

  clock.tick(100);
  scatter.push(() => {
    check.push('Three');
  });

  assert.deepEqual(check, ['One', 'Two', 'Empty', 'Three', 'Empty']);
  assert.deepEqual(scatter.length, 0);

  clock.uninstall();
});
