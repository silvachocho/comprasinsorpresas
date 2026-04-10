# CompraSinSorpresas — Análisis Funcional

## Propósito
Herramienta web de uso libre para ayudar a compradores de vivienda en Uruguay a estimar todos los costos involucrados en una operación de compraventa — más allá del precio publicado.

---

## Flujo del usuario

1. El usuario ingresa el **precio de la propiedad** (en USD)
2. Indica si **financia con banco** (toggle Sí/No)
   - Si sí: elige el banco y define el préstamo en modo *automático* (80% del precio) o *manual*
3. Indica si **interviene una inmobiliaria** (toggle Sí/No)
4. Presiona **"Calcular costos"**
5. Ve el panel de resultados con desglose completo
6. Opcionalmente ingresa el **valor catastral** para recalcular el ITP
7. Opcionalmente usa el **comparador de alquiler** (proyección a 10 años)
8. Puede volver al formulario con **"Recalcular"**

---

## Outputs que genera

| Concepto | Tasa/Cálculo |
|---|---|
| ITP | 1,5% del precio (o 2% del catastral si se ingresa) |
| Comisión inmobiliaria | 3% + IVA 22% → ~3,66% efectivo |
| Honorarios de escribano | 3% del precio |
| Aportes notariales | 0,7% del precio |
| Gastos registrales | USD 800 fijo |
| Gastos bancarios | Variables por banco (ver tabla abajo) |

### Gastos bancarios por banco

| Banco | Tipo | Tasa variable | Fijo |
|---|---|---|---|
| BHU | Real (cargo fijo) | — | USD 800 |
| BROU | Estimado | 1,2% del préstamo | USD 800 |
| Santander, Itaú, BBVA | Estimado | 1,5% del préstamo | USD 800 |
| Otro | Estimado | 1,4% del préstamo | USD 800 |

---

## Resumen de resultados que se muestra

- **Bloque principal**: dinero total necesario + % sobre el precio
- **Summary grid**: precio, préstamo (si aplica), dinero propio, gastos totales
- **Desglose línea a línea** de cada costo
- **Costo total** de la operación (precio + gastos)
- **Nota aclaratoria sobre ITP y valor catastral**
- **Comparador de alquiler** (cálculo simple a 10 años)

---

## Funcionalidad de leads (en desarrollo)

El botón "Ver comparador completo" registra un evento de Analytics y muestra un aviso de "te avisaremos". Es un **mecanismo de validación de interés**, no una funcionalidad real.

---

## Métricas registradas con Google Analytics

| Evento | Cuándo se dispara |
|---|---|
| `simulacion_realizada` | Al presionar "Calcular costos" |
| `uso_calculadora_alquiler` | Al presionar "Calcular" en el comparador |
| `click_ver_comparador` | Al presionar "Ver comparador completo" |
