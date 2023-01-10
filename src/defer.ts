export default class Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve!: (value: T) => T;
  readonly reject!: (reason: unknown) => void;
  constructor() {
    this.promise = new Promise((res, rej) => {
      // @ts-ignore
      this.resolve = res;
      // @ts-ignore
      this.reject = rej;
    });
  }
}
