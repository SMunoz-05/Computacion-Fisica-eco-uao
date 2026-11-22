import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon } from '@hugeicons/core-free-icons'
import BarraLateral, { type SectionId } from './components/BarraLateral'
import Encabezado from './components/Encabezado'
import SinDatos from './components/SinDatos'
import HojasDecorativas from './components/HojasDecorativas'
import SeccionInicio from './sections/SeccionInicio'
import SeccionMonitoreo from './sections/SeccionMonitoreo'
import SeccionHistorial from './sections/SeccionHistorial'
import { badge, badgeOutline, buttonMd, cx, secondaryButton, text3, typeCaption } from './components/estilos'
import { obtenerHistorial, obtenerLecturasRecientes, obtenerPorHora, obtenerResumen } from './data/api'
import { UBICACION_NODO, detectarEventos, generarNotificaciones } from './data/estados'
import { prepararSonido, reproducirAlerta } from './utils/sonido'
import { exportarExcel } from './utils/exportarExcel'
import type { AlertLevel, HourlyPoint, NodeStatus, Notification, RangeSummary, SensorReading, TimeRange } from './types/sensor'

const INTERVALO_EN_VIVO_MS = 2000
const INTERVALO_HISTORIAL_MS = 60000
// El ESP32 envía cada 2 s; si pasan más de 10 s sin datos se considera desconectado.
const TIEMPO_SIN_DATOS_MS = 10000
// Evita que un valor que oscila justo en el límite dispare un aviso (y un sonido) cada 2 s.
const ESPERA_ENTRE_AVISOS_MS = 30000
const MAXIMO_EVENTOS = 20
const CLAVE_SONIDO = 'ecouao-sonido'

const NOMBRE_SECCION: Record<SectionId, string> = {
  inicio: 'Inicio',
  monitoreo: 'Monitoreo en vivo',
  historial: 'Historial',
}

const GRAVEDAD: Record<AlertLevel, number> = { ok: 0, warn: 1, danger: 2 }

function leerPreferenciaSonido() {
  try {
    return localStorage.getItem(CLAVE_SONIDO) !== 'apagado'
  } catch {
    return true
  }
}

function guardarPreferenciaSonido(activo: boolean) {
  try {
    localStorage.setItem(CLAVE_SONIDO, activo ? 'activado' : 'apagado')
  } catch {
    // Sin almacenamiento disponible: la preferencia solo dura mientras la página esté abierta.
  }
}

const nombreArchivo = (detalle: string) => `ecouao-${detalle}-${new Date().toISOString().slice(0, 10)}.xlsx`

