import type {Event, Store} from 'effector'

export type PossibleKey = string | number

export type ListApi<Item, Key extends PossibleKey> = {
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
  addItem<Params>(config: {fn: (params: Params) => Item}): Event<Params>
  addItemTree<Input, RawInput = Input>(config: {
    normalize?: (input: RawInput) => Input
    convertInput: (item: Input, childOf: Key | null) => Item
    getChilds: (item: Input) => RawInput | RawInput[] | null | undefined
  }): Event<RawInput[] | RawInput>
  config: {
    getItem: (store: Record<Key, Item>, key: Key | [Key]) => Item // TOOD: | undefined
  }

  state: Stores<{
    store: {ref: Record<Key, Item>}
  }>

  events: Events<{
    setAll: {key: keyof Item; value: Item[keyof Item]}
    addItem: {key: Key; value: Item} | Array<{key: Key; value: Item}>
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

export type ItemApi<
  Item,
  Key extends PossibleKey,
  ItemTriggers extends Record<string, unknown>,
> = {
  kv: ListApi<Item, Key>
  api: {[K in keyof ItemTriggers]: Event<{key: Key; value: ItemTriggers[K]}>}
}

export type IndexApi<
  Item,
  Key extends PossibleKey,
  ChildField extends keyof Item,
> = {
  kv: ListApi<Item, Key>
  field: ChildField
  groups: Store<Map<Item[ChildField], Key[]>>
  selection?: Selection<Item>
}

export type Aggregate<
  Item,
  Key extends PossibleKey,
  AggregateField extends keyof Item,
  Aggregation,
> = {
  kv: ListApi<Item, Key>
  index: IndexApi<Item, Key, AggregateField>
  config: {
    aggregateField: AggregateField
    fn: (items: Item[], groupID: Item[AggregateField]) => Aggregation
    selection?: Selection<Item>
    when?: (item: Item, groupID: Item[AggregateField]) => boolean
    defaultValue: Aggregation
  }
  values: Store<Map<Item[AggregateField], Aggregation>>
}
