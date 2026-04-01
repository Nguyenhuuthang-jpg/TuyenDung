// Export Module
class ExportManager {
    constructor(db) {
        this.db = db;
    }

    exportToExcel(data) {
        if (!window.XLSX) {
            this.showNotification('Thư viện xuất Excel chưa tải xong, thử lại!', 'error');
            return;
        }
        const worksheetData = data.map((c, i) => ({
            'STT':               i + 1,
            'Họ và tên':         c.fullName   || '',
            'Vị trí':            c.position   || '',
            'Email':             c.email      || '',
            'Số điện thoại':     c.phone      || '',
            'Kinh nghiệm (năm)': c.experience || 0,
            'Trạng thái':        this.getStatusText(c.status),
            'Link CV':           c.cvLink     || '',
            'Ghi chú':           c.notes      || '',
            'Nguồn':             c.source === 'public' ? 'Ứng viên nộp' : 'Quản lý nhập',
            'Ngày tạo':          c.createdAt ? new Date(c.createdAt).toLocaleString('vi-VN') : '',
            'Ngày cập nhật':     c.updatedAt ? new Date(c.updatedAt).toLocaleString('vi-VN') : ''
        }));

        const ws = XLSX.utils.json_to_sheet(worksheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Danh sách ứng viên');

        ws['!cols'] = [
            { wch: 6  }, // STT
            { wch: 25 }, // Họ tên
            { wch: 22 }, // Vị trí
            { wch: 28 }, // Email
            { wch: 15 }, // Điện thoại
            { wch: 12 }, // Kinh nghiệm
            { wch: 14 }, // Trạng thái
            { wch: 35 }, // Link CV
            { wch: 35 }, // Ghi chú
            { wch: 14 }, // Nguồn
            { wch: 20 }, // Ngày tạo
            { wch: 20 }, // Ngày cập nhật
        ];

        XLSX.writeFile(wb, `danh_sach_ung_vien_${new Date().toISOString().slice(0,10)}.xlsx`);
        this.showNotification('Xuất Excel thành công!', 'success');
    }

    exportToPDF() {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            this.showNotification('Vui lòng cho phép mở cửa sổ mới!', 'error');
            return;
        }
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8"/>
                <title>Báo cáo tuyển dụng</title>
                <style>
                    * { margin:0; padding:0; box-sizing:border-box; }
                    body { font-family:'Segoe UI',Arial,sans-serif; padding:24px; color:#1a202c; }
                    h1  { color:#667eea; text-align:center; margin-bottom:6px; font-size:1.6rem; }
                    .subtitle { text-align:center; color:#718096; margin-bottom:24px; font-size:.9rem; }
                    .stats { display:flex; justify-content:center; gap:16px; margin-bottom:28px; flex-wrap:wrap; }
                    .stat-box { background:#f8f9fa; padding:14px 20px; border-radius:8px;
                                text-align:center; min-width:110px; border:1px solid #e2e8f0; }
                    .stat-num { font-size:1.8rem; font-weight:800; color:#667eea; }
                    .stat-lbl { font-size:.8rem; color:#718096; margin-top:4px; }
                    table { width:100%; border-collapse:collapse; font-size:.85rem; }
                    th,td { border:1px solid #e2e8f0; padding:8px 10px; text-align:left; }
                    th { background:#f8f9fa; font-weight:700; color:#4a5568; }
                    tr:nth-child(even) { background:#fafbff; }
                    .pending  { color:#d97706; font-weight:600; }
                    .interview{ color:#2563eb; font-weight:600; }
                    .passed   { color:#059669; font-weight:600; }
                    .rejected { color:#dc2626; font-weight:600; }
                    .no-print { margin-top:24px; text-align:center; }
                    @media print { .no-print { display:none; } }
                </style>
            </head>
            <body>
                <h1>Báo Cáo Tuyển Dụng</h1>
                <p class="subtitle">Xuất lúc: ${new Date().toLocaleString('vi-VN')}</p>
                <div class="stats">${this.generateStatsHTML()}</div>
                <table>
                    <thead>
                        <tr>
                            <th>STT</th><th>Họ tên</th><th>Vị trí</th>
                            <th>Email</th><th>Kinh nghiệm</th>
                            <th>Trạng thái</th><th>Nguồn</th>
                        </tr>
                    </thead>
                    <tbody>${this.generateTableRows()}</tbody>
                </table>
                <div class="no-print">
                    <button onclick="window.print()"
                        style="padding:10px 28px;background:#667eea;color:#fff;border:none;
                               border-radius:8px;font-size:1rem;cursor:pointer;">
                        🖨️ In báo cáo
                    </button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    generateStatsHTML() {
        const s = this.db.getStatistics();
        const items = [
            { num: s.total,     lbl: 'Tổng ứng viên' },
            { num: s.pending,   lbl: 'Đang chờ' },
            { num: s.interview, lbl: 'Đã phỏng vấn' },
            { num: s.passed,    lbl: 'Đã qua vòng' },
            { num: s.rejected,  lbl: 'Từ chối' },
        ];
        return items.map(i => `
            <div class="stat-box">
                <div class="stat-num">${i.num}</div>
                <div class="stat-lbl">${i.lbl}</div>
            </div>`).join('');
    }

    generateTableRows() {
        if (!this.db.candidates.length) {
            return '<tr><td colspan="7" style="text-align:center;color:#999">Chưa có dữ liệu</td></tr>';
        }
        return this.db.candidates.map((c, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${this.esc(c.fullName)}</strong></td>
                <td>${this.esc(c.position)}</td>
                <td>${this.esc(c.email)}</td>
                <td>${c.experience || 0} năm</td>
                <td class="${c.status}">${this.getStatusText(c.status)}</td>
                <td>${c.source === 'public' ? 'Ứng viên nộp' : 'Quản lý'}</td>
            </tr>`).join('');
    }

    getStatusText(status) {
        return { pending:'Đang chờ', interview:'Đã phỏng vấn',
                 passed:'Đã qua vòng', rejected:'Từ chối' }[status] || 'Đang chờ';
    }

    esc(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m =>
            ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[m]);
    }

    showNotification(message, type = 'info') {
        const n = document.createElement('div');
        n.className = `notification notification-${type}`;
        n.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3500);
    }
}
