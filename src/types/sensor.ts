export type AlertLevel = 'ok' | 'warn' | 'danger'

export type MetricKey = 'temperature' | 'humidity' | 'light'

export interface SensorReading {
  timestamp: string
  temperature: number
  humidity: number
  light: boolean
  /** Solo en el historial: proporción (0 a 1) de lecturas con luz dentro del grupo. */
  lightRatio?: number
  status?: string
}

export type TimeRange = '24h' | '7d' | '30d'

export interface MetricSummary {
  average: number
  min: number
  max: number
  optimalRatio: number
}

export interface PeriodSummary {
  temperature: MetricSummary
  humidity: MetricSummary
  light: { ratio: number }
}

export interface RangeSummary {
  current: PeriodSummary | null
  previous: PeriodSummary | null
}

export interface HourlyValues {
  temperature: number
  humidity: number
}

export interface HourlyPoint {
  hour: number
  today: HourlyValues | null
  yesterday: HourlyValues | null
}

export interface NodeStatus {
  connected: boolean
  lastUpdate: string | null
  nodeName: string
  location: string
  status: string | null
}

export interface Notification {
  id: string
  /** Qué la originó (luz, temperatura o humedad), para no repetir avisos de lo mismo muy seguido. */
  source: MetricKey
  title: string
  message: string
  level: AlertLevel
  timestamp: string
}
