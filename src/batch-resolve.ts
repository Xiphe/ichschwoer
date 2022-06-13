export type Value<T> = Promise<T> | T;

export default function createBatchResolve<R = any>(ms: number) {
  let current: Promise<any>[] = [];
  let ref: { current?: R } = { current: undefined };

  return {
    get length(): number {
      return Math.max(current.length - 1, 0);
    },
    get ref(): { current?: R } {
      return ref;
    },
    push<T>(value: Value<T>): Promise<T> {
      if (!current.length) {
        current.push(
          new Promise<void>((res) => {
            setTimeout(() => {
              current = [];
              ref = { current: undefined };
              res();
            }, ms);
          }),
        );
      }
      const chunk = current;
      chunk.push(Promise.resolve(value));

      return chunk[0].then(() => Promise.all(chunk)).then(() => value);
    },
  };
}
