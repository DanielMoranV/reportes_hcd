/* ─────────────────────────────────────────────────────────
   dashboard_farmacia.js  —  versión dinámica con carga Excel
   ───────────────────────────────────────────────────────── */

// ── Referencias a elementos del DOM ──────────────────────
const excelInput = document.getElementById("excelInput");
const uploadStatus = document.getElementById("uploadStatus");
const uploadPanel = document.getElementById("uploadPanel");

// ── Param GET para auto-carga ─────────────────────────────
// El archivo se especifica en la URL: ?archivo=nombre.xls
// El servidor Python lo sirve desde /data/<nombre>.xls
function getArchivoParam() {
  return new URLSearchParams(window.location.search).get("archivo");
}

// ── Instancias de Chart (para destruir al recargar) ───────
let charts = {};

// ── Estado toggle bar chart ────────────────────────────────
let barChartMode = "sep"; // "sep" | "uni"
let _recetasData = null;

// ── Estado toggle conv chart ───────────────────────────────
let convChartMode = "aten"; // "uni" | "aten"
let _convData = null;

// ── Estado toggle ventas chart ───────────────────────────────
let ventasMedMode = "uni"; // "uni" | "sep"
let _ventasMedData = null;

// ── Estado toggle meds ingreso chart ───────────────────────────────
let medsIngresoMode = "uni"; // "uni" | "sep"
let _medsIngresoData = null;

// ── Estado toggle meds unidades chart ───────────────────────────────
let medsUnidadesMode = "uni"; // "uni" | "sep"
let _medsUnidadesData = null;

// ─────────────────────────────────────────────────────────
// CACHÉ EN localStorage
// ─────────────────────────────────────────────────────────
const CACHE_KEY = "hcd_farmacia_data_v1";

function saveToCache(D) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(D));
  } catch (e) {
    console.warn("No se pudo guardar en caché:", e.message);
  }
}

