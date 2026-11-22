import { useEffect, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Activity01Icon,
  ChartHistogramIcon,
  CpuIcon,
  HumidityIcon,
  MonitorIcon,
  RefreshIcon,
  Sun03Icon,
  TemperatureIcon,
  ThermometerIcon,
  VolumeHighIcon,
  Wifi01Icon,
  WifiDisconnected01Icon,
} from '@hugeicons/core-free-icons'
import Insignia from '../components/Insignia'
import SelectorSegmentado from '../components/SelectorSegmentado'
import GraficoHoyAyer, { formatoHora } from '../components/GraficoHoyAyer'
import { useDegradadoScroll } from '../components/useDegradadoScroll'
import {
  FONDO_ESTADO,
  badge,
  badgeNeutral,
  buttonMd,
  codeTag,
  cx,
  fadeBottom,
  fadeTop,
  frameDescription,
  frameMeta,
  frameTitle,
  iconoVerde,
  itemDescription,
  itemMedia,
  itemRow,
  itemTitle,
  numericCell,
  panel,
  panelBody,
  panelFoot,
  panelHead,
  primaryButton,
  progressFill,
  progressTrack,
  rowsRuled,
  secondaryButton,
  statCell,
  statDescription,
  statGrid,
  statGroup,
  statLabel,
  statValueSm,
  table,
  tableCell,
  tableHead,
  tableRow,
  text2,
  text3,
  typeBodySm,
  typeCaption,
  typeCodeSm,
  typeHeadingSm,
  typeLabel,
  typeStatLg,
} from '../components/estilos'
import { UMBRALES, nivelAlertaPara, nivelGeneral } from '../data/estados'
import type { SectionId } from '../components/BarraLateral'
import type { AlertLevel, HourlyPoint, NodeStatus, RangeSummary, SensorReading } from '../types/sensor'

const ETIQUETA_NIVEL: Record<AlertLevel, string> = { ok: 'Óptimo', warn: 'Aceptable', danger: 'Peligroso' }

const horaConSegundos = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

type Metrica = 'temperature' | 'humidity'
const METRICAS: Record<Metrica, { label: string; unit: string }> = {
  temperature: { label: 'Temperatura', unit: '°C' },
  humidity: { label: 'Humedad', unit: '%' },
}

interface SeccionInicioProps {
  latest: SensorReading
  series: SensorReading[]
  nodeStatus: NodeStatus
  hourly: HourlyPoint[]
  summary: RangeSummary | null
  onNavigate: (id: SectionId) => void
  onRefresh: () => void
}

