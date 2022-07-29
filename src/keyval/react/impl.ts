import {useMemo, createElement} from 'react'
import {useEvent, useStoreMap} from 'effector-react'

import type {ItemApi, IndexApi} from '../core'
import {useView} from './useView'

export function useItemState<T extends ItemApi<any, any>>(
  id: string,
  itemApi: T,
): T extends ItemApi<infer S, any> ? S : never {
  return useStoreMap({
    store: itemApi.kv.state.store,
    fn: (items) => itemApi.kv.config.getItem(items, id),
    keys: [id],
  })
}

export function useItemApi<T extends ItemApi<any, any>>(
  id: string,
  itemApi: T,
): T extends ItemApi<any, infer Evs>
  ? {[K in keyof Evs]: (params: Evs[K]) => void}
  : never {
  const events = useEvent(itemApi.api)
  const api = useMemo(() => {
    const api: any = {}
    for (const field in events) {
      api[field] = (value: any) => {
        events[field]({key: id, value})
      }
    }
    return api
  }, [id, itemApi])
  return api
}

export function useIndex<T, K extends keyof T, ID extends keyof T>(
  index: IndexApi<T, K, ID>,
  value: T[K],
  view: (key: T[ID]) => React.ReactElement,
) {
  const View = useView([index], ({id}: {id: T[ID]}) => view(id))
  const items = useStoreMap({
    store: index.groups,
    keys: [index, value],
    fn: (map): T[ID][] => map.get(value) || [],
    updateFilter(keys: T[ID][], oldKeys) {
      if (keys.length !== oldKeys.length) return true
      return keys.some((key, index) => oldKeys[index] !== key)
    },
  })
  return items.map((id, idx) => createElement(View, {id, key: idx}))
}
