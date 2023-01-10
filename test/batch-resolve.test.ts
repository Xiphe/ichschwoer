import test from 'node:test';
import assert from 'node:assert';
import { install } from '@sinonjs/fake-timers';
import { createBatchResolve, Deferred } from '../src';

test('batchResolve resolves all jobs together', async () => {
  const clock = install();
  const batch = createBatchResolve(100);
  const d1 = new Deferred();

  const checkResolve: string[] = [];

  const r1 = batch.push(d1.promise).then(() => {
    checkResolve.push('One');
  });
  const r2 = batch.push(Promise.reject(new Error('Nope'))).catch((e) => {
    assert.equal(e.message, 'Nope');
    checkResolve.push('Two');
  });
  const r3 = batch.push('3').then(() => {
    checkResolve.push('Three');
  });

  assert.deepEqual(checkResolve, []);
  assert.equal(batch.length, 3);

  clock.tick(100);

  assert.deepEqual(checkResolve, []);
  assert.equal(batch.length, 0);

  const r4 = batch.push(null).then(() => {
    checkResolve.push('Four');
  });

  d1.resolve('1');
  await Promise.all([r1, r2, r3]);

  assert.deepEqual(checkResolve, ['Three', 'One', 'Two']);
  assert.equal(batch.length, 1);

  clock.tick(100);
  await r4;

  assert.deepEqual(checkResolve, ['Three', 'One', 'Two', 'Four']);
  assert.equal(batch.length, 0);
});
