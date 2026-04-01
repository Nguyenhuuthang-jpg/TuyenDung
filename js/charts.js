// Charts Management Module
class ChartManager {
    constructor(db) {
        this.db = db;
        this.charts = {};
        this.initCharts();
        this.bindEvents();
    }

    initCharts() {
        // Biểu đồ vị trí (Pie)
        const positionCtx = document.getElementById('positionChart')?.getContext('2d');
        if (positionCtx) {
            this.charts.position = new Chart(positionCtx, {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#667eea', '#48bb78', '#f56565',
                            '#ed8936', '#4299e1', '#9f7aea', '#38b2ac'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} ứng viên`
                            }
                        }
                    }
                }
            });
        }

        // Biểu đồ kinh nghiệm (Bar)
        const expCtx = document.getElementById('experienceChart')?.getContext('2d');
        if (expCtx) {
            this.charts.experience = new Chart(expCtx, {
                type: 'bar',
                data: {
                    labels: ['0-1 năm', '1-3 năm', '3-5 năm', '5+ năm'],
                    datasets: [{
                        label: 'Số lượng ứng viên',
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            'rgba(102,126,234,0.8)',
                            'rgba(72,187,120,0.8)',
                            'rgba(237,137,54,0.8)',
                            'rgba(245,101,101,0.8)'
                        ],
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });
        }

        // Biểu đồ trạng thái (Doughnut)
        const statusCtx = document.getElementById('statusChart')?.getContext('2d');
        if (statusCtx) {
            this.charts.status = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Đang chờ', 'Đã phỏng vấn', 'Đã qua vòng', 'Từ chối'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ['#fef3c7', '#dbeafe', '#d1fae5', '#fee2e2'],
                        borderColor:     ['#d97706', '#2563eb', '#059669', '#dc2626'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} người`
                            }
                        }
                    }
                }
            });
        }

        // Cập nhật lần đầu
        this.updateCharts();
    }

    updateCharts() {
        const stats = this.db.getStatistics();

        // Cập nhật biểu đồ vị trí
        if (this.charts.position) {
            this.charts.position.data.labels   = Object.keys(stats.positionStats);
            this.charts.position.data.datasets[0].data = Object.values(stats.positionStats);
            this.charts.position.update();
        }

        // Cập nhật biểu đồ kinh nghiệm
        if (this.charts.experience) {
            this.charts.experience.data.datasets[0].data = Object.values(stats.expStats);
            this.charts.experience.update();
        }

        // Cập nhật biểu đồ trạng thái
        if (this.charts.status) {
            this.charts.status.data.datasets[0].data = [
                stats.pending,
                stats.interview,
                stats.passed,
                stats.rejected
            ];
            this.charts.status.update();
        }
    }

    bindEvents() {
        // Cập nhật chart khi chuyển sang tab thống kê
        const statisticsTabBtn = document.querySelector('[data-tab="statistics"]');
        if (statisticsTabBtn) {
            statisticsTabBtn.addEventListener('click', () => {
                setTimeout(() => this.updateCharts(), 150);
            });
        }
    }
}
