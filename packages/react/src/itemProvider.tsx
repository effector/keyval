import { createContext, ReactNode, useContext, useMemo } from 'react';

import { ItemApi, ListApi, PossibleKey } from '@keyval/core';

export const ItemsContext = createContext(new Map());

type ItemProviderProps<
  Item,
  Key extends PossibleKey,
  ItemTriggers extends Record<string, unknown>
> = {
  api?: ItemApi<Item, Key, ItemTriggers>;
  kv?: ListApi<Item, Key>;
  id: string;
  children: ReactNode;
};

export const ItemProvider = <
  Item,
  Key extends PossibleKey,
  ItemTriggers extends Record<string, unknown>
>(
  props: ItemProviderProps<Item, Key, ItemTriggers>
) => {
  const ctx = useContext(ItemsContext);
  const nextCtx = useMemo(() => {
    return new Map(ctx.entries()).set(props.api ?? props.kv, props.id);
  }, [ctx, props.api ?? props.kv, props.id]);

  return (
    <ItemsContext.Provider value={nextCtx}>
      {props.children}
    </ItemsContext.Provider>
  );
};
