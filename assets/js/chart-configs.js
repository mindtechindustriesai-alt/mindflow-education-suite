// 📈 CHART CONFIGURATIONS - MindFlow Education Suite
class MindFlowChartConfigs {
    constructor() {
        this.themes = this.initializeThemes();
        this.chartInstances = new Map();
        console.log('📈 MindFlow Chart Configurations initialized');
    }

    // ✅ QUANTUM-INSPIRED THEMES
    initializeThemes() {
        return {
            mindflow: {
                backgroundColor: 'rgba(0, 102, 255, 0.1)',
                borderColor: '#0066FF',
                pointColor: '#00D4AA',
                gridColor: 'rgba(255, 255, 255, 0.1)',
                textColor: '#e0e0ff',
                successColor: '#00FFAA',
                warningColor: '#FFD700',
                dangerColor: '#FF3366'
            },
            khensani: {
                backgroundColor: 'rgba(0, 212, 170, 0.1)',
                borderColor: '#00D4AA',
                pointColor: '#0066FF',
                gridColor: 'rgba(255, 255, 255, 0.15)',
                textColor: '#e0e0ff',
                successColor: '#00FF88',
                warningColor: '#FFAA00',
                dangerColor: '#FF3366'
            },
            security: {
                backgroundColor: 'rgba(255, 51, 102, 0.1)',
                borderColor: '#FF3366',
                pointColor: '#FFD700',
                gridColor: 'rgba(255, 255, 255, 0.2)',
                textColor: '#ffffff',
                successColor: '#00FFAA',
                warningColor: '#FFAA00',
                dangerColor: '#FF3366'
            },
            corporate: {
                backgroundColor: 'rgba(138, 43, 226, 0.1)',
                borderColor: '#8A2BE2',
                pointColor: '#0066FF',
                gridColor: 'rgba(255, 255, 255, 0.1)',
                textColor: '#e0e0ff',
                successColor: '#00FFAA',
                warningColor: '#FFD700',
                dangerColor: '#FF3366'
            }
        };
    }

