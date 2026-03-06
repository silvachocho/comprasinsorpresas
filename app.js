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

const BANCOS = {
  bhu:       { label: "BHU",       tipo: "real",     fijo: 800,  tasa: null  },
  brou:      { label: "BROU",      tipo: "estimado", fijo: 800,  tasa: 0.012 },
  santander: { label: "Santander", tipo: "estimado", fijo: 800,  tasa: 0.015 },
  itau:      { label: "Itaú",      tipo: "estimado", fijo: 800,  tasa: 0.015 },
  bbva:      { label: "BBVA",      tipo: "estimado", fijo: 800,  tasa: 0.015 },
  otro:      { label: "Otro",      tipo: "estimado", fijo: 800,  tasa: 0.014 },
};

const NOTAS_BANCO = {
  real:     "BHU: los costos bancarios aquí reflejan un cargo fijo observado en una operación real; pueden existir otros cargos según el caso.",
  estimado: "Costos bancarios estimados. Pueden variar según tarifario del banco, seguros y condiciones del préstamo.",
};

const RATIO_PRESTAMO_AUTO = 0.80; // 80% del precio de la propiedad

// ════════════════════════════════════════════════════════
// ESTADO
// ════════════════════════════════════════════════════════

const state = {
  usaBanco:        false,
  usaInmobiliaria: false,
  modoPrestamo:    "auto", // "auto" | "manual"
};

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

