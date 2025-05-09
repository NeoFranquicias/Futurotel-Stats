// Initialize the demand chart
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('demandChart').getContext('2d');
    
    // Sample data for the chart
    const data = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
        datasets: [
            {
                label: 'Zona Centro',
                data: [85, 88, 90, 92, 94, 93, 95, 94],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4
            },
            {
                label: 'Zona Playa',
                data: [65, 70, 75, 80, 85, 90, 95, 86],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            },
            {
                label: 'Zona Histórica',
                data: [75, 77, 78, 79, 80, 79, 80, 79],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4
            }
        ]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Tendencia anual por zona geográfica'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Ocupación (%)'
                    }
                }
            }
        }
    };

    new Chart(ctx, config);

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation to stat cards when they come into view
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.stat-card').forEach(card => {
        observer.observe(card);
    });

    // Gráfico de barras semanal para Booking.com
    const weeklyPriceChartElem = document.getElementById('weeklyPriceChart');
    if (weeklyPriceChartElem) {
        const weeklyPriceChart = new Chart(weeklyPriceChartElem.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Futurotel',
                        data: [125, 130, 140, 150, 170, 185, 160],
                        backgroundColor: '#2563eb',
                        borderRadius: 6,
                        barPercentage: 0.5,
                        categoryPercentage: 0.5
                    },
                    {
                        label: 'Competencia',
                        data: [130, 135, 145, 155, 175, 190, 150],
                        backgroundColor: '#cbd5e1',
                        borderRadius: 6,
                        barPercentage: 0.5,
                        categoryPercentage: 0.5
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#1e293b',
                            font: { size: 14 }
                        }
                    },
                    title: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y + '€';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 13 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#e5e7eb' },
                        ticks: { color: '#64748b', font: { size: 13 }, stepSize: 20 },
                        title: {
                            display: true,
                            text: 'Precio (€)',
                            color: '#64748b',
                            font: { size: 14 }
                        }
                    }
                }
            }
        });
    }

    // Descargar tabla de precios como CSV
    const downloadBtn = document.getElementById('download-csv');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const table = document.getElementById('main-pricing-table');
            let csv = '';
            for (let row of table.rows) {
                let rowData = [];
                for (let cell of row.cells) {
                    rowData.push('"' + cell.innerText.replace(/"/g, '""') + '"');
                }
                csv += rowData.join(',') + '\n';
            }
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tabla-precios-futurotel.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}); 