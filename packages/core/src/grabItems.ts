import { NoInfer, combine } from "effector";
import { Compute } from "ts-toolbelt/out/Any/Compute";
import { createMap } from "./createMap";
import { ListApi, Mapping, PossibleKey, Selection } from "./types";

type ValueByType<T, U extends keyof T> = {
  [P in U]: { type: P; value: T[P] }
}[U]

export const grabItems = <Item, Key extends PossibleKey, Shape>(
  kv: ListApi<Item, Key> | Selection<Item, Key> | Mapping<Item, Key>,
  config: {
    source: {
      [ShapeKey in keyof Shape]:
        | ListApi<Shape[ShapeKey], string>
        | Selection<Shape[ShapeKey], string>
        | Mapping<Shape[ShapeKey], string>
    }
    filter: NoInfer<{
      [ShapeKey in keyof Shape]: (entry: Shape[ShapeKey], item: Item) => boolean
    }>
    orderBy?:
      | {
          key: keyof Shape[keyof Shape]
          type: 'asc' | 'desc'
        }
      | ((item: Item) => {
          key: keyof Shape[keyof Shape]
          type: 'asc' | 'desc'
        })
  },
) => {
  return createMap(kv, {
    source: combine(
      Object.fromEntries(Object.entries(config.source).map(([key, kv]) => [key, kv.state.store])),
    ),
    fn: (item, source) => {
      const children = [] as Compute<ValueByType<Shape, keyof Shape>[], 'flat'>
      for (const shapeKey in source) {
        children.push(
          // @ts-expect-error ...
          ...Object.values(source[shapeKey].ref)
            // @ts-expect-error ...
            .filter((shapeItem) => config.filter[shapeKey](shapeItem, item))
            .map((value) => ({ type: shapeKey, value })),
        )
      }
      const orderBy = !config.orderBy
        ? null
        : typeof config.orderBy === 'function'
        ? config.orderBy(item)
        : config.orderBy
      return {
        item,
        children: orderBy
          ? children.sort((a, b) => {
              return orderBy.type === 'asc'
                ? +a.value[orderBy.key] - +b.value[orderBy.key]
                : +b.value[orderBy.key] - +a.value[orderBy.key]
            })
          : children,
      }
    },
  })
}
