// Cargar datos desde eventos.json (simulación de API REST)
let eventos = [];
let demandaPorCiudad = {};
const cityColorMap = {};
// Paleta básica de colores fácilmente distinguibles (sin neón ni repetidos)
const colorPalette = [
    '#0074D9', // azul
    '#FF4136', // rojo
    '#2ECC40', // verde
    '#FF851B', // naranja
    '#B10DC9', // morado
    '#FFDC00', // amarillo
    '#001f3f', // azul oscuro
    '#39CCCC', // turquesa
    '#01FF70', // lima
    '#F012BE', // magenta
    '#3D9970', // verde oliva
    '#85144b', // vino
    '#7FDBFF', // celeste
    '#870C25', // burdeos
    '#AAAAAA', // gris
    '#111111', // negro
    '#F39C12', // naranja fuerte
    '#8E44AD', // violeta
    '#E67E22', // naranja claro
    '#16A085'  // verde azulado
];
let colorIndex = 0;

const tbody = document.getElementById('events-tbody');
const form = document.getElementById('add-event-form');
let nextId = 1;

function assignColor(ciudad) {
    if (!cityColorMap[ciudad]) {
        cityColorMap[ciudad] = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
    }
    return cityColorMap[ciudad];
}

function fetchData() {
    fetch('eventos.json')
        .then(resp => resp.json())
        .then(data => {
            eventos = data.eventos;
            demandaPorCiudad = data.demandaPorCiudad;
            nextId = eventos.length ? Math.max(...eventos.map(e => e.id)) + 1 : 1;
            // Asignar colores únicos a las ciudades iniciales
            Object.keys(demandaPorCiudad).forEach(assignColor);
            renderEventos();
            if (typeof demandChart !== 'undefined' && demandChart) updateChart();
        });
}

fetchData();

function renderEventos() {
    tbody.innerHTML = '';
    eventos.forEach((ev, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="show-on-chart" data-id="${ev.id}" ${ev.visible ? 'checked' : ''}></td>
            <td>${ev.fecha}</td>
            <td>${ev.evento}</td>
            <td>${ev.descripcion || ''}</td>
            <td>${ev.tipo}</td>
            <td>${ev.asistentes || ''}</td>
            <td>${ev.ciudad}</td>
            <td>
                <button class="delete-btn" data-id="${ev.id}" title="Eliminar evento">
                    <svg viewBox="0 0 24 24"><path d="M3 6h18M9 6v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6m-7 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#00eaff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateChart() {
    // Obtener ciudades activas (checkbox marcados)
    const visibles = eventos.filter(ev => ev.visible).map(ev => ev.ciudad);
    const uniqueCiudades = [...new Set(visibles)];
    const labels = Array.from({length: 30}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 29 + i);
        return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });
    const datasets = uniqueCiudades.map(ciudad => ({
        label: ciudad,
        data: demandaPorCiudad[ciudad],
        borderColor: assignColor(ciudad),
        backgroundColor: assignColor(ciudad)+'33',
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 7,
        fill: false
    }));
    demandChart.data.labels = labels;
    demandChart.data.datasets = datasets;
    demandChart.update();
}

// Ya no se usa, los colores ahora se asignan dinámicamente con assignColor()

// Eventos tabla
tbody.addEventListener('click', function(e) {
    if (e.target.closest('.delete-btn')) {
        const id = +e.target.closest('.delete-btn').dataset.id;
        eventos = eventos.filter(ev => ev.id !== id);
        renderEventos();
        updateChart();
    }
});

