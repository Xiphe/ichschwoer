import test from 'node:test';
import assert from 'node:assert';
import { install } from '@sinonjs/fake-timers';
import { createThrottle, Deferred, THROTTLE_DROPPED } from '../src';

test('throttle drops jobs that are called too frequent', async () => {
  const clock = install();
  const throttle = createThrottle(100);

  const check: string[] = [];

  throttle.onEmpty(() => {
    check.push('Empty');
  });

  // First job on queue, executed immediately
  throttle.push(() => {
    check.push('One');
  });
  // Second job on queue, delayed by at least 100ms
  const two = throttle.push(() => {
    check.push('Two');
  });

  // Third job on queue, replaces second job
  const threeD = new Deferred<void>();
  throttle.push(() => {
    check.push('Three');
    return threeD.promise;
  });

  // First job is executed
  assert.deepEqual(check, ['One']);
  // Second job is dropped
  assert.deepEqual(await two, THROTTLE_DROPPED);
  // We still have a trailing job
  assert.deepEqual(throttle.trailing, true);

  // after 100ms, third job is executed
  clock.tick(100);
  // Note: We don't resolve the promise of the third job
  //       -> it's still in the queue
  assert.deepEqual(check, ['One', 'Three']);

  // Fourth job on queue, accepted because currently only one job is in the queue
  const four = throttle.push(() => {
    check.push('Four');
  });
  // Fifth job on queue, replaces fourth job which is dropped
  const five = throttle.push(() => {
    check.push('Five');
  });

  // even after exceeding timing window of third job, we continue waiting for it
  clock.tick(100);
  assert.deepEqual(check, ['One', 'Three']);
  // fourth job has been dropped
  assert.deepEqual(await four, THROTTLE_DROPPED);

  // finally we resolve the third job
  threeD.resolve();
  // fifth job is executed immediately
  await five;
  // queue is now empty
  assert.deepEqual(check, ['One', 'Three', 'Five', 'Empty']);
  assert.deepEqual(throttle.trailing, false);
  // but we're still waiting for the window to close
  assert.deepEqual(throttle.waiting, true);

  clock.tick(100);
  // after 100ms, we're no longer waiting
  assert.deepEqual(throttle.waiting, false);

  // Sixth job on queue, executed immediately
  const six = throttle.push(() => {
    check.push('Six');
  });
  await six;
  assert.deepEqual(check, ['One', 'Three', 'Five', 'Empty', 'Six', 'Empty']);

  // queue is empty
  assert.deepEqual(throttle.trailing, false);
  // but we're still waiting for the window to close
  assert.deepEqual(throttle.waiting, true);

  // Seventh job on queue to be executed after 100ms
  const seven = throttle.push(() => {
    check.push('Seven');
  });
  // Eighth job on queue, replaces seventh job which is dropped
  const eight = throttle.push(() => {
    check.push('Eight');
  });

  // seventh job has been dropped
  assert.deepEqual(await seven, THROTTLE_DROPPED);
  assert.deepEqual(check, ['One', 'Three', 'Five', 'Empty', 'Six', 'Empty']);

  // still waiting on eighth job
  assert.deepEqual(throttle.trailing, true);

  // hard-resetting the throttle
  throttle.reset();

  // all jobs have been dropped
  assert.deepEqual(await eight, THROTTLE_DROPPED);

  // queue is empty
  assert.deepEqual(throttle.trailing, false);
  assert.deepEqual(throttle.waiting, false);
});
