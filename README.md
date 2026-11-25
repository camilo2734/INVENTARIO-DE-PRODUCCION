# Umami Fénix · Control de inventario y producción

**Aplicación web para registrar compras, producción, ventas y existencias en una pequeña fábrica de alimentos congelados.**

![React](https://img.shields.io/badge/React-TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-build-646CFF?logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-desplegada-000000?logo=vercel&logoColor=white)
![Estado](https://img.shields.io/badge/estado-en%20uso-2E7D32)

🔗 **Aplicación:** [inventario-de-produccion.vercel.app](https://inventario-de-produccion.vercel.app)

---

## Contexto

Umami Fénix es un negocio familiar que produce y vende comidas congeladas. La herramienta se diseñó para que el personal **solo digite los datos** y la aplicación lleve el control de cantidades producidas, consumos y stock.

**La aplicación está en uso en la operación diaria del negocio.**

## Qué resuelve

| Necesidad de la operación | Cómo la atiende la aplicación |
|---|---|
| Saber cuánta materia prima hay | Inventario por tipo: materia prima, masa e intermedios, rellenos y empaque |
| Descontar insumos al producir | Cada producto tiene su receta (lista de materiales); al registrar producción se descuentan los insumos correspondientes |
| Producir masa con una fórmula estándar | Receta base de masa escalable según la cantidad a producir |
| Evitar quedarse sin insumos | Alertas cuando un insumo baja de su nivel mínimo |
| Registrar ventas | Las ventas descuentan producto terminado; una venta eliminada devuelve el stock |
| Cargar compras rápido | Lectura de facturas de compra a partir de una foto, con apoyo de IA (Gemini) |
| Ver el estado del negocio | Panel de resumen con indicadores de inventario, producción y ventas |

## Módulos

- **Resumen del negocio:** panel con los indicadores principales.
- **Inventario:** existencias, compras y movimientos (entradas, salidas y consumo por producción).
- **Centro de producción:** registro de lotes y consumo automático de insumos según receta.
- **Catálogo y recetas:** productos, precios y receta por unidad.
- **Ventas:** registro e historial reciente.
- **Alertas de inventario:** insumos por debajo del mínimo.

## Conceptos de Ingeniería Industrial aplicados

- Lista de materiales (BOM) y explosión de materiales para el consumo por producción.
- Control de inventarios con punto mínimo de reorden.
- Trazabilidad de movimientos de inventario (entradas, salidas, producción).
- Estandarización de la fórmula de un producto intermedio (masa).

## Estructura del proyecto

```
App.tsx                 navegación y estructura general
components/Layout.tsx   diseño de la interfaz
pages/                  Dashboard, Inventory, Production, Recipes, Sales, Alerts
services/
  storageService.ts     almacenamiento de datos y datos de ejemplo
  geminiService.ts      lectura de facturas con IA
types.ts                modelo de datos (insumos, productos, recetas, ventas, movimientos)
```

## Ejecución local

Requisitos: Node.js 18 o superior.

```bash
npm install
npm run dev
```

Para la lectura de facturas con IA, crear un archivo `.env.local` con la variable `GEMINI_API_KEY`. El resto de la aplicación funciona sin ella.

## Limitaciones conocidas

- Los datos se guardan en el almacenamiento local del navegador (`localStorage`): cada equipo conserva su propia información y no hay sincronización entre dispositivos.
- Los datos de ejemplo del repositorio son ilustrativos.

## Autoría

Diseño y desarrollo: **Camilo Andrés Henríquez Noguera**, estudiante de Ingeniería Industrial de la Universidad del Magdalena. Aplicación creada con apoyo de Google AI Studio.
