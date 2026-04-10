/* ===========================
   CompraSinSorpresas – app.js
   Calculadora de costos de compraventa en Uruguay
=========================== */

// ════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ════════════════════════════════════════════════════════

const TASAS_COMPRA = {
  itp:               0.015,
  comision:          0.03,
  ivaComision:       0.22,
  escribano:         0.03,
  aportesNotariales: 0.007,
  registrosFijo:     800,
};

// Estimación orientativa de gastos bancarios de tramitación (tasación, seguros, apertura).
// En la práctica suelen estar entre USD 500 y USD 1.500 según el banco y el caso.
// No se desglosa por banco porque esa información no es pública ni verificable.
const GASTO_BANCO_ESTIMADO = 1000;

const RATIO_PRESTAMO_AUTO = 0.80; // 80% del precio de la propiedad

// ════════════════════════════════════════════════════════
// ESTADO
// ════════════════════════════════════════════════════════

const state = {
  usaBanco:        false,
  usaInmobiliaria: false,
  modoPrestamo:    "auto", // "auto" | "manual"
};

// Contexto del último cálculo — usado para recalcular ITP con valor catastral
let _lastBreakdown = null;
let _lastContext   = null; // { P, L, modoPrestamo }

// ════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════

function fmt(value) {
  if (value == null || isNaN(value)) return "–";
  return "USD " + Math.round(value).toLocaleString("es-UY");
}

function fmtPct(value, decimals = 1) {
  return value.toFixed(decimals).replace(".", ",") + "%";
}

// Devuelve el monto del préstamo según el modo activo.
// Retorna null si no se puede determinar aún (precio no ingresado en modo auto).
function resolverPrestamo() {
  const P = parseFloat(document.getElementById("precio").value) || 0;

  if (state.modoPrestamo === "auto") {
    return P > 0 ? P * RATIO_PRESTAMO_AUTO : null;
  }

  return parseFloat(document.getElementById("prestamo").value) || 0;
}

// ════════════════════════════════════════════════════════
// UI: MODO PRÉSTAMO (auto vs manual)
// ════════════════════════════════════════════════════════

function actualizarUIModoPrestamo() {
  const autoBloque   = document.getElementById("prestamo-auto-bloque");
  const manualBloque = document.getElementById("prestamo-manual-bloque");
  const autoValor    = document.getElementById("prestamo-auto-valor");

  if (state.modoPrestamo === "auto") {
    autoBloque.style.display   = "block";
    manualBloque.style.display = "none";

    const P = parseFloat(document.getElementById("precio").value) || 0;
    if (P > 0) {
      const estimado = P * RATIO_PRESTAMO_AUTO;
      autoValor.textContent = `Préstamo estimado: ${fmt(estimado)}`;
      autoValor.style.color = ""; // color normal (navy via CSS)
    } else {
      autoValor.textContent = "Ingresá el precio de la propiedad para estimar el préstamo.";
      autoValor.style.color = "var(--text-muted)";
    }
  } else {
    autoBloque.style.display   = "none";
    manualBloque.style.display = "block";
  }
}

function copiarResultado() {
  const items = document.querySelectorAll("#results-list .result-value");
  const labels = [
    "ITP",
    "Comisión inmobiliaria",
    "Honorarios de escribano",
    "Aportes notariales",
    "Gastos registrales y certificados",
    "Gastos bancarios",
  ];

  let lineas = ["CompraSinSorpresas — Resumen de costos estimados", ""];

  items.forEach((el, i) => {
    lineas.push(`${labels[i]}: ${el.textContent.trim()}`);
  });

  lineas.push("");

  const rowPrestamo = document.getElementById("sum-row-prestamo");
  lineas.push(`Precio de la vivienda: ${document.getElementById("sum-precio").textContent.trim()}`);
  if (rowPrestamo && rowPrestamo.style.display !== "none") {
    const labelPrestamo = rowPrestamo.querySelector(".summary-label").textContent.trim();
    lineas.push(`${labelPrestamo}: ${document.getElementById("sum-prestamo").textContent.trim()}`);
  }
  lineas.push(`Dinero propio necesario: ${document.getElementById("sum-propio").textContent.trim()}`);
  lineas.push(`Gastos de compra estimados: ${document.getElementById("total-amount").textContent.trim()}`);
  lineas.push(`Costo total de la operación: ${document.getElementById("total-final").textContent.trim()}`);
  lineas.push(`Dinero total necesario: ${document.getElementById("bloque-principal-monto").textContent.trim()}`);
  lineas.push("");
  lineas.push("Valores orientativos. Consultá siempre a un escribano y a tu banco.");

  const texto = lineas.join("\n");

  if (!navigator.clipboard) return;

  navigator.clipboard.writeText(texto).then(() => {
    const btn = document.getElementById("btn-copiar");
    btn.textContent = "Copiado ✓";
    setTimeout(() => { btn.textContent = "Copiar resultado"; }, 2000);
  }).catch(() => {});
}

