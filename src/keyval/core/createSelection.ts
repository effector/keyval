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
  forIn(normCases, (selection, field) => {
    const activator = createEvent<void>()
    $currentCase.on(activator, () => field)
    caseApi[field] = activator
    split({
      source: $currentCase,
      match: (currentCase) =>
        currentCase === field ? 'activate' : 'deactivate',
      cases: {
        activate: selection.api.addConsumer,
        deactivate: selection.api.removeConsumer,
      },
    })
  })
  if (initialCase in normCases) normCases[initialCase].api.addConsumer()
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
  const addConsumer = createEvent()
  const removeConsumer = createEvent()
  const activated = createEvent()
  const $consumersAmount = createStore(0)
  const $active = $consumersAmount.map((amount) => amount > 0)
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
  $consumersAmount.on(addConsumer, (amount) => amount + 1)
  $consumersAmount.on(removeConsumer, (amount) => amount - 1)

  return {
    state: {
      active: $active,
      consumersAmount: $consumersAmount,
      items: $items,
      size: $size,
    },
    api: {
      addConsumer,
      removeConsumer,
      activated,
    },
    fn,
  }
}
