import { useState } from 'react'
import SelectorSegmentado from './SelectorSegmentado'
import Variacion from './Variacion'
import { limitar, useMedida } from './useMedida'
import {
  chartArea,
  chartBar,
  chartBar2,
  chartGrid,
  chartTick,
  chartTooltip,
  chartZero,
  cx,
  ease,
  focusRing,
  frame,
  text3,
  typeCaption,
  typeLabel,
  typeStatLg,
} from './estilos'
import type { HourlyPoint } from '../types/sensor'

const PAD = { top: 10, right: 1, bottom: 20, left: 30 }
const ALTO = 240

type Metrica = 'temperature' | 'humidity'
type SerieId = 'today' | 'yesterday'

const METRICAS: Record<Metrica, { label: string; unit: string }> = {
  temperature: { label: 'Temperatura', unit: '°C' },
  humidity: { label: 'Humedad', unit: '%' },
}

const SERIES: { id: SerieId; label: string; barClass: string; outlined: boolean }[] = [
  { id: 'today', label: 'Hoy', barClass: chartBar, outlined: false },
  { id: 'yesterday', label: 'Ayer', barClass: chartBar2, outlined: true },
]

const legendItem = cx(
  'flex h-7 min-w-0 cursor-pointer items-center gap-2 rounded-md px-2',
  typeLabel,
  'text-neutral-900 hover:bg-neutral-900/5 aria-[pressed=false]:text-neutral-900/60',
  focusRing,
)

const formatoHora = (h: number) => `${String(h).padStart(2, '0')}:00`

function marcasEje(max: number, divisiones = 4) {
  if (!(max > 0)) return { tope: 1, marcas: [0, 1] }
  const paso0 = max / divisiones
  const magnitud = 10 ** Math.floor(Math.log10(paso0))
  const norm = paso0 / magnitud
  const paso = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * magnitud
  const tope = Math.ceil(max / paso) * paso
  const marcas: number[] = []
  for (let v = 0; v <= tope + paso / 1000; v += paso) marcas.push(v)
  return { tope, marcas }
}

