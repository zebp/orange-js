export function unreachable(): never {
  throw new Error("unreachable");
}

export function bail(message: string): never {
  throw new Error(message);
}

export function assert<T>(
  whatever: T,
  message = "assertion failed",
): asserts whatever {
  if (!whatever) {
    throw new Error(message);
  }
}

export function getAllMethods<T extends object>(obj: T): string[] {
  let props: string[] = [];

  do {
    const l = Object.getOwnPropertyNames(obj)
      .concat(Object.getOwnPropertySymbols(obj).map((s) => s.toString()))
      .sort()
      .filter(
        (p, i, arr) =>
          // @ts-ignore
          typeof obj[p] === "function" && //only the methods
          p !== "constructor" && //not the constructor
          (i == 0 || p !== arr[i - 1]) && //not overriding in this prototype
          props.indexOf(p) === -1, //not overridden in a child
      );
    props = props.concat(l);
  } while (
    (obj = Object.getPrototypeOf(obj)) && //walk-up the prototype chain
    Object.getPrototypeOf(obj) //not the the Object prototype methods (hasOwnProperty, etc...)
  );

  return props;
}
