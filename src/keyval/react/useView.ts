import {useMemo, useRef, memo, ComponentType, ReactElement} from 'react'

export function useView<T>(deps: any[], view: (value: T) => ReactElement) {
  const ref = useRef({fn: view})
  ref.current.fn = view
  return useMemo(
    () => memo<ComponentType<T>>((value: T) => ref.current.fn(value)),
    deps,
  )
}
