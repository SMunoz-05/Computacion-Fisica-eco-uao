import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDownRight01Icon, ArrowRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { cx, statDelta, text3 } from './estilos'

interface VariacionProps {
  value: number | null
  unit: string
  caption: string
  className?: string
}

export default function Variacion({ value, unit, caption, className }: VariacionProps) {
  if (value === null) {
    return <p className={cx(statDelta, text3, className)}>Sin datos para comparar</p>
  }

  const redondeado = Math.round(value * 10) / 10
  const icono = redondeado > 0 ? ArrowUpRight01Icon : redondeado < 0 ? ArrowDownRight01Icon : ArrowRight01Icon

  return (
    <p className={cx(statDelta, className)}>
      <HugeiconsIcon icon={icono} size={12} strokeWidth={1.8} aria-hidden="true" />
      <span className="sr-only">{redondeado > 0 ? 'Subió' : redondeado < 0 ? 'Bajó' : 'Sin cambio'}</span>
      {redondeado > 0 ? '+' : redondeado < 0 ? '−' : ''}
      {Math.abs(redondeado).toFixed(1)} {unit}
      <span className={text3}>{caption}</span>
    </p>
  )
}
