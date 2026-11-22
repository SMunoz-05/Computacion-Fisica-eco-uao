import { useEffect, useRef } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Activity01Icon,
  Cancel01Icon,
  ChartHistogramIcon,
  Home01Icon,
  Leaf01Icon,
  Wifi01Icon,
  WifiDisconnected01Icon,
} from '@hugeicons/core-free-icons'
import { cx, ease, focusRing, focusRingInset, typeCaption, typeLabel } from './estilos'
import { useDegradadoScroll } from './useDegradadoScroll'

export type SectionId = 'inicio' | 'monitoreo' | 'historial'

const ghostButton = cx(
  'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-900',
  'transition-[color,background-color,transform] duration-[120ms] active:scale-[0.98] motion-reduce:active:scale-100',
  'hover:bg-neutral-900/5 active:bg-neutral-900/8',
  focusRing,
  ease,
)
const navItem = cx(
  'flex h-9 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left',
  typeLabel,
  'text-neutral-900/70 transition-[background-color,color] duration-[120ms] [&_svg]:shrink-0',
  'hover:bg-neutral-900/5 hover:text-neutral-900',
  'aria-[current=page]:bg-eco-primary/20 aria-[current=page]:font-[550] aria-[current=page]:text-neutral-900',
  focusRingInset,
  ease,
)
const navCount =
  'ms-auto rounded-full bg-red-500/10 px-1.5 text-[12px]/[16px] font-[500] tabular-nums text-red-600'
const navGroupLabel = 'px-2.5 pt-4 pb-1 text-[12px]/[16px] font-normal text-neutral-900/55'
const fade = cx('pointer-events-none absolute inset-x-0 h-8 transition-opacity duration-[120ms]', ease)

interface NavItem {
  id: SectionId
  label: string
  icon: IconSvgElement
}

const GRUPOS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Panel',
    items: [
      { id: 'inicio', label: 'Inicio', icon: Home01Icon },
      { id: 'monitoreo', label: 'Monitoreo en Vivo', icon: Activity01Icon },
      { id: 'historial', label: 'Historial', icon: ChartHistogramIcon },
    ],
  },
]

interface BarraLateralProps {
  active: SectionId
  onNavigate: (id: SectionId) => void
  open: boolean
  onClose: () => void
  alertCount: number
  nodeConnected: boolean
  nodeName: string
  nodeLocation: string
}

export default function BarraLateral({
  active,
  onNavigate,
  open,
  onClose,
  alertCount,
  nodeConnected,
  nodeName,
  nodeLocation,
}: BarraLateralProps) {
  const { ref: navRef, bordes, onScroll } = useDegradadoScroll<HTMLElement>()
  const drawerRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  // App se vuelve a renderizar cada 2 s con las lecturas; guardar onClose en un ref
  // evita que el efecto del cajón se reinicie (y mueva el foco) en cada render.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // En móvil el menú funciona como cajón: Esc lo cierra, Tab no se sale de él
  // y al cerrarlo el foco vuelve al botón que lo abrió.
  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const drawer = drawerRef.current
      if (!drawer) return
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'),
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cx(
          'fixed inset-0 z-30 bg-neutral-900/20 transition-opacity duration-[160ms] lg:hidden',
          ease,
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        ref={drawerRef}
        aria-label="Navegación"
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85%] flex-col border-r border-neutral-900/8 bg-white text-neutral-900',
          'shadow-[0_12px_24px_-12px_rgb(0_0_0/0.2)] duration-[200ms] motion-reduce:transition-none',
          ease,
          'lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none lg:visible',
          // Al abrir, la visibilidad cambia de inmediato para poder enfocar el botón de cerrar;
          // al cerrar, espera a que termine el deslizamiento.
          open
            ? 'visible translate-x-0 transition-transform'
            : 'invisible -translate-x-full transition-[transform,visibility]',
        )}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-neutral-900/8 pl-4 pr-2">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-eco-primary text-neutral-900">
            <HugeiconsIcon icon={Leaf01Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cx(typeLabel, 'truncate font-[600]')}>ECO UAO</p>
            <p className={cx(typeCaption, 'truncate text-neutral-900/55')}>Computación Física</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Cerrar menú"
            onClick={onClose}
            className={cx(ghostButton, 'lg:hidden')}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          <nav ref={navRef} onScroll={onScroll} aria-label="Principal" className="h-full overflow-y-auto px-2 pb-3">
            {GRUPOS.map((grupo) => (
              <div key={grupo.label}>
                <p className={navGroupLabel}>{grupo.label}</p>
                <ul className="space-y-0.5">
                  {grupo.items.map((item) => {
                    const badge = item.id === 'monitoreo' && alertCount > 0 ? alertCount : null
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onNavigate(item.id)}
                          aria-current={active === item.id ? 'page' : undefined}
                          className={navItem}
                        >
                          <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.8} aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {badge !== null && (
                            <span className={navCount} aria-label={`${badge} alertas activas`}>
                              {badge}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div
            aria-hidden="true"
            className={cx(fade, 'top-0 bg-gradient-to-b from-white to-transparent', bordes.inicio ? 'opacity-100' : 'opacity-0')}
          />
          <div
            aria-hidden="true"
            className={cx(fade, 'bottom-0 bg-gradient-to-t from-white to-transparent', bordes.fin ? 'opacity-100' : 'opacity-0')}
          />
        </div>

        <div className="shrink-0 border-t border-neutral-900/8 p-2">
          <div className="flex h-12 items-center gap-2.5 px-2">
            <span
              className={cx(
                'relative inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-900/12',
                nodeConnected ? 'text-eco-primary' : 'text-neutral-900/40',
              )}
            >
              <HugeiconsIcon
                icon={nodeConnected ? Wifi01Icon : WifiDisconnected01Icon}
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <span
                className={cx(
                  'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white',
                  nodeConnected ? 'bg-eco-primary' : 'bg-neutral-300',
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cx(typeLabel, 'truncate')}>{nodeName}</p>
              <p className={cx(typeCaption, 'truncate text-neutral-900/55')}>
                {nodeLocation} · {nodeConnected ? 'Conectado' : 'Desconectado'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
