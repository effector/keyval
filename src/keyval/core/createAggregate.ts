import {combine} from 'effector'
import type {Aggregate, ListApi, SelectionSwitch} from './types'

import {createIndex} from './createIndex'

export function createAggregate<
  T,
  AggregateField extends keyof T,
  IDField extends keyof T,
  Aggregation,
>({
  kv,
  aggregateField,
  fn,
  selection,
  when,
  defaultValue,
}: {
  kv: ListApi<T, IDField>
  aggregateField: AggregateField
  fn: (items: T[], groupID: T[AggregateField]) => Aggregation
  when?: (item: T, groupID: T[AggregateField]) => boolean
  selection?: SelectionSwitch<T, AggregateField, any>
  defaultValue: Aggregation
}): Aggregate<T, AggregateField, IDField, Aggregation> {
  const index = createIndex({kv, field: aggregateField, selection})
  const values = combine(kv.state.store, index.groups, (kv, indexGroups) => {
    const result = new Map<T[AggregateField], Aggregation>()
    for (const [key, group] of indexGroups) {
      const vals: T[] = []
      for (const id of group) {
        const item = kv[id as any]
        if (!when || when(item, key)) {
          vals.push(kv[id as any])
        }
      }
      result.set(key, fn(vals, key))
    }
    return result
  })
  return {
    kv,
    index,
    config: {
      aggregateField,
      fn,
      selection,
      when,
      defaultValue,
    },
    values,
  }
}