tbody.addEventListener('change', function(e) {
    if (e.target.classList.contains('show-on-chart')) {
        const id = +e.target.dataset.id;
        const ev = eventos.find(ev => ev.id === id);
        if (ev) {
            ev.visible = e.target.checked;
            updateChart();
        }
    }
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    const fd = new FormData(form);
    const ciudad = fd.get('ciudad');
    const nuevoEvento = {
        id: nextId++,
        fecha: fd.get('fecha'),
        evento: fd.get('evento'),
        descripcion: fd.get('descripcion'),
        tipo: fd.get('tipo'),
        asistentes: fd.get('asistentes'),
        ciudad: ciudad,
        visible: true
    };
    eventos.unshift(nuevoEvento);
    // Si la ciudad no existe en demandaPorCiudad, crearla con datos planos <= 40%
    if (!demandaPorCiudad[ciudad]) {
        let base = Math.floor(Math.random() * 15) + 20; // entre 20 y 35
        let arr = Array.from({length: 30}, (_, i) => base + Math.floor(Math.sin(i/4)*4));
        demandaPorCiudad[ciudad] = arr.map(v => Math.min(40, Math.max(10, v)));
    }
    assignColor(ciudad);
    form.reset();
    renderEventos();
    updateChart();
    // Aquí se haría un POST/PUT a la API para guardar el evento
});

