import type {Event, EventPayload} from 'effector'

import type {ListApi, ItemApi} from './types'

export function createItemApi<
  T,
  Evs extends Record<string, Event<any>>,
  EvsMap extends {
    [K in keyof Evs]?: (id: string, params: any) => EventPayload<Evs[K]>
  },
  KeyField extends keyof T = any,
  Key extends T[KeyField] = any,
>({
  kv,
  events,
  prepare,
}: {
  kv: ListApi<T>
  events: Evs
  prepare: EvsMap
}): ItemApi<
  T,
  {
    [K in keyof Evs]: void extends EvsMap[K]
      ? EventPayload<Evs[K]> extends {key: Key}
        ? EventPayload<Evs[K]> extends {key: Key; value: infer V}
          ? V
          : void
        : never
      : Parameters<Exclude<EvsMap[K], undefined>>['length'] extends 2
      ? Parameters<Exclude<EvsMap[K], undefined>>[1]
      : void
  }
> {
  const api: any = {}
  for (const field in events) {
    const fn = prepare[field]
    const evt = events[field]
    if (fn) {
      api[field] = evt.prepend(({key, value}: {key: string; value: unknown}) =>
        fn(key, value),
      )
    } else {
      api[field] = evt
    }
  }
  const itemsApi = {kv, api} as any

  return itemsApi
}
