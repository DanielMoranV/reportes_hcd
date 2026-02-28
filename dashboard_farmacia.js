
  // ── DATOS ──────────────────────────────────────────────────────────────────
  const data = [
    { medico: 'SILVA MARROQUIN MARTHA',          seguro: 35, particular: 38 },
    { medico: 'LEIVA HERRADA CLEVER HUMBERTO',   seguro: 11, particular: 26 },
    { medico: 'MEDINA ARRUNATEGUI CESAR MARTIN', seguro: 25, particular:  2 },
    { medico: 'ALARCON CANOVA STEVEN',           seguro: 23, particular:  2 },
    { medico: 'ALVARADO GUERRERO ALEMBERT',      seguro:  7, particular: 13 },
    { medico: 'YAÑEZ CESTI MARIANO MANUEL',      seguro:  8, particular: 12 },
    { medico: 'GUERRERO AMAYA EDUARDO',          seguro:  6, particular: 11 },
    { medico: 'AYALA ROSALES MANUEL ALEXANDER',  seguro:  6, particular:  4 },
    { medico: 'SALAZAR HERNANDEZ OMAR GREGORY',  seguro:  2, particular:  3 },
    { medico: 'GALLOSA PALACIOS MARIA EUGUENIA', seguro:  2, particular:  0 },
    { medico: 'HERRERA OLIVARES MARTIN',         seguro:  0, particular:  2 },
    { medico: 'RAMOS RODRIGUEZ INGRID JOYCE',    seguro:  0, particular:  2 },
    { medico: 'CORDOVA CUEVA LIZ BRENDA',        seguro:  0, particular:  1 },
  ];

  // Abreviar nombres para el eje del chart
  function abreviar(nombre) {
    const partes = nombre.split(' ');
    // apellido + inicial nombre
    return partes[0] + (partes[2] ? ', ' + partes[2][0] + '.' : '');
  }

  const labels   = data.map(d => abreviar(d.medico));
  const seguros  = data.map(d => d.seguro);
  const parts    = data.map(d => d.particular);
  const totales  = data.map(d => d.seguro + d.particular);

  // ── BAR CHART ─────────────────────────────────────────────────────────────
  const ctx = document.getElementById('barChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Seguro',
          data: seguros,
          backgroundColor: '#2e86de',
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Particular',
          data: parts,
          backgroundColor: '#f39c12',
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => data[items[0].dataIndex].medico,
            afterBody: (items) => {
              const i = items[0].dataIndex;
              return `Total: ${totales[i]}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            color: '#4b5563',
            maxRotation: 35,
            minRotation: 25,
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f0f2f5' },
          ticks: {
            font: { size: 11 },
            color: '#9ca3af',
            stepSize: 5,
          }
        }
      }
    }
  });

  // ── DATOS: TOP MÉDICOS POR VENTAS ─────────────────────────────────────────
  const topMedVentas = [
    { medico: 'ALARCON CANOVA STEVEN',           abr: 'Alarcon',   ventas: 9024.64, atenciones: 25, ticket: 360.99, unidades: 819 },
    { medico: 'SILVA MARROQUIN MARTHA',           abr: 'Silva',     ventas: 4716.79, atenciones: 73, ticket:  64.61, unidades: 199 },
    { medico: 'YAÑEZ CESTI MARIANO MANUEL',       abr: 'Yañez',     ventas: 3332.40, atenciones: 20, ticket: 166.62, unidades: 405 },
    { medico: 'MEDINA ARRUNATEGUI CESAR MARTIN',  abr: 'Medina',    ventas: 3149.34, atenciones: 27, ticket: 116.64, unidades: 448 },
    { medico: 'ALVARADO GUERRERO ALEMBERT',       abr: 'Alvarado',  ventas: 2951.13, atenciones: 20, ticket: 147.56, unidades: 244 },
    { medico: 'AYALA ROSALES MANUEL ALEXANDER',   abr: 'Ayala',     ventas: 2148.54, atenciones: 10, ticket: 214.85, unidades:  46 },
    { medico: 'LEIVA HERRADA CLEVER HUMBERTO',    abr: 'Leiva',     ventas: 1637.45, atenciones: 37, ticket:  44.26, unidades:  67 },
    { medico: 'GUERRERO AMAYA EDUARDO',           abr: 'Guerrero',  ventas:  442.09, atenciones: 17, ticket:  26.01, unidades: 108 },
    { medico: 'SALAZAR HERNANDEZ OMAR GREGORY',   abr: 'Salazar',   ventas:  369.14, atenciones:  5, ticket:  73.83, unidades:   6 },
    { medico: 'GALLOSA PALACIOS MARIA EUGUENIA',  abr: 'Gallosa',   ventas:  139.35, atenciones:  2, ticket:  69.68, unidades:  10 },
  ];

  // ── DATOS: TOP MEDICAMENTOS ────────────────────────────────────────────────
  const topMedIngreso = [
    { producto: 'LANZOPRAL HELIPACK',       ingreso: 1906.10, unidades:  42 },
    { producto: 'CINITAL 1MG TAB',          ingreso: 1384.65, unidades: 306 },
    { producto: 'MAGAL D JBE',              ingreso: 1304.05, unidades:  21 },
    { producto: 'EZOLIUM 40MG TAB',         ingreso: 1177.08, unidades: 116 },
    { producto: 'LEFLUMIDE 20MG TAB',       ingreso: 1027.80, unidades:  45 },
    { producto: 'TRI AZIT 200MG JBE 30ML',  ingreso:  934.41, unidades:   7 },
    { producto: 'BICERTO TAB 150MG',         ingreso:  884.00, unidades:  80 },
    { producto: 'CONCOR 5MG TAB',           ingreso:  789.90, unidades: 120 },
    { producto: 'EXFORGE HCT 10/160/12.5',  ingreso:  744.60, unidades:  60 },
    { producto: 'MILPAX SAB CER JBE',       ingreso:  721.11, unidades:   9 },
  ];
  const topMedUnidades = [
    { producto: 'CINITAL 1MG TAB',          unidades: 306, ingreso: 1384.65 },
    { producto: 'CONCOR 5MG TAB',           unidades: 120, ingreso:  789.90 },
    { producto: 'EZOLIUM 40MG TAB',         unidades: 116, ingreso: 1177.08 },
    { producto: 'BICERTO TAB 150MG',         unidades:  80, ingreso:  884.00 },
    { producto: 'TRICOFAR 500MG TAB',       unidades:  78, ingreso:  432.30 },
    { producto: 'KETOPROFENO 100MG TAB',    unidades:  71, ingreso:  230.99 },
    { producto: 'MALTOFER 100MG TAB',       unidades:  60, ingreso:  180.00 },
    { producto: 'EXFORGE HCT 10/160/12.5',  unidades:  60, ingreso:  744.60 },
    { producto: 'DOLORAL 400MG TAB',        unidades:  55, ingreso:  122.75 },
    { producto: 'ZALDIAR 37.5/325MG TAB',   unidades:  49, ingreso:  381.71 },
  ];

  // ── DATOS: SIN STOCK ───────────────────────────────────────────────────────
  const sinStockData = [
    { producto: 'PANADOL INFANTIL JBE',           veces: 11, deriv: 14,  conv:  6 },
    { producto: 'GLYCOLAX X 320GR PVO',           veces:  9, deriv: 115, conv:  0 },
    { producto: 'FRUTIPED PEDIATRICO FRESA',      veces:  8, deriv: 22,  conv: 13 },
    { producto: 'KETOPROFENO 100MG TAB',          veces:  6, deriv: 71,  conv: 71 },
    { producto: 'NEO NISOPREX 15MG/5ML JBE',     veces:  6, deriv: 10,  conv:  2 },
    { producto: 'TRI AZIT 200MG JBE 15ML',       veces:  5, deriv:  5,  conv:  3 },
    { producto: 'ENTEROGERMINA X 5ML AMB BEB',   veces:  5, deriv: 46,  conv: 10 },
    { producto: 'CONCOR 5MG TAB',                veces:  4, deriv: 55,  conv: 30 },
    { producto: 'DICLOXACILINA 250MG/5ML JBE',   veces:  4, deriv:  6,  conv:  2 },
    { producto: 'FORTZINK 10MG/ML GOTAS',        veces:  3, deriv:  3,  conv:  0 },
    { producto: 'DOLORAL FORTE 200MG/5ML JBE',   veces:  3, deriv:  3,  conv:  1 },
    { producto: 'FLACORT 22.75MG/ML GOT',        veces:  3, deriv:  3,  conv:  0 },
    { producto: 'FLOGOCOX 120MG COMP',           veces:  3, deriv: 21,  conv:  0 },
    { producto: 'FORTZINK 20MG/5ML JBE',         veces:  3, deriv:  3,  conv:  1 },
    { producto: 'GESLUTIN 200MG CAP',            veces:  3, deriv: 64,  conv:  0 },
    { producto: 'DOLORAL 100MG/5ML JBE',         veces:  3, deriv:  3,  conv:  1 },
    { producto: 'ELAZIT PED 200MG/5ML JBE',     veces:  3, deriv:  3,  conv:  1 },
    { producto: 'CEFACLOR 250/5ML X75ML',        veces:  2, deriv:  2,  conv:  0 },
    { producto: 'BIOGAIA VIT D3',                veces:  2, deriv:  2,  conv:  0 },
    { producto: 'DEGRALER 2.5MG/5ML JBE',       veces:  2, deriv:  2,  conv:  1 },
  ];

  // ── CHART: VENTAS POR MÉDICO (horizontal) ─────────────────────────────────
  const ventasMedCtx = document.getElementById('ventasMedChart').getContext('2d');
  const ventasColors = topMedVentas.map((_, i) => {
    const intensity = Math.round(255 - (i / topMedVentas.length) * 130);
    return `rgb(${Math.round(30 + i*8)}, ${Math.round(106 + i*3)}, ${intensity})`;
  });
  new Chart(ventasMedCtx, {
    type: 'bar',
    data: {
      labels: [...topMedVentas].reverse().map(d => d.abr),
      datasets: [{
        label: 'Ventas (S/)',
        data: [...topMedVentas].reverse().map(d => d.ventas),
        backgroundColor: [...ventasColors].reverse(),
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const idx = topMedVentas.length - 1 - items[0].dataIndex;
              return topMedVentas[idx].medico;
            },
            afterBody: (items) => {
              const idx = topMedVentas.length - 1 - items[0].dataIndex;
              const d = topMedVentas[idx];
              return [`Atenciones: ${d.atenciones}`, `Unidades: ${d.unidades}`, `Ticket prom: S/ ${d.ticket}`];
            },
            label: (item) => ` S/ ${item.raw.toLocaleString('es-PE', {minimumFractionDigits:2})}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f0f2f5' },
          ticks: { font:{size:11}, color:'#9ca3af', callback: v => 'S/ ' + v.toLocaleString('es-PE') }
        },
        y: { grid:{display:false}, ticks:{font:{size:11}, color:'#374151'} }
      }
    }
  });

  // ── TABLA: VENTAS DETALLE ──────────────────────────────────────────────────
  const ventasBody = document.getElementById('ventasBody');
  topMedVentas.forEach((d, i) => {
    const isTop = i < 3;
    ventasBody.innerHTML += `
      <tr>
        <td>
          <span class="rank-num ${isTop?'top':''}">${i+1}</span>
          <span style="font-size:.78rem;font-weight:600;">${d.medico.split(' ').slice(0,2).join(' ')}</span>
        </td>
        <td class="r" style="font-size:.78rem;">${d.atenciones}</td>
        <td class="r" style="font-size:.78rem;">${d.unidades}</td>
        <td class="r"><span class="ticket-val">S/ ${d.ticket.toFixed(2)}</span></td>
        <td class="r" style="font-weight:700;color:#1a2035;">S/ ${d.ventas.toLocaleString('es-PE',{minimumFractionDigits:2})}</td>
      </tr>`;
  });

  // ── CHART: TOP MEDS POR INGRESO ────────────────────────────────────────────
  const medsIngresoCtx = document.getElementById('medsIngresoChart').getContext('2d');
  new Chart(medsIngresoCtx, {
    type: 'bar',
    data: {
      labels: [...topMedIngreso].reverse().map(p => p.producto),
      datasets: [{
        label: 'Ingreso (S/)',
        data: [...topMedIngreso].reverse().map(p => p.ingreso),
        backgroundColor: '#2e86de',
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => ` S/ ${item.raw.toFixed(2)}`,
            afterBody: (items) => {
              const idx = topMedIngreso.length - 1 - items[0].dataIndex;
              return `Unidades vendidas: ${topMedIngreso[idx].unidades}`;
            }
          }
        }
      },
      scales: {
        x: { beginAtZero:true, grid:{color:'#f0f2f5'}, ticks:{font:{size:10}, color:'#9ca3af', callback: v => 'S/ '+v} },
        y: { grid:{display:false}, ticks:{font:{size:10}, color:'#374151'} }
      }
    }
  });

  // ── CHART: TOP MEDS POR UNIDADES ──────────────────────────────────────────
  const medsUnidadesCtx = document.getElementById('medsUnidadesChart').getContext('2d');
  new Chart(medsUnidadesCtx, {
    type: 'bar',
    data: {
      labels: [...topMedUnidades].reverse().map(p => p.producto),
      datasets: [{
        label: 'Unidades',
        data: [...topMedUnidades].reverse().map(p => p.unidades),
        backgroundColor: '#8b5cf6',
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => ` ${item.raw} unidades`,
            afterBody: (items) => {
              const idx = topMedUnidades.length - 1 - items[0].dataIndex;
              return `Ingreso: S/ ${topMedUnidades[idx].ingreso.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: { beginAtZero:true, grid:{color:'#f0f2f5'}, ticks:{font:{size:10}, color:'#9ca3af'} },
        y: { grid:{display:false}, ticks:{font:{size:10}, color:'#374151'} }
      }
    }
  });

  // ── TABLA: SIN STOCK ──────────────────────────────────────────────────────
  const sinstockBody = document.getElementById('sinstockBody');
  sinStockData.forEach((d, i) => {
    const pct = d.deriv > 0 ? (d.conv / d.deriv * 100).toFixed(1) : '0.0';
    const p = parseFloat(pct);
    let rowCls = '', convCls = '', convIcon = '';
    if (p === 0)       { rowCls = 'crit'; convCls = 'c-zero'; convIcon = '✗'; }
    else if (p < 50)   { rowCls = 'warn'; convCls = 'c-low';  convIcon = '▲'; }
    else if (p < 100)  { rowCls = '';     convCls = 'c-mid';  convIcon = '●'; }
    else               { rowCls = '';     convCls = 'c-full'; convIcon = '✓'; }

    sinstockBody.innerHTML += `
      <tr class="${rowCls}">
        <td style="color:#9ca3af;font-size:.75rem;font-weight:600;">${i+1}</td>
        <td style="font-weight:600;font-size:.8rem;">${d.producto}</td>
        <td class="r">
          <span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:.72rem;font-weight:700;">
            ${d.veces}×
          </span>
        </td>
        <td class="r" style="font-size:.8rem;">${d.deriv}</td>
        <td class="r" style="font-size:.8rem;">${d.conv}</td>
        <td class="r">
          <span class="conv-ring ${convCls}">${convIcon} ${pct}%</span>
        </td>
      </tr>`;
  });

  // ── DOUGHNUT CHART ────────────────────────────────────────────────────────
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['Seguro', 'Particular'],
      datasets: [{
        data: [125, 116],
        backgroundColor: ['#2e86de', '#f39c12'],
        hoverBackgroundColor: ['#1a6fc4', '#d4870a'],
        borderWidth: 0,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => {
              const val = item.raw;
              const pct = (val / 241 * 100).toFixed(1);
              return ` ${val} atenciones (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // ── DATOS CONVERSIÓN ──────────────────────────────────────────────────────
  // Ordenado por derivadas desc
  const convData = [
    { medico: 'ALARCON CANOVA STEVEN',           abr: 'Alarcon',   deriv: 1157, conv: 819, sinConv: 338, pct: 70.8, ganReal: 5552.72, ganPerd: 1105.14 },
    { medico: 'ALVARADO GUERRERO ALEMBERT',       abr: 'Alvarado',  deriv: 969,  conv: 244, sinConv: 725, pct: 25.2, ganReal: 1853.50, ganPerd: 1878.36 },
    { medico: 'YAÑEZ CESTI MARIANO MANUEL',       abr: 'Yañez',     deriv: 865,  conv: 405, sinConv: 460, pct: 46.8, ganReal: 1690.95, ganPerd:  437.87 },
    { medico: 'MEDINA ARRUNATEGUI CESAR MARTIN',  abr: 'Medina',    deriv: 621,  conv: 448, sinConv: 173, pct: 72.1, ganReal: 2042.17, ganPerd:  360.90 },
    { medico: 'GUERRERO AMAYA EDUARDO',           abr: 'Guerrero',  deriv: 594,  conv: 108, sinConv: 486, pct: 18.2, ganReal:  249.59, ganPerd: 1289.00 },
    { medico: 'SILVA MARROQUIN MARTHA',           abr: 'Silva',     deriv: 533,  conv: 199, sinConv: 334, pct: 37.3, ganReal: 2701.12, ganPerd: 1046.98 },
    { medico: 'LEIVA HERRADA CLEVER HUMBERTO',    abr: 'Leiva',     deriv: 130,  conv: 67,  sinConv:  63, pct: 51.5, ganReal:  759.97, ganPerd:  415.17 },
    { medico: 'RAMOS RODRIGUEZ INGRID JOYCE',     abr: 'Ramos',     deriv: 121,  conv: 0,   sinConv: 121, pct:  0.0, ganReal:    0.00, ganPerd:  109.69 },
    { medico: 'AYALA ROSALES MANUEL ALEXANDER',   abr: 'Ayala',     deriv: 117,  conv: 46,  sinConv:  71, pct: 39.3, ganReal: 1450.29, ganPerd:  301.57 },
    { medico: 'SALAZAR HERNANDEZ OMAR GREGORY',   abr: 'Salazar',   deriv:  30,  conv: 6,   sinConv:  24, pct: 20.0, ganReal:  259.18, ganPerd:  217.86 },
    { medico: 'GALLOSA PALACIOS MARIA EUGUENIA',  abr: 'Gallosa',   deriv:  16,  conv: 10,  sinConv:   6, pct: 62.5, ganReal:   80.51, ganPerd:   42.46 },
    { medico: 'HERRERA OLIVARES MARTIN',          abr: 'Herrera',   deriv:  11,  conv: 0,   sinConv:  11, pct:  0.0, ganReal:    0.00, ganPerd:   18.69 },
    { medico: 'CORDOVA CUEVA LIZ BRENDA',         abr: 'Cordova',   deriv:   8,  conv: 0,   sinConv:   8, pct:  0.0, ganReal:    0.00, ganPerd:    3.92 },
  ];

  const topProductos = [
    { producto: 'OSTEOSYL 150MG TAB',         sinConv:  90, totSin: 3967.20, ganPerd: 793.80 },
    { producto: 'DALGIET 2MG TAB',            sinConv:  30, totSin: 2708.40, ganPerd: 506.40 },
    { producto: 'GESLUTIN 200MG CAP',         sinConv:  64, totSin:  717.04, ganPerd: 429.68 },
    { producto: 'EZOLIUM 40MG TAB',           sinConv:  46, totSin:  643.38, ganPerd: 423.96 },
    { producto: 'HANALGEZE 60MG INY',         sinConv:  10, totSin:  607.98, ganPerd: 365.78 },
    { producto: 'MAGAL D JBE',                sinConv:   4, totSin:  319.00, ganPerd: 253.56 },
    { producto: 'HIALUDRIN SOB NARANJA',      sinConv: 180, totSin: 1022.40, ganPerd: 212.40 },
    { producto: 'ENTEROGERMINA 5ML',          sinConv:  87, totSin:  468.73, ganPerd: 200.77 },
    { producto: 'NORFLEX AMP 60MG',           sinConv:   6, totSin:  257.46, ganPerd: 196.26 },
    { producto: 'MAXUCAL D 400UI TAB',        sinConv:  90, totSin:  256.20, ganPerd: 162.60 },
  ];

  // ── STACKED BAR: CONVERSIÓN POR MÉDICO ────────────────────────────────────
  const convCtx = document.getElementById('convChart').getContext('2d');
  new Chart(convCtx, {
    type: 'bar',
    data: {
      labels: convData.map(d => d.abr),
      datasets: [
        {
          label: 'Convertidas',
          data: convData.map(d => d.conv),
          backgroundColor: '#27ae60',
          borderRadius: 0,
          borderSkipped: false,
        },
        {
          label: 'Sin convertir',
          data: convData.map(d => d.sinConv),
          backgroundColor: '#e74c3c',
          borderRadius: 4,
          borderSkipped: 'bottom',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => convData[items[0].dataIndex].medico,
            afterBody: (items) => {
              const d = convData[items[0].dataIndex];
              return [
                `Total derivadas: ${d.deriv}`,
                `Tasa conversión: ${d.pct}%`,
                `Potencial no realizado: S/ ${d.ganPerd.toFixed(2)}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#4b5563', maxRotation: 35, minRotation: 25 }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          grid: { color: '#f0f2f5' },
          ticks: { font: { size: 11 }, color: '#9ca3af' }
        }
      }
    }
  });

  // ── TABLA: GANANCIA PERDIDA POR MÉDICO ────────────────────────────────────
  const lossBody = document.getElementById('lossBody');
  const lossOrdered = [...convData].sort((a,b) => b.ganPerd - a.ganPerd);
  lossOrdered.forEach(d => {
    let cls = d.pct >= 60 ? 'high' : d.pct >= 35 ? 'mid' : 'low';
    lossBody.innerHTML += `
      <tr>
        <td style="font-size:.78rem;font-weight:600;">${d.medico.split(' ').slice(0,2).join(' ')}</td>
        <td class="r"><span class="pct-badge ${cls}">${d.pct}%</span></td>
        <td class="r"><span class="loss-amount">S/ ${d.ganPerd.toFixed(2)}</span></td>
      </tr>`;
  });

  // ── HORIZONTAL BAR: TOP PRODUCTOS ─────────────────────────────────────────
  const prodCtx = document.getElementById('prodChart').getContext('2d');
  new Chart(prodCtx, {
    type: 'bar',
    data: {
      labels: [...topProductos].reverse().map(p => p.producto),
      datasets: [{
        label: 'Potencial no realizado (S/)',
        data: [...topProductos].reverse().map(p => p.ganPerd),
        backgroundColor: (ctx) => {
          const v = ctx.raw;
          if (v >= 500) return '#e74c3c';
          if (v >= 300) return '#e67e22';
          return '#f39c12';
        },
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => ` S/ ${item.raw.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f0f2f5' },
          ticks: {
            font: { size: 11 }, color: '#9ca3af',
            callback: (v) => 'S/ ' + v
          }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#374151' }
        }
      }
    }
  });

  // ── TABLA: TOP PRODUCTOS DETALLE ──────────────────────────────────────────
  const prodBody = document.getElementById('prodBody');
  topProductos.forEach(p => {
    const margen = ((p.ganPerd / p.totSin) * 100).toFixed(0);
    prodBody.innerHTML += `
      <tr>
        <td style="font-size:.75rem;font-weight:600;max-width:140px;">${p.producto}</td>
        <td class="r" style="font-size:.78rem;">${p.sinConv}</td>
        <td class="r" style="font-size:.78rem;">S/ ${p.totSin.toFixed(2)}</td>
        <td class="r"><span class="loss-amount" style="font-size:.82rem;">S/ ${p.ganPerd.toFixed(2)}</span></td>
      </tr>`;
  });

  // ── RANKING TABLE ─────────────────────────────────────────────────────────
  const tbody = document.getElementById('rankingBody');
  const maxTotal = Math.max(...totales);

  data.slice(0, 10).forEach((d, i) => {
    const total = d.seguro + d.particular;
    const pctSeg = total ? (d.seguro / total * 100).toFixed(0) : 0;
    const pctPar = total ? (d.particular / total * 100).toFixed(0) : 0;
    const segW   = (d.seguro / maxTotal * 60).toFixed(1);
    const parW   = (d.particular / maxTotal * 60).toFixed(1);
    const isTop  = i < 3;

    tbody.innerHTML += `
      <tr>
        <td><span class="rank-num ${isTop ? 'top' : ''}">${i + 1}</span></td>
        <td>
          <div class="medico-name">${d.medico.split(' ').slice(0,2).join(' ')}</div>
          <div class="mini-bar-wrap">
            <div class="mini-bar seg" style="width:${segW}px"></div>
            <div class="mini-bar par" style="width:${parW}px"></div>
          </div>
        </td>
        <td class="num"><span class="pill seg">${d.seguro}</span></td>
        <td class="num"><span class="pill par">${d.particular}</span></td>
        <td class="num" style="color:#1a2035;font-size:.88rem">${total}</td>
      </tr>`;
  });