// Actualizar el bloque auto cada vez que cambia el precio
document.getElementById("precio").addEventListener("input", function () {
  if (this.value < 0) this.value = 0;
  const errorEl = document.getElementById("precio-error");
  if (errorEl) errorEl.style.display = "none";
  if (state.usaBanco && state.modoPrestamo === "auto") {
    actualizarUIModoPrestamo();
  }
});

// Escuchar cambio de modo préstamo
document.querySelectorAll('input[name="modo-prestamo"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    const anterior = state.modoPrestamo;
    state.modoPrestamo = e.target.value;
    // Al pasar de automático a manual limpiamos el campo para evitar
    // que un valor residual genere cálculos incorrectos sin que el
    // usuario lo haya ingresado conscientemente en este modo.
    if (anterior === "auto" && state.modoPrestamo === "manual") {
      document.getElementById("prestamo").value = "";
    }
    actualizarUIModoPrestamo();
  });
});

// ════════════════════════════════════════════════════════
// CÁLCULO CENTRAL
// ════════════════════════════════════════════════════════

function computeBreakdown({ P, L, bancoClave, usaBanco, usaInmobiliaria }) {
  const t = TASAS_COMPRA;

  const itp               = P * t.itp;
  const comision          = usaInmobiliaria ? P * t.comision * (1 + t.ivaComision) : 0;
  const escribano         = P * t.escribano;
  const aportesNotariales = P * t.aportesNotariales;
  const registros         = t.registrosFijo;

  const banco = usaBanco ? GASTO_BANCO_ESTIMADO : 0;

  const extraTotal           = itp + comision + escribano + aportesNotariales + registros + banco;
  const costoTotal           = P + extraTotal;
  const extraPct             = (extraTotal / P) * 100;
  const dineroPropio         = usaBanco ? Math.max(P - L, 0) : P;
  const dineroTotalNecesario = dineroPropio + extraTotal;
  const ahorroNecesarioPct   = (dineroTotalNecesario / P) * 100;

  return {
    itp, comision, escribano, aportesNotariales, registros,
    banco,
    extraTotal, costoTotal, extraPct,
    dineroPropio, dineroTotalNecesario, ahorroNecesarioPct,
  };
}

// ════════════════════════════════════════════════════════
// VALIDACIONES
// ════════════════════════════════════════════════════════

