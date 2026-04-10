# Plan de mejoras — CompraSinSorpresas

> Generado: 2026-04-01
> Etapa: Producto real en crecimiento

---

## Contexto

Superada la fase MVP, el simulador funciona y tiene usuarios reales.
El foco ahora es aumentar la utilidad, claridad y medición del comportamiento real.

Todas las mejoras deben:
- Mantener `computeBreakdown()` como base del cálculo
- No romper el diseño ni la estructura actual
- Ser conservadoras e implementables de forma aislada

---

## Mejoras priorizadas

### 1. Ampliar eventos de Google Analytics
**Estado:** pendiente
**Esfuerzo:** bajo
**Archivos:** `app.js`

Actualmente solo se trackean 3 eventos: `simulacion_realizada`, `uso_calculadora_alquiler`, `click_ver_comparador`.

Agregar:
- Evento cuando el usuario activa el banco
- Evento cuando el usuario activa la inmobiliaria
- Evento cuando el usuario ingresa valor catastral
- Evento cuando el usuario usa el comparador de alquiler con parámetros completos

**Por qué:** sin estos eventos no se puede segmentar el comportamiento real ni entender qué features usan los usuarios.

---

### 2. Botón "Copiar resultado"
**Estado:** pendiente
**Esfuerzo:** bajo
**Archivos:** `app.js`, `index.html`

Agregar un botón al final del resultado que copie el resumen de costos al portapapeles (texto plano).

**Por qué:** el usuario llega a un resultado valioso y no tiene forma de guardarlo ni compartirlo. Aumenta retención y difusión orgánica.

---

### 3. Validación inline en campo precio
**Estado:** pendiente
**Esfuerzo:** bajo
**Archivos:** `app.js`, `index.html`

Reemplazar el `alert()` de validación del campo precio por un mensaje de error inline debajo del campo.

**Por qué:** el `alert()` es disruptivo en mobile y percibido como anticuado. Afecta la experiencia en el uso principal (mobile).

---

### 4. Texto introductorio antes del formulario
**Estado:** pendiente
**Esfuerzo:** bajo
**Archivos:** `index.html`

Agregar 2 líneas de contexto antes del formulario explicando qué calcula la herramienta y por qué vale la pena completarla.

**Por qué:** hoy no hay texto que prepare al usuario antes de ingresar datos. Aumenta conversión y confianza.

---

### 5. Horizonte variable en comparador de alquiler
**Estado:** pendiente
**Esfuerzo:** bajo
**Archivos:** `app.js`, `index.html`

Agregar un selector simple con opciones: 5 / 10 / 15 / 20 años.
Hoy el comparador calcula fijo a 10 años.

**Por qué:** el resultado es más útil y personalizable. El cambio es aislado y no toca `computeBreakdown()`.

---

### 6. Toggle "¿Ya tenés escribano?" con monto manual
**Estado:** pendiente
**Esfuerzo:** medio
**Archivos:** `app.js`, `index.html`

Agregar un toggle opcional que permita al usuario ingresar el honorario de escribano acordado directamente, en lugar del valor estimado.

**Por qué:** muchos usuarios traen escribano propio a precio cerrado. Esta opción mejora la precisión del cálculo para ese caso.

**Precaución:** verificar que el campo conviva bien con el bloque de valor catastral ya existente.

---

## Riesgos generales

- El campo catastral se inyecta dinámicamente en el DOM. Cambios en la estructura del resultado pueden romperlo.
- El comparador de alquiler tiene un texto "próximamente" visible. Revisar si sigue siendo correcto o si confunde al usuario.

---

## Orden de ejecución sugerido

1. Validación inline (mejora UX inmediata, bajo riesgo)
2. Texto introductorio (copy puro, cero riesgo)
3. Ampliar analytics (invisible para el usuario, alto valor de datos)
4. Botón copiar resultado (bajo riesgo, alto valor para el usuario)
5. Horizonte variable en comparador
6. Toggle escribano propio

---

## Agentes involucrados

| Rol | Responsabilidad |
|-----|----------------|
| Project Manager | Priorización y dirección |
| Dev | Implementación de cambios en `app.js` / `index.html` |
| QA | Validación de cada mejora en mobile y desktop |
| UX/Product | Revisión de textos y flujo de usuario |
| Analista | Definición funcional de mejoras complejas (ej. toggle escribano) |
