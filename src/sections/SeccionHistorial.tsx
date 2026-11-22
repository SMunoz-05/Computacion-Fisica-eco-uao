import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon } from '@hugeicons/core-free-icons'
import Insignia from '../components/Insignia'
import SinDatos from '../components/SinDatos'
import SelectorSegmentado from '../components/SelectorSegmentado'
import GraficoTendencia from '../components/GraficoTendencia'
import Variacion from '../components/Variacion'
import ComparacionPorHora from '../components/ComparacionPorHora'
import {
  buttonMd,
  chartInk,
  chartInk2,
  chartOptimo,
  cx,
  frame,
  numericCell as numeric,
  panel,
  secondaryButton,
  statUnit,
  table,
  tableCell,
  tableHead,
  tableRow,
  text3,
  typeBodySm,
  typeHeadingSm,
  typeLabel,
  typeStatLg,
} from '../components/estilos'
import { UMBRALES, nivelGeneral } from '../data/estados'
import type { HourlyPoint, RangeSummary, SensorReading, TimeRange } from '../types/sensor'


const OPCIONES_RANGO: { id: TimeRange; label: string }[] = [
  { id: '24h', label: '24 horas' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
]

type Metrica = 'temperature' | 'humidity'

const METRICAS: Record<Metrica, { label: string; unit: string; optimal: { min: number; max: number } }> = {
  temperature: { label: 'Temperatura', unit: '°C', optimal: UMBRALES.temperature },
  humidity: { label: 'Humedad', unit: '%', optimal: UMBRALES.humidity },
}

// Igual que en el servidor: duración del rango y tamaño de cada grupo de promedios.
const RANGOS: Record<TimeRange, { duracion: number; grupo: number }> = {
  '24h': { duracion: 24 * 3600e3, grupo: 15 * 60e3 },
  '7d': { duracion: 7 * 24 * 3600e3, grupo: 2 * 3600e3 },
  '30d': { duracion: 30 * 24 * 3600e3, grupo: 6 * 3600e3 },
}

function formatoFecha(ms: number, rango: TimeRange) {
  const d = new Date(ms)
  if (rango === '24h') return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

const PERIODO_ANTERIOR: Record<TimeRange, string> = {
  '24h': 'vs. las 24 horas anteriores',
  '7d': 'vs. los 7 días anteriores',
  '30d': 'vs. los 30 días anteriores',
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <span className={text3}>—</span>
  const min = Math.min(...values)
  const span = Math.max(...values) - min || 1
  const puntos = values
    .map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(2)},${(100 - ((v - min) / span) * 100).toFixed(2)}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="ml-auto h-5 w-16 overflow-visible">
      <polyline
        points={puntos}
        fill="none"
        vectorEffect="non-scaling-stroke"
        className={chartInk2}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const porcentaje = (ratio: number) => `${Math.round(ratio * 100)}%`

interface SeccionHistorialProps {
  series: SensorReading[]
  summary: RangeSummary | null
  hourly: HourlyPoint[]
  range: TimeRange
  onRangeChange: (range: TimeRange) => void
  onExport: () => void
}

export default function SeccionHistorial({
  series,
  summary,
  hourly,
  range,
  onRangeChange,
  onExport,
}: SeccionHistorialProps) {
  const [metrica, setMetrica] = useState<Metrica>('temperature')
  const config = METRICAS[metrica]
  const actual = summary?.current ?? null
  const anterior = summary?.previous ?? null
  const variacion = actual && anterior ? actual[metrica].average - anterior[metrica].average : null
  const filas = [...series].reverse().slice(0, 12)

  const resumenPorVariable = actual && [
    {
      nombre: 'Temperatura',
      promedio: `${actual.temperature.average.toFixed(1)} °C`,
      extremos: `${actual.temperature.min.toFixed(1)} – ${actual.temperature.max.toFixed(1)} °C`,
      enRango: porcentaje(actual.temperature.optimalRatio),
      tendencia: series.map((r) => r.temperature),
    },
    {
      nombre: 'Humedad',
      promedio: `${actual.humidity.average.toFixed(1)} %`,
      extremos: `${actual.humidity.min.toFixed(0)} – ${actual.humidity.max.toFixed(0)} %`,
      enRango: porcentaje(actual.humidity.optimalRatio),
      tendencia: series.map((r) => r.humidity),
    },
    {
      nombre: 'Iluminación',
      promedio: `${porcentaje(actual.light.ratio)} con luz`,
      extremos: '—',
      enRango: porcentaje(actual.light.ratio),
      tendencia: series.map((r) => r.lightRatio ?? (r.light ? 1 : 0)),
    },
  ]

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className={typeHeadingSm}>Historial</h1>
          <p className={cx(typeBodySm, text3, 'mt-1')}>Tendencias y registros guardados del nodo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectorSegmentado label="Rango de fechas" options={OPCIONES_RANGO} value={range} onChange={onRangeChange} />
          <button
            type="button"
            onClick={onExport}
            disabled={series.length === 0}
            className={cx(secondaryButton, buttonMd)}
          >
            <HugeiconsIcon icon={Download04Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
            Exportar Excel
          </button>
        </div>
      </div>

      {series.length === 0 ? (
        <SinDatos
          title="Sin registros en este rango"
          message="Todavía no hay lecturas guardadas del ESP32 para el periodo seleccionado."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className={panel}>
            <div className="mx-1 mt-1 flex min-w-0 flex-col divide-y divide-neutral-900/8 overflow-hidden rounded-md border border-neutral-900/8 bg-white">
              <div className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cx(typeLabel, 'flex flex-wrap gap-x-2 text-neutral-900/80')}>
                      <span>{config.label} promedio</span>
                      <span className={text3}>{OPCIONES_RANGO.find((o) => o.id === range)?.label}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                      <p className={cx(typeStatLg, 'flex items-baseline gap-x-1')}>
                        {actual ? actual[metrica].average.toFixed(1) : '—'}
                        <span className={statUnit}>{config.unit}</span>
                      </p>
                      <Variacion value={variacion} unit={config.unit} caption={PERIODO_ANTERIOR[range]} />
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
                    <div className={cx(typeLabel, 'flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-neutral-900')}>
                      <span className="inline-flex h-7 items-center gap-2">
                        <svg aria-hidden="true" width={12} height={8} viewBox="0 0 12 8" className="shrink-0">
                          <line x1={0} x2={12} y1={4} y2={4} strokeWidth={2} className={chartInk} />
                        </svg>
                        {config.label}
                      </span>
                      <span className="inline-flex h-7 items-center gap-2">
                        <svg aria-hidden="true" width={12} height={8} viewBox="0 0 12 8" className="shrink-0">
                          <line x1={0} x2={12} y1={4} y2={4} strokeWidth={2} strokeDasharray="4 4" stroke="currentColor" className={chartOptimo} />
                        </svg>
                        Rango óptimo
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <GraficoTendencia
                    data={series}
                    metric={metrica}
                    label={config.label}
                    unit={config.unit}
                    optimal={config.optimal}
                    peligro={metrica === 'temperature' ? UMBRALES.temperature.peligro : undefined}
                    inicio={Date.now() - RANGOS[range].duracion}
                    fin={Date.now()}
                    huecoMs={RANGOS[range].grupo * 1.5}
                    formatoX={(ms) => formatoFecha(ms, range)}
                    formatoTooltip={(ms) =>
                      new Date(ms).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 p-1 sm:grid-cols-3">
                {[
                  { label: 'Último intervalo', valor: series[series.length - 1][metrica] },
                  { label: 'Mínima del periodo', valor: actual?.[metrica].min },
                  { label: 'Máxima del periodo', valor: actual?.[metrica].max },
                ].map((celda) => (
                  <div key={celda.label} className="flex min-w-0 flex-col gap-2 rounded-md px-3 py-3">
                    <p className={cx(typeLabel, 'truncate text-neutral-900/80')}>{celda.label}</p>
                    <p className="flex min-w-0 flex-wrap items-baseline gap-x-1 text-[20px]/[24px] font-[450] tabular-nums">
                      {celda.valor !== undefined ? celda.valor.toFixed(1) : '—'}
                      <span className={statUnit}>{config.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-1" />
          </div>

          {hourly.length > 0 && <ComparacionPorHora data={hourly} />}

          {resumenPorVariable && (
            <div className={cx(frame, 'overflow-x-auto')}>
              <table className={table}>
                <caption className="sr-only">Resumen por variable</caption>
                <thead>
                  <tr>
                    <th scope="col" className={tableHead}>Variable</th>
                    <th scope="col" className={cx(tableHead, numeric)}>Promedio</th>
                    <th scope="col" className={cx(tableHead, numeric, 'hidden sm:table-cell')}>Mín – Máx</th>
                    <th scope="col" className={cx(tableHead, numeric)}>En rango óptimo</th>
                    <th scope="col" className={cx(tableHead, 'hidden text-right sm:table-cell')}>Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenPorVariable.map((fila) => (
                    <tr key={fila.nombre} className={tableRow}>
                      <td className={tableCell}>{fila.nombre}</td>
                      <td className={cx(tableCell, numeric)}>{fila.promedio}</td>
                      <td className={cx(tableCell, numeric, 'hidden text-neutral-900/80 sm:table-cell')}>{fila.extremos}</td>
                      <td className={cx(tableCell, numeric, 'text-neutral-900/80')}>{fila.enRango}</td>
                      <td className={cx(tableCell, 'hidden text-right sm:table-cell')}>
                        <Sparkline values={fila.tendencia} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={frame}>
            <div className="overflow-x-auto">
              <table className={cx(table, 'min-w-[560px]')}>
                <caption className="sr-only">Registros recientes (promedios por intervalo)</caption>
                <thead>
                  <tr>
                    <th scope="col" className={tableHead}>Fecha</th>
                    <th scope="col" className={tableHead}>Hora</th>
                    <th scope="col" className={cx(tableHead, numeric)}>Temp.</th>
                    <th scope="col" className={cx(tableHead, numeric)}>Humedad</th>
                    <th scope="col" className={tableHead}>Luz</th>
                    <th scope="col" className={tableHead}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((r) => (
                    <tr key={r.timestamp} className={tableRow}>
                      <td className={tableCell}>{new Date(r.timestamp).toLocaleDateString('es-CO')}</td>
                      <td className={cx(tableCell, 'text-neutral-900/80')}>
                        {new Date(r.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className={cx(tableCell, numeric)}>{r.temperature.toFixed(1)} °C</td>
                      <td className={cx(tableCell, numeric)}>{r.humidity.toFixed(0)} %</td>
                      <td className={tableCell}>{r.light ? 'Luz' : 'Oscuro'}</td>
                      <td className={tableCell}>
                        <Insignia level={nivelGeneral(r)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
