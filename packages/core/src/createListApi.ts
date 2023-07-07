import { createEvent, createStore, sample } from 'effector'

import { createGroup } from './createGroup'
import type { ListApi, PossibleKey, SelectionApi } from './types'
import { arrifyIterate, filterObj } from './utils'

export const getNewKv = <T>(kv: { ref: T }) => ({ ref: { ...kv.ref } })

export function createListApi<Item, Key extends PossibleKey>({
  keygen,
  serialize,
}: {
  keygen: (draft: Item) => Key
  serialize?:
    | 'ignore'
    | {
        write: (state: { ref: Record<Key, Item> }) => string
        read: (json: string) => { ref: Record<Key, Item> }
      }
}): ListApi<Item, Key> {
  type KV = Record<Key, Item>
  const storeSettings = serialize ? { serialize } : {}

  // @ts-expect-error External `serialize` config
  const $kv = createStore<{ ref: KV }>({ ref: {} as KV }, storeSettings)
  const fill = createEvent<{ key: Key; value: Item }[]>()
  const addItems = createEvent<{ key: Key; value: Item }[]>()
  const setAll = createEvent<{ key: keyof Item; value: Item[keyof Item] }>()
  $kv.on(setAll, (kv, { key, value }) => {
    const nextKv = getNewKv({ ref: kv.ref })
    for (const id in nextKv) {
      nextKv.ref[id as Key] = { ...nextKv.ref[id as Key], [key]: value }
    }
    return nextKv
  })
  const addItem = createEvent<{ key: Key; value: Item } | Array<{ key: Key; value: Item }>>()
  const removeItem = createEvent<{ key: Key } | { key: Key }[]>()
  const removeWhen = createEvent<{
    field: keyof {
      [K in keyof Item]: Item[K] extends boolean ? Item[K] : never
    }
  }>()
  const mapItem = createEvent<{
    key: Key
    value: any
    fn: (value: Item, data: any) => Partial<Item>
  }>()
  $kv.on(fill, (_kv, updates) => {
    const nextKv = { ref: {} as KV }
    arrifyIterate(updates, ({ key, value }) => {
      nextKv.ref[key] = value
    })
    return nextKv
  })
  $kv.on(addItems, (kv, updates) => {
    const nextKv = getNewKv(kv)
    arrifyIterate(updates, ({ key, value }) => {
      nextKv.ref[key] = value
    })
    return nextKv
  })
  $kv.on(addItem, (kv, updates) => {
    const nextKv = getNewKv(kv)
    let kvChanged = false
    arrifyIterate(updates, ({ key, value }) => {
      if (key === undefined) return
      if (key in nextKv.ref && value === nextKv.ref[key]) return

      kvChanged = true
      nextKv.ref[key] = value
    })

    return kvChanged ? { ref: nextKv.ref } : kv
  })
  $kv.on(mapItem, (kv, { key, value, fn }) => {
    let nextKv = kv
    if (key in nextKv.ref) {
      const upd = fn(nextKv.ref[key], value)
      nextKv = getNewKv(kv)
      nextKv.ref[key] = { ...nextKv.ref[key], ...upd }
      return { ref: nextKv.ref }
    }
    return kv
  })
  $kv.on(removeWhen, (kv, { field }) => ({
    ref: filterObj(kv.ref, (val) => !val[field]),
  }))
  $kv.on(removeItem, (kv, itemOrItems) => {
    const nextKv = getNewKv(kv)
    let kvChanged = false
    arrifyIterate(itemOrItems, ({ key }) => {
      if (key in nextKv.ref) {
        kvChanged = true
        delete nextKv.ref[key]
      }
    })
    return kvChanged ? { ref: nextKv.ref } : kv
  })
  const listApi: ListApi<Item, Key> = {
    config: {
      keygen,
      getItem: (store: KV, key: Key | [Key]): Item => store[Array.isArray(key) ? key[0] : key],
    },
    state: {
      store: $kv,
    },

    events: {
      fill,
      setAll,
      addItem,
      addItems,
      removeItem,
      removeWhen,
      mapItem,
    },
    mapItem(fn: (value: Item, data: any) => Partial<Item>) {
      const result = createEvent<{ key: Key; value: any }>()
      sample({
        clock: result,
        fn: ({ key, value }) => ({ key, value, fn }),
        target: mapItem,
      })
      return result as any
    },
    removeItem<ChildField extends keyof Item>(config?: {
      removeChilds: {
        childField: ChildField
        selection?: SelectionApi<Item, Key>
      }
    }) {
      if (!config) {
        return removeItem.prepend(({ key }: { key: Key }) => ({ key }))
      }

      const {
        removeChilds: { childField, selection },
      } = config
      const index = selection
        ? createGroup({
            field: childField,
            selection,
          })
        : createGroup({ kv: listApi, field: childField })

      const removeItemTrigger = createEvent<{ key: Key }>()
      function processItem(
        key: Key & Item[ChildField] & string,
        groups: Map<Item[ChildField], Key[]>,
        kv: KV,
        keysToRemove: string[],
      ) {
        const item = kv[key]
        if (!item) return
        if (keysToRemove.includes(key)) return
        keysToRemove.push(key)
        const group = groups.get(key)
        if (!group) return
        group.forEach((child) =>
          processItem(child as Key & Item[ChildField] & string, groups, kv, keysToRemove),
        )
      }
      sample({
        clock: removeItemTrigger,
        source: { groups: index.groups, kv: $kv },
        fn({ groups, kv }, { key }) {
          const keysToRemove: any[] = []
          processItem(key as Key & Item[ChildField] & string, groups, kv.ref, keysToRemove)
          return keysToRemove.map((key) => ({ key }))
        },
        target: removeItem,
      })

      return removeItemTrigger
    },
    addItem({ fn }) {
      return addItem.prepend((params: any) => {
        const userData = fn(params)
        const itemKey = keygen(userData)
        return {
          key: itemKey,
          value: userData,
        }
      })
    },
    addItems({ fn }) {
      return addItems.prepend((params: any) => {
        return params.map((param: any) => {
          const userData = fn(param)
          const itemKey = keygen(userData)
          return {
            key: itemKey,
            value: userData,
          }
        })
      })
    },
    addItemTree<Input, RawInput = Input>({
      normalize = (item: RawInput) => item as unknown as Input,
      convertInput,
      getChilds,
    }: {
      normalize?: (input: RawInput) => Input
      convertInput: (item: Input, childOf: Key | null) => Item
      getChilds: (item: Input) => RawInput | RawInput[] | null | undefined
    }) {
      function traverseTree(
        raw: RawInput,
        result: {
          key: Key
          value: Item
        }[],
        childOf: Key | null = null,
      ) {
        const input = normalize(raw)
        const value = convertInput(input, childOf)
        const childs = getChilds(input)
        const itemKey = keygen(value)

        result.push({ key: itemKey, value })
        arrifyIterate<RawInput>(childs, (child) => traverseTree(child, result, itemKey))
      }
      return addItem.prepend((params: RawInput[] | RawInput) => {
        const result: {
          key: Key
          value: Item
        }[] = []
        arrifyIterate(params, (item) => traverseTree(item, result))

        return result
      })
    },
    setAll<Path extends keyof Item>(match: Path) {
      const clock = createEvent<Item[Path]>()
      sample({
        clock,
        fn: (value) =>
          ({ key: match, value } as {
            key: keyof Item
            value: Item[keyof Item]
          }),
        target: setAll,
      })
      return clock
    },
    setItemField(field, cb = (item, payload) => payload) {
      const fn = (item: Item, upd: any) => ({ [field]: cb(item, upd) } as Partial<Item>)
      const clock = createEvent<any>()
      sample({
        clock,
        target: mapItem,
        fn: ({ key, value }) => ({ key, value, fn }),
      })
      return clock
    },
    removeItemsByField: (field) => removeWhen.prepend(() => ({ field })),
  }
  return listApi
}
