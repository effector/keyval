/** comparison with sorting taken into account */
export function areArraysDifferent<T>(a: T[], b: T[]) {
  if (a === b) return false
  return a.length !== b.length || a.some((e, idx) => e !== b[idx])
}
