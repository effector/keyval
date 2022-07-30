import type {Event, EventPayload} from 'effector'

import type {ListApi, ItemApi} from './types'

export function createItemApi<
  T,
  Evs extends Record<string, Event<any>>,
  KeyField extends keyof T = any,
  Key extends T[KeyField] = any,
>({
  kv,
  events,
}: {
  kv: ListApi<T>
  events: Evs
}): ItemApi<
  T,
  {
    [K in keyof Evs]: EventPayload<Evs[K]> extends {key: Key}
      ? EventPayload<Evs[K]> extends {key: Key; value: infer V}
        ? V
        : void
      : never
  }
> {
  const api: any = {}
  for (const field in events) {
    api[field] = events[field]
  }
  const itemsApi = {kv, api} as any

  return itemsApi
}
