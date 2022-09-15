import {combine} from 'effector'

import type {ListApi, Selection, IndexApi, PossibleKey} from './types'
import {addAlwaysActivatedConsumer} from './consumerPort'

export function createIndex<
  Item,
  Key extends PossibleKey,
  Field extends keyof Item,
>({
  kv,
  field,
  selection,
}: {
  kv: ListApi<Item, Key>
  field: Field
  selection?: Selection<Item>
}): IndexApi<Item, Key, Field> {
  const fn = ({ref}: {ref: Record<Key, Item>}, items?: Item[]) => {
    const result = new Map<Item[Field], Key[]>()

    for (const key in ref) {
      const value = ref[key]
      if (items && !items.includes(value)) continue
      const indexValue = value[field]
      let bucket = result.get(indexValue)
      if (!bucket) {
        bucket = []
        result.set(indexValue, bucket)
      }
      bucket.push(key)
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