export default function SeccionInicio({
  latest,
  series,
  nodeStatus,
  hourly,
  summary,
  onNavigate,
  onRefresh,
}: SeccionInicioProps) {
  const [metrica, setMetrica] = useState<Metrica>('temperature')
  const [cursor, setCursor] = useState<number | null>(null)
  const [actualizado, setActualizado] = useState(false)
  const lecturas = useDegradadoScroll<HTMLDivElement>()
  const componentes = useDegradadoScroll<HTMLDivElement>()

  useEffect(() => {
    if (!actualizado) return
    const temporizador = setTimeout(() => setActualizado(false), 2000)
    return () => clearTimeout(temporizador)
  }, [actualizado])

  const nivel = nivelGeneral(latest)
  const { label, unit } = METRICAS[metrica]
  const horaActual = new Date().getHours()
  const horaLeyenda = cursor ?? horaActual
  const valorLeyenda = (serie: 'today' | 'yesterday') => {
    const v = hourly[horaLeyenda]?.[serie]?.[metrica]
    return v !== undefined ? `${v.toFixed(1)} ${unit}` : '—'
  }

  const actual = summary?.current ?? null
  const enRango = [
    {
      label: 'Temperatura en rango',
      ratio: actual?.temperature.optimalRatio ?? null,
      rango: `Óptimo ${UMBRALES.temperature.min}–${UMBRALES.temperature.max} °C`,
      promedio: actual ? `Promedio ${actual.temperature.average.toFixed(1)} °C` : '',
    },
    {
      label: 'Humedad en rango',
      ratio: actual?.humidity.optimalRatio ?? null,
      rango: `Óptimo ${UMBRALES.humidity.min}–${UMBRALES.humidity.max} %`,
      promedio: actual ? `Promedio ${actual.humidity.average.toFixed(0)} %` : '',
    },
  ]

  const peligro = latest.status?.startsWith('PELIGROSO') ?? false
  const tiles: { label: string; Icon: IconSvgElement; meta: ReactNode; value: string }[] = [
    {
      label: 'Temperatura',
      Icon: TemperatureIcon,
      meta: <Insignia level={nivelAlertaPara('temperature', latest)} />,
      value: `${latest.temperature.toFixed(1)} °C`,
    },
    {
      label: 'Humedad',
      Icon: HumidityIcon,
      meta: <Insignia level={nivelAlertaPara('humidity', latest)} />,
      value: `${latest.humidity.toFixed(0)} %`,
    },
    {
      label: 'Iluminación',
      Icon: Sun03Icon,
      meta: <Insignia level={nivelAlertaPara('light', latest)} />,
      value: latest.light ? 'Luz' : 'Oscuro',
    },
    {
      label: 'Nodo ESP32',
      Icon: nodeStatus.connected ? Wifi01Icon : WifiDisconnected01Icon,
      meta: nodeStatus.location,
      value: nodeStatus.connected ? 'Conectado' : 'Desconectado',
    },
  ]

  const piezas: { nombre: string; detalle: string; valor: string; pin: string; Icon: IconSvgElement }[] = [
    {
      nombre: 'Sensor DHT22',
      detalle: 'Temperatura y humedad',
      valor: `${latest.temperature.toFixed(1)} °C · ${latest.humidity.toFixed(0)} %`,
      pin: 'GPIO 4',
      Icon: ThermometerIcon,
    },
    { nombre: 'Sensor LDR', detalle: 'Iluminación digital', valor: latest.light ? 'Luz' : 'Oscuro', pin: 'GPIO 34', Icon: Sun03Icon },
    {
      nombre: 'Buzzer',
      detalle: 'Alarma de peligro',
      valor: nodeStatus.connected ? (peligro ? 'Sonando' : 'Apagado') : '—',
      pin: 'GPIO 14',
      Icon: VolumeHighIcon,
    },
    { nombre: 'Pantalla OLED', detalle: 'SSD1306 · 128×64', valor: latest.status ?? '—', pin: 'I²C 0x3C', Icon: MonitorIcon },
    {
      nombre: 'ESP32',
      detalle: nodeStatus.nodeName,
      valor: nodeStatus.connected ? 'En línea' : 'Sin conexión',
      pin: 'Wi-Fi',
      Icon: CpuIcon,
    },
  ]

  const ultimaHora = nodeStatus.lastUpdate ? horaConSegundos(nodeStatus.lastUpdate) : null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className={typeHeadingSm}>Monitoreo ambiental</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className={cx(badge, badgeNeutral)}>{nodeStatus.location}</span>
            <span className={cx(typeBodySm, text3, 'truncate first-letter:uppercase')}>
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <p className={cx(typeBodySm, text3, 'mt-0.5')}>
            Hola, UAO.{' '}
            {nodeStatus.connected
              ? `Última lectura a las ${ultimaHora}.`
              : `El nodo no envía datos desde las ${ultimaHora}.`}
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-end gap-4">
          <div className="min-w-0 sm:text-right">
            <p className={cx(typeBodySm, text3)}>Estado del salón</p>
            <p className={cx(typeStatLg, 'mt-0.5 flex items-center gap-3 sm:justify-end')}>
              <span
                aria-hidden="true"
                className={cx(
                  'size-2.5 shrink-0 rounded-full',
                  FONDO_ESTADO[nivel],
                )}
              />
              {ETIQUETA_NIVEL[nivel]}
            </p>
            <p className={cx(typeBodySm, text3, 'mt-0.5')}>Reportado por el ESP32: {latest.status ?? '—'}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 pb-1">
            <button type="button" onClick={() => onNavigate('monitoreo')} className={cx(primaryButton, buttonMd)}>
              <HugeiconsIcon icon={Activity01Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
              Ver en vivo
            </button>
            <button
              type="button"
              onClick={() => {
                onRefresh()
                setActualizado(true)
              }}
              className={cx(secondaryButton, buttonMd)}
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
                className={actualizado ? text3 : undefined}
              />
              {actualizado ? 'Actualizado' : 'Actualizar'}
            </button>
          </div>
        </div>
      </div>

      <div className={statGroup}>
        <div className={statGrid}>
          {tiles.map((t) => (
            <div key={t.label} className={statCell}>
              <div className={cx(statLabel, 'flex items-center gap-2')}>
                <HugeiconsIcon icon={t.Icon} size={16} strokeWidth={1.8} aria-hidden="true" className={iconoVerde} />
                <span className="min-w-0 truncate">{t.label}</span>
              </div>
              <div className="mt-auto flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
                <span className={cx(statDescription, 'truncate')}>{t.meta}</span>
                <span className={cx(statValueSm, 'shrink-0')}>{t.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
        <div className={panel}>
          <div className={cx(panelHead, 'flex-wrap justify-between gap-y-2 py-3')}>
            <div className="min-w-0">
              <h2 className={frameTitle}>{label} por hora</h2>
              <p className={cx(frameDescription, 'mt-0.5 truncate')}>
                {cursor === null ? 'Promedio de hoy comparado con ayer' : formatoHora(cursor)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className={cx(typeCaption, text3, 'flex shrink-0 items-center gap-4')}>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-1 w-4 rounded-full bg-eco-acento" />
                  Hoy <span className="text-neutral-900">{valorLeyenda('today')}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-1 w-4 rounded-full bg-eco-suave" />
                  Ayer <span className="text-neutral-900">{valorLeyenda('yesterday')}</span>
                </span>
              </div>
              <SelectorSegmentado
                label="Variable"
                options={[
                  { id: 'temperature', label: 'Temperatura' },
                  { id: 'humidity', label: 'Humedad' },
                ]}
                value={metrica}
                onChange={setMetrica}
              />
            </div>
          </div>

          <div className={cx(panelBody, 'flex-1')}>
            <div className="px-3 pb-1 pt-3">
              <GraficoHoyAyer
                data={hourly}
                metric={metrica}
                unit={unit}
                label={label}
                cursor={cursor}
                onCursorChange={setCursor}
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col border-t border-neutral-900/8">
              <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2 pt-3">
                <h3 className={frameTitle}>Lecturas recientes</h3>
                <span className={frameMeta}>{series.length} lecturas</span>
              </div>
              <div className="relative">
                <div ref={lecturas.ref} onScroll={lecturas.onScroll} className="max-h-80 overflow-y-auto">
                  <table className={table}>
                    <caption className="sr-only">Lecturas recientes del nodo</caption>
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr>
                        <th scope="col" className={tableHead}>Hora</th>
                        <th scope="col" className={cx(tableHead, numericCell)}>Temperatura</th>
                        <th scope="col" className={cx(tableHead, numericCell)}>Humedad</th>
                        <th scope="col" className={cx(tableHead, 'hidden sm:table-cell')}>Luz</th>
                        <th scope="col" className={cx(tableHead, 'hidden sm:table-cell')}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...series].reverse().map((r) => (
                        <tr key={r.timestamp} className={tableRow}>
                          <td className={tableCell}>
                            <span className={codeTag}>{horaConSegundos(r.timestamp)}</span>
                          </td>
                          <td className={cx(tableCell, numericCell)}>{r.temperature.toFixed(1)} °C</td>
                          <td className={cx(tableCell, numericCell)}>{r.humidity.toFixed(0)} %</td>
                          <td className={cx(tableCell, 'hidden sm:table-cell')}>{r.light ? 'Luz' : 'Oscuro'}</td>
                          <td className={cx(tableCell, 'hidden sm:table-cell')}>
                            <Insignia level={nivelGeneral(r)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div
                  aria-hidden="true"
                  className={cx(fadeTop, 'top-8', lecturas.bordes.inicio ? 'opacity-100' : 'opacity-0')}
                />
                <div aria-hidden="true" className={cx(fadeBottom, lecturas.bordes.fin ? 'opacity-100' : 'opacity-0')} />
              </div>
            </div>
          </div>
        </div>

        <div className={panel}>
          <div className={cx(panelHead, 'justify-between py-3')}>
            <div className="min-w-0">
              <h2 className={frameTitle}>Condiciones del salón</h2>
              <p className={cx(frameDescription, 'mt-0.5 truncate')}>Últimas 24 horas</p>
            </div>
            <span className={cx(badge, badgeNeutral)}>Confort</span>
          </div>

          <div className={cx(panelBody, 'flex-1')}>
            <div className="flex shrink-0 flex-col gap-4 px-3 py-3.5">
              {enRango.map((r) => (
                <div key={r.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={cx(typeBodySm, text2)}>{r.label}</span>
                    <span className={cx(typeLabel, 'tabular-nums')}>
                      {r.ratio !== null ? `${Math.round(r.ratio * 100)}%` : '—'}
                    </span>
                  </div>
                  <span aria-hidden="true" className={cx(progressTrack, 'mt-2')}>
                    <span className={progressFill} style={{ width: `${Math.round((r.ratio ?? 0) * 100)}%` }} />
                  </span>
                  <div className={cx(typeCaption, text3, 'mt-2 flex items-baseline justify-between gap-2')}>
                    <span>{r.rango}</span>
                    <span>{r.promedio}</span>
                  </div>
                </div>
              ))}

              <button type="button" onClick={() => onNavigate('historial')} className={cx(secondaryButton, buttonMd, 'w-full')}>
                <HugeiconsIcon icon={ChartHistogramIcon} size={16} strokeWidth={1.8} aria-hidden="true" />
                Ver historial
              </button>
            </div>

            <div className="relative min-h-0 flex-1 border-t border-neutral-900/8">
              <div ref={componentes.ref} onScroll={componentes.onScroll} className="max-h-80 overflow-y-auto">
                <ul className={rowsRuled} aria-label="Componentes del circuito">
                  {piezas.map((p) => (
                    <li key={p.nombre} className={cx(itemRow, 'px-3')}>
                      <span className={itemMedia}>
                        <HugeiconsIcon icon={p.Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className={itemTitle}>
                          <span className="truncate">{p.nombre}</span>
                        </p>
                        <p className={itemDescription}>{p.detalle}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cx(typeLabel, 'tabular-nums')}>{p.valor}</p>
                        <p className={cx(typeCodeSm, text3, 'mt-0.5')}>{p.pin}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div aria-hidden="true" className={cx(fadeTop, 'top-0', componentes.bordes.inicio ? 'opacity-100' : 'opacity-0')} />
              <div aria-hidden="true" className={cx(fadeBottom, componentes.bordes.fin ? 'opacity-100' : 'opacity-0')} />
            </div>
          </div>

          <div className={cx(panelFoot, 'justify-between')}>
            <span>{piezas.length} componentes en el circuito</span>
            <span className={cx(typeLabel, 'text-neutral-900')}>{nodeStatus.nodeName}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