// Inicializar gráfica
let demandChart = null;
window.addEventListener('DOMContentLoaded', function() {
    // --- MAPA INTERACTIVO DE HOTELES ---
    function renderHotelMap(hoteles, kpiData) {
        const mapEl = document.getElementById('hotel-map');
        if (!mapEl) return;
        // Elimina mapa previo si lo hay
        if (window.hotelMap) {
            window.hotelMap.remove();
        }
        // Centra en España
        window.hotelMap = L.map('hotel-map').setView([39.5, -3], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 18,
        }).addTo(window.hotelMap);

        hoteles.forEach(hotel => {
            // Busca ocupación media si hay datos
            let ocup = null;
            if (kpiData && kpiData.length) {
                const kpi = kpiData.find(k=>k.nombre===hotel.nombre);
                if (kpi) ocup = Math.round(kpi.ocupacion.reduce((a,b)=>a+b,0)/kpi.ocupacion.length);
            }
            // Color por ocupación
            let color = ocup!==null ? (ocup>85 ? '#00e676' : ocup>75 ? '#00eaff' : ocup>65 ? '#ffe600' : '#ff1744') : '#888';
            let marker = L.circleMarker([hotel.lat, hotel.lng], {
                radius: 13,
                fillColor: color,
                color: '#222',
                weight: 2,
                fillOpacity: 0.92
            }).addTo(window.hotelMap);
            let tooltip = `<b>${hotel.nombre}</b><br>${hotel.ciudad}`;
            if (ocup!==null) tooltip += `<br><b>Ocupación:</b> ${ocup}%`;
            marker.bindTooltip(tooltip, {direction:'top', offset:[0,-8], className:'map-tooltip'});
        });
    }

    // Dashboard KPIs y Ranking: cargar hoteles desde hoteles.json
    let hoteles = [];
    let kpiData = [];
    fetch('hoteles.json')
        .then(resp => resp.json())
        .then(data => {
            hoteles = data;
            // Datos inventados para 30 días por hotel
            kpiData = hoteles.map(hotel => {
                let baseOcup = Math.random()*20+65; // 65-85%
                let ocupacion = Array.from({length:30}, (_,i)=>Math.round(baseOcup+Math.sin(i/5)*3+Math.random()*2));
                let reservas = Array.from({length:30}, (_,i)=>Math.round(ocupacion[i]*2+Math.random()*10));
                let cancel = Array.from({length:30}, (_,i)=>Math.round(reservas[i]*Math.random()*0.09));
                let adr = Array.from({length:30}, (_,i)=>Math.round(Math.random()*30+90));
                let revpar = ocupacion.map((o,i)=>Math.round(adr[i]*o/100));
                let ingresos = reservas.map((r,i)=>Math.round(r*adr[i]));
                let satisfaccion = Math.round(Math.random()*10+85); // 85-95
                return { ...hotel, ocupacion, reservas, cancel, adr, revpar, ingresos, satisfaccion };
            });
            // Renderizar comparativa de hoteles tras generar kpiData
            if (kpiData && kpiData.length > 0) {
                renderCompareChart(kpiData, kpiData.map(h=>h.nombre));
            }
            // Cargar coordenadas y renderizar mapa
            fetch('hoteles_map.json')
                .then(resp=>resp.json())
                .then(hotelesMap=>{
                    renderHotelMap(hotelesMap, kpiData);
                });
            // ---- RANKING DE HOTELES ----
            function renderRanking() {
                let ciudad = document.getElementById('filter-ciudad').value;
                let categoria = document.getElementById('filter-categoria').value;
                let tipo = document.getElementById('filter-tipo').value;
                let arr = [...kpiData];
                // Filtros
                if (ciudad) arr = arr.filter(h=>h.ciudad===ciudad);
                if (categoria) arr = arr.filter(h=>h.categoria===categoria);
                if (tipo) arr = arr.filter(h=>h.tipo===tipo);
                // Ordenar por ocupación media (puedes cambiar a ingresos, etc.)
                arr.sort((a,b)=>{
                    let ao = a.ocupacion.reduce((x,y)=>x+y,0)/a.ocupacion.length;
                    let bo = b.ocupacion.reduce((x,y)=>x+y,0)/b.ocupacion.length;
                    return bo-ao;
                });
                const tbody = document.getElementById('ranking-tbody');
                tbody.innerHTML = '';
                arr.forEach((h, i) => {
                    let medalla = '';
                    if(i===0) medalla = '<span class="medalla oro" title="Oro">🥇</span>';
                    else if(i===1) medalla = '<span class="medalla plata" title="Plata">🥈</span>';
                    else if(i===2) medalla = '<span class="medalla bronce" title="Bronce">🥉</span>';
                    tbody.innerHTML += `
                        <tr>
                            <td>${medalla || (i+1)}</td>
                            <td>${h.nombre}</td>
                            <td>${h.ciudad}</td>
                            <td>${h.categoria}</td>
                            <td>${h.tipo}</td>
                            <td>${Math.round(h.ocupacion.reduce((a,b)=>a+b,0)/h.ocupacion.length)}%</td>
                            <td>${h.ingresos.reduce((a,b)=>a+b,0).toLocaleString('es-ES')} €</td>
                            <td>${h.satisfaccion} / 100</td>
                        </tr>
                    `;
                });
            }
            document.getElementById('filter-ciudad').addEventListener('change', renderRanking);
            document.getElementById('filter-categoria').addEventListener('change', renderRanking);
            document.getElementById('filter-tipo').addEventListener('change', renderRanking);
            renderRanking();
            // KPIs globales
            function avg(arr) { return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length); }
            let ocupacionMedia = avg(kpiData.flatMap(k=>k.ocupacion));
            let ingresosTotales = kpiData.flatMap(k=>k.ingresos).reduce((a,b)=>a+b,0);
            let adrMedia = avg(kpiData.flatMap(k=>k.adr));
            let revparMedia = avg(kpiData.flatMap(k=>k.revpar));
            let reservasTotales = kpiData.flatMap(k=>k.reservas).reduce((a,b)=>a+b,0);
            let cancelTotales = kpiData.flatMap(k=>k.cancel).reduce((a,b)=>a+b,0);
            // Mostrar KPIs
            document.getElementById('kpi-ocupacion').textContent = ocupacionMedia+"%";
            document.getElementById('kpi-ingresos').textContent = ingresosTotales.toLocaleString('es-ES')+" €";
            document.getElementById('kpi-adr').textContent = adrMedia+" €";
            document.getElementById('kpi-revpar').textContent = revparMedia+" €";
            document.getElementById('kpi-reservas').textContent = reservasTotales;
            document.getElementById('kpi-cancelaciones').textContent = cancelTotales;
            // Mini-gráficas sparkline
            // Mini-gráficas sparkline
            if (!window.sparkCharts) window.sparkCharts = {};
            function spark(id, data, color) {
                const canvas = document.getElementById(id);
                if (!canvas) return;
                // Eliminar gráfica previa si existe (Chart.js v3+)
                const prev = Chart.getChart(canvas);
                if (prev) prev.destroy();
                const ctx = canvas.getContext('2d');
                window.sparkCharts[id] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: Array.from({length:30}, (_,i)=>i+1),
                        datasets: [{
                            data,
                            borderColor: color,
                            backgroundColor: color+'22',
                            borderWidth: 2,
                            pointRadius: 0,
                            fill: true,
                            tension: 0.5
                        }]
                    },
                    options: {
                        plugins: { legend: { display: false } },
                        scales: { x: { display: false }, y: { display: false } },
                        elements: { line: { borderCapStyle: 'round' } },
                        animation: { duration: 900 },
                        responsive: false,
                        maintainAspectRatio: false
                    }
                });
            }
            setTimeout(() => {
                spark('spark-ocupacion', kpiData.flatMap(k=>k.ocupacion), '#00eaff');
                spark('spark-ingresos', kpiData.flatMap(k=>k.ingresos), '#0ff4f8');
                spark('spark-adr', kpiData.flatMap(k=>k.adr), '#00bcd4');
                spark('spark-revpar', kpiData.flatMap(k=>k.revpar), '#00e676');
                spark('spark-reservas', kpiData.flatMap(k=>k.reservas), '#ff851b');
                spark('spark-cancelaciones', kpiData.flatMap(k=>k.cancel), '#ff1744');
            }, 0);
        });

    // ---- RANKING DE HOTELES ----
    function renderRanking() {
        let ciudad = document.getElementById('filter-ciudad').value;
        let categoria = document.getElementById('filter-categoria').value;
        let tipo = document.getElementById('filter-tipo').value;
        let arr = [...kpiData];
        // Filtros
        if (ciudad) arr = arr.filter(h=>h.ciudad===ciudad);
        if (categoria) arr = arr.filter(h=>h.categoria===categoria);
        if (tipo) arr = arr.filter(h=>h.tipo===tipo);
        // Ordenar por ocupación media (puedes cambiar a ingresos, etc.)
        arr.sort((a,b)=>{
            let ao = a.ocupacion.reduce((x,y)=>x+y,0)/a.ocupacion.length;
            let bo = b.ocupacion.reduce((x,y)=>x+y,0)/b.ocupacion.length;
            return bo-ao;
        });
        const tbody = document.getElementById('ranking-tbody');
        tbody.innerHTML = '';
        arr.forEach((h, i) => {
            let medalla = '';
            if(i===0) medalla = '<span class="medalla oro" title="Oro">🥇</span>';
            else if(i===1) medalla = '<span class="medalla plata" title="Plata">🥈</span>';
            else if(i===2) medalla = '<span class="medalla bronce" title="Bronce">🥉</span>';
            tbody.innerHTML += `
                <tr>
                    <td>${medalla || (i+1)}</td>
                    <td>${h.nombre}</td>
                    <td>${h.ciudad}</td>
                    <td>${h.categoria}</td>
                    <td>${h.tipo}</td>
                    <td>${Math.round(h.ocupacion.reduce((a,b)=>a+b,0)/h.ocupacion.length)}%</td>
                    <td>${h.ingresos.reduce((a,b)=>a+b,0).toLocaleString('es-ES')} €</td>
                    <td>${h.satisfaccion} / 100</td>
                </tr>
            `;
        });
    }
    document.getElementById('filter-ciudad').addEventListener('change', renderRanking);
    document.getElementById('filter-categoria').addEventListener('change', renderRanking);
    document.getElementById('filter-tipo').addEventListener('change', renderRanking);
    renderRanking();
    // KPIs globales
    function avg(arr) { return Math.round(arr.reduce((a,b)=>a+b,0)/arr.length); }
    let ocupacionMedia = avg(kpiData.flatMap(k=>k.ocupacion));
    let ingresosTotales = kpiData.flatMap(k=>k.ingresos).reduce((a,b)=>a+b,0);
    let adrMedia = avg(kpiData.flatMap(k=>k.adr));
    let revparMedia = avg(kpiData.flatMap(k=>k.revpar));
    let reservasTotales = kpiData.flatMap(k=>k.reservas).reduce((a,b)=>a+b,0);
    let cancelTotales = kpiData.flatMap(k=>k.cancel).reduce((a,b)=>a+b,0);
    // Mostrar KPIs
    document.getElementById('kpi-ocupacion').textContent = ocupacionMedia+"%";
    document.getElementById('kpi-ingresos').textContent = ingresosTotales.toLocaleString('es-ES')+" €";
    document.getElementById('kpi-adr').textContent = adrMedia+" €";
    document.getElementById('kpi-revpar').textContent = revparMedia+" €";
    document.getElementById('kpi-reservas').textContent = reservasTotales;
    document.getElementById('kpi-cancelaciones').textContent = cancelTotales;
    // Mini-gráficas sparkline
    function spark(id, data, color) {
        new Chart(document.getElementById(id).getContext('2d'), {
            type: 'line',
            data: {
                labels: Array.from({length:30}, (_,i)=>i+1),
                datasets: [{
                    data,
                    borderColor: color,
                    backgroundColor: color+'22',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.5
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false } },
                elements: { line: { borderCapStyle: 'round' } },
                animation: { duration: 900 },
                responsive: false,
                maintainAspectRatio: false
            }
        });
    }
    spark('spark-ocupacion', kpiData.flatMap(k=>k.ocupacion), '#00eaff');
    spark('spark-ingresos', kpiData.flatMap(k=>k.ingresos), '#0ff4f8');
    spark('spark-adr', kpiData.flatMap(k=>k.adr), '#00bcd4');
    spark('spark-revpar', kpiData.flatMap(k=>k.revpar), '#00e676');
    spark('spark-reservas', kpiData.flatMap(k=>k.reservas), '#ff851b');
    spark('spark-cancelaciones', kpiData.flatMap(k=>k.cancel), '#ff1744');

    // --- Eventos y gráfica demanda ---
    renderEventos();
    const ctx = document.getElementById('demand-chart').getContext('2d');
    demandChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#00eaff',
                        font: { family: 'Orbitron', size: 16 }
                    }
                },
                tooltip: {
                    backgroundColor: '#0ff4f8',
                    titleColor: '#192e3a',
                    bodyColor: '#192e3a',
                }
            },
            scales: {
                x: {
                    ticks: { color: '#00eaff', font: { family: 'Orbitron', size: 13 } },
                    grid: { color: '#00eaff33' }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#00eaff', font: { family: 'Orbitron', size: 13 }, stepSize: 10 },
                    grid: { color: '#00eaff33' }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeInOutQuart'
            }
        }
    });
    updateChart();

    // --- COMPARATIVA DE HOTELES ---
    function fillCompareSelectors(hoteles) {
        const s1 = document.getElementById('compare-hotel-1');
        const s2 = document.getElementById('compare-hotel-2');
        const s3 = document.getElementById('compare-hotel-3');
        [s1,s2,s3].forEach(sel => {
            if (!sel) return;
            sel.innerHTML = '<option value="">Selecciona hotel</option>';
            hoteles.forEach(h => {
                sel.innerHTML += `<option value="${h.nombre}">${h.nombre}</option>`;
            });
        });
    }

    let compareChart = null;
    function renderCompareChart(kpiData, nombres) {
        const canvas = document.getElementById('compare-chart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        // Filtra hoteles seleccionados
        const dataSel = kpiData.filter(h => nombres.includes(h.nombre));
        if (compareChart) compareChart.destroy();
        // Métricas clave y normalización
        const labels = ['Ocupación (%)','Ingresos (€)','ADR (€)','RevPAR (€)','Satisfacción'];
        // Encuentra máximos para normalizar
        let maxOcup = Math.max(...kpiData.map(h=>Math.round(h.ocupacion.reduce((a,b)=>a+b,0)/h.ocupacion.length)), 100);
        let maxIng = Math.max(...kpiData.map(h=>h.ingresos.reduce((a,b)=>a+b,0)), 1);
        let maxAdr = Math.max(...kpiData.map(h=>Math.round(h.adr.reduce((a,b)=>a+b,0)/h.adr.length)), 1);
        let maxRevpar = Math.max(...kpiData.map(h=>Math.round(h.revpar.reduce((a,b)=>a+b,0)/h.revpar.length)), 1);
        let maxSat = 100;
        const datasets = dataSel.map((h,i) => {
            let ocup = Math.round(h.ocupacion.reduce((a,b)=>a+b,0)/h.ocupacion.length) || 0;
            let ing = h.ingresos.reduce((a,b)=>a+b,0) || 0;
            let adr = Math.round(h.adr.reduce((a,b)=>a+b,0)/h.adr.length) || 0;
            let revpar = Math.round(h.revpar.reduce((a,b)=>a+b,0)/h.revpar.length) || 0;
            let sat = h.satisfaccion || 0;
            // Normalizados a 0-100
            let ocupN = Math.round(ocup/maxOcup*100);
            let ingN = Math.round(ing/maxIng*100);
            let adrN = Math.round(adr/maxAdr*100);
            let revparN = Math.round(revpar/maxRevpar*100);
            let satN = Math.round(sat/maxSat*100);
            // Colores cíclicos de la paleta
            const color = colorPalette[i % colorPalette.length];
            return {
                label: h.nombre,
                data: [ocupN, ingN, adrN, revparN, satN],
                fill: true,
                backgroundColor: color + '44',
                borderColor: color,
                borderWidth: 2.5,
                pointBackgroundColor: '#fff',
                pointRadius: 5,
                tension: 0,
                realValues: [ocup, ing, adr, revpar, sat]
            }
        });
        // Animación personalizada: dibuja la línea radialmente
        compareChart = new Chart(ctx, {
            type: 'radar',
            data: { labels, datasets },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#00eaff', font: { family: 'Orbitron', size: 16 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const i = context.dataIndex;
                                const real = context.dataset.realValues && context.dataset.realValues[i];
                                let label = context.dataset.label || '';
                                let metric = context.chart.data.labels[i];
                                let value = typeof real !== 'undefined' ? real : context.parsed.r;
                                if(metric.includes('Ingresos')) {
                                    value = value.toLocaleString('es-ES') + ' €';
                                } else if(metric.includes('ADR')||metric.includes('RevPAR')) {
                                    value = value + ' €';
                                } else if(metric.includes('Ocupación')) {
                                    value = value + '%';
                                } else if(metric.includes('Satisfacción')) {
                                    value = value + ' / 100';
                                }
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: { color: '#00eaff33' },
                        grid: { color: '#00eaff22' },
                        pointLabels: { color: '#fff', font: { family: 'Orbitron', size: 14 } },
                        ticks: { color: '#00eaff', backdropColor: 'transparent', font: { size: 12 } }
                    }
                },
                animation: {
                    duration: 1700,
                    easing: 'easeInOutQuart',
                    animateRotate: true,
                    animateScale: true,
                    onProgress: function(animation) {
                        // efecto "dibujado" radial
                        if (animation.currentStep === 1 && ctx) ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
                    }
                }
            }
        });
    }

    // Inicializar comparativa: mostrar todos los hoteles SOLO cuando kpiData esté listo
    if (kpiData && kpiData.length > 0) {
        renderCompareChart(kpiData, kpiData.map(h=>h.nombre));
    }

});
