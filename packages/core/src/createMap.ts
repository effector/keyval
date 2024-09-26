import { Source, Store, combine, createStore } from "effector"
import { ListApi, MappingApi, PossibleKey, SelectionApi } from "./types"

export const createMap = <Item, Key extends PossibleKey, MappedItem, SourceState = void>(
  api: ListApi<Item, Key> | SelectionApi<Item, Key> | MappingApi<Item, Key>,
  config: {
    source?: Source<SourceState>
    fn: (item: Item, source: SourceState, key: Key) => MappedItem
  },
): MappingApi<MappedItem, Key> => {
  // @ts-expect-error If source is not provided, type doesn't matter
  const $source: Store<SourceState> =  config.source || createStore(null)
  const $store = combine(api.state.store, $source, ({ ref }, source) => {
    // @ts-expect-error Buildable object
    const nextRef: Record<Key, MappedItem> = {}
    for (const k in ref) {
      nextRef[k] = config.fn(ref[k], source, k)
    }
    return { ref: nextRef }
  })

  return {
    state: {
      store: $store,
    },
  }
}