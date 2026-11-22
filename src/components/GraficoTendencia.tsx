import { useState } from 'react'
import { curveMonotoneX, line } from 'd3-shape'
import { limitar, useMedida } from './useMedida'
import {
  chartCrosshair,
  chartGrid,
  chartInk,
  chartOptimo,
  chartPoint,
  chartTick,
  chartTooltip,
  cx,
  failText,
  focusRing,
  typeCaption,
} from './estilos'
import type { SensorReading } from '../types/sensor'

const PAD = { top: 10, right: 1, bottom: 20, left: 34 }

/** Rango del eje Y redondeado a pasos "bonitos" (1, 2, 2.5, 5, 10...). */
export function rangoEje(min: number, max: number, divisiones = 4) {
  const paso0 = (max - min || 1) / divisiones
  const magnitud = 10 ** Math.floor(Math.log10(paso0))
  const norm = paso0 / magnitud
  const paso = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * magnitud
  const bajo = Math.floor(min / paso) * paso
  const alto = Math.ceil(max / paso) * paso
  const marcas: number[] = []
  for (let v = bajo; v <= alto + paso / 1000; v += paso) marcas.push(Math.round(v * 100) / 100)
  return { bajo, alto, marcas }
}

interface Punto {
  t: number
  v: number
}

interface GraficoTendenciaProps {
  data: SensorReading[]
  metric: 'temperature' | 'humidity'
  label: string
  unit: string
  optimal: { min: number; max: number }
  /** Valor a partir del cual la lectura es peligrosa (solo temperatura: 33 °C). */
  peligro?: number
  /** Ventana de tiempo que cubre el eje X, en milisegundos. */
  inicio: number
  fin: number
  /** Si entre dos lecturas pasa más que esto, la línea se corta (el nodo estuvo apagado). */
  huecoMs: number
  formatoX: (ms: number) => string
  formatoTooltip: (ms: number) => string
  alto?: number
}

