import type { AlertLevel } from '../types/sensor'

let contexto: AudioContext | null = null

/**
 * Los navegadores no dejan reproducir sonido hasta que la persona hace clic o presiona una
 * tecla en la página. Esta función se llama en esa primera interacción para habilitarlo.
 */
export function prepararSonido() {
  if (!contexto) contexto = new AudioContext()
  if (contexto.state === 'suspended') void contexto.resume()
}

function tono(ctx: AudioContext, frecuencia: number, inicio: number, duracion: number, tipo: OscillatorType, volumen: number) {
  const oscilador = ctx.createOscillator()
  const ganancia = ctx.createGain()
  oscilador.type = tipo
  oscilador.frequency.value = frecuencia
  const t0 = ctx.currentTime + inicio
  ganancia.gain.setValueAtTime(0.0001, t0)
  ganancia.gain.exponentialRampToValueAtTime(volumen, t0 + 0.02)
  ganancia.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion)
  oscilador.connect(ganancia).connect(ctx.destination)
  oscilador.start(t0)
  oscilador.stop(t0 + duracion + 0.05)
}

/** Campanita suave para avisos normales y tres pitidos para peligro. */
export function reproducirAlerta(nivel: AlertLevel) {
  if (!contexto || contexto.state !== 'running') return
  if (nivel === 'danger') {
    ;[0, 0.22, 0.44].forEach((inicio) => tono(contexto!, 440, inicio, 0.18, 'square', 0.06))
    return
  }
  tono(contexto, 880, 0, 0.3, 'sine', 0.15)
  tono(contexto, 1320, 0.12, 0.4, 'sine', 0.12)
}
