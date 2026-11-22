import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { BellIcon, Menu01Icon, Search01Icon, VolumeHighIcon, VolumeMute02Icon } from '@hugeicons/core-free-icons'
import { FONDO_ESTADO, breadcrumbList, breadcrumbSeparator, cx, ease, focusRing, text3, typeCaption, typeLabel } from './estilos'
import type { SectionId } from './BarraLateral'
import type { Notification } from '../types/sensor'

interface EncabezadoProps {
  section: string
  onMenuClick: () => void
  onNavigate: (id: SectionId) => void
  /** Alertas vigentes según la última lectura. */
  activeAlerts: Notification[]
  /** Eventos recientes (cambios detectados), del más nuevo al más viejo. */
  events: Notification[]
  unreadCount: number
  onOpenNotifications: () => void
  soundOn: boolean
  onToggleSound: () => void
  actions?: ReactNode
}

const horaEvento = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

interface ResultadoBusqueda {
  label: string
  section: SectionId
}

const ITEMS_BUSCABLES: ResultadoBusqueda[] = [
  { label: 'Inicio', section: 'inicio' },
  { label: 'Monitoreo en Vivo', section: 'monitoreo' },
  { label: 'Historial', section: 'historial' },
  { label: 'Temperatura', section: 'monitoreo' },
  { label: 'Humedad', section: 'monitoreo' },
  { label: 'Iluminación', section: 'monitoreo' },
  { label: 'Exportar Excel', section: 'historial' },
  { label: 'Estado del nodo', section: 'inicio' },
]

const iconButton = cx(
  'relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-900/80',
  'transition-[background-color,color] duration-[120ms] hover:bg-neutral-900/5 hover:text-neutral-900 aria-expanded:bg-neutral-900/[0.07]',
  focusRing,
  ease,
)
const popover = 'absolute right-0 top-full z-50 mt-2 rounded-[10px] border border-neutral-900/10 bg-white p-1 shadow-[0_12px_24px_-12px_rgb(0_0_0/0.25)]'

