export interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => T;
  readonly reject: (reason: unknown) => void;
}

export default function defer<T>(): Deferred<T> {
  let _res: any;
  let _rej: any;
  const promise = new Promise<T>((res, rej) => {
    _res = res;
    _rej = rej;
  });
  return {
    promise,
    resolve: _res.bind(promise),
    reject: _rej.bind(promise),
  };
}
