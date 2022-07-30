import {combine} from 'effector'

import type {ListApi, Selection, IndexApi} from './types'
import {addAlwaysActivatedConsumer} from './consumerPort'

export function createIndex<T, K extends keyof T, ID extends keyof T>({
  kv,
  field,
  selection,
}: {
  kv: ListApi<T, ID>
  field: K
  selection?: Selection<T>
}): IndexApi<T, K, ID> {
  const fn = (map: Record<string, T>, items?: T[]) => {
    const result = new Map<T[K], T[ID][]>()
    for (const key in map) {
      const value = map[key]
      if (items && !items.includes(value)) continue
      const indexValue = value[field]
      let bucket = result.get(indexValue)
      if (!bucket) {
        bucket = []
        result.set(indexValue, bucket)
      }
      bucket.push(kv.config.getKey(value) as unknown as T[ID])
    }
    return result
  }
  if (selection) {
    addAlwaysActivatedConsumer(selection.port)
  }
  const groups = selection
    ? combine(kv.state.store, selection.state.items, fn)
    : kv.state.store.map((map) => fn(map))
  return {
    kv,
    field,
    groups,
  }
}
