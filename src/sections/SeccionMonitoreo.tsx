import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { HumidityIcon, Sun03Icon, TemperatureIcon } from '@hugeicons/core-free-icons'
import Insignia from '../components/Insignia'
import Tooltip from '../components/Tooltip'
import GraficoTendencia from '../components/GraficoTendencia'
import LineaTiempoLuz from '../components/LineaTiempoLuz'
import {
  TONO_ESTADO,
  badge,
  badgeOutline,
  cx,
  iconoVerde,
  frameTitle,
  panel,
  panelBody,
  panelFoot,
  panelHead,
  statUnit,
  text3,
  typeBodySm,
  typeHeadingSm,
  typeStatLg,
} from '../components/estilos'
import {
  TOOLTIP_MEDICION,
  UMBRALES,
  alertaConUbicacion,
  mensajeEstado,
  nivelAlertaPara,
  textoAyudaEstado,
} from '../data/estados'
import type { MetricKey, SensorReading } from '../types/sensor'

interface PanelMetricaProps {
  title: string
  Icon: IconSvgElement
  value: string
  unit?: string
  metric: MetricKey
  latest: SensorReading
  children: ReactNode
}

function PanelMetrica({ title, Icon, value, unit, metric, latest, children }: PanelMetricaProps) {
  const nivel = nivelAlertaPara(metric, latest)
  const alerta = alertaConUbicacion(nivel)

  return (
    <div className={panel}>
      <div className={cx(panelHead, 'justify-between py-2.5')}>
        <div className="flex min-w-0 items-center gap-2">
          <HugeiconsIcon icon={Icon} size={16} strokeWidth={1.8} aria-hidden="true" className={iconoVerde} />
          <h2 className={frameTitle}>{title}</h2>
          <Tooltip text={TOOLTIP_MEDICION[metric]} />
        </div>
        <Insignia level={nivel} helpText={textoAyudaEstado(metric, nivel)} />
      </div>
      <div className={cx(panelBody, 'px-4 pb-3 pt-4')}>
        <p className={cx(typeStatLg, 'flex items-baseline gap-x-1')}>
          {value}
          {unit && <span className={statUnit}>{unit}</span>}
        </p>
        <div className="mt-4">{children}</div>
      </div>
      <div className={cx(panelFoot, 'flex-col items-start gap-0.5')}>
        <span>{mensajeEstado(metric, latest)}</span>
        {alerta && <span className={cx('font-[500]', TONO_ESTADO[nivel])}>{alerta}</span>}
      </div>
    </div>
  )
}

// El ESP32 envía cada 2 s; más de 6 s sin lecturas se dibuja como un corte en la línea.
const HUECO_EN_VIVO_MS = 6000
const VENTANA_EN_VIVO_MS = 60000
const formatoHora = (ms: number) =>
  new Date(ms).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

interface SeccionMonitoreoProps {
  series: SensorReading[]
  latest: SensorReading
  connected: boolean
}

export default function SeccionMonitoreo({ series, latest, connected }: SeccionMonitoreoProps) {
  // Ventana fija del último minuto, contada desde la última lectura (no desde el reloj del
  // navegador) para que no dependa de que el computador y el servidor tengan la misma hora.
  const fin = new Date(latest.timestamp).getTime()
  const inicio = fin - VENTANA_EN_VIVO_MS
  const enVentana = series.filter((r) => new Date(r.timestamp).getTime() >= inicio)
  const ventana = {
    inicio,
    fin,
    huecoMs: HUECO_EN_VIVO_MS,
    formatoX: formatoHora,
    formatoTooltip: formatoHora,
    alto: 196,
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className={typeHeadingSm}>Monitoreo en vivo</h1>
          <p className={cx(typeBodySm, text3, 'mt-1')}>Último minuto de lecturas · se actualiza cada 2 segundos</p>
        </div>
        <span className={cx(badge, badgeOutline, 'h-6 gap-1.5 px-2')}>
          <span
            aria-hidden="true"
            className={cx('size-1.5 rounded-full', connected ? 'animate-pulse bg-eco-acento motion-reduce:animate-none' : 'bg-neutral-900/30')}
          />
          {connected ? 'Recibiendo datos' : 'Sin conexión'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <PanelMetrica
          title="Temperatura"
          Icon={TemperatureIcon}
          value={latest.temperature.toFixed(1)}
          unit="°C"
          metric="temperature"
          latest={latest}
        >
          <GraficoTendencia
            data={enVentana}
            metric="temperature"
            label="Temperatura"
            unit="°C"
            optimal={UMBRALES.temperature}
            peligro={UMBRALES.temperature.peligro}
            {...ventana}
          />
        </PanelMetrica>

        <PanelMetrica
          title="Humedad"
          Icon={HumidityIcon}
          value={latest.humidity.toFixed(0)}
          unit="%"
          metric="humidity"
          latest={latest}
        >
          <GraficoTendencia data={enVentana} metric="humidity" label="Humedad" unit="%" optimal={UMBRALES.humidity} {...ventana} />
        </PanelMetrica>

        <PanelMetrica
          title="Iluminación"
          Icon={Sun03Icon}
          value={latest.light ? 'Luz' : 'Oscuro'}
          metric="light"
          latest={latest}
        >
          <LineaTiempoLuz data={enVentana} />
        </PanelMetrica>
      </div>
    </section>
  )
}
