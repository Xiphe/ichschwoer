import test from 'node:test';
import assert from 'node:assert';
import { createQueue, Deferred } from '../src';

test('queue executes only set number of jobs parallel', async () => {
  const singleLine = createQueue(1);
  const d1 = new Deferred();
  const d2 = new Deferred();

  const check: string[] = [];

  const r1 = singleLine.push(() => {
    check.push('One');
    return d1.promise;
  });
  const r2 = singleLine.push(() => {
    check.push('Two');
    return d2.promise;
  });
  const r3 = singleLine.push(() => {
    check.push('Three');
    return '3';
  });

  assert.deepEqual(check, ['One']);
  assert.deepEqual(singleLine.length, 3);

  d1.resolve('ok');
  assert.equal(await r1, 'ok');

  await tick();
  assert.deepEqual(singleLine.length, 2);
  assert.deepEqual(check, ['One', 'Two']);

  d2.reject(new Error('Nope'));
  try {
    await r2;
  } catch (e) {
    assert.equal(e.message, 'Nope');
  }

  await tick();
  assert.deepEqual(singleLine.length, 0);
  assert.deepEqual(check, ['One', 'Two', 'Three']);
  assert.equal(await r3, '3');
});

test('queue can be cleared', async () => {
  const singleLine = createQueue(1);
  const d1 = new Deferred();

  const check: string[] = [];

  singleLine.push(() => {
    check.push('One');
    return d1.promise;
  });
  singleLine.push(() => {
    check.push('Two');
  });
  singleLine.push(() => {
    check.push('Three');
  });

  singleLine.clear();
  d1.resolve('1');
  await tick();
  assert.deepEqual(check, ['One']);
  assert.deepEqual(singleLine.length, 0);
});

test('queue runs jobs in parallel', async () => {
  const singleLine = createQueue(2);
  const d1 = new Deferred();
  const d2 = new Deferred();
  const d3 = new Deferred();

  const check: string[] = [];

  singleLine.push(() => {
    check.push('One');
    return d1.promise;
  });
  singleLine.push(() => {
    check.push('Two');
    return d2.promise;
  });
  singleLine.push(() => {
    check.push('Three');
    return d3.promise;
  });
  singleLine.push(() => {
    check.push('Four');
    return '4';
  });

  assert.deepEqual(check, ['One', 'Two']);
  assert.deepEqual(singleLine.length, 4);

  d2.resolve('2');
  await tick();

  assert.deepEqual(check, ['One', 'Two', 'Three']);
  assert.deepEqual(singleLine.length, 3);

  d3.resolve('3');
  await tick();

  assert.deepEqual(check, ['One', 'Two', 'Three', 'Four']);
  assert.deepEqual(singleLine.length, 1);

  d1.resolve('1');
  await tick();

  assert.deepEqual(check, ['One', 'Two', 'Three', 'Four']);
  assert.deepEqual(singleLine.length, 0);
});

function tick() {
  return new Promise((res) => setImmediate(res));
}
