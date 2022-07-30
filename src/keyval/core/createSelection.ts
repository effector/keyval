import {combine, createStore, createEvent, Event, sample, split} from 'effector'

import {forIn} from './forIn'
import {areArraysDifferent} from './changeDetection'
import type {ListApi, SelectionSwitch, Selection} from './types'

export function createSwitch<
  Item,
  KeyField extends keyof Item,
  Shape extends Record<string, Selection<Item> | ((item: Item) => boolean)>,
>({
  kv,
  cases,
  initialCase,
}: {
  kv: ListApi<Item, KeyField>
  cases: Shape
  initialCase: keyof Shape
}): SelectionSwitch<Item, KeyField, {[K in keyof Shape]: Selection<Item>}> {
  const $currentCase = createStore(initialCase)
  const caseApi = {} as {[K in keyof Shape]: Event<void>}
  const normCases = {} as {[K in keyof Shape]: Selection<Item>}
  forIn(cases, (selectionOrFn, field) => {
    normCases[field] =
      typeof selectionOrFn === 'function'
        ? createSelection(kv, selectionOrFn)
        : (selectionOrFn as Selection<Item>)
  })
  let currentConsumerId: number | void
  forIn(normCases, (selection, field) => {
    const activator = createEvent<void>()
    $currentCase.on(activator, () => field)
    caseApi[field] = activator
    selection.consumersTotal += 1
    const consumerId = selection.consumersTotal
    if (field === initialCase) currentConsumerId = consumerId
    split({
      source: $currentCase,
      match: (currentCase) =>
        currentCase === field ? 'activate' : 'deactivate',
      cases: {
        activate: selection.api.addConsumer.prepend(() => consumerId),
        deactivate: selection.api.removeConsumer.prepend(() => consumerId),
      } as const,
    })
  })
  if (currentConsumerId!) {
    normCases[initialCase].api.addConsumer(currentConsumerId)
  }
  const caseNames = Object.keys(normCases) as Array<keyof Shape>
  const caseValues = Object.values(normCases)
  const $list = combine(
    [$currentCase, ...caseValues.map(({state}) => state.items)],
    ([currentCase, ...lists]) => lists[caseNames.indexOf(currentCase)],
  )
  const $size = combine(
    [$currentCase, ...caseValues.map(({state}) => state.size)],
    ([currentCase, ...lists]) => lists[caseNames.indexOf(currentCase)],
  )
  return {
    state: {
      currentCase: $currentCase,
      items: $list,
      size: $size,
    },
    api: caseApi,
    cases: normCases,
  }
}

export function createSelection<Item, KeyField extends keyof Item>(
  kv: ListApi<Item, KeyField>,
  fn: (item: Item) => boolean,
): Selection<Item> {
  const addConsumer = createEvent<number>()
  const removeConsumer = createEvent<number>()
  const activated = createEvent()
  const $consumers = createStore<number[]>([])
  const $active = $consumers.map((consumers) => consumers.length > 0)
  const $items = createStore<Item[]>([], {updateFilter: areArraysDifferent})
  const $size = $items.map((items) => items.length)
  sample({
    clock: $active,
    filter: Boolean,
    target: activated,
  })
  sample({
    clock: [kv.state.store, activated],
    source: kv.state.store,
    filter: $active,
    target: $items,
    fn: (kv) => Object.values(kv).filter(fn),
  })
  $consumers.on(addConsumer, (consumers, id) => {
    if (!consumers.includes(id)) return [...consumers, id]
  })
  $consumers.on(removeConsumer, (consumers, id) => {
    if (consumers.includes(id)) {
      const result = [...consumers]
      result.splice(result.indexOf(id), 1)
      return result
    }
  })

  return {
    state: {
      active: $active,
      consumers: $consumers,
      items: $items,
      size: $size,
    },
    api: {
      addConsumer,
      removeConsumer,
      activated,
    },
    consumersTotal: 0,
    fn,
  }
}
