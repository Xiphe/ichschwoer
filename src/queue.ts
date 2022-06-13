export type Job<T> = () => Promise<T> | T;

export default function createQueue(maxParallel: number = Infinity) {
  let running = 0;
  const jobs: Job<any>[] = [];

  const trigger = () => {
    if (running < maxParallel && jobs.length) {
      running++;
      const job = jobs.shift()!;
      job().finally(() => {
        running--;
        trigger();
      });
    }
  };

  return {
    get length() {
      return jobs.length + running;
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
