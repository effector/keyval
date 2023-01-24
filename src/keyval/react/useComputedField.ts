import {useStoreMap} from 'effector-react'
import type {Aggregate, PossibleKey} from '../core'

export function useComputedField<
  Item,
  IndexField extends keyof Item,
  Key extends PossibleKey,
  Aggregation,
>(
  aggregate: Aggregate<Item, Key, IndexField, Aggregation>,
  groupValue: Item[IndexField],
) {
  return useStoreMap({
    store: aggregate.values,
    keys: [aggregate, groupValue],
    fn(map) {
      const result = map.get(groupValue)
      if (result === undefined) return aggregate.config.defaultValue
      return result
    },
  })
}