function loadFromCache() {
  try {
    const s = localStorage.getItem(CACHE_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY);
}

// ─────────────────────────────────────────────────────────
// ESTADO VACÍO  (sin Excel cargado)
// ─────────────────────────────────────────────────────────
function showEmptyState() {
  // —— Header
  const dashHdr = document.getElementById("dashHeaderDate");
  if (dashHdr) dashHdr.textContent = "Sin datos cargados";

  // —— Footer
  const footerBar = document.getElementById("footerBar");
  if (footerBar) footerBar.textContent = "Sin datos cargados";

  // —— Helper: resetea un querySelector a "—"
  const qset = (sel) => {
    const el = document.querySelector(sel);
    if (el) el.textContent = "—";
  };

  // —— KPIs numéricos
  const kpiIds = [
    ".kpi-card.total .value",
    ".kpi-card.seguro .value",
    ".kpi-card.part .value",
    ".kpi-card.conv .value",
    "#kpiUnidadesSinVender",
    "#kpiGanReal",
    "#kpiGanPerd",
    "#kpiTotalVentaConv",
    "#kpiTotalVentaSinConv",
    "#kpiAtenciones",
    "#kpiMedicos",
    "#kpiPctRecetasAten",
    "#kpiRecetasConv",
    "#kpiRecetasSinConv",
    "#kpiPctRecetasConv",
    "#kpiPctRecetasSinConv",
  ];
  kpiIds.forEach(qset);

  const segLabel = document.querySelector(".kpi-card.seguro .label");
  if (segLabel) segLabel.textContent = "Seguro";
  const parLabel = document.querySelector(".kpi-card.part .label");
  if (parLabel) parLabel.textContent = "Particular";
  qset(".kpi-card.conv .value");
  set("kpiUnidadesSinVender", "—");
  qset("#kpiGanReal");

  // —— KPIs sin stock
  qset(".kpi-card.stk-prod .value");
  qset(".kpi-card.stk-aten .value");
  qset(".kpi-card.stk-cero .value");
  qset(".kpi-card.stk-seg .value");

  // —— Pie center
  qset("#pieCenterLabel .big");

  // —— Pie legend
  const pLegItems = document.querySelectorAll(".pie-legend-item");
  if (pLegItems[0]) {
    const lbl = pLegItems[0].querySelector(".pie-label");
    if (lbl) lbl.innerHTML = "Seguro &mdash; —";
    const fill = pLegItems[0].querySelector(".pie-progress-fill");
    if (fill) fill.style.width = "0%";
  }
  if (pLegItems[1]) {
    const lbl = pLegItems[1].querySelector(".pie-label");
    if (lbl) lbl.innerHTML = "Particular &mdash; —";
    const fill = pLegItems[1].querySelector(".pie-progress-fill");
    if (fill) fill.style.width = "0%";
  }

  // —— Insight boxes seguro / particular
  [".insight-box.seg", ".insight-box.par"].forEach((sel) => {
    const box = document.querySelector(sel);
    if (!box) return;
    const big = box.querySelector(".ib-big");
    if (big) big.textContent = "—";
    box.querySelectorAll(".ib-val").forEach((v) => (v.textContent = "—"));
  });

  // —— Alerta particular (panel rojo)
  const alertPar = document.querySelector('[style*="fff8f8"] span');
  if (alertPar) alertPar.textContent = "⚠ Sin datos cargados.";

  // —— Gráficos: destruir instancias previas
  Object.values(charts).forEach((c) => {
    try {
      c.destroy();
    } catch (_) {}
  });
  charts = {};

  // —— Tablas / contenedores dinámicos
  const empty = (id, colspan = 5) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === "TBODY") {
      el.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;padding:24px;color:#9ca3af;font-size:.85rem">
        Cargue un archivo Excel para ver los datos</td></tr>`;
    } else {
      el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#9ca3af;font-size:.85rem">
        <div style="font-size:2rem;margin-bottom:8px">📂</div>
        Cargue un archivo Excel para ver los datos</div>`;
    }
  };

  empty("rankingBody", 6);
  empty("ventasBody", 5);
  empty("lossBody", 3);
  empty("sinstockBody", 6);
  empty("prodBody", 4);
  empty("descuentoBody", 7);
  empty("medprioBody", 6);
  empty("insightRow", 1);

  // —— Alerta de estrategias
  const alertTxt = document.getElementById("stratAlertText");
  if (alertTxt)
    alertTxt.innerHTML =
      "<em style='color:#9ca3af'>Cargue un archivo Excel para ver el análisis de conversión Particular.</em>";

  // —— Escenarios
  ["scActualPct", "scConsPct", "scModPct", "scOptPct"].forEach((id) =>
    set(id, "—"),
  );
  ["scActualUnds", "scConsUnds", "scModUnds", "scOptUnds"].forEach((id) =>
    set(id, ""),
  );
  ["scActualRev", "scConsRev", "scModRev", "scOptRev"].forEach((id) =>
    set(id, ""),
  );
  ["scConsGain", "scModGain", "scOptGain"].forEach((id) => set(id, ""));

  // —— KPIs de conversión particular
  ["parConvPct", "segConvPct"].forEach((id) => set(id, "—"));
  ["parSinConvTotal", "parActivaText"].forEach((id) => set(id, "—"));
  set("stockAlertText", "—");

  // —— Reset toggle bar chart
  barChartMode = "sep";
  _recetasData = null;
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === "sep");
  });
  const barLegend = document.getElementById("barLegend");
  if (barLegend) barLegend.style.display = "";
  const barSub = document.getElementById("barSubtitle");
  if (barSub) barSub.textContent = "Agrupado por tipo de atención";

  // —— Reset toggle conv chart
  convChartMode = "aten";
  _convData = null;
  document.querySelectorAll("[data-conv-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.convMode === "aten");
  });
  const convSub = document.getElementById("convSubtitle");
  if (convSub)
    convSub.textContent =
      "Unidades recetadas (derivadas) y vendidas (convertidas)";

  // —— Reset toggle ventas chart
  ventasMedMode = "uni";
  _ventasMedData = null;
  document.querySelectorAll("[data-vmed-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.vmedMode === "uni");
  });
  const vmedLegend = document.getElementById("vmedLegend");
  if (vmedLegend) vmedLegend.style.display = "none";
  const vmedSub = document.getElementById("ventasMedSubtitle");
  if (vmedSub)
    vmedSub.textContent =
      "Total venta realizada (S/) — exluye médicos sin conversiones";

  // —— Reset toggle meds ingreso chart
  medsIngresoMode = "uni";
  _medsIngresoData = null;
  document.querySelectorAll("[data-mingreso-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mingresoMode === "uni");
  });
  const mingresoLegend = document.getElementById("mingresoLegend");
  if (mingresoLegend) mingresoLegend.style.display = "none";
  const mingresoSub = document.getElementById("medsIngresoSubtitle");
  if (mingresoSub) mingresoSub.textContent = "Monto total vendido (S/)";

  // —— Reset toggle meds unidades chart
  medsUnidadesMode = "uni";
  _medsUnidadesData = null;
  document.querySelectorAll("[data-munidades-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.munidadesMode === "uni");
  });
  const munidadesLegend = document.getElementById("munidadesLegend");
  if (munidadesLegend) munidadesLegend.style.display = "none";
  const munidadesSub = document.getElementById("medsUnidadesSubtitle");
  if (munidadesSub) munidadesSub.textContent = "Unidades vendidas por receta";

  // —— Barra superior de estado
  setStatus(
    '<span class="us-info">📂 Cargue un archivo Excel (.xls / .xlsx) para comenzar</span>',
  );
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function fmt(n, dec = 2) {
  return n.toLocaleString("es-PE", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}
function fmtN(n) {
  return n.toLocaleString("es-PE");
}
function abreviar(nombre) {
  const p = nombre.split(" ");
  return p[0] + (p[2] ? ", " + p[2][0] + "." : "");
}
function excelDateToJS(serial) {
  if (serial instanceof Date) return serial;
  if (typeof serial === "number") {
    return new Date(Math.round((serial - 25569) * 86400 * 1000));
  }
  if (typeof serial === "string") return new Date(serial);
  return null;
}
function formatoFecha(d) {
  if (!d || isNaN(d)) return "";
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function mesAnio(d) {
  if (!d || isNaN(d)) return "";
  return d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
}
function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

// ─────────────────────────────────────────────────────────
// RENDERIZADO PRINCIPAL  —  recibe un objeto con la misma
// estructura que DEFAULT
// ─────────────────────────────────────────────────────────
function renderDashboard(D) {
  // ── Header y footer ────────────────────────────────────
  const dashHdr = document.getElementById("dashHeaderDate");
  if (dashHdr) dashHdr.textContent = D.fechaRango;
  const footer = document.getElementById("footerBar");
  const hoy = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  footer.innerHTML = `Datos al ${hoy} &nbsp;|&nbsp; Fuente: ${D.archivoNom} &nbsp;|&nbsp; HCD`;

  // ── KPIs principales totales ────────────────────────────
  const totalSeg = D.recetas.reduce((s, d) => s + d.seguro, 0);
  const totalPar = D.recetas.reduce((s, d) => s + d.particular, 0);
  const total = totalSeg + totalPar;
  window._totalRecetas = total; // expuesto para % Recetas/Atenciones (calculado al llegar PostgreSQL)
  document.querySelector(".kpi-card.total .value").textContent = fmtN(total);
  document.querySelector(".kpi-card.seguro .value").textContent =
    fmtN(totalSeg);
  document.querySelector(".kpi-card.seguro .label").textContent =
    `Seguro (${((totalSeg / total) * 100).toFixed(1)}%)`;
  document.querySelector(".kpi-card.part .value").textContent = fmtN(totalPar);
  document.querySelector(".kpi-card.part .label").textContent =
    `Particular (${((totalPar / total) * 100).toFixed(1)}%)`;

  // kpiAtenciones se llena por PostgreSQL, ponemos un placeholder
  const elAten = document.getElementById("kpiAtenciones");
  if (elAten) elAten.textContent = "Cargando...";

  // kpiMedicos se llena con la cantidad de médicos en el Excel (D.recetas)
  const elMed = document.getElementById("kpiMedicos");
  if (elMed) elMed.textContent = fmtN(D.recetas.length);

  // ── KPIs conversión ─────────────────────────────────────
  const K = D.kpi;
  const elConvVal = document.querySelector(".kpi-card.conv .value");
  if (elConvVal) elConvVal.textContent = K.tasaGlobal.toFixed(1) + "%";
  const elSinVender = document.getElementById("kpiUnidadesSinVender");
  if (elSinVender) elSinVender.textContent = fmtN(K.totalDeriv - K.totalConv);
  const elGreal = document.getElementById("kpiGanReal");
  if (elGreal) elGreal.textContent = "S/ " + fmtN(Math.round(K.ganReal));
  const elGperd = document.getElementById("kpiGanPerd");
  if (elGperd) elGperd.textContent = "S/ " + fmtN(Math.round(K.ganPerd));
  const elVentaConv = document.getElementById("kpiTotalVentaConv");
  if (elVentaConv) elVentaConv.textContent = "S/ " + fmtN(Math.round(K.totalVentaConv));
  const elVentaSin = document.getElementById("kpiTotalVentaSinConv");
  if (elVentaSin) elVentaSin.textContent = "S/ " + fmtN(Math.round(K.totalVentaSinConv));

  const elRecConv = document.getElementById("kpiRecetasConv");
  const valConv = K.segConvGuia + K.parConvGuia;
  if (elRecConv) elRecConv.textContent = fmtN(valConv);

  const elRecSinConv = document.getElementById("kpiRecetasSinConv");
  let valSinConv = 0;
  if (elRecSinConv) {
    const sDeriv = K.segDerivGuia || 0;
    const sConv = K.segConvGuia || 0;
    const pDeriv = K.parDerivGuia || 0;
    const pConv = K.parConvGuia || 0;
    valSinConv = sDeriv - sConv + (pDeriv - pConv);
    elRecSinConv.textContent = fmtN(valSinConv);
  }

  const elPctRecConv = document.getElementById("kpiPctRecetasConv");
  const elPctRecSinConv = document.getElementById("kpiPctRecetasSinConv");
  const totRec = valConv + valSinConv;
  if (elPctRecConv) {
    elPctRecConv.textContent =
      totRec > 0 ? ((valConv / totRec) * 100).toFixed(1) + "%" : "0%";
  }
  if (elPctRecSinConv) {
    elPctRecSinConv.textContent =
      totRec > 0 ? ((valSinConv / totRec) * 100).toFixed(1) + "%" : "0%";
  }

  // ── KPIs sin stock ──────────────────────────────────────
  const ssProds = D.sinStockData.length;
  const ssAfect = D.admisionesSinStock; // admisiones únicas con ≥1 producto sin stock
  const ssLineas = D.sinStockData.reduce((s, x) => s + x.deriv, 0);
  document.querySelector(".kpi-card.stk-prod .value").textContent =
    fmtN(ssProds);
  document.querySelector(".kpi-card.stk-aten .value").textContent =
    fmtN(ssAfect);
  document.querySelector(".kpi-card.stk-seg  .value").textContent =
    fmtN(ssLineas);

  // ── Doughnut center ─────────────────────────────────────
  document.querySelector("#pieCenterLabel .big").textContent = fmtN(total);
  // Pie legend
  const pLegItems = document.querySelectorAll(".pie-legend-item");
  if (pLegItems[0]) {
    pLegItems[0].querySelector(".pie-label").innerHTML =
      `Seguro &mdash; ${fmtN(totalSeg)} <span style="color:#2e86de;font-weight:700">${((totalSeg / total) * 100).toFixed(1)}%</span>`;
    pLegItems[0].querySelector(".pie-progress-fill").style.width =
      ((totalSeg / total) * 100).toFixed(1) + "%";
  }
  if (pLegItems[1]) {
    pLegItems[1].querySelector(".pie-label").innerHTML =
      `Particular &mdash; ${fmtN(totalPar)} <span style="color:#f39c12;font-weight:700">${((totalPar / total) * 100).toFixed(1)}%</span>`;
    pLegItems[1].querySelector(".pie-progress-fill").style.width =
      ((totalPar / total) * 100).toFixed(1) + "%";
  }

  // ── Conversión por tipo (insight boxes) — métricas por receta (guia) ───
  const ibSeg = document.querySelector(".insight-box.seg");
  const ibPar = document.querySelector(".insight-box.par");
  if (ibSeg) {
    const dG = K.segDerivGuia,
      cG = K.segConvGuia;
    ibSeg.querySelector(".ib-big").textContent =
      (dG > 0 ? (cG / dG) * 100 : 0).toFixed(1) + "%";
    const rows = ibSeg.querySelectorAll(".ib-val");
    if (rows[0]) rows[0].textContent = fmtN(dG);
    if (rows[1]) rows[1].textContent = fmtN(cG);
    if (rows[2]) rows[2].textContent = fmtN(dG - cG);
    if (rows[3]) rows[3].textContent = "S/ " + fmt(K.segVentaNR);
    // Actualizar etiqueta a "Recetas" cuando existe columna guia
    if (K.hasGuiaCol) {
      const keys = ibSeg.querySelectorAll(".ib-key");
      if (keys[0]) keys[0].textContent = "Recetas";
    }
  }
  if (ibPar) {
    const dG = K.parDerivGuia,
      cG = K.parConvGuia;
    ibPar.querySelector(".ib-big").textContent =
      (dG > 0 ? (cG / dG) * 100 : 0).toFixed(1) + "%";
    const rows = ibPar.querySelectorAll(".ib-val");
    if (rows[0]) rows[0].textContent = fmtN(dG);
    if (rows[1]) rows[1].textContent = fmtN(cG);
    if (rows[2]) rows[2].textContent = fmtN(dG - cG);
    if (rows[3]) rows[3].textContent = "S/ " + fmt(K.parVentaNR);
    if (K.hasGuiaCol) {
      const keys = ibPar.querySelectorAll(".ib-key");
      if (keys[0]) keys[0].textContent = "Recetas";
    }
  }
  // Alerta particular (panel rojo)
  const alertPar = document.querySelector('[style*="fff8f8"] span');
  if (alertPar) {
    const parPct =
      K.parDerivGuia > 0
        ? ((K.parConvGuia / K.parDerivGuia) * 100).toFixed(1)
        : "0.0";
    alertPar.textContent = `⚠ Los pacientes Particulares convierten apenas el ${parPct}% de sus recetas en ventas.`;
  }

  // ── Proyecciones dinámicas ──────────────────────────────
  renderProyecciones(K);

  // ─── GRÁFICOS ──────────────────────────────────────────
  renderBarChart(D.recetas);
  renderRankingTable(D.recetas);
  renderVentasMedChart(D.topMedVentas);
  renderVentasBody(D.topMedVentas);
  renderMedsIngresoChart(D.topMedIngreso);
  renderMedsUnidadesChart(D.topMedRecetas || D.topMedUnidades || []);
  renderSinStockBody(D.sinStockData.slice(0, 20));
  renderPieChart(totalSeg, totalPar);
  renderConvChart(D.convData);
  renderLossBody(D.convData);
  renderProdChart(D.topProductos);
  renderProdBody(D.topProductos);
  renderInsights(D.estrategias, D.kpi);
  renderDescuentoTable(D.estrategias);
  renderMedPrioTable(D.medPriData, D.estrategias, D.kpi);
}

// ─────────────────────────────────────────────────────────
// PROYECCIONES DINÁMICAS
// ─────────────────────────────────────────────────────────
function renderProyecciones(K) {
  const parPct =
    K.parDerivGuia > 0 ? (K.parConvGuia / K.parDerivGuia) * 100 : 0;
  const segPct =
    K.segDerivGuia > 0 ? (K.segConvGuia / K.segDerivGuia) * 100 : 0;
  const sinConv = K.parDeriv - K.parConv; // unidades sin convertir (para cálculos monetarios)
  const stockFail = Math.max(0, K.parStockFail);
  const activas = Math.max(0, sinConv - stockFail);

  // Precio por unidad = parRevNR ÷ sinConv (precio real de las PAR sin vender)
  // Margen por unidad = parVentaNR ÷ sinConv (margen de esas mismas unidades)
  const precioPorUnd = sinConv > 0 ? K.parRevNR / sinConv : K.avgPrecioUnd;
  const margenNetoPorUnd =
    sinConv > 0 ? K.parVentaNR / sinConv : K.avgPrecioUnd - K.avgCostoUnd;

  // ── Alerta ── reconstruye el HTML completo para que los IDs siempre existan
  const stockText =
    sinConv > 0
      ? `${fmtN(stockFail)} (${((stockFail / sinConv) * 100).toFixed(1)}%) no se convirtieron por falta de stock`
      : "sin datos de stock disponibles";
  const alertTxtEl = document.getElementById("stratAlertText");
  if (alertTxtEl) {
    alertTxtEl.innerHTML =
      `<strong>Brecha crítica de conversión:</strong> Los pacientes ` +
      `Particulares convierten solo el ` +
      `<strong id="parConvPct">${parPct.toFixed(1)}%</strong> de sus recetas frente al ` +
      `<strong id="segConvPct">${segPct.toFixed(1)}%</strong> en Seguros. De las ` +
      `<span id="parSinConvTotal">${fmtN(sinConv)}</span> unds. no vendidas, ` +
      `<strong id="stockAlertText">${stockText}</strong> ` +
      `— recuperables sin descuentos ni estrategias de precio. Las ` +
      `<span id="parActivaText">${fmtN(activas)}</span> unds. restantes requieren ` +
      `acciones activas de conversión.`;
  }

  // ── Tarjeta Actual ──
  set("scActualPct", parPct.toFixed(1) + "%");
  set(
    "scActualUnds",
    `${fmtN(K.parConvGuia)} / ${fmtN(K.parDerivGuia)} recetas`,
  );
  set(
    "scActualRev",
    `Ingreso potencial: S/ ${fmt(K.parRevNR)} · Ganancia: S/ ${fmt(K.parVentaNR)}`,
  );

  const ticketPromedio = K.parConvGuia > 0 ? K.parSumRev / K.parConvGuia : 0;
  set(
    "scActualBase",
    `Ticket prom. vendido: S/ ${fmt(ticketPromedio)} · Línea base`,
  );

  // ── Escenarios ──
  const escenarios = [
    {
      pct: 15,
      elPct: "scConsPct",
      elUnds: "scConsUnds",
      elRev: "scConsRev",
      elGain: "scConsGain",
    },
    {
      pct: 25,
      elPct: "scModPct",
      elUnds: "scModUnds",
      elRev: "scModRev",
      elGain: "scModGain",
    },
    {
      pct: 40,
      elPct: "scOptPct",
      elUnds: "scOptUnds",
      elRev: "scOptRev",
      elGain: "scOptGain",
    },
  ];

  // Proyectar basado en el comportamiento histórico (Ticket Promedio)
  // en lugar del valor de las recetas perdidas.
  const ingresoPorRecetaAprox =
    K.parConvGuia > 0 ? K.parSumRev / K.parConvGuia : 0;
  const gananciaPorRecetaAprox =
    K.parConvGuia > 0 ? K.parSumGan / K.parConvGuia : 0;

  escenarios.forEach((sc) => {
    const nuevasConvRecetas = Math.round((K.parDerivGuia * sc.pct) / 100);
    const deltaRecetas = Math.max(0, nuevasConvRecetas - K.parConvGuia);
    const ingresoAdd = deltaRecetas * ingresoPorRecetaAprox;
    const gananciaAdd = deltaRecetas * gananciaPorRecetaAprox;
    set(sc.elPct, sc.pct + "%");
    set(sc.elUnds, "+" + fmtN(deltaRecetas) + " recetas más");
    set(
      sc.elRev,
      "+ S/ " + fmtN(Math.round(ingresoAdd)) + " en ingreso adicional",
    );
    set(sc.elGain, "+ S/ " + fmtN(Math.round(gananciaAdd)) + " ganancia neta");
  });
}

function set(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}

// ─────────────────────────────────────────────────────────
// GRÁFICO: BAR CHART ATENCIONES POR MÉDICO
// ─────────────────────────────────────────────────────────
function renderBarChart(data) {
  _recetasData = data;
  window._recetasData = data; // Export it for fetchHistoriasDigitales to access
  destroyChart("barChart");
  const labels = data.map((d) => abreviar(d.medico));
  const totales = data.map((d) => d.seguro + d.particular);
  const ctx = document.getElementById("barChart").getContext("2d");

  let datasets;
  if (barChartMode === "uni") {
    datasets = [
      {
        label: "Total",
        data: totales,
        backgroundColor: "#6366f1",
        borderRadius: 4,
        borderSkipped: false,
      },
    ];
  } else {
    const seguros = data.map((d) => d.seguro);
    const parts = data.map((d) => d.particular);
    datasets = [
      {
        label: "Seguro",
        data: seguros,
        backgroundColor: "#2e86de",
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Particular",
        data: parts,
        backgroundColor: "#f39c12",
        borderRadius: 4,
        borderSkipped: false,
      },
    ];
  }

  const tooltipCallbacks = {
    title: (items) => data[items[0].dataIndex].medico,
  };
  if (barChartMode === "sep") {
    tooltipCallbacks.afterBody = (items) =>
      `Total: ${totales[items[0].dataIndex]}`;
  }

  charts["barChart"] = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: tooltipCallbacks },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            color: "#4b5563",
            maxRotation: 35,
            minRotation: 25,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "#f0f2f5" },
          ticks: { font: { size: 11 }, color: "#9ca3af", stepSize: 5 },
        },
      },
    },
  });
}

