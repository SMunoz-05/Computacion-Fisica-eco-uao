import { HugeiconsIcon } from '@hugeicons/react'
import { WifiDisconnected01Icon } from '@hugeicons/core-free-icons'
import { cx, frameDescription, frameTitle, panel, panelBody } from './estilos'

interface SinDatosProps {
  title: string
  message: string
}

export default function SinDatos({ title, message }: SinDatosProps) {
  return (
    <div className={panel}>
      <div className={cx(panelBody, 'mt-1 items-center gap-3 px-6 py-14 text-center')}>
        <span className="flex size-10 items-center justify-center rounded-md border border-neutral-900/8 bg-neutral-50 text-neutral-900/60">
          <HugeiconsIcon icon={WifiDisconnected01Icon} size={18} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <p className={frameTitle}>{title}</p>
        <p className={cx(frameDescription, 'max-w-md')}>{message}</p>
      </div>
    </div>
  )
}
