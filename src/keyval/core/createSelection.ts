import {combine, createStore, createEvent, Event, sample, split} from 'effector'

import {forIn} from './forIn'
import {areArraysDifferent} from './changeDetection'
import type {
  ListApi,
  SwitchSelection,
  FilterSelection,
  Selection,
} from './types'
import {createConsumerPort, getConsumerId} from './consumerPort'

export function createSwitch<
  Item,
  Shape extends Record<string, Selection<Item> | ((item: Item) => boolean)>,
>({
  kv,
  cases,
  initialCase,
}: {
  kv: ListApi<Item, any>
  cases: Shape
  initialCase: keyof Shape
}): SwitchSelection<Item, {[K in keyof Shape]: Selection<Item>}> {
  const port = createConsumerPort()
  const $currentCase = createStore(initialCase)
  const caseApi = {} as {[K in keyof Shape]: Event<void>}
  const normCases = {} as {[K in keyof Shape]: Selection<Item>}
  const selectionActivation = createEvent<keyof Shape>()
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
    const consumerId = getConsumerId(selection.port)
    const activateCase = selection.port.api.addConsumer.prepend(
      () => consumerId,
    )
    const deactivateCase = selection.port.api.removeConsumer.prepend(
      () => consumerId,
    )
    split({
      source: selectionActivation,
      match: (currentCase) =>
        currentCase === field ? 'activate' : 'deactivate',
      cases: {
        activate: activateCase,
        deactivate: deactivateCase,
      } as const,
    })
    sample({
      clock: port.api.deactivated,
      target: deactivateCase,
    })
  })
  const caseNames = Object.keys(normCases) as Array<keyof Shape>
  const caseValues = Object.values(normCases)
  const $list = createStore([] as Item[])
  const $size = createStore(0)
  sample({
    clock: [$currentCase, port.api.activated],
    source: $currentCase,
    filter: port.state.active,
    target: selectionActivation,
  })
  sample({
    source: combine([
      $currentCase,
      ...caseValues.map(({state}) => state.items),
    ]),
    filter: port.state.active,
    target: $list,
    fn: ([currentCase, ...lists]) => lists[caseNames.indexOf(currentCase)],
  })
  sample({
    source: combine([$currentCase, ...caseValues.map(({state}) => state.size)]),
    filter: port.state.active,
    target: $size,
    fn: ([currentCase, ...lists]) => lists[caseNames.indexOf(currentCase)],
  })

  return {
    state: {
      currentCase: $currentCase,
      items: $list,
      size: $size,
    },
    api: caseApi,
    cases: normCases,
    port,
  }
}

export function createSelection<Item>(
  kv: ListApi<Item, any>,
  fn: (item: Item) => boolean,
): FilterSelection<Item> {
  const port = createConsumerPort()
  const $items = createStore<Item[]>([], {updateFilter: areArraysDifferent})
  const $size = $items.map((items) => items.length)

  sample({
    clock: [kv.state.store, port.api.activated],
    source: kv.state.store,
    filter: port.state.active,
    target: $items,
    fn: (kv) => Object.values<Item>(kv.ref).filter(fn),
  })

  return {
    state: {
      items: $items,
      size: $size,
    },
    fn,
    port,
  }
}
