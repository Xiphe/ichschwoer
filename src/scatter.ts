export type Job<T> = () => PromiseLike<T> | T;

/**
 * Makes sure all callbacks are executed with at least set ms delay
 */
export default function createScatter(delay: number) {
  let lastExecution = -Infinity;
  let waiting = false;
  const jobs: Job<any>[] = [];
  const onEmpty: (() => void)[] = [];

  const trigger = () => {
    if (jobs.length && !waiting) {
      const now = Date.now();

      if (lastExecution + delay <= now) {
        lastExecution = now;
        const job = jobs.shift()!;
        job().finally(() => {
          trigger();
        });
        if (!jobs.length) {
          onEmpty.forEach((cb) => cb());
        }
      } else {
        waiting = true;
        setTimeout(() => {
          waiting = false;
          trigger();
        }, lastExecution + delay - now);
      }
    }
  };

  return {
    get length() {
      return jobs.length;
    },
    onEmpty(cb: () => void) {
      onEmpty.push(cb);

      return () => {
        onEmpty.splice(onEmpty.indexOf(cb), 1);
      };
    },
    push<T>(job: Job<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        jobs.push(() => Promise.resolve(job()).then(resolve, reject));
        trigger();
      });
    },
    clear() {
      jobs.length = 0;
    },
  };
}
