export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const ease = 'ease-[cubic-bezier(0.2,0,0,1)]'

// Texto
export const text2 = 'text-neutral-900/80'
export const text3 = 'text-neutral-900/60'
export const typeHeadingSm = 'text-[20px]/[24px] font-[600] tracking-[-0.015em]'
export const typeBodySm = 'text-[13px]/[18px] font-normal'
export const typeLabel = 'text-[14px]/[16px] font-[500]'
export const typeCaption = 'text-[12px]/[16px] font-normal tabular-nums'
export const typeCodeSm = 'font-mono text-[12px]/[16px] tabular-nums'
export const typeStatLg = 'text-[40px]/[44px] font-[500] tabular-nums tracking-[-0.02em]'

// Foco
export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eco-acento'
export const focusRingInset =
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-eco-acento'

// Botones
const buttonBase = cx(
  'relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap',
  'transition-[color,background-color,border-color,box-shadow,transform,filter] duration-[120ms] active:scale-[0.98] motion-reduce:active:scale-100',
  'disabled:cursor-not-allowed',
  focusRing,
  ease,
)
export const primaryButton = cx(
  buttonBase,
  'bg-[linear-gradient(180deg,color-mix(in_oklab,#4d7c0f_84%,white),color-mix(in_oklab,#4d7c0f_94%,black))] text-white',
  'shadow-[inset_0_2px_0_-1px_rgb(255_255_255/0.2),inset_0_-2px_0_-1px_rgb(0_0_0/0.3),inset_0_0_0_1px_color-mix(in_oklab,#4d7c0f_88%,black),0_1px_1px_rgb(0_0_0/0.22),0_2px_5px_-2px_rgb(0_0_0/0.3)]',
  'enabled:hover:brightness-110 disabled:opacity-40 disabled:shadow-none',
)
export const secondaryButton = cx(
  buttonBase,
  'border border-neutral-900/12 bg-white text-neutral-900 shadow-[0_1px_2px_-1px_rgb(0_0_0/0.12)]',
  'enabled:hover:border-neutral-900/30 enabled:hover:bg-neutral-900/[0.03] active:shadow-[inset_0_1px_2px_rgb(0_0_0/0.12)]',
  'disabled:border-neutral-900/8 disabled:text-neutral-900/40 disabled:shadow-none',
)
export const buttonMd = 'h-8 gap-2 rounded-md px-4 text-[14px]/[16px] font-[500]'

// Insignias y etiquetas
export const badge =
  'inline-flex h-5 min-w-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded px-1.5 text-[12px]/[16px] font-[500] tabular-nums'
export const badgeNeutral = 'bg-neutral-900/[0.07] text-neutral-900'
export const badgeOutline = 'border border-neutral-900/12 bg-white text-neutral-900'
export const codeTag =
  'inline-flex h-5 min-w-5 shrink-0 items-center justify-center whitespace-nowrap rounded bg-neutral-900/[0.07] px-1.5 font-mono text-[12px]/[16px] tabular-nums text-neutral-900'

// Estados: óptimo en azul, aceptable en verde, peligroso en rojo
export const statusOk = 'text-estado-optimo'
export const statusWarn = 'text-estado-aceptable'
export const failText = 'text-estado-peligro'
export const TONO_ESTADO = { ok: statusOk, warn: statusWarn, danger: failText } as const
export const FONDO_ESTADO = { ok: 'bg-estado-optimo', warn: 'bg-estado-aceptable', danger: 'bg-estado-peligro' } as const

// Paneles
export const panel =
  'relative flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-neutral-900/10 bg-neutral-50 text-neutral-900'
export const panelHead = 'flex min-h-10 min-w-0 shrink-0 items-center gap-2 px-4'
export const panelBody =
  'mx-1 mb-1 flex min-w-0 flex-col overflow-hidden rounded-md border border-neutral-900/8 bg-white [&:has(+*)]:mb-0'
export const panelFoot = 'flex min-h-11 min-w-0 items-center gap-2 px-4 py-2 text-[13px]/[18px] text-neutral-900/60'
export const frameTitle = 'min-w-0 truncate text-[14px]/[16px] font-[600] text-neutral-900'
export const frameMeta = 'shrink-0 text-[14px]/[16px] font-[500] tabular-nums text-neutral-900/60'
export const frameDescription = 'text-[13px]/[18px] text-neutral-900/70'
export const frame =
  'relative flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-neutral-900/10 bg-white text-neutral-900'
