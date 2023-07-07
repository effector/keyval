import { combine, createEvent, createStore, Event, sample, Source, split, Store } from 'effector'

import { createConsumerPort, getConsumerId } from './consumerPort'
import type { ListApi, PossibleKey, Selection, SelectionItem, SwitchSelection } from './types'
import { areObjectsDifferent, filterObj, forIn } from './utils'

export function createSwitch<Shape extends { [k: string]: Selection<any, any> }>({
  cases,
  initialCase,
}: {
  cases: Shape
  initialCase: keyof Shape
}): SwitchSelection<Shape> {
  type ShapeCase = keyof Shape
  type ShapeItem = SelectionItem<SwitchSelection<Shape>>

  const port = createConsumerPort()
  const $currentCase = createStore(initialCase)
  const caseApi = {} as { [K in ShapeCase]: Event<void> }
  const selectionActivation = createEvent<ShapeCase>()

  forIn(cases, (selection, field) => {
    const activator = createEvent<void>()
    $currentCase.on(activator, () => field)
    caseApi[field] = activator
    const consumerId = getConsumerId(selection.port)
    const activateCase = selection.port.api.addConsumer.prepend(() => consumerId)
    const deactivateCase = selection.port.api.removeConsumer.prepend(() => consumerId)
    split({
      source: selectionActivation,
      match: (currentCase) => (currentCase === field ? 'activate' : 'deactivate'),
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
  const caseNames = Object.keys(cases) as Array<ShapeCase>
  const caseValues = Object.values(cases)

  const $store = createStore({} as Record<any, ShapeItem>)
  const $size = createStore(0)

  sample({
    clock: [$currentCase, port.api.activated],
    source: $currentCase,
    filter: port.state.active,
    target: selectionActivation,
  })
  sample({
    source: combine([$currentCase, ...caseValues.map(({ state }) => state.store)]),
    filter: port.state.active,
    target: $store,
    fn: ([currentCase, ...lists]) => lists[caseNames.indexOf(currentCase)],
  })
  sample({
    source: combine([$currentCase, ...caseValues.map(({ state }) => state.size)]),
    filter: port.state.active,
    target: $size,
    fn: ([currentCase, ...lists]) => lists[caseNames.indexOf(currentCase)],
  })

  return {
    state: {
      store: $store,
      size: $size,
      currentCase: $currentCase,
    },
    api: caseApi,
    cases,
    port,
  }
}

export function createSelection<
  Item,
  Key extends PossibleKey,
  SelectedItem extends Item,
  SourceState,
>(
  kv: ListApi<Item, Key>,
  config: {
    source?: Source<SourceState>
    fn:
      | ((item: Item, source: SourceState) => item is SelectedItem)
      | ((item: Item, source: SourceState) => boolean)
  },
): Selection<SelectedItem, any> {
  // @ts-expect-error If source is not provided, type doesn't matter
  const source: Store<SourceState> = config.source ?? createStore<SourceState>(null)
  // const port = createConsumerPort()
  const $store = createStore<{ ref: Record<Key, SelectedItem> }>(
    { ref: {} as Record<Key, SelectedItem> },
    {
      updateFilter: (prev, next) => areObjectsDifferent(prev.ref, next.ref),
    },
  )
  const $size = $store.map((items) => Object.keys(items).length)

  $store.on(
    sample({
      clock: [kv.state.store, source],
      source: [kv.state.store, source] as const,
    }),
    (_prev, [{ ref }, source]) => ({
      ref: filterObj(ref, (item) => config.fn(item, source)),
    }),
  )

  return {
    kv,
    state: {
      store: $store,
      size: $size,
    },
    // port,
    config: {
      source: config?.source ?? undefined,
      fn: config.fn,
    },
  }
}
