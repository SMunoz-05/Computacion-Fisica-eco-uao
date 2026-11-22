import { HugeiconsIcon } from '@hugeicons/react'
import { HelpCircleIcon } from '@hugeicons/core-free-icons'

interface TooltipProps {
  text: string
}

export default function Tooltip({ text }: TooltipProps) {
  return (
    <span className="group/tooltip relative inline-flex">
      <span
        tabIndex={0}
        aria-label={text}
        className="inline-flex cursor-help rounded-full text-neutral-900/40 transition-colors duration-150 hover:text-neutral-900 focus-visible:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-eco-acento"
      >
        <HugeiconsIcon icon={HelpCircleIcon} size={14} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-md bg-neutral-900 px-3 py-2 text-center text-[12px]/[16px] font-[500] text-white opacity-0 shadow-[0_12px_24px_-12px_rgb(0_0_0/0.2)] transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">
        {text}
      </span>
    </span>
  )
}