function setBarMode(mode) {
  barChartMode = mode;
  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  const legend = document.getElementById("barLegend");
  if (legend) legend.style.display = mode === "sep" ? "" : "none";
  const sub = document.getElementById("barSubtitle");
  if (sub)
    sub.textContent =
      mode === "sep"
        ? "Agrupado por tipo de atención"
        : "Total de recetas (Seguro + Particular)";
  if (_recetasData) renderBarChart(_recetasData);
}

// RANKING TABLE
function renderRankingTable(data) {
  const tbody = document.getElementById("rankingBody");
  tbody.innerHTML = "";
  const maxTotal = Math.max(...data.map((d) => d.seguro + d.particular));
  data.forEach((d, i) => {
    const total = d.seguro + d.particular;
    const segW = ((d.seguro / maxTotal) * 60).toFixed(1);
    const parW = ((d.particular / maxTotal) * 60).toFixed(1);
    const isTop = i < 3;
    const spinner = '<span class="us-spin" style="width:12px;height:12px;border-width:2px;display:inline-block"></span>';
    const atenciones =
      d.atenciones !== undefined ? fmtN(d.atenciones) : spinner;
    const pctCell =
      d.atenciones !== undefined && d.atenciones > 0
        ? `<span style="font-size:.8rem;font-weight:700;color:#2563eb">${((total / d.atenciones) * 100).toFixed(1)}%</span>`
        : d.atenciones === 0
          ? '<span style="font-size:.78rem;color:#9ca3af">0%</span>'
          : spinner;

    tbody.innerHTML += `<tr>
      <td><span class="rank-num ${isTop ? "top" : ""}">${i + 1}</span></td>
      <td>
        <div class="medico-name">${d.medico.split(" ").slice(0, 2).join(" ")}</div>
        <div class="mini-bar-wrap">
          <div class="mini-bar seg" style="width:${segW}px"></div>
          <div class="mini-bar par" style="width:${parW}px"></div>
        </div>
      </td>
      <td class="num"><span class="pill seg">${d.seguro}</span></td>
      <td class="num"><span class="pill par">${d.particular}</span></td>
      <td class="num" style="color:#1a2035;font-size:.88rem">${total}</td>
      <td class="num"><span class="pill" style="background:#f3f4f6;color:#374151;border:1px solid #e5e7eb">${atenciones}</span></td>
      <td class="num">${pctCell}</td>
    </tr>`;
  });
}

// VENTAS MED CHART
function renderVentasMedChart(data) {
  _ventasMedData = data;
  destroyChart("ventasMedChart");

  const ctx = document.getElementById("ventasMedChart").getContext("2d");
  const labels = [...data].reverse().map((d) => d.abr);
  let datasets;

  if (ventasMedMode === "sep") {
    datasets = [
      {
        label: "Seguro (S/)",
        data: [...data].reverse().map((d) => d.ventasSeg),
        backgroundColor: "#2e86de",
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Particular (S/)",
        data: [...data].reverse().map((d) => d.ventasPar),
        backgroundColor: "#f39c12",
        borderRadius: 4,
        borderSkipped: false,
      },
    ];
  } else {
    const ventasColors = data.map(
      (_, i) =>
        `rgb(${Math.round(30 + i * 8)},${Math.round(106 + i * 3)},${Math.round(255 - (i / data.length) * 130)})`,
    );
    datasets = [
      {
        label: "Ventas (S/)",
        data: [...data].reverse().map((d) => d.ventas),
        backgroundColor: [...ventasColors].reverse(),
        borderRadius: 4,
        borderSkipped: false,
      },
    ];
  }

  const tooltipCallbacks = {
    title: (items) => {
      const idx = data.length - 1 - items[0].dataIndex;
      return data[idx].medico;
    },
    afterBody: (items) => {
      const idx = data.length - 1 - items[0].dataIndex;
      const d = data[idx];
      return [
        `Recetas: ${d.recetas}`,
        `Unds.: ${d.unidades}`,
        `Ticket prom.: S/ ${d.ticket.toFixed(2)}`,
        ...(ventasMedMode === "sep"
          ? [
              `Total: S/ ${d.ventas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
            ]
          : []),
      ];
    },
    label: (item) =>
      ` S/ ${item.raw.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
  };

  charts["ventasMedChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets,
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: tooltipCallbacks },
      },
      scales: {
        x: {
          stacked: ventasMedMode === "sep",
          beginAtZero: true,
          grid: { color: "#f0f2f5" },
          ticks: {
            font: { size: 11 },
            color: "#9ca3af",
            callback: (v) => "S/ " + v.toLocaleString("es-PE"),
          },
        },
        y: {
          stacked: ventasMedMode === "sep",
          grid: { display: false },
          ticks: { font: { size: 11 }, color: "#374151" },
        },
      },
    },
  });
}

function setVentasMedMode(mode) {
  ventasMedMode = mode;
  document.querySelectorAll("[data-vmed-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.vmedMode === mode);
  });
  const legend = document.getElementById("vmedLegend");
  if (legend) legend.style.display = mode === "sep" ? "" : "none";
  const sub = document.getElementById("ventasMedSubtitle");
  if (sub)
    sub.textContent =
      mode === "sep"
        ? "Agrupado por tipo de atención"
        : "Total venta realizada (S/) — exluye médicos sin conversiones";
  if (_ventasMedData) renderVentasMedChart(_ventasMedData);
}