export default function App() {
  const [serieEnVivo, setSerieEnVivo] = useState<SensorReading[]>([])
  const [servidorCaido, setServidorCaido] = useState(false)
  const [ultimaConsulta, setUltimaConsulta] = useState(Date.now())
  const [rangoHistorial, setRangoHistorial] = useState<TimeRange>('24h')
  const [serieHistorial, setSerieHistorial] = useState<SensorReading[]>([])
  const [resumen, setResumen] = useState<RangeSummary | null>(null)
  const [resumenHoy, setResumenHoy] = useState<RangeSummary | null>(null)
  const [porHora, setPorHora] = useState<HourlyPoint[]>([])
  const [seccionActiva, setSeccionActiva] = useState<SectionId>('inicio')
  const [sidebarAbierto, setSidebarAbierto] = useState(false)
  const [eventos, setEventos] = useState<Notification[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [sonidoActivo, setSonidoActivo] = useState(leerPreferenciaSonido)

  const mainRef = useRef<HTMLElement>(null)
  const ultimaProcesada = useRef<string | null>(null)
  const ultimoAviso = useRef<Record<string, number>>({})

  // El navegador solo permite sonido después de la primera interacción con la página.
  useEffect(() => {
    const habilitar = () => prepararSonido()
    window.addEventListener('pointerdown', habilitar, { once: true })
    window.addEventListener('keydown', habilitar, { once: true })
    return () => {
      window.removeEventListener('pointerdown', habilitar)
      window.removeEventListener('keydown', habilitar)
    }
  }, [])

  // Revisa las lecturas nuevas y genera avisos cuando algo cambia (ej. se enciende la luz).
  useEffect(() => {
    if (serieEnVivo.length === 0) return
    const ultimaLectura = serieEnVivo[serieEnVivo.length - 1]
    // En la primera carga no se avisa de cambios viejos, solo de los que pasen desde ahora.
    if (ultimaProcesada.current === null) {
      ultimaProcesada.current = ultimaLectura.timestamp
      return
    }

    const nuevos: Notification[] = []
    serieEnVivo.forEach((lectura, i) => {
      if (i === 0 || lectura.timestamp <= ultimaProcesada.current!) return
      for (const evento of detectarEventos(serieEnVivo[i - 1], lectura)) {
        // La espera es por tipo de aviso (ej. "se encendió la luz" y "quedó a oscuras" son distintos)
        const clave = `${evento.source}-${evento.level}`
        const momento = new Date(lectura.timestamp).getTime()
        if (momento - (ultimoAviso.current[clave] ?? 0) < ESPERA_ENTRE_AVISOS_MS) continue
        ultimoAviso.current[clave] = momento
        nuevos.push(evento)
      }
    })
    ultimaProcesada.current = ultimaLectura.timestamp
    if (nuevos.length === 0) return

    setEventos((previos) => [...nuevos.reverse(), ...previos].slice(0, MAXIMO_EVENTOS))
    setNoLeidas((n) => n + nuevos.length)
    if (sonidoActivo) {
      const peor = nuevos.reduce((a, b) => (GRAVEDAD[b.level] > GRAVEDAD[a.level] ? b : a))
      reproducirAlerta(peor.level)
    }
  }, [serieEnVivo, sonidoActivo])

  const alternarSonido = () => {
    prepararSonido()
    setSonidoActivo((activo) => {
      guardarPreferenciaSonido(!activo)
      return !activo
    })
  }

  const consultarEnVivo = useCallback(() => {
    obtenerLecturasRecientes()
      .then((lecturas) => {
        setSerieEnVivo(lecturas)
        setServidorCaido(false)
      })
      .catch(() => setServidorCaido(true))
      .finally(() => setUltimaConsulta(Date.now()))
  }, [])

  const consultarResumenDelDia = useCallback(() => {
    obtenerPorHora()
      .then(setPorHora)
      .catch(() => setPorHora([]))
    obtenerResumen('24h')
      .then(setResumenHoy)
      .catch(() => setResumenHoy(null))
  }, [])

  useEffect(() => {
    consultarEnVivo()
    const intervalo = setInterval(consultarEnVivo, INTERVALO_EN_VIVO_MS)
    return () => clearInterval(intervalo)
  }, [consultarEnVivo])

  useEffect(() => {
    if (seccionActiva === 'monitoreo') return
    consultarResumenDelDia()
    const intervalo = setInterval(consultarResumenDelDia, INTERVALO_HISTORIAL_MS)
    return () => clearInterval(intervalo)
  }, [seccionActiva, consultarResumenDelDia])

  useEffect(() => {
    if (seccionActiva !== 'historial') return
    const consultar = () => {
      obtenerHistorial(rangoHistorial)
        .then(setSerieHistorial)
        .catch(() => setSerieHistorial([]))
      obtenerResumen(rangoHistorial)
        .then(setResumen)
        .catch(() => setResumen(null))
    }
    consultar()
    const intervalo = setInterval(consultar, INTERVALO_HISTORIAL_MS)
    return () => clearInterval(intervalo)
  }, [rangoHistorial, seccionActiva])

  const ultima = serieEnVivo.length ? serieEnVivo[serieEnVivo.length - 1] : null
  const notificaciones = useMemo(() => generarNotificaciones(ultima), [ultima])

  const estadoNodo: NodeStatus = {
    connected: ultima !== null && ultimaConsulta - new Date(ultima.timestamp).getTime() < TIEMPO_SIN_DATOS_MS,
    lastUpdate: ultima?.timestamp ?? null,
    nodeName: 'ESP32 · Nodo 01',
    location: UBICACION_NODO,
    status: ultima?.status ?? null,
  }

  const handleNavegar = (id: SectionId) => {
    setSeccionActiva(id)
    setSidebarAbierto(false)
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const exportarUltimas24h = () => {
    obtenerHistorial('24h')
      .then((filas) => exportarExcel(filas, nombreArchivo('ultimas-24h')))
      .catch(() => setServidorCaido(true))
  }

  const avisoSinDatos = servidorCaido ? (
    <SinDatos
      title="No hay conexión con el servidor"
      message="Verifica que el backend del proyecto esté corriendo y recarga la página."
    />
  ) : (
    <SinDatos
      title="Esperando datos del ESP32"
      message={`Verifica que el nodo de ${UBICACION_NODO} esté encendido y conectado a la misma red Wi-Fi que el servidor.`}
    />
  )

  const accionesInicio = (
    <>
      <span className={cx(badge, badgeOutline, 'h-8 px-2.5 max-lg:hidden')}>Últimas 24 horas</span>
      <button
        type="button"
        onClick={exportarUltimas24h}
        disabled={!ultima}
        className={cx(secondaryButton, buttonMd, 'max-sm:px-2.5')}
      >
        <HugeiconsIcon icon={Download04Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
        <span className="max-sm:sr-only">Exportar Excel</span>
      </button>
    </>
  )

  return (
    <div className="flex min-h-screen bg-white">
      <HojasDecorativas />
      <BarraLateral
        active={seccionActiva}
        onNavigate={handleNavegar}
        open={sidebarAbierto}
        onClose={() => setSidebarAbierto(false)}
        alertCount={notificaciones.length}
        nodeConnected={estadoNodo.connected}
        nodeName={estadoNodo.nodeName}
        nodeLocation={estadoNodo.location}
      />

      <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col">
        <Encabezado
          section={NOMBRE_SECCION[seccionActiva]}
          onMenuClick={() => setSidebarAbierto(true)}
          onNavigate={handleNavegar}
          activeAlerts={notificaciones}
          events={eventos}
          unreadCount={noLeidas}
          onOpenNotifications={() => setNoLeidas(0)}
          soundOn={sonidoActivo}
          onToggleSound={alternarSonido}
          actions={seccionActiva === 'inicio' ? accionesInicio : undefined}
        />

        <main ref={mainRef} className="flex flex-1 flex-col gap-8 overflow-y-auto px-4 pb-6 pt-5 sm:px-6">
          {seccionActiva === 'inicio' &&
            (ultima ? (
              <SeccionInicio
                latest={ultima}
                series={serieEnVivo}
                nodeStatus={estadoNodo}
                hourly={porHora}
                summary={resumenHoy}
                onNavigate={handleNavegar}
                onRefresh={() => {
                  consultarEnVivo()
                  consultarResumenDelDia()
                }}
              />
            ) : (
              avisoSinDatos
            ))}
          {seccionActiva === 'monitoreo' &&
            (ultima ? (
              <SeccionMonitoreo series={serieEnVivo} latest={ultima} connected={estadoNodo.connected} />
            ) : (
              avisoSinDatos
            ))}
          {seccionActiva === 'historial' && (
            <SeccionHistorial
              series={serieHistorial}
              summary={resumen}
              hourly={porHora}
              range={rangoHistorial}
              onRangeChange={setRangoHistorial}
              onExport={() => void exportarExcel(serieHistorial, nombreArchivo(`historial-${rangoHistorial}`))}
            />
          )}

          <footer className={cx(typeCaption, text3, 'mt-auto text-center')}>
            ECO UAO · Universidad Autónoma de Occidente · Cali, Colombia
          </footer>
        </main>
      </div>
    </div>
  )
}
