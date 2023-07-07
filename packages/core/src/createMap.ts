import { Source, combine, createStore } from "effector"
import { ListApi, Mapping, PossibleKey, Selection } from "./types"

export const createMap = <Item, Key extends PossibleKey, MappedItem, SourceState = void>(
  api: ListApi<Item, Key> | Selection<Item, Key> | Mapping<Item, Key>,
  config: {
    source?: Source<SourceState>
    fn: (item: Item, source: SourceState, key: Key) => MappedItem
  },
): Mapping<MappedItem, Key> => {
  const $store = combine(api.state.store, config.source || createStore(null), ({ ref }, source) => {
    // @ts-expect-error
    const nextRef: Record<Key, MappedItem> = {}
    for (const k in ref) {
      // @ts-expect-error
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