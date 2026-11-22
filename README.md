# ECO UAO — Dashboard (frontend)

Interfaz web del sistema **ECO UAO**, monitoreo ambiental con computación física
(Universidad Autónoma de Occidente, Cali). Muestra temperatura, humedad e iluminación
medidas por un ESP32 con sensores DHT22 y LDR.

Este repositorio contiene **solo el frontend**: React + TypeScript + Vite + Tailwind CSS.
Los datos los entrega el backend del proyecto a través de una API REST.

## Cómo ejecutarlo

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`. El backend debe estar corriendo al mismo tiempo.

## Conexión con el backend

Las peticiones a `/api/...` se redirigen al backend configurado en `vite.config.ts`
(por defecto `http://localhost:3000`). Si el backend corre en otro puerto o computador,
solo hay que cambiar esa dirección.

Todas las llamadas están en `src/data/api.ts`. Si el backend usa otras rutas o nombres de
campos, ese es el único archivo que hay que adaptar.

### Rutas que usa el dashboard

| Ruta | Para qué | Respuesta |
| ---- | -------- | --------- |
| `GET /api/lecturas/recientes?limite=30` | Monitoreo en vivo (se consulta cada 2 s) | Lista de lecturas, de la más vieja a la más nueva |
| `GET /api/lecturas/historial?rango=24h\|7d\|30d` | Gráfica y tabla del historial | Lista de promedios por intervalo |
| `GET /api/lecturas/resumen?rango=24h\|7d\|30d` | Promedios, mínimos, máximos y % en rango | Resumen del periodo actual y del anterior |
| `GET /api/lecturas/por-hora` | Comparación hoy vs ayer | 24 elementos, uno por hora |

### Formato de los datos

Lectura (`recientes` e `historial`):

```json
{
  "timestamp": "2026-11-09T21:55:38.966Z",
  "temperature": 24.6,
  "humidity": 52.0,
  "light": true,
  "status": "OPTIMO",
  "lightRatio": 0.83
}
```

- `status` es el estado que calcula el ESP32 (`OPTIMO`, `ACEPTABLE`, `PELIGROSO!`). Opcional.
- `lightRatio` solo en `historial`: proporción de lecturas con luz dentro del intervalo. Opcional.

Resumen (`resumen`); `current` o `previous` son `null` si no hay datos en ese periodo:

```json
{
  "current": {
    "temperature": { "average": 22.0, "min": 17.6, "max": 26.5, "optimalRatio": 0.66 },
    "humidity": { "average": 55.2, "min": 45.7, "max": 64.4, "optimalRatio": 1 },
    "light": { "ratio": 0.43 }
  },
  "previous": null
}
```

Por hora (`por-hora`); `today` o `yesterday` son `null` en horas sin datos:

```json
[{ "hour": 0, "today": { "temperature": 18.9, "humidity": 61.4 }, "yesterday": null }]
```

Los tipos completos están en `src/types/sensor.ts`.

## Funciones

- **Inicio:** estado del salón, indicadores, comparación por hora hoy vs ayer, últimas
  lecturas y componentes del circuito.
- **Monitoreo en vivo:** último minuto de lecturas con gráficas y alertas.
- **Historial:** tendencias de 24 h, 7 días o 30 días, resumen por variable y exportación a Excel.
- **Notificaciones con sonido:** avisa cuando se enciende la luz, cuando el salón queda a
  oscuras y cuando la temperatura o la humedad salen de su rango. El navegador solo permite
  el sonido después de hacer clic una vez en la página.

## Rangos de referencia

Son los mismos que evalúa el ESP32:

| Variable    | Óptimo (azul) | Aceptable (verde)   | Peligroso (rojo) |
| ----------- | ------------- | ------------------- | ---------------- |
| Temperatura | 18 °C – 25 °C | Fuera de 18 – 25 °C | Más de 33 °C     |
| Humedad     | 40 % – 70 %   | Fuera de 40 – 70 %  | —                |
| Iluminación | Hay luz       | —                   | Oscuro           |
