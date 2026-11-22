import type { AlertLevel, MetricKey, Notification, SensorReading } from '../types/sensor'

// Mismos umbrales que usa el ESP32 en EcoUAO.ino
export const UMBRALES = {
  temperature: { min: 18, max: 25, peligro: 33 },
  humidity: { min: 40, max: 70 },
}

export const UBICACION_NODO = 'Salón 3115'

export const TOOLTIP_MEDICION: Record<MetricKey, string> = {
  temperature: 'Medida por el sensor DHT22 cada 2 segundos',
  humidity: 'Medida por el sensor DHT22 cada 2 segundos',
  light: 'Medida por el sensor LDR cada 2 segundos',
}

const NOMBRE_METRICA: Record<MetricKey, string> = {
  temperature: 'Temperatura',
  humidity: 'Humedad',
  light: 'Iluminación',
}

export function nivelAlertaPara(metrica: MetricKey, lectura: SensorReading): AlertLevel {
  if (metrica === 'temperature') {
    const { min, max, peligro } = UMBRALES.temperature
    if (lectura.temperature > peligro) return 'danger'
    if (lectura.temperature < min || lectura.temperature > max) return 'warn'
    return 'ok'
  }
  if (metrica === 'humidity') {
    const { min, max } = UMBRALES.humidity
    if (lectura.humidity < min || lectura.humidity > max) return 'warn'
    return 'ok'
  }
  return lectura.light ? 'ok' : 'danger'
}

/** Texto descriptivo que se muestra debajo de cada métrica según su estado. */
export function mensajeEstado(metrica: MetricKey, lectura: SensorReading): string {
  const nivel = nivelAlertaPara(metrica, lectura)
  if (nivel === 'ok') return 'Condiciones ideales para estudiar'

  if (metrica === 'temperature') {
    if (nivel === 'danger') return 'Temperatura peligrosa, ventila el salón de inmediato'
    return lectura.temperature > UMBRALES.temperature.max
      ? 'La temperatura está alta, considera ventilar'
      : 'La temperatura está baja, considera cerrar ventanas'
  }
  if (metrica === 'humidity') {
    return lectura.humidity > UMBRALES.humidity.max
      ? 'La humedad está alta, considera ventilar'
      : 'La humedad está baja, el ambiente está seco'
  }
  return 'El salón está oscuro, enciende las luces'
}

/** Texto de la alerta corta que aparece en las cards fuera de rango, con la ubicación del nodo. */
export function alertaConUbicacion(nivel: AlertLevel): string | null {
  if (nivel === 'warn') return `Atención en ${UBICACION_NODO}`
  if (nivel === 'danger') return `Peligro en ${UBICACION_NODO}`
  return null
}

/** Texto explicativo del tooltip al pasar el mouse sobre el estado. */
export function textoAyudaEstado(metrica: MetricKey, nivel: AlertLevel): string {
  if (metrica === 'temperature') {
    if (nivel === 'ok') return 'Óptimo significa que está dentro del rango de confort (18-25°C)'
    if (nivel === 'danger') return 'Peligroso: la temperatura supera los 33°C'
    return 'Fuera del rango de confort de 18-25°C'
  }
  if (metrica === 'humidity') {
    return nivel === 'ok'
      ? 'Óptimo significa que está dentro del rango de confort (40-70%)'
      : 'Fuera del rango de confort de 40-70%'
  }
  return nivel === 'ok'
    ? 'Óptimo significa que el sensor LDR detecta luz'
    : 'Peligroso: el sensor LDR no detecta luz'
}

/** Nivel más grave entre las tres métricas de una lectura. */
export function nivelGeneral(lectura: SensorReading): AlertLevel {
  const metricas: MetricKey[] = ['temperature', 'humidity', 'light']
  const niveles = metricas.map((metrica) => nivelAlertaPara(metrica, lectura))
  if (niveles.includes('danger')) return 'danger'
  if (niveles.includes('warn')) return 'warn'
  return 'ok'
}

/** Genera notificaciones a partir de las métricas que están fuera de rango. */
export function generarNotificaciones(lectura: SensorReading | null): Notification[] {
  if (!lectura) return []
  const metricas: MetricKey[] = ['temperature', 'humidity', 'light']

  return metricas
    .filter((metrica) => nivelAlertaPara(metrica, lectura) !== 'ok')
    .map((metrica) => ({
      id: `${metrica}-${lectura.timestamp}`,
      source: metrica,
      title: NOMBRE_METRICA[metrica],
      message: `${mensajeEstado(metrica, lectura)} · ${UBICACION_NODO}`,
      level: nivelAlertaPara(metrica, lectura),
      timestamp: lectura.timestamp,
    }))
}

/**
 * Compara dos lecturas seguidas y devuelve los cambios que merecen aviso: la luz se encendió
 * o se apagó, o la temperatura/humedad salieron de su rango.
 */
export function detectarEventos(anterior: SensorReading, actual: SensorReading): Notification[] {
  const eventos: Notification[] = []
  const comun = { timestamp: actual.timestamp }

  if (!anterior.light && actual.light) {
    eventos.push({
      ...comun,
      id: `light-on-${actual.timestamp}`,
      source: 'light',
      title: 'Se encendió la luz',
      message: `El sensor LDR detectó luz en ${UBICACION_NODO}`,
      level: 'ok',
    })
  }
  if (anterior.light && !actual.light) {
    eventos.push({
      ...comun,
      id: `light-off-${actual.timestamp}`,
      source: 'light',
      title: 'El salón quedó a oscuras',
      message: `Enciende las luces · ${UBICACION_NODO}`,
      level: 'danger',
    })
  }

  for (const metrica of ['temperature', 'humidity'] as const) {
    const antes = nivelAlertaPara(metrica, anterior)
    const ahora = nivelAlertaPara(metrica, actual)
    if (ahora === antes || ahora === 'ok') continue
    eventos.push({
      ...comun,
      id: `${metrica}-${ahora}-${actual.timestamp}`,
      source: metrica,
      title: `${NOMBRE_METRICA[metrica]} ${ahora === 'danger' ? 'en nivel peligroso' : 'fuera del rango óptimo'}`,
      message: `${mensajeEstado(metrica, actual)} · ${UBICACION_NODO}`,
      level: ahora,
    })
  }

  return eventos
}