// VENTAS BODY TABLE
function renderVentasBody(data) {
  const tbody = document.getElementById("ventasBody");
  tbody.innerHTML = "";
  data.forEach((d, i) => {
    const isTop = i < 3;
    tbody.innerHTML += `<tr>
      <td><span class="rank-num ${isTop ? "top" : ""}">${i + 1}</span>
          <span style="font-size:.78rem;font-weight:600;">${d.medico.split(" ").slice(0, 2).join(" ")}</span></td>
      <td class="r" style="font-size:.78rem;">${d.recetas}</td>
      <td class="r" style="font-size:.78rem;">${(d.convPct || 0).toFixed(1)}%</td>
      <td class="r"><span class="ticket-val">S/ ${d.ticket.toFixed(2)}</span></td>
      <td class="r" style="font-weight:700;color:#1a2035;">S/ ${d.ventas.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
    </tr>`;
  });
}

// TOP MEDS INGRESO CHART
function renderMedsIngresoChart(data) {
  _medsIngresoData = data;
  destroyChart("medsIngresoChart");
  const ctx = document.getElementById("medsIngresoChart").getContext("2d");
  const labels = [...data].reverse().map((p) => p.producto);
  let datasets;
  if (medsIngresoMode === "sep") {
    datasets = [
      {
        label: "Seguro (S/)",
        data: [...data].reverse().map((p) => p.ingresoSeg),
        backgroundColor: "#2e86de",
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Particular (S/)",
        data: [...data].reverse().map((p) => p.ingresoPar),
        backgroundColor: "#f39c12",
        borderRadius: 4,
        borderSkipped: false,
      },
    ];
  } else {
    datasets = [
      {
        label: "Ingreso (S/)",
        data: [...data].reverse().map((p) => p.ingreso),
        backgroundColor: "#2e86de",
        borderRadius: 4,
        borderSkipped: false,
      },
    ];
  }

  charts["medsIngresoChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets,
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) =>
              ` S/ ${item.raw.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
            afterBody: (items) => {
              const idx = data.length - 1 - items[0].dataIndex;
              const d = data[idx];
              return [
                `Unds. vendidas: ${d.unidades}`,
                ...(medsIngresoMode === "sep"
                  ? [
                      `Total: S/ ${d.ingreso.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
                    ]
                  : []),
              ];
            },
          },
        },
      },
      scales: {
        x: {
          stacked: medsIngresoMode === "sep",
          beginAtZero: true,
          grid: { color: "#f0f2f5" },
          ticks: {
            font: { size: 10 },
            color: "#9ca3af",
            callback: (v) => "S/ " + v,
          },
        },
        y: {
          stacked: medsIngresoMode === "sep",
          grid: { display: false },
          ticks: { font: { size: 10 }, color: "#374151" },
        },
      },
    },
  });
}

function setMedsIngresoMode(mode) {
  medsIngresoMode = mode;
  document.querySelectorAll("[data-mingreso-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mingresoMode === mode);
  });
  const legend = document.getElementById("mingresoLegend");
  if (legend) legend.style.display = mode === "sep" ? "" : "none";
  const sub = document.getElementById("medsIngresoSubtitle");
  if (sub)
    sub.textContent =
      mode === "sep"
        ? "Agrupado por tipo de atención"
        : "Monto total vendido (S/)";
  if (_medsIngresoData) renderMedsIngresoChart(_medsIngresoData);
}

// TOP MEDS RECETAS CHART
function renderMedsUnidadesChart(data) {
  _medsUnidadesData = data;
  destroyChart("medsUnidadesChart");
  const ctx = document.getElementById("medsUnidadesChart").getContext("2d");
  const labels = [...data].reverse().map((p) => p.producto);
  let datasets;
  if (medsUnidadesMode === "sep") {
    datasets = [
      {
        label: "Seguro",
        data: [...data].reverse().map((p) => p.unidadesSeg),
        backgroundColor: "#2e86de",
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: "Particular",
        data: [...data].reverse().map((p) => p.unidadesPar),
        backgroundColor: "#f39c12",
        borderRadius: 4,
        borderSkipped: false,
      },
    ];
  } else {
    datasets = [
      {
        label: "Unds. vendidas",
        data: [...data].reverse().map((p) => p.unidades),
        backgroundColor: "#8b5cf6",
        borderRadius: 4,
        borderSkipped: false,
      },
    ];
  }

  charts["medsUnidadesChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets,
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => ` ${item.raw} unds. vendidas`,
            afterBody: (items) => {
              const idx = data.length - 1 - items[0].dataIndex;
              const d = data[idx];
              return [
                `Recetadas: ${d.derivada} unds.`,
                `Ingreso: S/ ${d.ingreso.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
                ...(medsUnidadesMode === "sep"
                  ? [`Total vendidas: ${d.unidades}`]
                  : []),
              ];
            },
          },
        },
      },
      scales: {
        x: {
          stacked: medsUnidadesMode === "sep",
          beginAtZero: true,
          grid: { color: "#f0f2f5" },
          ticks: { font: { size: 10 }, color: "#9ca3af" },
        },
        y: {
          stacked: medsUnidadesMode === "sep",
          grid: { display: false },
          ticks: { font: { size: 10 }, color: "#374151" },
        },
      },
    },
  });
}

function setMedsUnidadesMode(mode) {
  medsUnidadesMode = mode;
  document.querySelectorAll("[data-munidades-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.munidadesMode === mode);
  });
  const legend = document.getElementById("munidadesLegend");
  if (legend) legend.style.display = mode === "sep" ? "" : "none";
  const sub = document.getElementById("medsUnidadesSubtitle");
  if (sub)
    sub.textContent =
      mode === "sep"
        ? "Agrupado por tipo de atención"
        : "Unidades vendidas por receta";
  if (_medsUnidadesData) renderMedsUnidadesChart(_medsUnidadesData);
}

// SIN STOCK TABLE
function renderSinStockBody(data) {
  const tbody = document.getElementById("sinstockBody");
  tbody.innerHTML = "";
  data.forEach((d, i) => {
    const pct = d.deriv > 0 ? ((d.conv / d.deriv) * 100).toFixed(1) : "0.0";
    const p = parseFloat(pct);
    let rowCls = "",
      convCls = "",
      convIcon = "";
    if (p === 0) {
      rowCls = "crit";
      convCls = "c-zero";
      convIcon = "✗";
    } else if (p < 50) {
      rowCls = "warn";
      convCls = "c-low";
      convIcon = "▲";
    } else if (p < 100) {
      rowCls = "";
      convCls = "c-mid";
      convIcon = "●";
    } else {
      rowCls = "";
      convCls = "c-full";
      convIcon = "✓";
    }
    tbody.innerHTML += `<tr class="${rowCls}">
      <td style="color:#9ca3af;font-size:.75rem;font-weight:600;">${i + 1}</td>
      <td style="font-weight:600;font-size:.8rem;">${d.producto}</td>
      <td class="r"><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:.72rem;font-weight:700;">${d.veces}×</span></td>
      <td class="r" style="font-size:.8rem;">${d.deriv}</td>
      <td class="r" style="font-size:.8rem;">${d.conv}</td>
      <td class="r"><span class="conv-ring ${convCls}">${convIcon} ${pct}%</span></td>
    </tr>`;
  });
}

// PIE CHART
function renderPieChart(seg, par) {
  destroyChart("pieChart");
  const ctx = document.getElementById("pieChart").getContext("2d");
  charts["pieChart"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Seguro", "Particular"],
      datasets: [
        {
          data: [seg, par],
          backgroundColor: ["#2e86de", "#f39c12"],
          hoverBackgroundColor: ["#1a6fc4", "#d4870a"],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => {
              const val = item.raw;
              const pct = ((val / (seg + par)) * 100).toFixed(1);
              return ` ${val} recetas (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// CONV CHART
function renderConvChart(data) {
  _convData = data;
  destroyChart("convChart");
  const ctx = document.getElementById("convChart").getContext("2d");

  const isAten = convChartMode === "aten";
  const datasets = isAten
    ? [
        {
          label: "Con conversión",
          data: data.map((d) => d.atenConv),
          backgroundColor: "#27ae60",
          borderRadius: 0,
          borderSkipped: false,
        },
        {
          label: "Sin conversión",
          data: data.map((d) => d.atenSinConv),
          backgroundColor: "#e74c3c",
          borderRadius: 4,
          borderSkipped: "bottom",
        },
      ]
    : [
        {
          label: "Convertidas",
          data: data.map((d) => d.conv),
          backgroundColor: "#27ae60",
          borderRadius: 0,
          borderSkipped: false,
        },
        {
          label: "Sin convertir",
          data: data.map((d) => d.sinConv),
          backgroundColor: "#e74c3c",
          borderRadius: 4,
          borderSkipped: "bottom",
        },
      ];

  const tooltipAfterBody = isAten
    ? (items) => {
        const d = data[items[0].dataIndex];
        const total = d.atenConv + d.atenSinConv;
        const pct = total > 0 ? ((d.atenConv / total) * 100).toFixed(1) : "0.0";
        return [`Total recetas: ${total}`, `Tasa conv.: ${pct}%`];
      }
    : (items) => {
        const d = data[items[0].dataIndex];
        return [
          `Total deriv.: ${d.deriv}`,
          `Tasa conv.: ${d.pct}%`,
          `Ganan. Neta no realiz.: S/ ${d.ganPerd.toFixed(2)}`,
        ];
      };

  charts["convChart"] = new Chart(ctx, {
    type: "bar",
    data: { labels: data.map((d) => d.abr), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => data[items[0].dataIndex].medico,
            afterBody: tooltipAfterBody,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            color: "#4b5563",
            maxRotation: 35,
            minRotation: 25,
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: "#f0f2f5" },
          ticks: { font: { size: 11 }, color: "#9ca3af" },
        },
      },
    },
  });
}

function setConvMode(mode) {
  convChartMode = mode;
  document.querySelectorAll("[data-conv-mode]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.convMode === mode);
  });
  const sub = document.getElementById("convSubtitle");
  if (sub)
    sub.textContent =
      mode === "uni"
        ? "Unidades recetadas (derivadas) y vendidas (convertidas)"
        : "Recetas con y sin conversión por médico (campo admision)";
  if (_convData) renderConvChart(_convData);
}

// LOSS BODY TABLE
function renderLossBody(data) {
  const tbody = document.getElementById("lossBody");
  tbody.innerHTML = "";
  [...data]
    .sort((a, b) => b.ganPerd - a.ganPerd)
    .forEach((d) => {
      const pctConv = d.pctRec !== undefined ? d.pctRec : d.pct;
      const pctNoConv = parseFloat((100 - pctConv).toFixed(1));
      const cls = pctNoConv >= 65 ? "low" : pctNoConv >= 35 ? "mid" : "high";
      tbody.innerHTML += `<tr>
      <td style="font-size:.78rem;font-weight:600;">${d.medico.split(" ").slice(0, 2).join(" ")}</td>
      <td class="r"><span class="pct-badge ${cls}">${pctNoConv}%</span></td>
      <td class="r"><span class="loss-amount">S/ ${d.ganPerd.toFixed(2)}</span></td>
    </tr>`;
    });
}

// PROD CHART
function renderProdChart(data) {
  destroyChart("prodChart");
  const ctx = document.getElementById("prodChart").getContext("2d");
  charts["prodChart"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [...data].reverse().map((p) => p.producto),
      datasets: [
        {
          label: "Pot. no realizado (S/)",
          data: [...data].reverse().map((p) => p.ganPerd),
          backgroundColor: (ctx) => {
            const v = ctx.raw;
            return v >= 500 ? "#e74c3c" : v >= 300 ? "#e67e22" : "#f39c12";
          },
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (item) => ` S/ ${item.raw.toFixed(2)}` },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: "#f0f2f5" },
          ticks: {
            font: { size: 11 },
            color: "#9ca3af",
            callback: (v) => "S/ " + v,
          },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: "#374151" },
        },
      },
    },
  });
}

