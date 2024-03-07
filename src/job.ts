export type Job<T> = () => PromiseLike<T> | T;
