/**
 * Chart Visualization Module
 * Wrapper for Chart.js with consistent styling
 */

// Chart.js default options for consistent styling
const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                font: {
                    family: "'Inter', sans-serif",
                    size: 12
                },
                usePointStyle: true,
                padding: 20
            }
        },
        tooltip: {
            backgroundColor: 'rgba(44, 62, 80, 0.9)',
            titleFont: {
                family: "'Inter', sans-serif",
                size: 13
            },
            bodyFont: {
                family: "'Inter', sans-serif",
                size: 12
            },
            padding: 12,
            cornerRadius: 8
        }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                font: {
                    family: "'Inter', sans-serif",
                    size: 11
                }
            }
        },
        y: {
            grid: {
                color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
                font: {
                    family: "'Inter', sans-serif",
                    size: 11
                }
            }
        }
    }
};

// Store chart instances for cleanup
const chartInstances = {};

/**
 * Create or update a line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - Chart data with labels and datasets
 * @param {Object} customOptions - Custom chart options
 * @returns {Chart} Chart instance
 */
export function createLineChart(canvasId, data, customOptions = {}) {
    destroyChart(canvasId);

    const ctx = document.getElementById(canvasId).getContext('2d');

    const options = {
        ...defaultOptions,
        ...customOptions,
        interaction: {
            mode: 'index',
            intersect: false
        }
    };

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: data.datasets
        },
        options
    });

    return chartInstances[canvasId];
}

/**
 * Create or update a bar chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - Chart data
 * @param {Object} customOptions - Custom chart options
 * @returns {Chart} Chart instance
 */
export function createBarChart(canvasId, data, customOptions = {}) {
    destroyChart(canvasId);

    const ctx = document.getElementById(canvasId).getContext('2d');

    const options = {
        ...defaultOptions,
        ...customOptions,
        plugins: {
            ...defaultOptions.plugins,
            legend: {
                display: false
            }
        }
    };

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: data.backgroundColor || '#5c7cfa',
                borderRadius: 6,
                maxBarThickness: 40
            }]
        },
        options
    });

    return chartInstances[canvasId];
}

/**
 * Create or update a doughnut chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} data - Chart data
 * @param {Object} customOptions - Custom chart options
 * @returns {Chart} Chart instance
 */
export function createDoughnutChart(canvasId, data, customOptions = {}) {
    destroyChart(canvasId);

    const ctx = document.getElementById(canvasId).getContext('2d');

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        layout: {
            padding: {
                right: 20,
                left: 20,
                top: 20,
                bottom: 20
            }
        },
        plugins: {
            legend: {
                position: 'right', // Move legend to right to avoid bottom cutoff
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    padding: 10,
                    boxWidth: 12
                }
            },
            tooltip: {
                ...defaultOptions.plugins.tooltip
            }
        },
        ...customOptions
    };

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: data.backgroundColor || ['#5c7cfa', '#ff6b6b'],
                borderWidth: 0
            }]
        },
        options
    });

    return chartInstances[canvasId];
}

/**
 * Create word cloud using wordcloud2.js
 * @param {string} canvasId - Canvas element ID
 * @param {Array} words - Array of [word, size] pairs
 */
export function createWordCloud(canvasId, words) {
    const canvas = document.getElementById(canvasId);

    if (!words || words.length === 0) {
        // Clear canvas if no words
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Inter';
        ctx.fillStyle = '#8b9cad';
        ctx.textAlign = 'center';
        ctx.fillText('No words to display', canvas.width / 2, canvas.height / 2);
        return;
    }

    // Color palette for word cloud
    const colors = [
        '#5c7cfa', '#748ffc', '#91a7ff',
        '#4263eb', '#3b5bdb', '#364fc7',
        '#845ef7', '#7950f2', '#6741d9'
    ];

    WordCloud(canvas, {
        list: words,
        gridSize: 8,
        weightFactor: 1,
        fontFamily: 'Inter, sans-serif',
        color: () => colors[Math.floor(Math.random() * colors.length)],
        rotateRatio: 0.3,
        rotationSteps: 2,
        backgroundColor: 'transparent',
        drawOutOfBound: false,
        shrinkToFit: true
    });
}

/**
 * Create horizontal bar chart for top words
 * @param {string} canvasId - Canvas element ID
 * @param {Array} topWords - Array of {word, count} objects
 */
export function createTopWordsChart(canvasId, topWords) {
    destroyChart(canvasId);

    const ctx = document.getElementById(canvasId).getContext('2d');

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topWords.map(w => w.word),
            datasets: [{
                label: 'Frequency',
                data: topWords.map(w => w.count),
                backgroundColor: 'rgba(92, 124, 250, 0.7)',
                borderRadius: 4,
                maxBarThickness: 30
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: defaultOptions.plugins.tooltip
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: "'Inter', sans-serif",
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                    }
                }
            }
        }
    });

    return chartInstances[canvasId];
}

/**
 * Destroy a chart instance
 * @param {string} canvasId - Canvas element ID
 */
export function destroyChart(canvasId) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }
}

/**
 * Destroy all chart instances
 */
export function destroyAllCharts() {
    Object.keys(chartInstances).forEach(id => destroyChart(id));
}
