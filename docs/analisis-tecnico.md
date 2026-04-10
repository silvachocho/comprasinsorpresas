# CompraSinSorpresas — Análisis Técnico

## Stack

- **HTML5** — estructura semántica plana (un solo archivo `index.html`)
- **CSS puro** — `styles.css`, ~880 líneas, con design tokens en `:root`
- **JavaScript vanilla** — `app.js`, ~530 líneas, sin frameworks ni dependencias externas
- **Google Fonts** — Playfair Display (display) + DM Sans (body)
- **Google Analytics** — integrado como `gtag` global (referenciado pero no incluido en el repo, se inyecta desde el HTML de producción)

---

## Arquitectura del JS (`app.js`)

```
CONFIGURACIÓN
  ├── TASAS_COMPRA      — tasas fijas del sistema (ITP, comisiones, etc.)
  ├── BANCOS            — catálogo de bancos con tipo y tasa
  └── NOTAS_BANCO       — textos aclaratorios por tipo de banco

ESTADO
  ├── state             — objeto mutable: usaBanco, usaInmobiliaria, modoPrestamo
  └── _lastBreakdown    — contexto del último cálculo (para recálculo catastral)

CÁLCULO
  └── computeBreakdown()  — función pura central, recibe parámetros, retorna objeto con todos los valores

VALIDACIÓN
  └── validar()           — valida inputs antes de calcular

RENDER
  ├── renderResults()              — renderiza el panel de resultados inyectando HTML dinámicamente
  └── recalcularConCatastral()     — recálculo parcial del ITP sin volver a calcular todo

ORQUESTACIÓN
  └── calcular()          — lee inputs, resuelve préstamo, llama validate → computeBreakdown → renderResults

UI
  ├── setupToggle()                   — inicializa los botones de toggle (banco, inmobiliaria)
  └── actualizarUIModoPrestamo()      — controla visibilidad del bloque auto/manual
```

---

## Función central: `computeBreakdown()`

Es una **función pura** que recibe `{ P, L, bancoClave, usaBanco, usaInmobiliaria }` y retorna un objeto con todos los valores calculados. No tiene side effects. Es la base que no debe modificarse sin pedido explícito.

---

## Estado de la UI

El formulario y los resultados son **mutuamente excluyentes** — se alternan con `display:none/block`. No hay routing ni estados complejos.

---

## CSS: design system

Paleta definida en variables CSS:

| Variable | Valor | Uso |
|---|---|---|
| `--navy` | #1a2340 | Color principal |
| `--sand` | #f5f0e8 | Fondo |
| `--terracotta` | #c0603a | Acento / CTA |

Dos tipografías: **Playfair Display** (headings) + **DM Sans** (body).
Responsive básico con breakpoints en 480px y 520px.

---

## Limitaciones conocidas / deuda técnica

| Ítem | Descripción |
|---|---|
| Sin persistencia | Nada se guarda; al recargar se pierde todo |
| Sin backend | Todo el cálculo es client-side con tasas hardcodeadas |
| Tasas hardcodeadas | Si cambian los aranceles legales, hay que editar el JS a mano |
| Catastral inyectado en DOM | El input de valor catastral se inserta dinámicamente en el `result-label` del ITP al calcular, no existe en el HTML base |
| Comparador alquiler incompleto | Es un feature stub — solo proyecta a 10 años sin considerar variación de precios ni costos de oportunidad |
| BHU y modo auto | BHU tiene costo fijo (no usa tasa sobre préstamo), pero `L` sí impacta en "dinero propio necesario" |
| Google Analytics sin fallback | Si `gtag` no carga, los eventos no se disparan pero la app sigue funcionando |

---

## Fortalezas técnicas para un MVP

- Cero dependencias externas de runtime
- Deploy trivial (HTML+CSS+JS estático)
- Código legible y bien organizado en secciones comentadas
- Función de cálculo aislada y testeable
- Buen manejo de edge cases en validaciones
