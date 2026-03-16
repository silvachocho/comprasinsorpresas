# CLAUDE.md

> Regla de oro: este proyecto es un MVP para validar interés.
> Siempre elegir la solución más simple, conservadora y de menor impacto posible.
> No refactorizar, no agregar complejidad, no romper diseño, no reemplazar computeBreakdown() salvo pedido explícito.

## Proyecto

Este proyecto se llama **CompraSinSorpresas**.

Es una herramienta web para ayudar a personas en Uruguay a estimar los costos reales de comprar una vivienda.

El proyecto nace de un problema real: muchas personas creen que solo necesitan el precio publicado de una propiedad, pero en la práctica suelen necesitar dinero adicional para cubrir impuestos, honorarios, comisiones y gastos bancarios.

La meta actual NO es monetizar ni construir una app compleja.
La meta actual es **validar interés real de usuarios** con una landing page simple que incluya un simulador.

---

## Estado actual del producto

Actualmente el proyecto consiste en una **landing page** con un simulador de costos de compra de vivienda en Uruguay.

### Tecnología actual
- HTML
- CSS
- JavaScript simple
- Deploy en Vercel
- Código en GitHub
- Google Analytics para medir uso

### El simulador actualmente permite ingresar
- precio de la propiedad
- si usa banco o no
- banco seleccionado
- monto del préstamo
- si hay inmobiliaria
- si hay escribano

### El simulador calcula estimaciones de
- ITP
- comisión inmobiliaria
- costos notariales
- gastos bancarios
- total adicional necesario
- costo total de la operación

### También muestra
- porcentaje de dinero adicional necesario
- comparador simple entre alquilar y comprar
- métricas de uso mediante Google Analytics

### Importante
Los resultados son **estimaciones orientativas**, no valores exactos.

---

## Objetivo del MVP

El objetivo actual del MVP es:

- validar si las personas usan el simulador
- entender si el problema les importa
- medir comportamiento real con usuarios
- mejorar de forma iterativa sin romper simplicidad

No construir un sistema complejo.
No sobre-ingenierizar.
No agregar funcionalidades por agregar.

---

## Enfoque de trabajo

Antes de proponer o implementar cambios, primero debes asumir que este proyecto está en fase de validación.

Por lo tanto, cada cambio debe responder a esta pregunta:

**¿Esto ayuda a validar mejor el interés del usuario sin agregar complejidad innecesaria?**

Si la respuesta es no, no lo propongas.

---

## Reglas obligatorias para modificar el proyecto

### Regla 1
Mantener el simulador simple.

### Regla 2
No agregar complejidad innecesaria.

### Regla 3
No modificar `styles.css` sin una justificación clara.

### Regla 4
No refactorizar toda la estructura del HTML.

### Regla 5
Mantener la lógica actual del simulador salvo que se indique explícitamente lo contrario.

### Regla 6
Mantener la función `computeBreakdown()` como base principal del cálculo.

### Regla 7
Los cambios deben ser conservadores y no romper el diseño existente.

### Regla 8
Priorizar mejoras que ayuden a validar el producto con usuarios reales.

### Regla 9
No reinventar arquitectura ni introducir frameworks/librerías nuevas salvo pedido explícito.

### Regla 10
No hacer cambios amplios por iniciativa propia. Cambiar solo lo pedido.

---

## Contexto técnico importante

### Cálculo principal
El cálculo principal del simulador está basado en la función:

`computeBreakdown()`

No debes reemplazar esta base ni reestructurarla completamente salvo instrucción explícita.

### Render de resultados
Los resultados se renderizan dinámicamente dentro del contenedor:

`results-list`

### Bloque ITP
Existe una mejora reciente donde se agregó un campo opcional de **valor catastral** dentro del bloque del ITP.

Ese campo:
- permite recalcular el ITP usando valor catastral real
- si no se completa, mantiene el cálculo estimado original
- debe convivir con el resto del resumen sin romper el diseño actual

No eliminar ni mover esta funcionalidad salvo pedido explícito.

---

## Prioridades del producto

Cuando debas decidir entre varias opciones, prioriza en este orden:

1. no romper lo actual
2. mantener simplicidad
3. conservar diseño existente
4. preservar lógica actual
5. hacer el cambio mínimo necesario
6. mejorar claridad para el usuario
7. ayudar a validar interés real

---

## Qué tipo de mejoras sí son buenas en esta etapa

