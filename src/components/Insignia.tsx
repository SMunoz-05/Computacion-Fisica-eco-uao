import { TONO_ESTADO, cx } from './estilos'
import type { AlertLevel } from '../types/sensor'

const LABELS: Record<AlertLevel, string> = {
  ok: 'Óptimo',
  warn: 'Aceptable',
  danger: 'Peligroso',
}

interface InsigniaProps {
  level: AlertLevel
  label?: string
  helpText?: string
}

export default function Insignia({ level, label, helpText }: InsigniaProps) {
  const estado = (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap text-[13px]/[16px] font-[500]', TONO_ESTADO[level])}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {label ?? LABELS[level]}
    </span>
  )

  if (!helpText) return estado

  return (
    <span className="group/estado relative inline-flex cursor-help">
      {estado}
      <span className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 w-56 rounded-md bg-neutral-900 px-3 py-2 text-center text-[12px]/[16px] font-[500] text-white opacity-0 shadow-[0_12px_24px_-12px_rgb(0_0_0/0.2)] transition-opacity duration-150 group-hover/estado:opacity-100">
        {helpText}
      </span>
    </span>
  )
}