function ListaAvisos({ titulo, avisos, conHora }: { titulo: string; avisos: Notification[]; conHora: boolean }) {
  return (
    <div>
      <p className={cx(typeCaption, text3, 'px-3 pb-1 pt-2')}>{titulo}</p>
      <ul className="flex flex-col">
        {avisos.map((n) => (
          <li key={n.id} className="flex items-start gap-2.5 rounded-md px-3 py-2">
            <span className={cx('mt-[5px] size-1.5 shrink-0 rounded-full', FONDO_ESTADO[n.level])} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className={typeLabel}>{n.title}</p>
                {conHora && <span className={cx(typeCaption, text3, 'shrink-0')}>{horaEvento(n.timestamp)}</span>}
              </div>
              <p className={cx('mt-0.5 text-[13px]/[18px]', text3)}>{n.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Encabezado({
  section,
  onMenuClick,
  onNavigate,
  activeAlerts,
  events,
  unreadCount,
  onOpenNotifications,
  soundOn,
  onToggleSound,
  actions,
}: EncabezadoProps) {
  const [notifAbierto, setNotifAbierto] = useState(false)
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [consulta, setConsulta] = useState('')

  const notifRef = useRef<HTMLDivElement>(null)
  const busquedaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function manejarClickAfuera(evento: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(evento.target as Node)) {
        setNotifAbierto(false)
      }
      if (busquedaRef.current && !busquedaRef.current.contains(evento.target as Node)) {
        setBusquedaAbierta(false)
      }
    }
    document.addEventListener('mousedown', manejarClickAfuera)
    return () => document.removeEventListener('mousedown', manejarClickAfuera)
  }, [])

  const resultados = ITEMS_BUSCABLES.filter((item) => item.label.toLowerCase().includes(consulta.toLowerCase()))

  const irAResultado = (destino: SectionId) => {
    onNavigate(destino)
    setConsulta('')
    setBusquedaAbierta(false)
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-900/8 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" className={cx(iconButton, 'lg:hidden')} onClick={onMenuClick} aria-label="Abrir menú">
          <HugeiconsIcon icon={Menu01Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <nav aria-label="Ruta" className="min-w-0">
          <ol className={breadcrumbList}>
            <li className="max-sm:hidden">ECO UAO</li>
            <li aria-hidden="true" className={cx(breadcrumbSeparator, 'max-sm:hidden')}>
              /
            </li>
            <li aria-current="page" className="truncate text-neutral-900">
              {section}
            </li>
          </ol>
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div ref={busquedaRef} className="relative hidden md:block">
          <label className="flex h-8 w-56 items-center gap-2 rounded-md border border-neutral-900/12 bg-white px-2.5 shadow-[0_1px_2px_-1px_rgb(0_0_0/0.12)] focus-within:border-neutral-900/30">
            <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.8} aria-hidden="true" className={text3} />
            <span className="sr-only">Buscar</span>
            <input
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onFocus={() => setBusquedaAbierta(true)}
              placeholder="Buscar métrica o sección"
              className="min-w-0 flex-1 bg-transparent text-[13px]/[18px] text-neutral-900 placeholder:text-neutral-900/50 focus:outline-none"
            />
          </label>

          {busquedaAbierta && (
            <div className={cx(popover, 'w-64')}>
              {resultados.length === 0 ? (
                <p className={cx(typeCaption, text3, 'px-3 py-2')}>Sin resultados</p>
              ) : (
                resultados.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => irAResultado(item.section)}
                    className={cx(
                      'flex h-8 w-full items-center rounded-md px-2.5 text-left text-[14px]/[16px] font-[500] text-neutral-900/80',
                      'hover:bg-neutral-900/5 hover:text-neutral-900',
                      focusRing,
                    )}
                  >
                    {item.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div ref={notifRef} className="relative">
          <button
            type="button"
            className={iconButton}
            aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
            aria-expanded={notifAbierto}
            onClick={() => {
              if (!notifAbierto) onOpenNotifications()
              setNotifAbierto((abierto) => !abierto)
            }}
          >
            {/* La key reinicia la animación de la campana cada vez que llega un aviso nuevo */}
            <span key={unreadCount} className={cx('inline-flex', unreadCount > 0 && 'animate-campana motion-reduce:animate-none')}>
              <HugeiconsIcon icon={BellIcon} size={16} strokeWidth={1.8} aria-hidden="true" />
            </span>
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-estado-peligro px-1 text-[10px]/[12px] font-[600] tabular-nums text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : (
              activeAlerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-estado-peligro ring-2 ring-white" />
              )
            )}
          </button>

          {notifAbierto && (
            <div className={cx(popover, 'w-[calc(100vw-2rem)] max-w-80')}>
              <div className="flex items-center justify-between gap-2 py-1 pl-3 pr-1">
                <p className={typeLabel}>Notificaciones</p>
                <button
                  type="button"
                  aria-pressed={soundOn}
                  onClick={onToggleSound}
                  className={cx(
                    'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px]/[16px] font-[500] text-neutral-900/70',
                    'hover:bg-neutral-900/5 hover:text-neutral-900',
                    focusRing,
                  )}
                >
                  <HugeiconsIcon icon={soundOn ? VolumeHighIcon : VolumeMute02Icon} size={14} strokeWidth={1.8} aria-hidden="true" />
                  {soundOn ? 'Sonido activado' : 'Sonido apagado'}
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {activeAlerts.length > 0 && <ListaAvisos titulo="Alertas activas" avisos={activeAlerts} conHora={false} />}
                {events.length > 0 ? (
                  <ListaAvisos titulo="Recientes" avisos={events} conHora />
                ) : (
                  <p className={cx('px-3 pb-3 pt-2 text-[13px]/[18px]', text3)}>
                    Aquí aparecerán los cambios del salón, por ejemplo cuando se encienda la luz.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {actions}
      </div>
    </header>
  )
}