    // ✅ BASE CONFIGURATION TEMPLATE
    getBaseConfig(theme = 'mindflow') {
        const themeConfig = this.themes[theme] || this.themes.mindflow;
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: themeConfig.textColor,
                        font: {
                            family: "'Exo 2', sans-serif",
                            size: 12,
                            weight: '500'
                        },
                        usePointStyle: true,
                        padding: 20
                    },
                    position: 'top',
                    align: 'center'
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 10, 42, 0.95)',
                    titleColor: themeConfig.textColor,
                    bodyColor: themeConfig.textColor,
                    borderColor: themeConfig.borderColor,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: themeConfig.gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: themeConfig.textColor,
                        font: {
                            family: "'Exo 2', sans-serif",
                            size: 11
                        },
                        padding: 10
                    }
                },
                x: {
                    grid: {
                        color: themeConfig.gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: themeConfig.textColor,
                        font: {
                            family: "'Exo 2', sans-serif",
                            size: 11
                        },
                        padding: 10
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };
    }

    // ✅ LINE CHART CONFIGURATION
    createLineChart(canvasId, data, options = {}) {
        const theme = options.theme || 'mindflow';
        const themeConfig = this.themes[theme];
        
        const config = {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label || `Dataset ${index + 1}`,
                    data: dataset.data || [],
                    borderColor: dataset.borderColor || themeConfig.borderColor,
                    backgroundColor: dataset.backgroundColor || themeConfig.backgroundColor,
                    pointBackgroundColor: dataset.pointColor || themeConfig.pointColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: dataset.fill || false,
                    cubicInterpolationMode: 'monotone'
                }))
            },
            options: this.mergeOptions(this.getBaseConfig(theme), options)
        };

        return this.initializeChart(canvasId, config);
    }

    // ✅ BAR CHART CONFIGURATION
    createBarChart(canvasId, data, options = {}) {
        const theme = options.theme || 'mindflow';
        const themeConfig = this.themes[theme];

        const config = {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label || `Dataset ${index + 1}`,
                    data: dataset.data || [],
                    backgroundColor: dataset.backgroundColor || [
                        'rgba(0, 102, 255, 0.8)',
                        'rgba(0, 212, 170, 0.8)',
                        'rgba(138, 43, 226, 0.8)',
                        'rgba(255, 209, 0, 0.8)',
                        'rgba(255, 51, 102, 0.8)'
                    ][index % 5],
                    borderColor: dataset.borderColor || '#ffffff',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                }))
            },
            options: this.mergeOptions(this.getBaseConfig(theme), {
                ...options,
                scales: {
                    y: {
                        ...this.getBaseConfig(theme).scales.y,
                        beginAtZero: true
                    },
                    x: {
                        ...this.getBaseConfig(theme).scales.x
                    }
                }
            })
        };

        return this.initializeChart(canvasId, config);
    }

    // ✅ PIE CHART CONFIGURATION
    createPieChart(canvasId, data, options = {}) {
        const theme = options.theme || 'mindflow';
        const themeConfig = this.themes[theme];

        const config = {
            type: 'pie',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: data.backgroundColor || [
                        'rgba(0, 102, 255, 0.8)',
                        'rgba(0, 212, 170, 0.8)',
                        'rgba(138, 43, 226, 0.8)',
                        'rgba(255, 209, 0, 0.8)',
                        'rgba(255, 51, 102, 0.8)',
                        'rgba(0, 255, 170, 0.8)',
                        'rgba(128, 0, 255, 0.8)'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverOffset: 15
                }]
            },
            options: this.mergeOptions(this.getBaseConfig(theme), {
                ...options,
                plugins: {
                    ...this.getBaseConfig(theme).plugins,
                    legend: {
                        ...this.getBaseConfig(theme).plugins.legend,
                        position: 'right'
                    }
                }
            })
        };

        return this.initializeChart(canvasId, config);
    }

    // ✅ RADAR CHART CONFIGURATION (Skills Assessment)
    createRadarChart(canvasId, data, options = {}) {
        const theme = options.theme || 'mindflow';
        const themeConfig = this.themes[theme];

        const config = {
            type: 'radar',
            data: {
                labels: data.labels || [],
                datasets: data.datasets.map((dataset, index) => ({
                    label: dataset.label || `Student ${index + 1}`,
                    data: dataset.data || [],
                    backgroundColor: dataset.backgroundColor || `${themeConfig.backgroundColor}40`,
                    borderColor: dataset.borderColor || themeConfig.borderColor,
                    pointBackgroundColor: dataset.pointColor || themeConfig.pointColor,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    borderWidth: 2,
                    fill: true
                }))
            },
            options: this.mergeOptions(this.getBaseConfig(theme), {
                ...options,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: options.maxValue || 100,
                        ticks: {
                            color: themeConfig.textColor,
                            backdropColor: 'transparent',
                            stepSize: options.stepSize || 20
                        },
                        grid: {
                            color: themeConfig.gridColor
                        },
                        angleLines: {
                            color: themeConfig.gridColor
                        },
                        pointLabels: {
                            color: themeConfig.textColor,
                            font: {
                                family: "'Exo 2', sans-serif",
                                size: 11
                            }
                        }
                    }
                }
            })
        };

        return this.initializeChart(canvasId, config);
    }

    // ✅ PROGRESS CHART CONFIGURATION
    createProgressChart(canvasId, current, total, options = {}) {
        const theme = options.theme || 'mindflow';
        const themeConfig = this.themes[theme];
        const percentage = (current / total) * 100;

        const config = {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [current, total - current],
                    backgroundColor: [
                        themeConfig.successColor,
                        themeConfig.gridColor
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: this.mergeOptions(this.getBaseConfig(theme), {
                ...options,
                cutout: '70%',
                plugins: {
                    ...this.getBaseConfig(theme).plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}`;
                            }
                        }
                    }
                }
            })
        };

        const chart = this.initializeChart(canvasId, config);
        
        // Add percentage text in center
        this.addChartCenterText(canvasId, `${percentage.toFixed(1)}%`, options.text || 'Progress');
        
        return chart;
    }

    // ✅ REAL-TIME DATA STREAM CHART
    createRealTimeChart(canvasId, options = {}) {
        const theme = options.theme || 'mindflow';
        const themeConfig = this.themes[theme];

        const config = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: options.label || 'Real-time Data',
                    data: [],
                    borderColor: themeConfig.borderColor,
                    backgroundColor: themeConfig.backgroundColor,
                    pointBackgroundColor: themeConfig.pointColor,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: this.mergeOptions(this.getBaseConfig(theme), {
                ...options,
                animation: {
                    duration: 0
                },
                plugins: {
                    ...this.getBaseConfig(theme).plugins,
                    streaming: {
                        duration: 20000,
                        refresh: 1000,
                        delay: 0
                    }
                },
                scales: {
                    x: {
                        ...this.getBaseConfig(theme).scales.x,
                        type: 'realtime',
                        realtime: {
                            duration: 20000,
                            refresh: 1000,
                            delay: 0,
                            onRefresh: options.onRefresh || null
                        }
                    },
                    y: {
                        ...this.getBaseConfig(theme).scales.y
                    }
                }
            })
        };

        return this.initializeChart(canvasId, config);
    }

    // ✅ UTILITY METHODS
    initializeChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas element with id '${canvasId}' not found`);
            return null;
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, config);
        
        this.chartInstances.set(canvasId, chart);
        return chart;
    }

    mergeOptions(baseOptions, customOptions) {
        const mergeDeep = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    mergeDeep(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        };

        return mergeDeep(JSON.parse(JSON.stringify(baseOptions)), customOptions);
    }

    addChartCenterText(canvasId, mainText, subText = '') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Main text
        ctx.font = 'bold 24px "Exo 2", sans-serif';
        ctx.fillStyle = this.themes.mindflow.textColor;
        ctx.fillText(mainText, centerX, centerY - 10);
        
        // Sub text
        if (subText) {
            ctx.font = '12px "Exo 2", sans-serif';
            ctx.fillStyle = this.themes.mindflow.gridColor;
            ctx.fillText(subText, centerX, centerY + 15);
        }
        
        ctx.restore();
    }

    // ✅ CHART MANAGEMENT
    updateChartData(canvasId, newData) {
        const chart = this.chartInstances.get(canvasId);
        if (chart) {
            chart.data = newData;
            chart.update();
        }
    }

    destroyChart(canvasId) {
        const chart = this.chartInstances.get(canvasId);
        if (chart) {
            chart.destroy();
            this.chartInstances.delete(canvasId);
        }
    }

    // ✅ QUANTUM ANIMATIONS
    addQuantumGlow(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        canvas.style.boxShadow = '0 0 30px rgba(0, 102, 255, 0.5)';
        canvas.style.transition = 'box-shadow 0.3s ease';
        
        setTimeout(() => {
            canvas.style.boxShadow = '0 0 15px rgba(0, 102, 255, 0.3)';
        }, 1000);
    }

    // ✅ PRE-BUILT DASHBOARD CHARTS
    getStudentProgressConfig() {
        return {
            theme: 'education',
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Learning Progress',
                        color: this.themes.education.textColor,
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        };
    }

    getSecurityMonitoringConfig() {
        return {
            theme: 'security',
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Security Activity',
                        color: this.themes.security.textColor,
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        };
    }

    getCorporateAnalyticsConfig() {
        return {
            theme: 'corporate',
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Business Intelligence',
                        color: this.themes.corporate.textColor,
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        };
    }
}

// Initialize Chart System
document.addEventListener('DOMContentLoaded', () => {
    window.MindFlowCharts = new MindFlowChartConfigs();
    console.log('📈 MindFlow Chart System ready for quantum visualization');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MindFlowChartConfigs;
}