import test from 'node:test';
import assert from 'node:assert';
import { Deferred } from '../src';

test('deferred interface', async (t) => {
  const d = new Deferred();
  assert.ok(d.promise instanceof Promise);
  assert.ok(d.resolve instanceof Function);
  assert.ok(d.reject instanceof Function);
});

test('does resolve', async (t) => {
  const d = new Deferred();

  d.resolve('ok');

  assert.strictEqual('ok', await d.promise);
});

test('does reject', async (t) => {
  const d = new Deferred();

  d.reject('nope');

  try {
    await d.promise;
  } catch (e) {
    assert.strictEqual('nope', e);
  }
});
