import Deferred from './defer';
import type { Job } from './job';

export const THROTTLE_DROPPED = Symbol('THROTTLE_DROPPED');

/**
 * Drop jobs that are called earlier than windowMs from the last job
 * while ensuring the latest job is called after windowMs
 */
export default function createThrottle(windowMs: number) {
  let last = -Infinity;
  const onEmpty: (() => void)[] = [];
  const jobs: [Deferred<any>, Job<any>][] = [];

  const trigger = () => {
    if (jobs.length > 2) {
      jobs[1][0].resolve(THROTTLE_DROPPED);
      jobs.splice(1, 1);
      return;
    }

    if (jobs.length !== 1) {
      return;
    }

    last = Date.now();
    const [d, job] = jobs[0]!;
    const next = () => {
      jobs.shift();
      trigger();
    };

    Promise.resolve(job())
      .then(d.resolve, d.reject)
      .finally(() => {
        const delay = last + windowMs - Date.now();
        if (jobs.length === 1) {
          onEmpty.forEach((cb) => cb());
        }
        if (delay > 0) {
          setTimeout(next, delay);
        } else {
          next();
        }
      });
  };

  return {
    get trailing() {
      return jobs.length >= 2;
    },
    get waiting() {
      return jobs.length === 1;
    },
    async push<T>(job: Job<T>) {
      const d = new Deferred<T | typeof THROTTLE_DROPPED>();
      jobs.push([d, job]);
      trigger();

      return d.promise;
    },
    onEmpty(cb: () => void) {
      onEmpty.push(cb);

      return () => {
        onEmpty.splice(onEmpty.indexOf(cb), 1);
      };
    },
    reset() {
      jobs.forEach(([d]) => d.resolve(THROTTLE_DROPPED));
      last = -Infinity;
      jobs.length = 0;
    },
  };
}
