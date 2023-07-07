import { combine } from "effector"
import { ListApi, Mapping, PossibleKey, Selection } from "./types"

/** Takes `kv` KV. Takes `join` KV. Returns `{ [kvId]: JoinItem[] }`, where `JoinItem[]` is array of items filtered by `fn` and sorted through by `orderBy` */
export const joinLists = <
  Item,
  ItemKey extends PossibleKey,
  JoinItem,
  JoinKey extends PossibleKey,
>(config: {
  kv: ListApi<Item, ItemKey> | Selection<Item, ItemKey> | Mapping<Item, ItemKey>
  join: ListApi<JoinItem, JoinKey> | Selection<JoinItem, JoinKey> | Mapping<JoinItem, JoinKey>
  orderBy?: (joinedItemA: JoinItem, joinedItemB: JoinItem, itemA: Item) => number
  fn: (joinedItem: JoinItem, item: Item) => boolean
}): Mapping<JoinItem[], ItemKey> => {
  const { kv, join, orderBy, fn } = config
  const $store = combine(kv.state.store, join.state.store, (kv, joined) => {
    const joinedEntries = Object.entries(joined.ref) as [JoinKey, JoinItem][]
    return {
      ref: Object.fromEntries(
        (Object.entries(kv.ref) as [ItemKey, Item][]).map(([key, item]) => {
          let filtered = joinedEntries.filter(([_joinedKey, joinItem]) => {
            return fn(joinItem, item)
          })
          if (orderBy) {
            filtered = filtered.sort((a, b) => {
              return orderBy(a[1], b[1], item)
            })
          }
          const items = filtered.map(([_, joinedItem]) => joinedItem)
          return [key, items]
        }),
      ) as Record<ItemKey, JoinItem[]>,
    }
  })

  return {
    state: {
      store: $store,
    },
  }
}