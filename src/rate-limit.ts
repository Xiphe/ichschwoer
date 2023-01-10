export type Job<T> = () => Promise<T> | T;

/**
 * Create a rateLimited queue that only executes max Jobs within windowMs
 */
export default function createRateLimit(max: number, windowMs: number) {
  let window = 0;
  const jobs: Job<any>[] = [];

  const trigger = () => {
    if (window === 0) {
      setTimeout(() => {
        window = 0;
        const next = Math.min(max, jobs.length);
        for (let i = 0; i < next; i++) {
          trigger();
        }
      }, windowMs);
    }

    if (jobs.length && window < max) {
      window++;
      jobs.shift()!();
    }
  };

  return {
    get length() {
      return jobs.length + window;
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
