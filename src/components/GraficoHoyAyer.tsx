import { area, curveMonotoneX, line } from 'd3-shape'
import { rangoEje } from './GraficoTendencia'
import { limitar, useMedida } from './useMedida'
import { chartArea, chartCrosshair, chartGrid, chartInk, chartInk2, chartPoint, chartTick, cx, focusRingInset } from './estilos'
import type { HourlyPoint } from '../types/sensor'

const PAD = { top: 12, right: 6, bottom: 22, left: 40 }
const ALTO = 244

export const formatoHora = (h: number) => `${String(h).padStart(2, '0')}:00`

interface GraficoHoyAyerProps {
  data: HourlyPoint[]
  metric: 'temperature' | 'humidity'
  unit: string
  label: string
  cursor: number | null
  onCursorChange: (hora: number | null) => void
}

export default function GraficoHoyAyer({ data, metric, unit, label, cursor, onCursorChange }: GraficoHoyAyerProps) {
  const [ref, ancho] = useMedida<HTMLDivElement>()
  const n = 24
  const innerW = Math.max(ancho - PAD.left - PAD.right, 1)
  const innerH = ALTO - PAD.top - PAD.bottom

  const hoy = data.map((p) => p.today?.[metric] ?? null)
  const ayer = data.map((p) => p.yesterday?.[metric] ?? null)
  const valores = [...hoy, ...ayer].filter((v): v is number => v !== null)
  const { bajo, alto, marcas } = rangoEje(Math.min(...valores), Math.max(...valores))

  const x = (i: number) => PAD.left + (i / (n - 1)) * innerW
  const y = (v: number) => PAD.top + innerH - ((v - bajo) / (alto - bajo || 1)) * innerH

  const trazo = line<number | null>()
    .defined((v) => v !== null)
    .x((_, i) => x(i))
    .y((v) => y(v!))
    .curve(curveMonotoneX)
  const relleno = area<number | null>()
    .defined((v) => v !== null)
    .x((_, i) => x(i))
    .y0(PAD.top + innerH)
    .y1((v) => y(v!))
    .curve(curveMonotoneX)

  const mover = (clientX: number) => {
    const el = ref.current
    if (!el) return
    const t = (clientX - el.getBoundingClientRect().left - PAD.left) / innerW
    onCursorChange(limitar(Math.round(t * (n - 1)), 0, n - 1))
  }

  const pasoEtiquetas = innerW / 4 < 64 ? 6 : 3
  const valoresCursor = cursor === null ? [] : [ayer[cursor], hoy[cursor]].filter((v): v is number => v !== null)

  return (
    <div
      ref={ref}
      role="application"
      tabIndex={0}
      aria-label={`${label} promedio por hora: hoy comparado con ayer. Usa las flechas para recorrer las horas.`}
      onPointerMove={(e) => mover(e.clientX)}
      onPointerLeave={() => onCursorChange(null)}
      onBlur={() => onCursorChange(null)}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        e.preventDefault()
        const desde = cursor ?? new Date().getHours()
        onCursorChange(limitar(desde + (e.key === 'ArrowRight' ? 1 : -1), 0, n - 1))
      }}
      style={{ height: ALTO, touchAction: 'pan-y' }}
      className={cx(focusRingInset, 'relative shrink-0 cursor-crosshair')}
    >
      {ancho > 0 && valores.length > 0 && (
        <svg width={ancho} height={ALTO} className="overflow-visible" aria-hidden="true">
          {marcas.map((m) => (
            <g key={m}>
              <line
                x1={PAD.left}
                x2={ancho - PAD.right}
                y1={y(m)}
                y2={y(m)}
                strokeWidth={1}
                shapeRendering="crispEdges"
                className={chartGrid}
              />
              <text x={PAD.left - 8} y={y(m)} dy={3.5} textAnchor="end" className={chartTick}>
                {Number.isInteger(m) ? m : m.toFixed(1)}
                {unit === '%' ? '%' : '°'}
              </text>
            </g>
          ))}

          <path d={relleno(hoy) ?? ''} className={chartArea} />
          <path
            d={trazo(ayer) ?? ''}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={chartInk2}
          />
          <path
            d={trazo(hoy) ?? ''}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={chartInk}
          />

          {data.map((p, i) =>
            i % pasoEtiquetas === 0 || i === n - 1 ? (
              <text
                key={p.hour}
                x={x(i)}
                y={ALTO - 2}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                className={chartTick}
              >
                {formatoHora(p.hour)}
              </text>
            ) : null,
          )}

          {cursor !== null && (
            <g>
              <line
                x1={x(cursor)}
                x2={x(cursor)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                strokeWidth={1}
                shapeRendering="crispEdges"
                className={chartCrosshair}
              />
              {valoresCursor.map((v, i) => (
                <rect key={i} x={x(cursor) - 4} y={y(v) - 4} width={8} height={8} className={chartPoint} />
              ))}
            </g>
          )}
        </svg>
      )}
    </div>
  )
}
