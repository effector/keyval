import {useStoreMap} from 'effector-react'
import type {Aggregate} from '../core'

export function useAggregate<
  T,
  IndexField extends keyof T,
  IDField extends keyof T,
  Aggregation
>(
  aggregate: Aggregate<T, IndexField, IDField, Aggregation>,
  groupValue: T[IndexField],
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