// PROD BODY TABLE
function renderProdBody(data) {
  const tbody = document.getElementById("prodBody");
  tbody.innerHTML = "";
  data.forEach((p) => {
    tbody.innerHTML += `<tr>
      <td style="font-size:.75rem;font-weight:600;max-width:140px;">${p.producto}</td>
      <td class="r" style="font-size:.78rem;">${p.sinConv}</td>
      <td class="r" style="font-size:.78rem;">S/ ${p.totSin.toFixed(2)}</td>
      <td class="r"><span class="loss-amount" style="font-size:.82rem;">S/ ${p.ganPerd.toFixed(2)}</span></td>
    </tr>`;
  });
}

// ─────────────────────────────────────────────────────────
// INSIGHTS CLAVE — renderizado dinámico
// ─────────────────────────────────────────────────────────
function renderInsights(E, K) {
  const row = document.getElementById("insightRow");
  if (!row) return;

  const sinConv = K.parDeriv - K.parConv;
  const stockPct = sinConv > 0 ? ((E.stockUnds / sinConv) * 100).toFixed(1) : 0;
  const badPct =
    E.nAltoMargen > 0
      ? (100 - (E.nAltoMargen / (E.nAltoMargen + E.nBajoMargen)) * 100).toFixed(
          0,
        )
      : 0;

  // Benchmark: mejor médico Particular
  const bench = E.mejorMedPar;
  const benchNom = bench ? bench.medico.split(" ").slice(0, 2).join(" ") : "—";
  const benchEsp = bench ? bench.especialidad || "" : "";
  const benchPct = bench ? bench.pct.toFixed(1) + "%" : "—";
  const avgParPct =
    K.parDeriv > 0 ? ((K.parConv / K.parDeriv) * 100).toFixed(1) : 0;

  row.innerHTML = `
    <div class="insight-card ins-red">
      <div class="insight-icon">📦</div>
      <div>
        <div class="insight-title">
          ${fmtN(E.stockUnds)} unds no vendidas por falta de stock — S/ ${fmtN(Math.round(E.stockValRecup))} recuperables
        </div>
        <div class="insight-desc">
          El ${stockPct}% del potencial no realizado Particular se debe a
          <code>sto_med ≤ 0</code> al momento de la atención. Resolver el quiebre de stock
          es la palanca de mayor impacto sin necesidad de modificar precios ni márgenes.
        </div>
      </div>
    </div>
    <div class="insight-card ins-amber">
      <div class="insight-icon">📊</div>
      <div>
        <div class="insight-title">
          Solo ${E.nAltoMargen} productos pueden absorber descuentos — el ${badPct}% tiene margen &lt;20%
        </div>
        <div class="insight-desc">
          Los descuentos son viables únicamente en los ${E.nAltoMargen} productos con margen ≥ 30%,
          donde incluso con 20% de descuento se mantiene rentabilidad positiva.
          Ganancia neta simulada con 15% descuento: S/ ${fmtN(Math.round(E.ganNeta15dscto))}.
        </div>
      </div>
    </div>
    <div class="insight-card ins-teal">
      <div class="insight-icon">👩‍⚕️</div>
      <div>
        <div class="insight-title">
          ${benchNom} convierte al ${benchPct}${benchEsp ? " — modelo a replicar en " + benchEsp : ""}
        </div>
        <div class="insight-desc">
          ${benchNom} ${bench && bench.pct > parseFloat(avgParPct) * 1.5 ? "supera" : "lidera"} la tasa promedio Particular
          (${avgParPct}%). Identificar y replicar sus prácticas hacia los médicos de menor conversión
          puede tener alto impacto sin costo adicional.
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────
// TABLA CANDIDATOS A DESCUENTO — renderizado dinámico
// ─────────────────────────────────────────────────────────
function renderDescuentoTable(E) {
  const tbody = document.getElementById("descuentoBody");
  if (!tbody) return;
  const prods = E.top4AltoMargen.length
    ? E.prodsAltoMargenSlice || E.top4AltoMargen
    : [];

  // Usar prodsAltoMargen completo si está disponible, si no top4 del objeto estrategias
  const list = (E.prodsAltoMargenFull || E.top4AltoMargen || []).slice(0, 10);

  if (!list.length) {
    tbody.innerHTML =
      "<tr><td colspan='7' style='text-align:center;padding:16px;color:#9ca3af'>No hay productos con margen ≥ 30% en el período cargado</td></tr>";
    return;
  }

  let totalUnds = 0,
    totSin = 0,
    tot10 = 0;
  let rows = "";
  list.forEach((p) => {
    const ganSin = p.sinConv * (p.precio - p.costo);
    const gan10 = p.sinConv * (p.precio * 0.9 - p.costo);
    const mCls = p.margen >= 45 ? "alto" : "medio";
    totalUnds += p.sinConv;
    totSin += ganSin;
    tot10 += gan10;
    rows += `<tr>
      <td style="font-size:.8rem">${p.producto.replace(/\bTAB\b|\bCOMP\b|\bCAP\b|\bSOL\b/gi, (m) => m.toLowerCase())}</td>
      <td class="r">${fmtN(Math.round(p.sinConv))}</td>
      <td class="r"><span class="margen-badge ${mCls}">${p.margen.toFixed(1)}%</span></td>
      <td class="r">S/ ${fmt(ganSin)}</td>
      <td class="r"><span class="desc-val">S/ ${fmt(Math.max(0, gan10))}</span></td>
    </tr>`;
  });
  rows += `<tr>
    <td><strong>TOTAL</strong></td>
    <td class="r"><strong>${fmtN(Math.round(totalUnds))}</strong></td>
    <td class="r">&mdash;</td>
    <td class="r"><strong>S/ ${fmt(totSin)}</strong></td>
    <td class="r"><strong>S/ ${fmt(Math.max(0, tot10))}</strong></td>

  </tr>`;
  tbody.innerHTML = rows;
}

// ─────────────────────────────────────────────────────────
// TABLA MÉDICOS PRIORITARIOS — renderizado dinámico
// ─────────────────────────────────────────────────────────
function renderMedPrioTable(medPriData, E, K) {
  const tbody = document.getElementById("medprioBody");
  if (!tbody || !medPriData || !medPriData.length) return;

  const mejorPct = E.mejorMedPar ? E.mejorMedPar.pct : 0;
  let rows = "";
  medPriData.forEach((d) => {
    const pct = d.pct;
    const barW = Math.min(Math.round(pct * 1.5), 120);
    const cls = pct >= 40 ? "high" : pct >= 15 ? "mid" : "low";
    const nombre = d.medico
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    const esp = d.especialidad || "—";
    const isBench =
      d.isBenchmark || (E.mejorMedPar && d.medico === E.mejorMedPar.medico);
    const isMayor =
      d.isMayorTasa || (mejorPct > 0 && pct === mejorPct && !isBench);
    const tag = isBench
      ? '<span class="benchmark-tag">Benchmark</span>'
      : isMayor
        ? '<span class="model-tag">Mayor tasa</span>'
        : "";
    const pot =
      d.ganPerd >= 500
        ? `<strong>S/ ${fmt(d.ganPerd)}</strong>`
        : `S/ ${fmt(d.ganPerd)}`;
    rows += `<tr>
      <td>${nombre}${tag}</td>
      <td>${esp}</td>
      <td class="r">${fmtN(d.deriv)}</td>
      <td class="r">${fmtN(d.sinConv)}</td>
      <td class="r">
        <div class="conv-bar-wrap" style="justify-content:flex-end">
          <div class="conv-bar ${cls}" style="width:${barW}px"></div>
          <span class="conv-pct ${cls}">${pct.toFixed(1)}%</span>
        </div>
      </td>
      <td class="r">${pot}</td>
    </tr>`;
  });
  tbody.innerHTML = rows;
}

// ─────────────────────────────────────────────────────────
// PARSEO DE EXCEL  (SheetJS)
// ─────────────────────────────────────────────────────────
function parseExcel(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      setStatus(
        `<span class="us-spin"></span> <span class="us-info">Procesando ${file.name}…</span>`,
      );
      const wb = XLSX.read(e.target.result, { type: "array", cellDates: true });
      const D = buildDataFromWorkbook(wb, file.name);
      saveToCache(D);
      renderDashboard(D);
      setStatus(
        `<span class="us-ok">✓ Cargado</span> <span class="us-date">Rango: ${D.fechaRango}</span> <span class="us-info">· ${D.archivoNom} · ${D.totalRows} registros</span>`,
      );
    } catch (err) {
      setStatus(
        `<span class="us-err">✗ Error al procesar:</span> <span class="us-info">${err.message}</span>`,
      );
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

function setStatus(html) {
  uploadStatus.innerHTML = html;
}

// ─────────────────────────────────────────────────────────
// CONSTRUCCIÓN DE DATOS DESDE WORKBOOK
// Asume primera hoja con columnas:
//   med_nomb | tipo_atencion | fec_atencion | can_derivada | can_conversion |
//   tot_conversion | t_costo_conver | tot_sinconversion | t_costo_sin_conver |
//   sto_med | prod_nomb | precio_venta | costo
// (acepta variaciones en mayúsculas/minúsculas)
// ─────────────────────────────────────────────────────────
function buildDataFromWorkbook(wb, fileName) {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  if (!rows.length) throw new Error("La hoja está vacía");

  // normalizar claves a minúsculas sin espacios
  const norm = rows.map((r) => {
    const out = {};
    for (const k in r) {
      out[k.toLowerCase().trim().replace(/\s+/g, "_")] = r[k];
    }
    return out;
  });

  // ── detectar rango de fechas ──────────────────────────
  const COL_FECHA = [
    "fecha",
    "fec_atencion",
    "fecha_atencion",
    "date",
    "fec_ate",
  ];
  let fechaCol = COL_FECHA.find((c) => norm[0][c] !== undefined);
  let minDate = null,
    maxDate = null;
  if (fechaCol) {
    norm.forEach((r) => {
      const d = excelDateToJS(r[fechaCol]);
      if (d && !isNaN(d)) {
        if (!minDate || d < minDate) minDate = d;
        if (!maxDate || d > maxDate) maxDate = d;
      }
    });
  }
  let fechaRango = "Período cargado";
  if (minDate && maxDate) {
    if (
      minDate.getMonth() === maxDate.getMonth() &&
      minDate.getFullYear() === maxDate.getFullYear()
    ) {
      fechaRango = mesAnio(minDate);
    } else {
      fechaRango = mesAnio(minDate) + " / " + mesAnio(maxDate);
    }
    // Capitalizar
    fechaRango = fechaRango.replace(/^\w|\s\w/g, (m) => m.toUpperCase());
  }

  // ── helpers de columna ────────────────────────────────
  const get = (row, ...cols) => {
    for (const c of cols) {
      if (row[c] !== undefined && row[c] !== "") return row[c];
    }
    return 0;
  };
  const num = (v) => parseFloat(v) || 0;

  // helpers de médico y tipo (prioriza nombres reales del Excel)
  const getMed = (r) =>
    String(
      get(r, "medico", "med_nomb", "med_nombre", "doctor") || "DESCONOCIDO",
    )
      .toUpperCase()
      .trim();
  const getTipo = (r) =>
    String(get(r, "tipo", "tipo_atencion", "tipo_ate") || "").toUpperCase();

  // ── ATENCIONES POR MÉDICO ─────────────────────────────
  const atenMap = {};
  norm.forEach((r) => {
    const med = getMed(r);
    const tipo = getTipo(r);
    const cod = String(
      get(r, "cod_ser", "codigo_servicio", "cod_servicio") || "",
    ).trim();

    if (!atenMap[med])
      atenMap[med] = {
        medico: med,
        seguro: 0,
        particular: 0,
        codigos: new Set(),
      };
    if (tipo.includes("SEG")) atenMap[med].seguro++;
    else if (tipo.includes("PAR")) atenMap[med].particular++;
    else atenMap[med].particular++;

    if (cod) atenMap[med].codigos.add(cod);
  });
  // Deduplicar por admision si existe columna admision
  const COL_ADM = ["admision", "adm", "admisión"];
  const admCol = COL_ADM.find((c) => norm[0][c] !== undefined);
  let recetas;
  if (admCol) {
    // contar admisiones únicas por médico/tipo
    const admByMed = {};
    norm.forEach((r) => {
      const med = getMed(r);
      const tipo = getTipo(r);
      const cod = String(
        get(r, "cod_ser", "codigo_servicio", "cod_servicio") || "",
      ).trim();
      const adm = String(r[admCol] || "").trim();
      const key = med + "|" + adm;
      if (!admByMed[key]) admByMed[key] = { med, tipo, cod };
      // Ojo: si una admision tiene multiples codigos de servicio se guarda el primero (poco probable pero posible)
    });
    const atenMap2 = {};
    Object.values(admByMed).forEach(({ med, tipo, cod }) => {
      if (!atenMap2[med])
        atenMap2[med] = {
          medico: med,
          seguro: 0,
          particular: 0,
          codigos: new Set(),
        };
      if (tipo.includes("SEG")) atenMap2[med].seguro++;
      else atenMap2[med].particular++;

      if (cod) atenMap2[med].codigos.add(cod);
    });
    recetas = Object.values(atenMap2)
      .map((d) => ({ ...d, codigos: [...d.codigos] }))
      .sort((a, b) => b.seguro + b.particular - (a.seguro + a.particular));
  } else {
    recetas = Object.values(atenMap)
      .map((d) => ({ ...d, codigos: [...d.codigos] }))
      .sort((a, b) => b.seguro + b.particular - (a.seguro + a.particular));
  }

  // ── CONVERSIÓN POR MÉDICO (con especialidad) ──────────────
  const convMap = {};
  norm.forEach((r) => {
    const med = getMed(r);
    const abr = med.split(" ")[0];
    const esp = String(
      get(r, "especialidad", "espec", "esp", "esp_nomb", "servicio") || "",
    ).trim();
    if (!convMap[med])
      convMap[med] = {
        medico: med,
        abr,
        especialidad: esp,
        deriv: 0,
        conv: 0,
        sinConv: 0,
        ganReal: 0,
        ganPerd: 0,
      };
    // actualiza especialidad si la encontramos ahora
    if (!convMap[med].especialidad && esp) convMap[med].especialidad = esp;
    convMap[med].deriv += num(get(r, "can_derivada"));
    convMap[med].conv += num(get(r, "can_conversion"));
    convMap[med].sinConv += num(get(r, "can_sinconvert"));
    convMap[med].ganReal +=
      num(get(r, "tot_conversion")) - num(get(r, "t_costo_conver"));
    convMap[med].ganPerd +=
      num(get(r, "tot_sinconversion")) - num(get(r, "t_costo_sin_conver"));
  });
  const convData = Object.values(convMap)
    .map((d) => {
      d.pct =
        d.deriv > 0 ? parseFloat(((d.conv / d.deriv) * 100).toFixed(1)) : 0;
      d.atenConv = 0;
      d.atenSinConv = 0;
      return d;
    })
    .sort((a, b) => b.deriv - a.deriv);

  // Enriquecer convData con recetas únicas por médico (admision o guia como fallback)
  const _recIdCol = admCol || guiaCol;
  if (_recIdCol) {
    const recConvSet = {};
    norm.forEach((r) => {
      const med = getMed(r);
      const id = String(r[_recIdCol] || "").trim();
      if (!id) return;
      const key = med + "|" + id;
      if (!recConvSet[key]) recConvSet[key] = { med, hasConv: false };
      if (num(get(r, "can_conversion")) > 0) recConvSet[key].hasConv = true;
    });
    const atenByMed = {};
    Object.values(recConvSet).forEach(({ med, hasConv }) => {
      if (!atenByMed[med]) atenByMed[med] = { atenConv: 0, atenSinConv: 0 };
      if (hasConv) atenByMed[med].atenConv++;
      else atenByMed[med].atenSinConv++;
    });
    convData.forEach((d) => {
      const ac = atenByMed[d.medico] || { atenConv: 0, atenSinConv: 0 };
      d.atenConv = ac.atenConv;
      d.atenSinConv = ac.atenSinConv;
    });
  }
  // pctRec: tasa de conversión basada en recetas (fallback a pct por unidades si no hay col id)
  convData.forEach((d) => {
    const totalRec = d.atenConv + d.atenSinConv;
    d.pctRec = totalRec > 0
      ? parseFloat(((d.atenConv / totalRec) * 100).toFixed(1))
      : d.pct;
  });

  // ── CONVERSIÓN SOLO PARTICULAR POR MÉDICO ─────────────────────
  // convData incluye SEGURO + PARTICULAR; convDataPar es solo PAR
  const convMapPar = {};
  norm.forEach((r) => {
    const tipo = getTipo(r);
    if (!tipo.includes("PAR")) return;
    const med = getMed(r);
    const abr = med.split(" ")[0];
    const esp = String(
      get(r, "especialidad", "espec", "esp", "esp_nomb", "servicio") || "",
    ).trim();
    if (!convMapPar[med])
      convMapPar[med] = {
        medico: med,
        abr,
        especialidad: esp,
        deriv: 0,
        conv: 0,
        sinConv: 0,
        ganReal: 0,
        ganPerd: 0,
      };
    if (!convMapPar[med].especialidad && esp)
      convMapPar[med].especialidad = esp;
    convMapPar[med].deriv += num(get(r, "can_derivada"));
    convMapPar[med].conv += num(get(r, "can_conversion"));
    convMapPar[med].sinConv += num(get(r, "can_sinconvert"));
    convMapPar[med].ganReal +=
      num(get(r, "tot_conversion")) - num(get(r, "t_costo_conver"));
    convMapPar[med].ganPerd +=
      num(get(r, "tot_sinconversion")) - num(get(r, "t_costo_sin_conver"));
  });
  const convDataPar = Object.values(convMapPar)
    .map((d) => {
      d.pct =
        d.deriv > 0 ? parseFloat(((d.conv / d.deriv) * 100).toFixed(1)) : 0;
      return d;
    })
    .sort((a, b) => b.ganPerd - a.ganPerd);

  // médicos Particular ordenados por potencial no realizado (para tabla médicos prioritarios)
  const medPriData = convDataPar.slice(0, 10);

  // ── TOP VENTAS POR MÉDICO ─────────────────────────────
  const ventMap = {};
  norm.forEach((r) => {
    const med = getMed(r);
    const tipo = getTipo(r);
    const v = num(get(r, "tot_conversion"));
    if (v <= 0) return;
    if (!ventMap[med])
      ventMap[med] = {
        medico: med,
        abr: med.split(" ")[0],
        ventas: 0,
        ventasSeg: 0,
        ventasPar: 0,
        unidades: 0,
        recetas: 0,
      };
    ventMap[med].ventas += v;
    if (tipo.includes("SEG")) ventMap[med].ventasSeg += v;
    else ventMap[med].ventasPar += v;
    ventMap[med].unidades += num(get(r, "can_conversion"));
  });
  // recetas de venta (solo las que tuvieron conversión real)
  if (admCol) {
    const admConVentaXMed = {};
    norm.forEach((r) => {
      const v = num(get(r, "tot_conversion"));
      const med = getMed(r);
      const adm = String(r[admCol] || "").trim();
      if (v > 0 && adm) {
        const key = med + "|" + adm;
        if (!admConVentaXMed[med]) admConVentaXMed[med] = new Set();
        admConVentaXMed[med].add(adm);
      }
    });
    Object.keys(admConVentaXMed).forEach((med) => {
      if (ventMap[med]) ventMap[med].recetas = admConVentaXMed[med].size;
    });
  } else if (guiaCol) {
    const guiaConVentaXMed = {};
    norm.forEach((r) => {
      const v = num(get(r, "tot_conversion"));
      const med = getMed(r);
      const guia = String(r[guiaCol] || "").trim();
      if (v > 0 && guia) {
        if (!guiaConVentaXMed[med]) guiaConVentaXMed[med] = new Set();
        guiaConVentaXMed[med].add(guia);
      }
    });
    Object.keys(guiaConVentaXMed).forEach((med) => {
      if (ventMap[med]) ventMap[med].recetas = guiaConVentaXMed[med].size;
    });
  } else {
    // Fallback: si no hay agrupadores precisos contaremos ventas donde >0
    norm.forEach((r) => {
      const v = num(get(r, "tot_conversion"));
      const med = getMed(r);
      if (v > 0 && ventMap[med]) {
        ventMap[med].recetas++;
      }
    });
  }
  const topMedVentas = Object.values(ventMap)
    .map((d) => {
      const medData = recetas.find((r) => r.medico === d.medico);
      const atenciones = medData ? medData.seguro + medData.particular : 0;
      return {
        ...d,
        ticket: d.recetas > 0 ? d.ventas / d.recetas : 0,
        atenciones,
        convPct: atenciones > 0 ? (d.recetas / atenciones) * 100 : 0,
      };
    })
    .filter((d) => d.ventas > 0)
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 10);

  // ── TOP MEDICAMENTOS ──────────────────────────────────
  const prodMap = {};
  norm.forEach((r) => {
    const prod = String(
      get(r, "prod_nomb", "producto", "descripcion", "prod_desc") || "",
    )
      .toUpperCase()
      .trim();
    if (!prod) return;
    const tipo = getTipo(r);
    if (!prodMap[prod])
      prodMap[prod] = {
        producto: prod,
        ingreso: 0,
        ingresoSeg: 0,
        ingresoPar: 0,
        unidades: 0,
        unidadesSeg: 0,
        unidadesPar: 0,
        derivada: 0,
        derivadaSeg: 0,
        derivadaPar: 0,
      };
    const ingr = num(get(r, "tot_conversion", "tot_conv"));
    const unids = num(get(r, "can_conversion", "can_conv"));
    const deriv = num(get(r, "can_derivada", "can_der"));
    prodMap[prod].ingreso += ingr;
    prodMap[prod].unidades += unids;
    prodMap[prod].derivada += deriv;
    if (tipo.includes("SEG")) {
      prodMap[prod].ingresoSeg += ingr;
      prodMap[prod].unidadesSeg += unids;
      prodMap[prod].derivadaSeg += deriv;
    } else {
      prodMap[prod].ingresoPar += ingr;
      prodMap[prod].unidadesPar += unids;
      prodMap[prod].derivadaPar += deriv;
    }
  });
  const topAllProds = Object.values(prodMap).filter((p) => p.ingreso > 0);
  const topMedIngreso = [...topAllProds]
    .sort((a, b) => b.ingreso - a.ingreso)
    .slice(0, 10);
  const topMedRecetas = [...topAllProds]
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, 10);

  // ── TOP PRODUCTOS SIN CONVERSIÓN ──────────────────────
  const prodSinMap = {};
  norm.forEach((r) => {
    const prod = String(
      get(r, "prod_nomb", "producto", "descripcion", "prod_desc") || "",
    )
      .toUpperCase()
      .trim();
    if (!prod) return;
    if (!prodSinMap[prod])
      prodSinMap[prod] = { producto: prod, sinConv: 0, totSin: 0, ganPerd: 0 };
    prodSinMap[prod].sinConv += num(get(r, "can_sinconvert", "can_sin_conv"));
    prodSinMap[prod].totSin += num(get(r, "tot_sinconversion", "tot_sin"));
    prodSinMap[prod].ganPerd +=
      num(get(r, "tot_sinconversion", "tot_sin")) -
      num(get(r, "t_costo_sin_conver", "costo_sin"));
  });
  const topProductos = Object.values(prodSinMap)
    .filter((p) => p.ganPerd > 0)
    .sort((a, b) => b.ganPerd - a.ganPerd)
    .slice(0, 10);

  // ── SIN STOCK (sto_med <= 0 incluye negativos) ────────
  const stockMap = {};
  const _admSinStock = new Set(); // admisiones únicas afectadas por sin-stock
  norm.forEach((r) => {
    const sto = num(get(r, "sto_med", "stock", "existencia"));
    if (sto > 0) return; // >0 = hay stock; 0 y negativos = sin stock
    const prod = String(get(r, "producto", "prod_nomb", "descripcion") || "")
      .toUpperCase()
      .trim();
    if (!prod) return;
    if (!stockMap[prod])
      stockMap[prod] = { producto: prod, veces: 0, deriv: 0, conv: 0 };
    stockMap[prod].veces++;
    stockMap[prod].deriv += num(get(r, "can_derivada"));
    stockMap[prod].conv += num(get(r, "can_conversion"));
    // Contabilizar admisión única afectada
    if (admCol) {
      const adm = String(r[admCol] || "").trim();
      if (adm) _admSinStock.add(adm);
    }
  });
  const sinStockData = Object.values(stockMap).sort(
    (a, b) => b.veces - a.veces,
  );
  const admisionesSinStock = _admSinStock.size;

  // ── KPIs GLOBALES ─────────────────────────────────────
  let totalDeriv = 0,
    totalConv = 0,
    ganReal = 0,
    ganPerd = 0,
    totalVentaConv = 0,
    totalVentaSinConv = 0;
  let segDeriv = 0,
    segConv = 0,
    parDeriv = 0,
    parConv = 0;
  let parVentaNR = 0, // margen neto PAR no realizado (tot_sinconv − t_costo_sinconv)
    parRevNR = 0, // ingreso bruto PAR no realizado (tot_sinconversion)
    parStockFail = 0,
    segVentaNR = 0;
  // Precio ponderado PAR: Σ(tot_conversion PAR) / Σ(can_conversion PAR)
  let parSumRev = 0,
    parSumGan = 0,
    parSumConv = 0;

  norm.forEach((r) => {
    const tipo = getTipo(r);
    const der = num(get(r, "can_derivada"));
    const conv = num(get(r, "can_conversion"));
    const totC = num(get(r, "tot_conversion"));
    const coC = num(get(r, "t_costo_conver"));
    const totS = num(get(r, "tot_sinconversion"));
    const coS = num(get(r, "t_costo_sin_conver"));
    const sto = num(get(r, "sto_med", "stock", "existencia"));
    totalDeriv += der;
    totalConv += conv;
    ganReal += totC - coC;
    ganPerd += totS - coS;
    totalVentaConv += totC;
    totalVentaSinConv += totS;
    if (tipo.includes("SEG")) {
      segDeriv += der;
      segConv += conv;
      segVentaNR += totS - coS;
    } else {
      parDeriv += der;
      parConv += conv;
      parRevNR += totS; // ingreso bruto no capturado
      parVentaNR += totS - coS; // margen neto no capturado
      if (sto <= 0) {
        parStockFail += Math.max(0, der - conv);
      }
      // precio ponderado PAR (solo unidades convertidas como referencia)
      if (conv > 0) {
        parSumRev += totC;
        parSumGan += totC - coC;
        parSumConv += conv;
      }
    }
  });
  // Precio promedio ponderado de unidades PAR convertidas (fallback si no hay sin-convertir)
  const avgPrecioUnd = parSumConv > 0 ? parSumRev / parSumConv : 21.12;
  const avgCostoUnd = avgPrecioUnd * 0.789; // mantener ratio aproximado de fallback

  // ── KPIs POR RECETA (campo guia + admision) ──────────────
  // Lógica: una admision "convirtió" si tiene ≥1 fila con guia (receta emitida).
  // Una admision "sin convertir" es aquella donde ninguna fila tiene guia.
  // Total recetas = total admisiones únicas (con guia + sin guia).
  const COL_GUIA = ["guia", "nro_guia", "num_guia", "guia_nro"];
  const guiaCol = COL_GUIA.find((c) => norm[0][c] !== undefined);
  let segDerivGuia = 0,
    segConvGuia = 0,
    parDerivGuia = 0,
    parConvGuia = 0;
  if (guiaCol && admCol) {
    // Map: admision → tiene alguna guia?
    const segAdmMap = new Map();
    const parAdmMap = new Map();
    norm.forEach((r) => {
      const tipo = getTipo(r);
      const adm = String(r[admCol] || "").trim();
      if (!adm) return;
      const g = String(r[guiaCol] || "").trim();
      const map = tipo.includes("SEG") ? segAdmMap : parAdmMap;
      if (!map.has(adm)) map.set(adm, false);
      if (g) map.set(adm, true); // al menos una fila con guia → convertida
    });
    segDerivGuia = segAdmMap.size;
    segConvGuia = [...segAdmMap.values()].filter(Boolean).length;
    parDerivGuia = parAdmMap.size;
    parConvGuia = [...parAdmMap.values()].filter(Boolean).length;
  } else if (guiaCol) {
    // Fallback sin admision: contar guias únicas
    const _segG = new Set(),
      _parG = new Set();
    norm.forEach((r) => {
      const tipo = getTipo(r);
      const g = String(r[guiaCol] || "").trim();
      if (!g) return;
      if (tipo.includes("SEG")) _segG.add(g);
      else _parG.add(g);
    });
    segDerivGuia = _segG.size;
    segConvGuia = _segG.size;
    parDerivGuia = _parG.size;
    parConvGuia = _parG.size;
  }

  const kpi = {
    tasaGlobal:
      totalDeriv > 0
        ? parseFloat(((totalConv / totalDeriv) * 100).toFixed(1))
        : 0,
    totalDeriv,
    totalConv,
    ganReal,
    ganPerd,
    totalVentaConv,
    totalVentaSinConv,
    segDeriv,
    segConv,
    segVentaNR,
    parDeriv,
    parConv,
    parSinConv: parDeriv - parConv,
    parStockFail,
    parVentaNR, // margen neto PAR no realizado
    parRevNR, // ingreso bruto PAR no realizado
    avgPrecioUnd,
    avgCostoUnd,
    // por receta: usa admision+guia; fallback a unidades si no existen ambas columnas
    hasGuiaCol: !!(guiaCol && admCol),
    segDerivGuia: guiaCol && admCol ? segDerivGuia : segDeriv,
    segConvGuia: guiaCol && admCol ? segConvGuia : segConv,
    parDerivGuia: guiaCol && admCol ? parDerivGuia : parDeriv,
    parConvGuia: guiaCol && admCol ? parConvGuia : parConv,
    parSumRev, // Ingreso total de recetas particulares convertidas
    parSumGan, // Ganancia total de recetas particulares convertidas
  };

  // ── ESTRATEGIAS: calcular datos clave ────────────────────
  // 1. Stock: unidades sin convertir por falta de stock + valor recuperable
  let stockUnds = 0,
    stockValRecup = 0;
  norm.forEach((r) => {
    const sto = num(get(r, "sto_med", "stock", "existencia"));
    const tipo = getTipo(r);
    if (sto <= 0 && tipo.includes("PAR")) {
      const sinC = num(get(r, "can_sinconvert"));
      const precio = num(get(r, "precio_venta"));
      stockUnds += sinC;
      stockValRecup += sinC * precio;
    }
  });

  // 2. Médicos Particular de baja conversión (min 50 unds derivadas Particular)
  const medPar = convDataPar
    .filter((d) => d.deriv >= 50)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  // 3. Productos con margen por rango: alto (≥30%), bajo (<20%)
  // Precio y costo se derivan como promedios ponderados:
  //   precio_unit = tot_sinconversion / can_sinconvert
  //   costo_unit  = t_costo_sin_conver / can_sinconvert
  // Esto evita depender de la primera fila y garantiza consistencia
  // matemática entre margen y los cálculos de descuento.
  const prodConMargenAcc = {};
  norm.forEach((r) => {
    const tipo = getTipo(r);
    if (!tipo.includes("PAR")) return;
    const prod = String(get(r, "producto", "prod_nomb", "descripcion") || "")
      .toUpperCase()
      .trim();
    const sinC = num(get(r, "can_sinconvert"));
    if (!prod || sinC <= 0) return;
    if (!prodConMargenAcc[prod])
      prodConMargenAcc[prod] = {
        producto: prod,
        sinConv: 0,
        totVenta: 0,
        totCosto: 0,
      };
    prodConMargenAcc[prod].sinConv += sinC;
    prodConMargenAcc[prod].totVenta += num(get(r, "tot_sinconversion"));
    prodConMargenAcc[prod].totCosto += num(get(r, "t_costo_sin_conver"));
  });
  const todosProdsMargen = Object.values(prodConMargenAcc).map((p) => {
    const precio = p.sinConv > 0 ? p.totVenta / p.sinConv : 0;
    const costo = p.sinConv > 0 ? p.totCosto / p.sinConv : 0;
    const margen = precio > 0 ? ((precio - costo) / precio) * 100 : 0;
    return {
      producto: p.producto,
      sinConv: p.sinConv,
      precio,
      costo,
      margen,
      totSin: p.totVenta,
    };
  });
  // alto margen ≥30%
  const prodsAltoMargen = todosProdsMargen
    .filter((p) => p.margen >= 30)
    .sort((a, b) => b.margen - a.margen);
  const nAltoMargen = prodsAltoMargen.length;
  const top4AltoMargen = prodsAltoMargen.slice(0, 4);
  // ganancia neta con 15% dscto: sinConv * ( precio*0.85 - costo )
  const ganNeta15dscto = prodsAltoMargen.reduce(
    (s, p) => s + p.sinConv * (p.precio * 0.85 - p.costo),
    0,
  );
  // bajo margen <20%
  const prodsBajoMargen = todosProdsMargen.filter(
    (p) => p.margen < 20 && p.margen >= 0,
  );
  const nBajoMargen = prodsBajoMargen.length;
  const undsBajoMargen = prodsBajoMargen.reduce((s, p) => s + p.sinConv, 0);

  // 4. Productos de alto costo sin convertir (precio unitario más alto, margen <30%)
  const topAltoCosto = todosProdsMargen
    .filter((p) => p.precio > 10 && p.margen < 30 && p.sinConv > 0)
    .sort((a, b) => b.totSin - a.totSin)
    .slice(0, 2);
  const potencialAltoCosto = topAltoCosto.reduce((s, p) => s + p.totSin, 0);

  // 5. Admisiones únicas Particular (para tarjeta fidelización)
  const uniqAdmPar = new Set();
  norm.forEach((r) => {
    const tipo = getTipo(r);
    if (!tipo.includes("PAR")) return;
    const adm = String(r["admision"] || r["adm"] || "").trim();
    if (adm) uniqAdmPar.add(adm);
  });

  // 6. Médico con mayor conversión Particular (modelo a replicar)
  const mejorMedPar = convDataPar
    .filter((d) => d.deriv >= 5 && d.pct > 0)
    .sort((a, b) => b.pct - a.pct)[0];

  const estrategias = {
    stockUnds: Math.round(stockUnds),
    stockValRecup,
    medPar,
    nAltoMargen,
    top4AltoMargen,
    prodsAltoMargenFull: prodsAltoMargen.slice(0, 10), // lista completa para la tabla de descuentos
    ganNeta15dscto,
    nBajoMargen,
    undsBajoMargen: Math.round(undsBajoMargen),
    topAltoCosto,
    potencialAltoCosto,
    uniqAdmPar: uniqAdmPar.size,
    mejorMedPar,
  };

  // ── 7. Extraer codigos de servicio únicos y llamar al backend ──
  const codSerSet = new Set();
  norm.forEach((r) => {
    const cod = String(
      get(r, "cod_ser", "codigo_servicio", "cod_servicio") || "",
    ).trim();
    if (cod) codSerSet.add(cod);
  });
  const codigosServicio = [...codSerSet];

  // Opcional: imprimir en consola la cantidad encontrada
  console.log(
    `Extraídos ${codigosServicio.length} códigos de servicio únicos del Excel.`,
  );

  // Disparar la petición en segundo plano al servidor Python
  if (window.fetchHistoriasDigitales && codigosServicio.length > 0) {
    // Formatear fechas para mandarlas a postgres
    const getIsoDate = (d) => (d ? d.toISOString().split("T")[0] : null);
    const minDateStr = getIsoDate(minDate);
    const maxDateStr = getIsoDate(maxDate);

    // Se llama de forma asíncrona, no bloquea el renderizado del dashboard
    window.fetchHistoriasDigitales(codigosServicio, minDateStr, maxDateStr);
  }

  return {
    fechaRango,
    archivoNom: fileName,
    totalRows: rows.length,
    recetas,
    topMedVentas,
    topMedIngreso,
    topMedRecetas,
    sinStockData,
    admisionesSinStock,
    convData,
    medPriData,
    topProductos,
    kpi,
    estrategias,
    codigosServicio, // Agregado por si se necesita después en el estado global
  };
}

// ─────────────────────────────────────────────────────────
// EVENTOS DE CARGA
// ─────────────────────────────────────────────────────────
excelInput.addEventListener("change", (e) => {
  if (e.target.files[0]) parseExcel(e.target.files[0]);
});

uploadPanel.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadPanel.classList.add("drag-over");
});
uploadPanel.addEventListener("dragleave", () =>
  uploadPanel.classList.remove("drag-over"),
);
uploadPanel.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadPanel.classList.remove("drag-over");
  const f = e.dataTransfer.files[0];
  if (f && /\.(xls|xlsx|xlsm)$/i.test(f.name)) parseExcel(f);
  else
    setStatus(
      '<span class="us-err">✗ Solo se aceptan archivos .xls / .xlsx</span>',
    );
});

// ─────────────────────────────────────────────────────────
// INICIALIZACIÓN — caché o estado vacío
// ─────────────────────────────────────────────────────────
const clearCacheBtn = document.getElementById("clearCacheBtn");
if (clearCacheBtn) {
  clearCacheBtn.addEventListener("click", () => {
    clearCache();
    showEmptyState();
    // Reset input para permitir recargar el mismo archivo
    if (excelInput) excelInput.value = "";
  });
}

// ─────────────────────────────────────────────────────────
// AUTO-CARGA DESDE SERVIDOR (endpoint /data/)
// ─────────────────────────────────────────────────────────
async function autoLoadFile(fileName) {
  const url = `/data/${encodeURIComponent(fileName)}`;
  setStatus(
    `<span class="us-spin"></span> <span class="us-info">Cargando ${fileName}…</span>`,
  );
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const msg = await response.text().catch(() => `HTTP ${response.status}`);
      throw new Error(msg || `HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buffer), {
      type: "array",
      cellDates: true,
    });
    const D = buildDataFromWorkbook(wb, fileName);
    saveToCache(D);
    renderDashboard(D);
    setStatus(
      `<span class="us-ok">✓ Cargado</span> <span class="us-date">Rango: ${D.fechaRango}</span>` +
        ` <span class="us-info">· ${D.archivoNom} · ${D.totalRows} registros</span>`,
    );
  } catch (err) {
    console.error("Error al cargar archivo:", err);
    setStatus(
      `<span class="us-err">✗ Error al cargar "${fileName}":</span>` +
        ` <span class="us-info">${err.message}</span>`,
    );
    showEmptyState();
  }
}

// ─────────────────────────────────────────────────────────
// INICIALIZACIÓN
// ─────────────────────────────────────────────────────────
const _archivoParam = getArchivoParam();
if (_archivoParam) {
  // URL tiene ?archivo=... → siempre cargar desde el servidor (dato fresco)
  showEmptyState();
  autoLoadFile(_archivoParam);
} else {
  // Sin param → intentar desde caché localStorage
  const _cached = loadFromCache();
  if (_cached) {
    renderDashboard(_cached);
    setStatus(
      `<span class="us-ok">✓ Datos en caché</span> <span class="us-date">Rango: ${_cached.fechaRango}</span>` +
        ` <span class="us-info">· ${_cached.archivoNom} · ${_cached.totalRows} registros</span>`,
    );
  } else {
    showEmptyState();
  }
}
