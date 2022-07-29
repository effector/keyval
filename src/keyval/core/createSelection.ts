import {combine, createStore, createEvent, Event} from 'effector'

import {forIn} from './forIn'
import type {ListApi, Selection} from './types'

export function createSelection<
  Item,
  KeyField extends keyof Item,
  Shape extends Record<string, (item: Item) => boolean>
>({
  kv,
  cases,
  initialCase,
}: {
  kv: ListApi<Item, KeyField>
  cases: Shape
  initialCase: keyof Shape
}): Selection<Item, KeyField, Shape> {
  const $currentCase = createStore(initialCase)
  const caseApi = {} as {[K in keyof Shape]: Event<void>}
  forIn(cases, (_, field) => {
    const activator = createEvent<void>()
    $currentCase.on(activator, () => field)
    caseApi[field] = activator
  })
  const $list = combine(kv.state.store, $currentCase, (kv, currentCase) => {
    return Object.values(kv).filter(cases[currentCase])
  })
  const $size = $list.map((items) => items.length)
  return {
    state: {
      currentCase: $currentCase,
      items: $list,
      size: $size,
    },
    api: caseApi,
    cases,
  }
}