export default function GraficoTendencia({
  data,
  metric,
  label,
  unit,
  optimal,
  peligro,
  inicio,
  fin,
  huecoMs,
  formatoX,
  formatoTooltip,
  alto: ALTO = 236,
}: GraficoTendenciaProps) {
  const [ref, ancho] = useMedida<HTMLDivElement>()
  const [activa, setActiva] = useState<number | null>(null)
  const [fijada, setFijada] = useState(Number.POSITIVE_INFINITY)

  const puntos: Punto[] = data.map((r) => ({ t: new Date(r.timestamp).getTime(), v: r[metric] }))
  const n = puntos.length
  const duracion = Math.max(fin - inicio, 1)
  const innerW = Math.max(ancho - PAD.left - PAD.right, 1)
  const innerH = ALTO - PAD.top - PAD.bottom

  const valores = puntos.map((p) => p.v)
  // La línea de peligro solo se dibuja si las lecturas se acercan a ella, para no aplastar la curva.
  const mostrarPeligro = peligro !== undefined && Math.max(...valores) >= peligro - 3
  const { bajo, alto, marcas } = rangoEje(
    Math.min(...valores, optimal.min),
    Math.max(...valores, optimal.max, mostrarPeligro ? peligro : -Infinity),
  )

  const x = (t: number) => PAD.left + ((t - inicio) / duracion) * innerW
  const y = (v: number) => PAD.top + innerH - ((v - bajo) / (alto - bajo)) * innerH
  const esPeligroso = (v: number) => peligro !== undefined && v > peligro
  const estadoDe = (v: number) =>
    esPeligroso(v) ? 'Peligroso' : v < optimal.min || v > optimal.max ? 'Aceptable' : 'Óptimo'

  // Un null entre dos lecturas muy separadas hace que d3 corte la línea en ese hueco.
  const conHuecos: (Punto | null)[] = []
  puntos.forEach((p, i) => {
    if (i > 0 && p.t - puntos[i - 1].t > huecoMs) conHuecos.push(null)
    conHuecos.push(p)
  })
  const trazo =
    line<Punto | null>()
      .defined((p): p is Punto => p !== null)
      .x((p) => x(p!.t))
      .y((p) => y(p!.v))
      .curve(curveMonotoneX)(conHuecos) ?? ''

  const indiceFijado = limitar(fijada, 0, n - 1)
  const fijado = puntos[indiceFijado]
  const cantidadEtiquetas = limitar(Math.floor(innerW / 72), 2, 6)
  const etiquetas = Array.from({ length: cantidadEtiquetas }, (_, i) => inicio + (duracion * i) / (cantidadEtiquetas - 1))

  const irA = (indice: number) => {
    setActiva(indice)
    setFijada(indice)
  }

  const mover = (clientX: number) => {
    const el = ref.current
    if (!el || n === 0) return
    const t = inicio + ((clientX - el.getBoundingClientRect().left - PAD.left) / innerW) * duracion
    let cercano = 0
    for (let i = 1; i < n; i++) {
      if (Math.abs(puntos[i].t - t) < Math.abs(puntos[cercano].t - t)) cercano = i
    }
    irA(cercano)
  }

  // Cada etiqueta de límite va donde la curva está más lejos de esa línea, para no taparla.
  const masBajo = puntos.reduce((a, p) => (p.v < a.v ? p : a), puntos[0])
  const masAlto = puntos.reduce((a, p) => (p.v > a.v ? p : a), puntos[0])
  const limites = [
    { valor: optimal.max, texto: `Máx ${optimal.max} ${unit}`, t: masBajo?.t ?? fin, tono: chartOptimo },
    { valor: optimal.min, texto: `Mín ${optimal.min} ${unit}`, t: masAlto?.t ?? fin, tono: chartOptimo },
    ...(mostrarPeligro
      ? [{ valor: peligro, texto: `Peligro ${peligro} ${unit}`, t: masBajo?.t ?? fin, tono: failText }]
      : []),
  ]

  return (
    <div
      ref={ref}
      role="img"
      tabIndex={0}
      aria-label={`${label} en el tiempo. Rango óptimo entre ${optimal.min} y ${optimal.max} ${unit}. Usa las flechas para recorrer las lecturas.`}
      onPointerMove={(e) => mover(e.clientX)}
      onPointerLeave={() => setActiva(null)}
      onBlur={() => setActiva(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          irA(limitar((activa ?? n - 1) + (e.key === 'ArrowLeft' ? -1 : 1), 0, n - 1))
        }
        if (e.key === 'Home') irA(0)
        if (e.key === 'End') irA(n - 1)
        if (e.key === 'Escape') setActiva(null)
      }}
      style={{ height: ALTO, touchAction: 'pan-y' }}
      className={cx(focusRing, 'relative cursor-crosshair rounded-sm')}
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
                {Number.isInteger(m) ? m : m.toFixed(1)}
              </text>
            </g>
          ))}

          {etiquetas.map((t, i) => (
            <text
              key={t}
              x={x(t)}
              y={ALTO - 4}
              textAnchor={i === 0 ? 'start' : i === cantidadEtiquetas - 1 ? 'end' : 'middle'}
              className={chartTick}
            >
              {formatoX(t)}
            </text>
          ))}

          {limites.map((l) => (
            <g key={l.texto}>
              <line
                x1={PAD.left}
                x2={ancho - PAD.right}
                y1={y(l.valor)}
                y2={y(l.valor)}
                strokeDasharray="4 4"
                stroke="currentColor"
                className={l.tono}
                strokeWidth={1}
              />
              <text
                x={limitar(x(l.t), PAD.left + 40, ancho - PAD.right - 40)}
                y={y(l.valor)}
                dy={-6}
                textAnchor="middle"
                className={chartTick}
              >
                {l.texto}
              </text>
            </g>
          ))}

          <path d={trazo} fill="none" className={chartInk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {puntos.map((p) =>
            esPeligroso(p.v) ? (
              <rect
                key={p.t}
                x={x(p.t) - 3}
                y={y(p.v) - 3}
                width={6}
                height={6}
                fill="currentColor"
                className={failText}
              />
            ) : null,
          )}

          {activa !== null && fijado && (
            <g>
              <line
                x1={x(fijado.t)}
                x2={x(fijado.t)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                className={chartCrosshair}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <rect
                x={x(fijado.t) - 4}
                y={y(fijado.v) - 4}
                width={8}
                height={8}
                {...(esPeligroso(fijado.v)
                  ? { fill: 'currentColor', className: failText }
                  : { className: chartPoint })}
              />
            </g>
          )}
        </svg>
      )}

      {ancho > 0 && fijado && (
        <div
          aria-hidden="true"
          style={{ left: limitar(x(fijado.t), 78, Math.max(ancho - 78, 78)), top: 4 }}
          className={cx(chartTooltip, activa === null ? 'opacity-0' : 'opacity-100')}
        >
          <p className={cx(typeCaption, 'whitespace-nowrap')}>{formatoTooltip(fijado.t)}</p>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-4">
              <span className={cx(typeCaption, 'flex items-center gap-1.5 whitespace-nowrap')}>
                <svg aria-hidden="true" width={12} height={8} viewBox="0 0 12 8" className="shrink-0">
                  <line x1={0} x2={12} y1={4} y2={4} strokeWidth={2} stroke="currentColor" />
                </svg>
                {label}
              </span>
              <span className="whitespace-nowrap">
                {fijado.v.toFixed(1)} {unit}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className={cx(typeCaption, 'whitespace-nowrap')}>Estado</span>
              <span className="whitespace-nowrap">{estadoDe(fijado.v)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