// Actualizar el bloque auto cada vez que cambia el precio
document.getElementById("precio").addEventListener("input", function () {
  if (this.value < 0) this.value = 0;
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

  let banco     = 0;
  let bancoInfo = null;

  if (usaBanco && bancoClave) {
    const b = BANCOS[bancoClave];
    banco   = b.tipo === "real" ? b.fijo : L * b.tasa + b.fijo;
    bancoInfo = {
      ...b,
      clave:        bancoClave,
      monto:        banco,
      tasaAplicada: b.tipo === "estimado" ? L * b.tasa : null,
      nota:         NOTAS_BANCO[b.tipo],
    };
  }

  const extraTotal           = itp + comision + escribano + aportesNotariales + registros + banco;
  const costoTotal           = P + extraTotal;
  const extraPct             = (extraTotal / P) * 100;
  const dineroPropio         = usaBanco ? Math.max(P - L, 0) : P;
  const dineroTotalNecesario = dineroPropio + extraTotal;
  const ahorroNecesarioPct   = (dineroTotalNecesario / P) * 100;

  return {
    itp, comision, escribano, aportesNotariales, registros,
    banco, bancoInfo,
    extraTotal, costoTotal, extraPct,
    dineroPropio, dineroTotalNecesario, ahorroNecesarioPct,
  };
}

// ════════════════════════════════════════════════════════
// VALIDACIONES
// ════════════════════════════════════════════════════════

function validar({ P, L, bancoClave, usaBanco }) {
  if (P <= 0) {
    alert("Por favor ingresá el precio de la propiedad.");
    return false;
  }
  if (usaBanco && !bancoClave) {
    alert("Por favor seleccioná un banco.");
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

function renderResults(r, { P, L, tipo, modoPrestamo }) {
  // ── Desglose ──────────────────────────────────────────
  const list = document.getElementById("results-list");
  list.innerHTML = "";

  const items = [
    {
      label: "ITP — Impuesto a las Transmisiones Patrimoniales",
      note:  "P × 1,5% · Base: precio declarado o valor catastral (el que sea mayor) — ver nota abajo",
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

  if (state.usaBanco && r.bancoInfo) {
    const b      = r.bancoInfo;
    const esReal = b.tipo === "real";
    const label  = esReal ? "Gastos bancarios (BHU)" : `Gastos bancarios (estimado) — ${b.label}`;
    const note   = esReal
      ? `Cargo fijo observado en operación real: ${fmt(b.fijo)}`
      : `L × ${(b.tasa * 100).toFixed(1).replace(".", ",")}% (${fmt(b.tasaAplicada)}) + gastos fijos (${fmt(b.fijo)})`;
    items.push({ label, note, value: fmt(r.banco) });
  } else {
    items.push({
      label: "Gastos bancarios",
      note:  "No aplica — comprás sin financiamiento bancario",
      value: null,
      na:    true,
    });
  }

  const tipoMap = { unica: "Vivienda única", segunda: "Segunda vivienda", inversion: "Inversión" };
  items.push({
    label:  "Tipo de vivienda",
    note:   "Informativo — puede incidir en exoneraciones o alícuotas; consultá tu escribano",
    value:  tipoMap[tipo],
    isText: true,
  });

  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "result-item";
    el.innerHTML = `
      <div class="result-label">
        ${item.label}
        <span class="result-note">${item.note}</span>
      </div>
      <div class="result-value${item.na ? " na" : ""}">
        ${item.na ? "No aplica" : item.value}
      </div>
    `;
    list.appendChild(el);
  });

  // ── Nota bancaria ─────────────────────────────────────
  const notaBancoEl = document.getElementById("nota-banco");
  if (notaBancoEl) {
    if (state.usaBanco && r.bancoInfo) {
      notaBancoEl.textContent   = r.bancoInfo.nota;
      notaBancoEl.style.display = "block";
    } else {
      notaBancoEl.style.display = "none";
    }
  }

  // ── Summary grid ──────────────────────────────────────
  document.getElementById("sum-precio").textContent = fmt(P);

  const rowPrestamo = document.getElementById("sum-row-prestamo");
  if (state.usaBanco && L > 0) {
    const labelPrestamo = modoPrestamo === "auto" ? "Préstamo banco (estimado 80%)" : "Préstamo banco";
    rowPrestamo.querySelector(".summary-label").textContent = labelPrestamo;
    document.getElementById("sum-prestamo").textContent    = fmt(L);
    rowPrestamo.style.display = "flex";
  } else {
    rowPrestamo.style.display = "none";
  }

  document.getElementById("sum-propio").textContent          = fmt(r.dineroPropio);
  document.getElementById("total-amount").textContent        = fmt(r.extraTotal);
  document.getElementById("sum-total-necesario").textContent = fmt(r.dineroTotalNecesario);
  document.getElementById("total-final").textContent         = fmt(r.costoTotal);

  // ── Extra pct ─────────────────────────────────────────
  const pctEl = document.getElementById("extra-pct");
  if (pctEl) {
    pctEl.textContent =
      `Los gastos adicionales representan el ${fmtPct(r.extraPct)} del precio de compra.`;
  }

  // ── Ahorro necesario ──────────────────────────────────
  const ahorroBloque = document.getElementById("ahorro-bloque");
  const ahorroLine   = document.getElementById("ahorro-pct-line");
  if (ahorroBloque && ahorroLine) {
    ahorroLine.textContent =
      `Para comprar esta propiedad necesitás tener ahorrado aproximadamente ${fmtPct(r.ahorroNecesarioPct)} del valor de la vivienda.`;
    ahorroBloque.style.display = "block";
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

  const totalAlquiler10 = alquiler * 12 * 10;

  // Analytics
  if (typeof gtag !== "undefined") gtag("event", "uso_calculadora_alquiler");

  resultadoEl.innerHTML =
    `Si alquilás esta propiedad durante <strong>10 años</strong> pagando <strong>${fmt(alquiler)}</strong> por mes, habrás pagado aproximadamente <strong>${fmt(totalAlquiler10)}</strong> en alquiler.`;
  resultadoEl.style.display = "block";
}

// ════════════════════════════════════════════════════════
// ORQUESTACIÓN
// ════════════════════════════════════════════════════════

function calcular() {
  const P          = parseFloat(document.getElementById("precio").value) || 0;
  const bancoClave = document.getElementById("banco-nombre").value;
  const tipo       = document.querySelector('input[name="tipo"]:checked').value;

  // Resolver L según modo (aplica igual para todos los bancos, incluido BHU).
  // BHU tiene gastos fijos, pero L sí impacta en dinero propio y ahorro necesario.
  let L = 0;
  if (state.usaBanco) {
    if (state.modoPrestamo === "auto") {
      if (P <= 0) {
        alert("Por favor ingresá el precio de la propiedad para estimar el préstamo.");
        return;
      }
      L = P * RATIO_PRESTAMO_AUTO;
    } else {
      L = parseFloat(document.getElementById("prestamo").value) || 0;
    }
  }

  if (!validar({ P, L, bancoClave, usaBanco: state.usaBanco })) return;

  // Analytics
  if (typeof gtag !== "undefined") gtag("event", "simulacion_realizada");

  const breakdown = computeBreakdown({
    P, L, bancoClave,
    usaBanco:        state.usaBanco,
    usaInmobiliaria: state.usaInmobiliaria,
  });

  renderResults(breakdown, { P, L, tipo, modoPrestamo: state.modoPrestamo });
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
  const alquilerInput = document.getElementById("alquiler-mensual");
  if (alquilerInput) alquilerInput.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.getElementById("btn-alquiler").addEventListener("click", calcularAlquiler);

document.getElementById("btn-comparador-completo").addEventListener("click", () => {
  // Analytics
  if (typeof gtag !== "undefined") gtag("event", "click_ver_comparador");

  const aviso = document.getElementById("leads-aviso");
  if (aviso) {
    aviso.style.display = "block";
    document.getElementById("btn-comparador-completo").style.display = "none";
  }
});
