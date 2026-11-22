import { useEffect, useRef, useState } from 'react'

export const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** Mide el ancho de un elemento y lo actualiza cuando cambia de tamaño. */
export function useMedida<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [ancho, setAncho] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, ancho] as const
}
