import type { Column } from 'write-excel-file/browser'
import { nivelGeneral } from '../data/estados'
import type { SensorReading } from '../types/sensor'

const ETIQUETA_ESTADO = { ok: 'Óptimo', warn: 'Aceptable', danger: 'Peligroso' } as const

// Excel guarda las fechas sin zona horaria. Se pasan los componentes de la hora local como si
// fueran UTC para que en el archivo aparezca la misma hora que se ve en el dashboard.
function fechaLocal(iso: string) {
  const d = new Date(iso)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()))
}

const encabezado = (texto: string) => ({
  value: texto,
  fontWeight: 'bold' as const,
  backgroundColor: '#EAF5D3',
  bottomBorderStyle: 'thin' as const,
  bottomBorderColor: '#7CB342',
})

/** Descarga las lecturas como un archivo de Excel (.xlsx). */
export async function exportarExcel(filas: SensorReading[], nombreArchivo: string) {
  // Se carga solo al exportar para no hacer más pesada la página.
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const sonPromedios = filas.some((r) => r.lightRatio !== undefined)

  const columnas: Column<SensorReading>[] = [
    {
      header: encabezado('Fecha y hora'),
      width: 20,
      cell: (r) => ({ value: fechaLocal(r.timestamp), type: Date, format: 'dd/mm/yyyy hh:mm:ss' }),
    },
    { header: encabezado('Temperatura (°C)'), width: 17, cell: (r) => ({ value: r.temperature, type: Number, format: '0.0' }) },
    { header: encabezado('Humedad (%)'), width: 13, cell: (r) => ({ value: r.humidity, type: Number, format: '0.0' }) },
    sonPromedios
      ? {
          header: encabezado('Tiempo con luz (%)'),
          width: 18,
          cell: (r) => ({ value: Math.round((r.lightRatio ?? 0) * 100), type: Number }),
        }
      : { header: encabezado('Luz'), width: 10, cell: (r) => (r.light ? 'Luz' : 'Oscuro') },
    { header: encabezado('Estado'), width: 12, cell: (r) => ETIQUETA_ESTADO[nivelGeneral(r)] },
  ]

  await writeXlsxFile(filas, { columns: columnas, sheet: 'Lecturas', stickyRowsCount: 1 }).toFile(nombreArchivo)
}
