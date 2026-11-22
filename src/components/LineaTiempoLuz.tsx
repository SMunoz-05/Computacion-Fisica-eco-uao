import { cx, text3, typeCaption } from './estilos'
import type { SensorReading } from '../types/sensor'

const formatoHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

interface LineaTiempoLuzProps {
  data: SensorReading[]
}

export default function LineaTiempoLuz({ data }: LineaTiempoLuzProps) {
  const lecturasConLuz = data.filter((r) => r.light).length
  const porcentajeLuz = data.length ? Math.round((lecturasConLuz / data.length) * 100) : 0

  return (
    <div>
      <div className="flex h-[140px] items-end gap-[2px] border-b border-neutral-900/10">
        {data.map((r) => (
          <div
            key={r.timestamp}
            title={`${formatoHora(r.timestamp)} · ${r.light ? 'Luz' : 'Oscuro'}`}
            className={cx(
              'flex-1 rounded-t-[2px] transition-[height,background-color] duration-300',
              r.light ? 'h-full bg-eco-acento' : 'h-1/4 bg-neutral-900/10',
            )}
          />
        ))}
      </div>
      {data.length > 0 && (
        <div className={cx(typeCaption, text3, 'mt-2 flex justify-between')}>
          <span>{formatoHora(data[0].timestamp)}</span>
          <span>{formatoHora(data[data.length - 1].timestamp)}</span>
        </div>
      )}
      <div className={cx(typeCaption, text3, 'mt-2 flex flex-wrap items-center justify-between gap-2')}>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 bg-eco-acento" /> Luz
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 bg-neutral-900/10" /> Oscuro
          </span>
        </span>
        <span>{porcentajeLuz}% con luz</span>
      </div>
    </div>
  )
}
