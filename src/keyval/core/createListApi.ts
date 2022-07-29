import {createStore, createEvent, sample} from 'effector'

import type {KV, Key, ListApi, Selection} from './types'
import {createIndex} from './createIndex'

export function createListApi<Item, KeyField extends keyof Item>({
  keygen,
  key,
}: {
  key: KeyField
  keygen: (draft: Omit<Item, KeyField>) => Item[KeyField]
}): ListApi<Item, KeyField> {
  const getKey = (item: Item): Key => item[key] as any
  const $kv = createStore<KV<Item>>({})

  const $keys = createStore<Array<Item[KeyField]>>([], {
    updateFilter(keys, oldKeys) {
      if (keys.length !== oldKeys.length) return true
      return keys.some((key, index) => oldKeys[index] !== key)
    },
  })
  $keys.on($kv, (kv) => (Object.keys(kv) as unknown) as Array<Item[KeyField]>)

  const setAll = createEvent<{key: keyof Item; value: Item[keyof Item]}>()
  $kv.on(setAll, (kv, {key, value}) => {
    kv = {...kv}
    for (const id in kv) {
      kv[id] = {...kv[id], [key]: value}
    }
    return kv
  })
  const addItem = createEvent<
    | {key: Item[KeyField]; value: Item}
    | Array<{key: Item[KeyField]; value: Item}>
  >()
  const removeItem = createEvent<{key: Key} | {key: Key}[]>()
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
  $kv.on(addItem, (kv, updates) => {
    let kvChanged = false
    arrifyIterate(updates, ({key, value}) => {
      if (key === undefined) return
      const key_: Key = key as any
      if (key_ in kv && value === kv[key_]) return
      if (!kvChanged) {
        kvChanged = true
        kv = {...kv}
      }
      kv[key_] = value
    })
    return kv
  })
  $kv.on(mapItem, (kv, {key, value, fn}) => {
    if (key in kv) {
      const upd = fn(kv[key], value)
      return {...kv, [key]: {...kv[key], ...upd}}
    }
  })
  $kv.on(removeWhen, (kv, {field}) => filterKV(kv, (val) => !val[field]))
  $kv.on(removeItem, (kv, itemOrItems) => {
    let kvChanged = false
    arrifyIterate(itemOrItems, ({key}) => {
      if (key in kv) {
        if (!kvChanged) {
          kvChanged = true
          kv = {...kv}
        }
        delete kv[key]
      }
    })
    return kv
  })
  const listApi: ListApi<Item, KeyField> = {
    config: {
      key,
      getKey,
      getItem: (store: KV<Item>, key: Key | [Key]): Item =>
        store[Array.isArray(key) ? key[0] : key],
      keygen,
    },
    state: {
      store: $kv,
      keys: $keys,
    },
    events: {
      setAll,
      addItem,
      removeItem,
      removeWhen,
      mapItem,
    },
    mapItem(fn: (value: Item, data: any) => Partial<Item>) {
      const result = createEvent<{key: Key; value: any}>()
      sample({
        clock: result,
        fn: ({key, value}) => ({key, value, fn}),
        target: mapItem,
      })
      return result as any
    },
    removeItem<ChildField extends keyof Item>(config?: {
      removeChilds: {
        childField: ChildField
        selection?: Selection<Item, ChildField, any>
      }
    }) {
      if (!config) {
        return removeItem.prepend(({key}: {key: Key}) => ({key}))
      }
      const {
        removeChilds: {childField, selection},
      } = config
      const index = createIndex({
        kv: listApi,
        field: childField,
        selection,
      })
      const removeItemTrigger = createEvent<{key: Key}>()
      function processItem(
        key: Item[KeyField] & Item[ChildField] & string,
        groups: Map<Item[ChildField], Item[KeyField][]>,
        kv: KV<Item>,
        keysToRemove: string[],
      ) {
        const item = kv[key]
        if (!item) return
        if (keysToRemove.includes(key)) return
        keysToRemove.push(key)
        const group = groups.get(key)
        if (!group) return
        group.forEach((child) =>
          processItem(
            child as Item[KeyField] & Item[ChildField] & string,
            groups,
            kv,
            keysToRemove,
          ),
        )
      }
      sample({
        clock: removeItemTrigger,
        source: {groups: index.groups, kv: $kv},
        fn({groups, kv}, {key}) {
          const keysToRemove: string[] = []
          processItem(
            key as Item[KeyField] & Item[ChildField] & string,
            groups,
            kv,
            keysToRemove,
          )
          return keysToRemove.map((key) => ({key}))
        },
        target: removeItem,
      })
      return removeItemTrigger
    },
    addItem({fn}) {
      return addItem.prepend((params: any) => {
        const userData = fn(params)
        const itemKey = keygen(userData)
        return {
          key: itemKey,
          value: {
            ...userData,
            [key]: itemKey,
          } as any,
        }
      })
    },
    addItemTree<Input, RawInput = Input>({
      normalize = (item: RawInput) => (item as unknown) as Input,
      convertInput,
      getChilds,
    }: {
      normalize?: (input: RawInput) => Input
      convertInput: (
        item: Input,
        childOf: Item[KeyField] | null,
      ) => Omit<Item, KeyField>
      getChilds: (item: Input) => RawInput | RawInput[] | null | undefined
    }) {
      function traverseTree(
        raw: RawInput,
        result: {
          key: Item[KeyField]
          value: Item
        }[],
        childOf: Item[KeyField] | null = null,
      ) {
        const input = normalize(raw)
        const value = convertInput(input, childOf)
        const childs = getChilds(input)
        const itemKey = keygen(value)
        const item = (value as unknown) as Item
        item[key] = itemKey
        result.push({key: itemKey, value: item})
        arrifyIterate<RawInput>(childs, (child) =>
          traverseTree(child, result, itemKey),
        )
      }
      return addItem.prepend((params: RawInput[] | RawInput) => {
        const result: {
          key: Item[KeyField]
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
          ({key: match, value} as {key: keyof Item; value: Item[keyof Item]}),
        target: setAll,
      })
      return clock
    },
    setField(field) {
      const fn = (item: Item, upd: any) => ({[field]: upd} as Partial<Item>)
      const clock = createEvent<any>()
      sample({
        clock,
        target: mapItem,
        fn: ({key, value}) => ({key, value, fn}),
      })
      return clock
    },
    removeByField: (field) => removeWhen.prepend(() => ({field})),
  }
  return listApi
}

function arrifyIterate<T>(
  value: T[] | T | null | void,
  fn: (value: T) => void,
) {
  if (value === null || value === undefined) return
  if (Array.isArray(value)) value.forEach((item) => fn(item))
  else fn(value)
}

function filterKV<Item>(
  kv: KV<Item>,
  callback: (item: Item, key?: Key) => boolean,
): KV<Item> {
  return Object.fromEntries(
    Object.entries(kv).filter(([key, value]) => callback(value, key)),
  )
}