export const rowsRuled = 'divide-y divide-neutral-900/8'

// Indicadores
export const statGroup = 'rounded-[10px] border border-neutral-900/10 bg-white'
export const statGrid =
  'grid grid-cols-2 overflow-hidden rounded-[10px] lg:grid-cols-4 [&>*]:-ml-px [&>*]:-mt-px [&>*]:border-l [&>*]:border-t [&>*]:border-neutral-900/8'
export const statCell = 'flex min-w-0 flex-col gap-2 px-4 py-3'
export const statLabel = 'text-[14px]/[16px] font-[500] text-neutral-900/80'
export const statValueSm =
  'flex min-w-0 flex-wrap items-baseline gap-x-1 text-[20px]/[24px] font-[500] tabular-nums text-neutral-900'
export const statDescription = 'text-[13px]/[18px] text-neutral-900/60'
export const statUnit = 'ms-0.5 text-[14px]/[16px] font-[500] text-neutral-900/70'
export const statDelta =
  'inline-flex min-w-0 flex-wrap items-center gap-x-1 text-[12px]/[16px] font-[500] tabular-nums text-neutral-900/80'

// Progreso
export const progressTrack = 'relative block h-1.5 w-full overflow-hidden rounded-full bg-neutral-900/[0.07]'
export const progressFill = cx('block h-full rounded-full bg-eco-acento transition-[width] duration-[120ms] motion-reduce:transition-none', ease)

// Listas
export const itemRow = 'relative flex min-h-14 w-full min-w-0 items-center gap-x-3 py-2 text-left text-neutral-900'
export const itemMedia =
  'flex size-9 shrink-0 items-center justify-center rounded-md border border-eco-primary/40 bg-eco-primary/15 text-eco-acento'
export const iconoVerde = 'shrink-0 text-eco-acento'
export const itemTitle = 'flex min-w-0 items-baseline gap-2 text-[14px]/[16px] font-[500] text-neutral-900'
export const itemDescription = 'truncate text-[13px]/[18px] text-neutral-900/60'

// Tablas
export const table = 'w-full border-separate border-spacing-0 text-left text-[14px]/[20px]'
export const tableHead =
  'h-8 border-b border-neutral-900/8 px-3 text-left align-middle text-[12px]/[16px] font-normal whitespace-nowrap text-neutral-900/60 first:pl-4 last:pr-4'
export const tableRow = 'group transition-[background-color] duration-[120ms] hover:bg-neutral-900/[0.03]'
export const tableCell =
  'h-11 border-b border-neutral-900/8 px-3 align-middle whitespace-nowrap text-neutral-900 group-last:border-b-0 first:pl-4 last:pr-4'
export const numericCell = 'text-right tabular-nums'

// Degradados al desplazar
export const fadeTop = cx('pointer-events-none absolute inset-x-0 h-8 bg-gradient-to-b from-white to-transparent transition-opacity duration-[120ms]', ease)
export const fadeBottom = cx('pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-[120ms]', ease)

// Ruta de navegación
export const breadcrumbList = 'flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[14px]/[16px] font-[500] text-neutral-900/70'
export const breadcrumbSeparator = 'select-none text-neutral-900/40'

// Gráficas
export const chartGrid = 'stroke-neutral-900/[0.06]'
export const chartZero = 'stroke-neutral-900/10'
export const chartInk = 'stroke-eco-acento'
export const chartInk2 = 'stroke-eco-suave'
export const chartArea = 'fill-eco-primary/20'
export const chartBar = 'fill-eco-acento'
export const chartBar2 = 'fill-eco-primary/25 stroke-eco-suave'
export const chartOptimo = 'text-estado-optimo'
export const chartTick = 'fill-neutral-900/60 text-[12px] tabular-nums'
export const chartCrosshair = 'stroke-neutral-900/70'
export const chartPoint = 'fill-eco-acento stroke-white stroke-2'
export const chartTooltip = cx(
  'pointer-events-none absolute z-10 flex min-w-36 max-w-64 -translate-x-1/2 flex-col gap-1.5 rounded-md bg-neutral-900 px-3 py-2',
  'text-[12px]/[16px] font-[500] tabular-nums text-white shadow-[0_12px_24px_-12px_rgb(0_0_0/0.2)]',
  'transition-opacity duration-[160ms] motion-reduce:transition-none',
  ease,
)