function mostrarErrorPrecio(msg) {
  const el = document.getElementById("precio-error");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

function validar({ P, L, usaBanco }) {
  if (P <= 0) {
    mostrarErrorPrecio("Por favor ingresá el precio de la propiedad.");
    return false;
  }

  if (usaBanco) {
    // Modo auto: L = P*0.80, siempre válido si P > 0 (ya validado arriba).
    // Modo manual: validar para cualquier banco, incluido BHU.
    if (state.modoPrestamo === "manual") {
      if (L <= 0) {
        alert("Por favor ingresá el monto del préstamo.");
        return false;
      }
      if (L > P) {
        alert("El monto del préstamo no puede superar el precio de la propiedad.");
        return false;
      }
    }
  }

  return true;
}

// ════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════

function renderResults(r, { P, L, modoPrestamo }) {
  // ── Desglose ──────────────────────────────────────────
  const list = document.getElementById("results-list");
  list.innerHTML = "";

  const items = [
    {
      label: "ITP — Impuesto a las Transmisiones Patrimoniales",
      note:  "P × 1,5% · Estimación orientativa.",
      value: fmt(r.itp),
    },
    {
      label: "Comisión inmobiliaria",
      note:  state.usaInmobiliaria
               ? "P × 3% + IVA 22% · Efectivo ~3,66% sobre precio"
               : "No aplica — operación directa sin inmobiliaria",
      value: state.usaInmobiliaria ? fmt(r.comision) : null,
      na:    !state.usaInmobiliaria,
    },
    {
      label: "Honorarios de escribano",
      note:  "P × 3% · Estimación de mercado; puede variar según escribano y complejidad",
      value: fmt(r.escribano),
    },
    {
      label: "Aportes notariales",
      note:  "P × 0,7% · Contribución al Fondo Notarial y Caja de Jubilaciones",
      value: fmt(r.aportesNotariales),
    },
    {
      label: "Gastos registrales y certificados",
      note:  "Inscripciones, certificados y trámites en Registros — estimado fijo",
      value: fmt(r.registros),
    },
  ];

  if (state.usaBanco) {
    items.push({
      label: "Gastos bancarios (estimado)",
      note:  "Tasación, seguros y gastos de apertura. En la práctica suelen estar entre USD 500 y USD 1.500 según el banco. Consultá con tu banco para el valor exacto.",
      value: fmt(r.banco),
    });
  } else {
    items.push({
      label: "Gastos bancarios",
      note:  "No aplica — comprás sin financiamiento bancario",
      value: null,
      na:    true,
    });
  }

  items.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "result-item";
    if (idx === 0) el.id = "itp-result-item"; // ITP — para inyectar input catastral
    el.innerHTML = `
      <div class="result-label">
        ${item.label}
        <span class="result-note">${item.note}</span>
      </div>
      <div class="result-value${item.na ? " na" : ""}" ${idx === 0 ? 'id="itp-valor"' : ""}>
        ${item.na ? "No aplica" : item.value}
      </div>
    `;
    list.appendChild(el);
  });

  // ── Nota bancaria ─────────────────────────────────────
  const notaBancoEl = document.getElementById("nota-banco");
  if (notaBancoEl) notaBancoEl.style.display = "none";

  // ── Summary grid ──────────────────────────────────────
  document.getElementById("sum-precio").textContent = fmt(P);

  const rowPrestamo = document.getElementById("sum-row-prestamo");
  if (state.usaBanco && L > 0) {
    const labelPrestamo = modoPrestamo === "auto" ? "Préstamo estimado del banco" : "Préstamo banco";
    rowPrestamo.querySelector(".summary-label").textContent = labelPrestamo;
    document.getElementById("sum-prestamo").textContent    = fmt(L);
    rowPrestamo.style.display = "flex";
  } else {
    rowPrestamo.style.display = "none";
  }

  document.getElementById("sum-propio").textContent   = fmt(r.dineroPropio);
  document.getElementById("total-amount").textContent = fmt(r.extraTotal);
  document.getElementById("total-final").textContent  = fmt(r.costoTotal);

  // ── Bloque principal — dinero total necesario ───────────
  const bloquePrincipal = document.getElementById("bloque-principal");
  const bloqueMonto     = document.getElementById("bloque-principal-monto");
  const bloquePct       = document.getElementById("bloque-principal-pct");
  if (bloquePrincipal && bloqueMonto && bloquePct) {
    bloqueMonto.textContent = fmt(r.dineroTotalNecesario);
    bloquePct.textContent   = `Eso equivale aproximadamente al ${fmtPct(r.ahorroNecesarioPct)} del valor de la vivienda.`;
    bloquePrincipal.style.display = "block";
  }

  // ── Ahorro pct (oculto — valor ya está en bloque principal) ──
  const ahorroBloque = document.getElementById("ahorro-bloque");
  const ahorroLine   = document.getElementById("ahorro-pct-line");
  if (ahorroBloque && ahorroLine) {
    ahorroLine.textContent = "";
    ahorroBloque.style.display = "none";
  }

  // ── Gastos adicionales: monto en USD primero, luego % ─
  const pctEl = document.getElementById("extra-pct");
  if (pctEl) {
    pctEl.innerHTML =
      `Solo en gastos de compra, necesitás sumar aproximadamente <strong>${fmt(r.extraTotal)}</strong> extra. ` +
      `Eso equivale al ${fmtPct(r.extraPct)} del valor publicado.`;
  }

  // ── Comparador alquiler ───────────────────────────────
  const comparadorBloque = document.getElementById("comparador-bloque");
  if (comparadorBloque) {
    comparadorBloque.style.display = "block";
    const res = document.getElementById("comparador-resultado");
    if (res) res.style.display = "none";
    const aviso = document.getElementById("leads-aviso");
    if (aviso) aviso.style.display = "none";
    const btnLeads = document.getElementById("btn-comparador-completo");
    if (btnLeads) btnLeads.style.display = "";
  }

  // ── Input valor catastral — inyectar dentro del result-label del ITP ───────
  // Se inserta en result-label (columna izquierda) para que quede debajo del
  // texto descriptivo, en flujo vertical, sin afectar el valor USD a la derecha.
  const itpItem = document.getElementById("itp-result-item");
  if (itpItem) {
    const itpLabel = itpItem.querySelector(".result-label");
    if (itpLabel) {
      itpLabel.insertAdjacentHTML("beforeend", `
        <div id="catastral-bloque" style="margin-top:8px; margin-bottom:6px;">
          <p class="result-note">El ITP se calcula sobre el valor catastral. Como ese valor no siempre es público, acá se muestra una estimación.</p>
          <div class="input-wrapper" style="margin-top:8px; max-width:200px;">
            <span class="input-prefix">USD</span>
            <input type="number" id="catastral-input" class="input" placeholder="Valor catastral" min="0" />
          </div>
          <p class="result-note" style="margin-top:6px;">Si conocés el valor catastral podés ingresarlo para recalcular el ITP.</p>
          <p class="result-note" style="margin-top:4px; color:#c0bab2; font-size:0.72rem;">Podés obtenerlo con el número de padrón del inmueble en Catastro o consultando a la inmobiliaria o escribano.</p>
        </div>
      `);
      document.getElementById("catastral-input").addEventListener("input", recalcularConCatastral);
    }
  }

  // ── Guardar contexto para recálculo por catastral ─────
  _lastBreakdown = r;
  _lastContext   = { P, L, modoPrestamo };

  // ── Mostrar panel ─────────────────────────────────────
  document.querySelector(".form-card").style.display = "none";
  const resultsPanel = document.getElementById("results");
  resultsPanel.style.display = "block";
  resultsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ════════════════════════════════════════════════════════
