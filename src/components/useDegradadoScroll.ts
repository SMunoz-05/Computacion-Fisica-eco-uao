import { useCallback, useEffect, useRef, useState } from 'react'

/** Indica si un contenedor con scroll tiene más contenido arriba o abajo, para mostrar un degradado. */
export function useDegradadoScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [bordes, setBordes] = useState({ inicio: false, fin: false })

  const actualizar = useCallback(() => {
    const el = ref.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    setBordes({
      inicio: scrollTop > 1,
      fin: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
    })
  }, [])

  useEffect(() => {
    actualizar()
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(actualizar)
    observer.observe(el)
    return () => observer.disconnect()
  }, [actualizar])

  return { ref, bordes, onScroll: actualizar }
}
