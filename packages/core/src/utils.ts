/** comparison with sorting taken into account */
export function areArraysDifferent<T>(a: T[], b: T[]) {
  if (a === b) return false;
  return a.length !== b.length || a.some((e, idx) => e !== b[idx]);
}

export function areObjectsDifferent<K extends number | string, V>(
  a: Record<K, V>,
  b: Record<K, V>
) {
  if (a === b) return false;

  const aKeys = Object.keys(a) as K[];
  const bKeys = Object.keys(b) as K[];

  if (aKeys.length !== bKeys.length) {
    return true;
  }

  return aKeys.some((aKey) => a[aKey] !== b[aKey]);
}

export function forIn<T extends Record<string, unknown>>(
  obj: T,
  cb: (value: T[keyof T], key: Exclude<keyof T, number>) => void
) {
  for (const key in obj) {
    cb(obj[key], key as any);
  }
}

export function filterObj<K extends string | number, V, VV extends V>(
  obj: Record<K, V>,
  fn: ((value: V, key: K) => value is VV) | ((value: V, key: K) => boolean)
): Record<K, VV> {
  return Object.fromEntries(
    Object.entries<V>(obj).filter(([key, value]) => fn(value, key as K))
  ) as Record<K, VV>;
}

export function arrifyIterate<T>(
  value: T[] | T | null | void,
  fn: (value: T) => void
) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) value.forEach((item) => fn(item));
  else fn(value);
}
