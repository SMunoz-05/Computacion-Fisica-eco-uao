// Posiciones fijas (no aleatorias) para que las hojas no salten de lugar en cada render.
const HOJAS = [
  { left: '6%', size: 22, duracion: 26, retraso: -4, balanceo: 3.8, color: 'text-eco-primary', opacidad: 0.55 },
  { left: '17%', size: 14, duracion: 34, retraso: -18, balanceo: 4.6, color: 'text-eco-suave', opacidad: 0.4 },
  { left: '29%', size: 18, duracion: 29, retraso: -9, balanceo: 3.2, color: 'text-eco-primary', opacidad: 0.5 },
  { left: '42%', size: 12, duracion: 38, retraso: -26, balanceo: 5.1, color: 'text-eco-acento', opacidad: 0.25 },
  { left: '55%', size: 20, duracion: 31, retraso: -14, balanceo: 4.2, color: 'text-eco-suave', opacidad: 0.4 },
  { left: '67%', size: 15, duracion: 27, retraso: -2, balanceo: 3.5, color: 'text-eco-primary', opacidad: 0.5 },
  { left: '79%', size: 24, duracion: 36, retraso: -21, balanceo: 4.8, color: 'text-eco-suave', opacidad: 0.35 },
  { left: '90%', size: 13, duracion: 30, retraso: -11, balanceo: 3.9, color: 'text-eco-primary', opacidad: 0.5 },
]

function Hoja({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 19C5 10 10 4 20 4c0 10-6 15-15 15Z" fill="currentColor" />
      <path d="M5 19c4-4 8-8 12-12" stroke="white" strokeOpacity={0.6} strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  )
}

export default function HojasDecorativas() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden">
      {HOJAS.map((h) => (
        <div
          key={h.left}
          className="absolute top-0 animate-caer"
          style={{ left: h.left, animationDuration: `${h.duracion}s`, animationDelay: `${h.retraso}s` }}
        >
          <div className={`animate-balanceo ${h.color}`} style={{ animationDuration: `${h.balanceo}s`, opacity: h.opacidad }}>
            <Hoja size={h.size} />
          </div>
        </div>
      ))}
    </div>
  )
}