// COMPARADOR ALQUILER
// ════════════════════════════════════════════════════════

function calcularAlquiler() {
  const alquiler    = parseFloat(document.getElementById("alquiler-mensual").value) || 0;
  const resultadoEl = document.getElementById("comparador-resultado");

  if (alquiler <= 0) {
    alert("Por favor ingresá un monto mensual de alquiler.");
    return;
  }

  const horizonte = parseInt(document.getElementById("horizonte-anos").value) || 10;
  const totalAlquiler10 = alquiler * 12 * horizonte;

  // Analytics
  if (typeof gtag !== "undefined") gtag("event", "uso_calculadora_alquiler");

  resultadoEl.innerHTML =
    `Si alquilás esta propiedad durante <strong>${horizonte} años</strong> pagando <strong>${fmt(alquiler)}</strong> por mes, habrás pagado aproximadamente <strong>${fmt(totalAlquiler10)}</strong> en alquiler.`;
  resultadoEl.style.display = "block";
}

// ════════════════════════════════════════════════════════
// RECÁLCULO ITP CON VALOR CATASTRAL
// ════════════════════════════════════════════════════════

function recalcularConCatastral() {
  if (!_lastBreakdown || !_lastContext) return;

  const catastral = parseFloat(document.getElementById("catastral-input")?.value) || 0;
  const r         = _lastBreakdown;
  const { P }     = _lastContext;

  // ITP: usar catastral si fue ingresado, si no el original del breakdown
  const itpNuevo = catastral > 0 ? catastral * 0.02 : r.itp;

  // Recalcular totales derivados
  const extraTotal           = itpNuevo + r.comision + r.escribano + r.aportesNotariales + r.registros + r.banco;
  const costoTotal           = P + extraTotal;
  const extraPct             = (extraTotal / P) * 100;
  const dineroTotalNecesario = r.dineroPropio + extraTotal;
  const ahorroNecesarioPct   = (dineroTotalNecesario / P) * 100;

  // Actualizar valor del ITP en el desglose
  const itpValorEl = document.getElementById("itp-valor");
  if (itpValorEl) itpValorEl.textContent = fmt(itpNuevo);

  // Actualizar todos los totales
  document.getElementById("total-amount").textContent = fmt(extraTotal);
  document.getElementById("total-final").textContent  = fmt(costoTotal);

  const pctEl = document.getElementById("extra-pct");
  if (pctEl) pctEl.innerHTML =
    `Solo en gastos de compra, necesitás sumar aproximadamente <strong>${fmt(extraTotal)}</strong> extra. ` +
    `Eso equivale al ${fmtPct(extraPct)} del valor publicado.`;

  const bloqueMonto2 = document.getElementById("bloque-principal-monto");
  const bloquePct2   = document.getElementById("bloque-principal-pct");
  if (bloqueMonto2) bloqueMonto2.textContent = fmt(dineroTotalNecesario);
  if (bloquePct2)   bloquePct2.textContent   = `Eso equivale aproximadamente al ${fmtPct(ahorroNecesarioPct)} del valor de la vivienda.`;
}