function barraRedondeada(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0 || w <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

function Muestra({ outlined, inverse = false }: { outlined: boolean; inverse?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 8 8" className="inline-block size-2 shrink-0">
      {outlined ? (
        <rect
          x={0.5}
          y={0.5}
          width={7}
          height={7}
          strokeWidth={1}
          {...(inverse ? { fill: 'none', stroke: 'currentColor' } : { className: chartBar2 })}
        />
      ) : (
        <rect width={8} height={8} {...(inverse ? { fill: 'currentColor' } : { className: chartBar })} />
      )}
    </svg>
  )
}

const promedio = (valores: number[]) => (valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null)

interface ComparacionPorHoraProps {
  data: HourlyPoint[]
}

export default function ComparacionPorHora({ data }: ComparacionPorHoraProps) {
  const [ref, ancho] = useMedida<HTMLDivElement>()
  const [metrica, setMetrica] = useState<Metrica>('temperature')
  const [activa, setActiva] = useState<number | null>(null)
  const [fijada, setFijada] = useState(new Date().getHours())
  const [visibles, setVisibles] = useState<Record<SerieId, boolean>>({ today: true, yesterday: true })

  const { label, unit } = METRICAS[metrica]
  const valor = (p: HourlyPoint, serie: SerieId) => p[serie]?.[metrica] ?? null
  const n = 24
  const innerW = Math.max(ancho - PAD.left - PAD.right, 1)
  const innerH = ALTO - PAD.top - PAD.bottom
  const grupoW = innerW / n
  const bandaW = grupoW * 0.72
  const separacion = 2
  const barraW = Math.max((bandaW - separacion) / 2, 1)

  const hoy = data.map((p) => valor(p, 'today')).filter((v): v is number => v !== null)
  const ayer = data.map((p) => valor(p, 'yesterday')).filter((v): v is number => v !== null)
  const promedioHoy = promedio(hoy)
  const promedioAyer = promedio(ayer)

  const conDatosHoy = data.filter((p) => p.today)
  const maxima = conDatosHoy.reduce<HourlyPoint | null>(
    (mejor, p) => (!mejor || valor(p, 'today')! > valor(mejor, 'today')! ? p : mejor),
    null,
  )
  const minima = conDatosHoy.reduce<HourlyPoint | null>(
    (mejor, p) => (!mejor || valor(p, 'today')! < valor(mejor, 'today')! ? p : mejor),
    null,
  )

  const { tope, marcas } = marcasEje(Math.max(...hoy, ...ayer, 0))
  const x = (i: number) => PAD.left + i * grupoW
  const y = (v: number) => PAD.top + innerH - (v / tope) * innerH

  const puntoActivo = activa === null ? null : data[activa]
  const valorMostrado = puntoActivo ? valor(puntoActivo, 'today') : promedioHoy
  const valorComparado = puntoActivo ? valor(puntoActivo, 'yesterday') : promedioAyer
  const variacion = valorMostrado !== null && valorComparado !== null ? valorMostrado - valorComparado : null

  const puntoFijado = data[fijada]
  const tooltipHoy = puntoFijado ? valor(puntoFijado, 'today') : null
  const tooltipAyer = puntoFijado ? valor(puntoFijado, 'yesterday') : null

  const mover = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const indice = limitar(Math.floor((clientX - el.getBoundingClientRect().left - PAD.left) / grupoW), 0, n - 1)
    setActiva(indice)
    setFijada(indice)
  }

  const irA = (indice: number) => {
    setActiva(indice)
    setFijada(indice)
  }

  const estadisticas = [
    { label: 'Promedio hoy', value: promedioHoy !== null ? promedioHoy.toFixed(1) : '—', unit, extra: '' },
    {
      label: 'Hora más alta',
      value: maxima ? valor(maxima, 'today')!.toFixed(1) : '—',
      unit,
      extra: maxima ? `a las ${formatoHora(maxima.hour)}` : '',
    },
    {
      label: 'Hora más baja',
      value: minima ? valor(minima, 'today')!.toFixed(1) : '—',
      unit,
      extra: minima ? `a las ${formatoHora(minima.hour)}` : '',
    },
  ]

  return (
    <div className={cx(frame, 'bg-neutral-50')}>
      <div className="mx-1 mt-1 flex min-w-0 flex-col divide-y divide-neutral-900/8 overflow-hidden rounded-md border border-neutral-900/8 bg-white">
        <div className="px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={cx(typeLabel, 'flex flex-wrap gap-x-2 text-neutral-900/80')}>
                <span>{label} por hora</span>
                <span className={text3}>{activa === null ? 'Promedio de hoy' : formatoHora(activa)}</span>
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                <p className={typeStatLg} style={{ minWidth: '4ch' }}>
                  {valorMostrado !== null ? valorMostrado.toFixed(1) : '—'}
                  <span className="ml-1 text-[20px]/[24px] text-neutral-900/60">{unit}</span>
                </p>
                <Variacion
                  value={variacion}
                  unit={unit}
                  caption={activa === null ? 'vs. ayer' : 'vs. ayer a la misma hora'}
                />
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <SelectorSegmentado
                label="Variable"
                options={[
                  { id: 'temperature', label: 'Temperatura' },
                  { id: 'humidity', label: 'Humedad' },
                ]}
                value={metrica}
                onChange={setMetrica}
              />
              <div className="flex items-center gap-1">
                {SERIES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={visibles[s.id]}
                    onClick={() =>
                      setVisibles((prev) => {
                        const siguiente = { ...prev, [s.id]: !prev[s.id] }
                        return siguiente.today || siguiente.yesterday ? siguiente : prev
                      })
                    }
                    className={legendItem}
                  >
                    <span className={cx('inline-flex', visibles[s.id] ? 'opacity-100' : 'opacity-40')}>
                      <Muestra outlined={s.outlined} />
                    </span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            ref={ref}
            role="img"
            tabIndex={0}
            aria-label={`${label} promedio por hora, hoy comparado con ayer. Usa las flechas para recorrer las horas.`}
            onPointerMove={(e) => mover(e.clientX)}
            onPointerLeave={() => setActiva(null)}
            onBlur={() => setActiva(null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault()
                irA(limitar((activa ?? fijada) + (e.key === 'ArrowLeft' ? -1 : 1), 0, n - 1))
              }
              if (e.key === 'Home') irA(0)
              if (e.key === 'End') irA(n - 1)
              if (e.key === 'Escape') setActiva(null)
            }}
            style={{ height: ALTO, touchAction: 'pan-y' }}
            className={cx(focusRing, 'relative mt-4 cursor-crosshair rounded-sm')}
          >
            {ancho > 0 && (
              <svg width={ancho} height={ALTO} className="overflow-visible">
                {marcas.map((m) => (
                  <g key={m}>
                    <line
                      x1={PAD.left}
                      x2={ancho - PAD.right}
                      y1={y(m)}
                      y2={y(m)}
                      shapeRendering="crispEdges"
                      className={chartGrid}
                      strokeWidth={1}
                    />
                    <text x={0} y={y(m)} dy={-4} className={chartTick}>
                      {m}
                    </text>
                  </g>
                ))}

                {activa !== null && (
                  <rect x={x(activa)} y={PAD.top} width={grupoW} height={innerH} className={chartArea} />
                )}

                {data.map((p, i) =>
                  i % 3 === 0 ? (
                    <text
                      key={p.hour}
                      x={x(i) + grupoW / 2}
                      y={ALTO - 4}
                      textAnchor="middle"
                      className={cx(chartTick, i % 6 !== 0 && 'hidden sm:inline')}
                    >
                      {formatoHora(p.hour)}
                    </text>
                  ) : null,
                )}

                {data.map((p, i) => {
                  const inicio = x(i) + (grupoW - bandaW) / 2
                  const atenuada = activa !== null && activa !== i
                  return (
                    <g key={p.hour}>
                      {SERIES.map((s, si) => {
                        const v = valor(p, s.id)
                        if (v === null) return null
                        const alto = (v / tope) * innerH
                        return (
                          <path
                            key={s.id}
                            d={barraRedondeada(inicio + si * (barraW + separacion), PAD.top + innerH - alto, barraW, alto, 2)}
                            strokeWidth={1}
                            className={cx(s.barClass, 'transition-opacity duration-[120ms]', ease)}
                            style={{ opacity: !visibles[s.id] || atenuada ? 0.4 : 1 }}
                          />
                        )
                      })}
                    </g>
                  )
                })}

                <line
                  x1={PAD.left}
                  x2={ancho - PAD.right}
                  y1={PAD.top + innerH}
                  y2={PAD.top + innerH}
                  shapeRendering="crispEdges"
                  className={chartZero}
                  strokeWidth={1}
                />
              </svg>
            )}

            {ancho > 0 && (
              <div
                aria-hidden="true"
                style={{ left: limitar(x(fijada) + grupoW / 2, 72, Math.max(ancho - 72, 72)), top: 4 }}
                className={cx(chartTooltip, activa === null ? 'opacity-0' : 'opacity-100')}
              >
                <p className={cx(typeCaption, 'whitespace-nowrap')}>{formatoHora(fijada)}</p>
                <div className="space-y-0.5">
                  {SERIES.map((s) => {
                    const v = s.id === 'today' ? tooltipHoy : tooltipAyer
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-4">
                        <span className={cx(typeCaption, 'flex items-center gap-1.5 whitespace-nowrap')}>
                          <Muestra outlined={s.outlined} inverse />
                          {s.label}
                        </span>
                        <span className="whitespace-nowrap">{v !== null ? `${v.toFixed(1)} ${unit}` : 'Sin datos'}</span>
                      </div>
                    )
                  })}
                  {tooltipHoy !== null && tooltipAyer !== null && (
                    <div className="flex items-center justify-between gap-4 pt-0.5">
                      <span className={cx(typeCaption, 'whitespace-nowrap')}>Diferencia</span>
                      <span className="whitespace-nowrap">
                        {tooltipHoy - tooltipAyer >= 0 ? '+' : '−'}
                        {Math.abs(tooltipHoy - tooltipAyer).toFixed(1)} {unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 p-1 sm:grid-cols-3">
          {estadisticas.map((e) => (
            <div key={e.label} className="flex min-w-0 flex-col gap-2 rounded-md px-3 py-3">
              <p className={cx(typeLabel, 'truncate text-neutral-900/80')}>{e.label}</p>
              <p className="flex min-w-0 flex-wrap items-baseline gap-x-1 text-[20px]/[24px] font-[450] tabular-nums">
                {e.value}
                <span className="ms-0.5 text-[14px]/[16px] font-[450] text-neutral-900/80">{e.unit}</span>
                {e.extra && <span className={cx(typeCaption, text3)}>{e.extra}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="h-1" />
    </div>
  )
}
