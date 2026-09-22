import type { ca } from "./ca";

type Widen<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { [K in keyof T]: Widen<T[K]> }
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type Messages = Widen<typeof ca>;