// ════════════════════════════════════════════════════════
// ORQUESTACIÓN
// ════════════════════════════════════════════════════════

function calcular() {
  const P = parseFloat(document.getElementById("precio").value) || 0;

  let L = 0;
  if (state.usaBanco) {
    if (state.modoPrestamo === "auto") {
      if (P <= 0) {
        mostrarErrorPrecio("Por favor ingresá el precio de la propiedad para estimar el préstamo.");
        return;
      }
      L = P * RATIO_PRESTAMO_AUTO;
    } else {
      L = parseFloat(document.getElementById("prestamo").value) || 0;
    }
  }

  if (!validar({ P, L, usaBanco: state.usaBanco })) return;

  // Analytics
  if (typeof gtag !== "undefined") gtag("event", "simulacion_realizada");

  const breakdown = computeBreakdown({
    P, L,
    usaBanco:        state.usaBanco,
    usaInmobiliaria: state.usaInmobiliaria,
  });

  renderResults(breakdown, { P, L, modoPrestamo: state.modoPrestamo });
}

// ════════════════════════════════════════════════════════
// TOGGLE BUTTONS
// ════════════════════════════════════════════════════════

function setupToggle(groupId, onChangeFn) {
  const group = document.getElementById(groupId);
  group.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      group.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (onChangeFn) onChangeFn(btn.dataset.value);
    });
  });
}

setupToggle("toggle-banco", (value) => {
  state.usaBanco = (value === "si");
  const bancoFields = document.getElementById("banco-fields");
  bancoFields.style.display       = state.usaBanco ? "flex" : "none";
  bancoFields.style.flexDirection = "column";
  // Inicializar UI del modo préstamo al mostrar el bloque
  if (state.usaBanco) actualizarUIModoPrestamo();
});

setupToggle("toggle-inmobiliaria", (value) => {
  state.usaInmobiliaria = (value === "si");
});

// ════════════════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════════════════

document.getElementById("prestamo").addEventListener("input", function () {
  if (this.value < 0) this.value = 0;
});

document.getElementById("btn-calcular").addEventListener("click", calcular);

document.getElementById("btn-reset").addEventListener("click", () => {
  document.getElementById("results").style.display = "none";
  document.querySelector(".form-card").style.display = "block";
  const alquilerInput  = document.getElementById("alquiler-mensual");
  if (alquilerInput) alquilerInput.value = "";
  const horizonteSelect = document.getElementById("horizonte-anos");
  if (horizonteSelect) horizonteSelect.value = "10";
  _lastBreakdown = null;
  _lastContext   = null;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("btn-alquiler").addEventListener("click", calcularAlquiler);

document.getElementById("btn-copiar").addEventListener("click", copiarResultado);

document.getElementById("btn-comparador-completo").addEventListener("click", () => {
  // Analytics
  if (typeof gtag !== "undefined") gtag("event", "click_ver_comparador");

  const aviso = document.getElementById("leads-aviso");
  if (aviso) {
    aviso.style.display = "block";
    document.getElementById("btn-comparador-completo").style.display = "none";
  }
});