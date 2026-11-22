import { useRef, type KeyboardEvent } from 'react'
import { cx, ease, focusRingInset } from './estilos'

const track = 'inline-flex h-8 w-fit max-w-full shrink-0 items-stretch gap-0.5 rounded-md bg-neutral-900/5 p-0.5'
const segment = cx(
  'relative inline-flex min-w-0 cursor-pointer select-none items-center justify-center whitespace-nowrap rounded px-3',
  'text-[14px]/[16px] font-[450] text-neutral-900/70 transition-[background-color,color] duration-[120ms]',
  'aria-[checked=false]:hover:bg-neutral-900/5 aria-[checked=false]:hover:text-neutral-900',
  'aria-checked:bg-white aria-checked:text-neutral-900 aria-checked:shadow-[0_1px_2px_rgb(0_0_0/0.1)]',
  focusRingInset,
  ease,
)

interface Opcion<T extends string> {
  id: T
  label: string
}

interface SelectorSegmentadoProps<T extends string> {
  label: string
  options: Opcion<T>[]
  value: T
  onChange: (value: T) => void
}

export default function SelectorSegmentado<T extends string>({
  label,
  options,
  value,
  onChange,
}: SelectorSegmentadoProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const mover = (indice: number) => {
    const siguiente = (indice + options.length) % options.length
    onChange(options[siguiente].id)
    refs.current[siguiente]?.focus({ preventScroll: true })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const actual = options.findIndex((o) => o.id === value)
    const acciones: Record<string, number> = {
      ArrowRight: actual + 1,
      ArrowDown: actual + 1,
      ArrowLeft: actual - 1,
      ArrowUp: actual - 1,
      Home: 0,
      End: options.length - 1,
    }
    if (event.key in acciones) {
      event.preventDefault()
      mover(acciones[event.key])
    }
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={track}>
      {options.map((opcion, i) => {
        const seleccionada = opcion.id === value
        return (
          <button
            key={opcion.id}
            ref={(nodo) => {
              refs.current[i] = nodo
            }}
            type="button"
            role="radio"
            aria-checked={seleccionada}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => onChange(opcion.id)}
            className={segment}
          >
            {opcion.label}
          </button>
        )
      })}
    </div>
  )
}
