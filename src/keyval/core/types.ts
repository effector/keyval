import type {Event, Store} from 'effector'

export type Key = string
export type KV<Item> = Record<Key, Item>

export type ListApi<Item, IDField extends keyof Item = any> = {
  setField<Path extends keyof Item>(
    path: Path,
  ): Event<{key: Key; value: Item[Path]}>
  removeByField(match: keyof Item): Event<void>
  setAll<Path extends keyof Item>(match: Path): Event<Item[Path]>
  mapItem(
    fn: (value: Item, payload: undefined) => Partial<Item>,
  ): Event<{key: Key}>
  mapItem<T>(
    fn: (value: Item, payload: T) => Partial<Item>,
  ): Event<{key: Key; value: T}>
  removeItem(): Event<{key: Key}>
  removeItem<ChildField extends keyof Item>(config: {
    removeChilds: {
      childField: ChildField
      selection?: Selection<Item>
    }
  }): Event<{key: Key}>
  addItem<Params>(config: {
    fn: (params: Params) => Omit<Item, IDField>
  }): Event<Params>
  addItemTree<Input, RawInput = Input>(config: {
    normalize?: (input: RawInput) => Input
    convertInput: (
      item: Input,
      childOf: Item[IDField] | null,
    ) => Omit<Item, IDField>
    getChilds: (item: Input) => RawInput | RawInput[] | null | undefined
  }): Event<RawInput[] | RawInput>
  config: {
    key: IDField
    getKey: (item: Item) => Key
    getItem: (store: KV<Item>, key: Key | [Key]) => Item
    keygen: (draft: Omit<Item, IDField>) => Item[IDField]
  }

  state: Stores<{
    store: KV<Item>
    keys: Item[IDField][]
  }>

  events: Events<{
    setAll: {key: keyof Item; value: Item[keyof Item]}
    addItem:
      | {key: Item[IDField]; value: Item}
      | Array<{key: Item[IDField]; value: Item}>
    removeItem: {key: Key} | {key: Key}[]
    removeWhen: {
      field: keyof {
        [K in keyof Item]: Item[K] extends boolean ? Item[K] : never
      }
    }
    mapItem: {
      key: Key
      value: any
      fn: (value: Item, data: any) => Partial<Item>
    }
  }>
}

export type InputItemTree<Item> = {
  value: Item
  childs: InputItemTree<Item>[]
}
type Events<T extends {[key: string]: any}> = {[K in keyof T]: Event<T[K]>}
type Stores<T extends {[key: string]: any}> = {[K in keyof T]: Store<T[K]>}

export type Selection<Item> = {
  state: Stores<{
    items: Item[]
    size: number
  }>
  port: ConsumerPort
}

export type ConsumerPort = {
  state: Stores<{
    active: boolean
    consumers: number[]
  }>
  api: Events<{
    addConsumer: number
    removeConsumer: number
    activated: void
    deactivated: void
  }>
  consumersTotal: number
}

export type SwitchSelection<
  Item,
  Shape extends Record<string, Selection<Item>>,
> = {
  state: Stores<{
    currentCase: keyof Shape
    items: Item[]
    size: number
  }>
  api: {[K in keyof Shape]: Event<void>}
  cases: Shape
  port: ConsumerPort
}

export type FilterSelection<Item> = {
  state: Stores<{
    items: Item[]
    size: number
  }>
  fn: (item: Item) => boolean
  port: ConsumerPort
}

export type ItemApi<T, ItemTriggers extends Record<string, unknown>> = {
  kv: ListApi<T>
  api: {[K in keyof ItemTriggers]: Event<{key: string; value: ItemTriggers[K]}>}
}

export type IndexApi<
  Item,
  ChildField extends keyof Item,
  IDField extends keyof Item,
> = {
  kv: ListApi<Item, IDField>
  field: ChildField
  groups: Store<Map<Item[ChildField], Item[IDField][]>>
  selection?: Selection<Item>
}

export type Aggregate<
  T,
  AggregateField extends keyof T,
  IDField extends keyof T,
  Aggregation,
> = {
  kv: ListApi<T, IDField>
  index: IndexApi<T, AggregateField, IDField>
  config: {
    aggregateField: AggregateField
    fn: (items: T[], groupID: T[AggregateField]) => Aggregation
    selection?: Selection<T>
    when?: (item: T, groupID: T[AggregateField]) => boolean
    defaultValue: Aggregation
  }
  values: Store<Map<T[AggregateField], Aggregation>>
}