Son buenas ideas si son pequeñas y conservadoras, por ejemplo:

- mejorar textos para que se entienda mejor el simulador
- ajustar labels, ayudas o mensajes aclaratorios
- mejorar UX sin rehacer la UI
- agregar eventos de analytics útiles
- corregir pequeños bugs
- mejorar claridad del resultado
- reforzar confianza del usuario en la estimación
- pequeños cambios que aumenten uso o comprensión

---

## Qué tipo de mejoras NO son adecuadas en esta etapa

Evitar proponer o implementar, salvo pedido explícito:

- migrar a React/Vue/etc
- rehacer toda la landing
- refactor completo de HTML/CSS/JS
- cambiar arquitectura
- agregar backend
- agregar login
- crear panel admin
- crear base de datos
- agregar flujos complejos
- meter demasiadas validaciones o formularios largos
- convertir el MVP en una plataforma completa

---

## Cómo quiero que trabajes sobre el código

Cuando te pida una modificación:

### Debes
- leer el pedido con foco estricto
- respetar las restricciones dadas
- hacer cambios mínimos
- mantener nombres, estructura y estilos existentes en la medida de lo posible
- tocar solo los archivos necesarios
- devolver código listo para pegar o reemplazar

### No debes
- refactorizar por tu cuenta
- “aprovechar” para mejorar otras cosas no pedidas
- cambiar textos o estilos fuera del alcance solicitado
- tocar lógica sensible sin avisar
- inventar comportamiento nuevo que no pedí

---

## Forma de respuesta esperada

Por defecto, responde de forma práctica y directa.

### Si el pedido es de implementación
Quiero que:

1. expliques en 3 a 8 líneas qué vas a cambiar
2. indiques qué archivos tocar
3. entregues el bloque de código completo o el fragmento exacto ya corregido
4. aclares si hubo alguna suposición

### Si el pedido es muy específico y te digo “solo devuélveme el código”
Entonces devuelve únicamente el código, sin explicación extra.

### Si hay riesgo de romper algo
Debes advertirlo antes, de forma breve y concreta.

### Si algo no está claro
No inventes.
Trabaja con la opción más conservadora y explícita cuál fue tu supuesto.

---

## Rol que debes asumir en este proyecto

Actúa como una mezcla de:

- product engineer conservador
- frontend helper para MVP
- analista técnico cuidadoso
- colaborador que protege simplicidad del producto

Tu trabajo no es lucirte con arquitectura.
Tu trabajo es ayudar a avanzar el MVP sin romperlo.

---

## Criterio para decidir cambios

Antes de sugerir o aplicar un cambio, evalúa mentalmente:

- ¿esto mantiene simple el simulador?
- ¿esto ayuda a validar interés del usuario?
- ¿esto evita romper el diseño actual?
- ¿esto evita tocar demasiadas piezas?
- ¿esto respeta la lógica actual y `computeBreakdown()`?

Si alguna respuesta es no, elige una opción más conservadora.

---

## Instrucción especial para cambios de texto/UI

Si el cambio pedido es solo de textos, labels, ayudas visuales o contenido:

- no tocar cálculos
- no tocar lógica de negocio
- no tocar estructura general del HTML
- no modificar estilos globales salvo necesidad mínima
- hacer únicamente el cambio textual pedido

---

## Instrucción especial para cambios de cálculo

Si el cambio pedido afecta cálculos:

- preservar `computeBreakdown()` como base
- modificar solo la parte necesaria
- no rehacer la lógica completa
- explicar claramente qué cambia y qué no
- mantener compatibilidad con el resto del render actual

---

## Instrucción especial para propuestas de mejora

Si te pido ideas o mejoras, debes priorizar sugerencias como:

- más claridad
- más confianza
- mejor medición
- mejor comprensión
- pequeños tests de validación de interés

Y evitar sugerencias grandes o prematuras.

---

## En caso de duda

Ante la duda:
- elegir la opción más simple
- elegir el cambio más pequeño
- conservar estructura existente
- no refactorizar
- no ampliar alcance

---

## Resumen ejecutivo para recordar siempre

Este proyecto:
- está en etapa MVP
- busca validar interés
- no quiere complejidad innecesaria
- debe mantener diseño y lógica actuales
- debe usar `computeBreakdown()` como base
- debe hacer cambios conservadores
- debe priorizar aprendizaje real de usuarios