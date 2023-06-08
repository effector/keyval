import { useEvent, useStoreMap } from 'effector-react';
import { createElement, useMemo, useContext } from 'react';

import type { IndexApi, ItemApi, ListApi, PossibleKey } from '@keyval/core';
import { ItemsContext } from './itemProvider';
import { useView } from './useView';

export function useItemState<Item, Key extends PossibleKey>(
  id: Key,
  itemApi: ItemApi<Item, Key, any>
): Item {
  return useStoreMap({
    store: itemApi.kv.state.store,
    fn: (items) => itemApi.kv.config.getItem(items.ref, id),
    keys: [id],
  });
}

export function useItemApi<
  Key extends PossibleKey,
  T extends ItemApi<any, Key, any>
>(
  id: Key,
  itemApi: T
): T extends ItemApi<any, Key, infer Evs>
  ? { [K in keyof Evs]: (params: Evs[K]) => void }
  : never {
  const events = useEvent(itemApi.api);
  const api = useMemo(() => {
    const api: any = {};
    for (const field in events) {
      api[field] = (value: any) => {
        events[field]({ key: id, value });
      };
    }
    return api;
  }, [id, itemApi]);
  return api;
}

export function useGroup<Item, ChildField extends keyof Item>(
  index: IndexApi<Item, any, ChildField>,
  value: Item[ChildField],
  view: (key: Item[ChildField]) => React.ReactElement
) {
  const View = useView([index], ({ id }: { id: Item[ChildField] }) => view(id));
  const items = useStoreMap({
    store: index.groups,
    keys: [index, value],
    fn: (map): Item[ChildField][] => map.get(value) || [],
    updateFilter(keys: Item[ChildField][], oldKeys) {
      if (keys.length !== oldKeys.length) return true;
      return keys.some((key, index) => oldKeys[index] !== key);
    },
  });
  return items.map((id, idx) => createElement(View, { id, key: idx }));
}

export const useItem = <
  Item,
  Key extends PossibleKey,
  ItemTriggers extends Record<string, unknown>
>(
  itemOrKv: ItemApi<Item, Key, ItemTriggers> | ListApi<Item, Key>,
  id?: Key
) => {
  const actualId =
    id !== undefined ? id : useContext(ItemsContext).get(itemOrKv);
  const state = useItemState(actualId, itemOrKv);
  // @ts-expect-error TODO: Replace with real kv check
  const api = itemOrKv.kv ? useItemApi(actualId, itemOrKv) : {};

  return [state, api] as const;
};
