import type { HourlyPoint, RangeSummary, SensorReading, TimeRange } from '../types/sensor'

async function obtenerJson<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(ruta)
  if (!respuesta.ok) {
    throw new Error(`Error ${respuesta.status} al consultar ${ruta}`)
  }
  return respuesta.json() as Promise<T>
}

export function obtenerLecturasRecientes(limite = 30): Promise<SensorReading[]> {
  return obtenerJson(`/api/lecturas/recientes?limite=${limite}`)
}

export function obtenerHistorial(rango: TimeRange): Promise<SensorReading[]> {
  return obtenerJson(`/api/lecturas/historial?rango=${rango}`)
}

export function obtenerResumen(rango: TimeRange): Promise<RangeSummary> {
  return obtenerJson(`/api/lecturas/resumen?rango=${rango}`)
}

export function obtenerPorHora(): Promise<HourlyPoint[]> {
  return obtenerJson('/api/lecturas/por-hora')
}
