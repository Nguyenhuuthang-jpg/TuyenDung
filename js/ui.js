// UI Management Module — Admin only
class UIManager {
    constructor(db) {
        this.db = db;
        this.currentFilters = {
            search: '',
            position: '',
            status: '',
            source: ''
        };
        this.currentPage = 1;
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.elements = {
            tableBody:        document.getElementById('tableBody'),
            searchInput:      document.getElementById('searchInput'),
            filterPosition:   document.getElementById('filterPosition'),
            filterStatus:     document.getElementById('filterStatus'),
            filterSource:     document.getElementById('filterSource'),
            totalCount:       document.getElementById('totalCount'),
            pendingCount:     document.getElementById('pendingCount'),
            passedCount:      document.getElementById('passedCount'),
            displayCount:     document.getElementById('displayCount'),
            form:             document.getElementById('candidateForm'),
            fullName:         document.getElementById('fullName'),
            position:         document.getElementById('position'),
            email:            document.getElementById('email'),
            phone:            document.getElementById('phone'),
            experience:       document.getElementById('experience'),
            status:           document.getElementById('status'),
            cvLink:           document.getElementById('cvLink'),
            notes:            document.getElementById('notes'),
            submitBtn:        document.getElementById('submitBtn'),
            cancelBtn:        document.getElementById('cancelBtn'),
            formTitle:        document.getElementById('formTitle'),
            refreshBtn:       document.getElementById('refreshBtn'),
            clearAllData:     document.getElementById('clearAllData'),
            autoSave:         document.getElementById('autoSave'),
            pageSize:         document.getElementById('pageSize'),
            backupBtn:        document.getElementById('backupBtn'),
            restoreBtn:       document.getElementById('restoreBtn'),
            exportExcelBtn:   document.getElementById('exportExcelBtn'),
            // Settings tuyển dụng
            recruitmentEnabled: document.getElementById('recruitmentEnabled'),
            companyName:        document.getElementById('companyName'),
            recruitStartDate:   document.getElementById('recruitStartDate'),
            recruitEndDate:     document.getElementById('recruitEndDate'),
        };
        this.editId = null;
    }

    bindEvents() {
        // Form submit
        if (this.elements.form) {
            this.elements.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        if (this.elements.cancelBtn) {
            this.elements.cancelBtn.addEventListener('click', () => this.resetForm());
        }
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', () => this.refresh());
        }

        // Bộ lọc
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.renderTable();
            });
        }
        if (this.elements.filterPosition) {
            this.elements.filterPosition.addEventListener('change', (e) => {
                this.currentFilters.position = e.target.value;
                this.renderTable();
            });
        }
        if (this.elements.filterStatus) {
            this.elements.filterStatus.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.renderTable();
            });
        }
        if (this.elements.filterSource) {
            this.elements.filterSource.addEventListener('change', (e) => {
                this.currentFilters.source = e.target.value;
                this.renderTable();
            });
        }

        // Settings chung
        if (this.elements.clearAllData) {
            this.elements.clearAllData.addEventListener('click', () => {
                if (this.db.clearAll()) {
                    this.renderTable();
                    this.showNotification('Đã xóa toàn bộ dữ liệu!', 'success');
                }
            });
        }
        if (this.elements.autoSave) {
            this.elements.autoSave.addEventListener('change', (e) => {
                this.db.settings.autoSave = e.target.checked;
                this.db.saveSettings();
            });
            this.elements.autoSave.checked = this.db.settings.autoSave;
        }
        if (this.elements.pageSize) {
            this.elements.pageSize.addEventListener('change', (e) => {
                this.db.settings.pageSize = parseInt(e.target.value);
                this.db.saveSettings();
                this.renderTable();
            });
            this.elements.pageSize.value = this.db.settings.pageSize;
        }

        // Backup / Restore
        if (this.elements.backupBtn) {
            this.elements.backupBtn.addEventListener('click', () => this.backupData());
        }
        if (this.elements.restoreBtn) {
            this.elements.restoreBtn.addEventListener('click', () => this.restoreData());
        }

        // Xuất Excel
        if (this.elements.exportExcelBtn) {
            this.elements.exportExcelBtn.addEventListener('click', () => {
                if (window.exporter) {
                    window.exporter.exportToExcel(this.db.candidates);
                } else {
                    this.showNotification('Tính năng xuất Excel chưa sẵn sàng!', 'error');
                }
            });
        }

        // Settings tuyển dụng
        if (this.elements.recruitmentEnabled) {
            this.elements.recruitmentEnabled.addEventListener('change', () => this.saveRecruitmentSettings());
        }
        if (this.elements.companyName) {
            this.elements.companyName.addEventListener('change', () => this.saveRecruitmentSettings());
        }
        if (this.elements.recruitStartDate) {
            this.elements.recruitStartDate.addEventListener('change', () => this.saveRecruitmentSettings());
        }
        if (this.elements.recruitEndDate) {
            this.elements.recruitEndDate.addEventListener('change', () => this.saveRecruitmentSettings());
        }

        // Quản lý vị trí tuyển dụng
        const addPositionBtn = document.getElementById('addPositionBtn');
        if (addPositionBtn) {
            addPositionBtn.addEventListener('click', () => this.addPosition());
        }
        const newPositionInput = document.getElementById('newPositionInput');
        if (newPositionInput) {
            newPositionInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); this.addPosition(); }
            });
        }

        // Database listener — tự động cập nhật bảng khi có thay đổi
        this.db.addListener(() => {
            this.renderTable();
            this.updateStats();
            if (window.chartManager) window.chartManager.updateCharts();
        });

        // Load recruitment settings vào form
        this.loadRecruitmentSettings();
    }

    // ── Form thêm/sửa ứng viên ──────────────────────────────────────────
    handleSubmit(e) {
        e.preventDefault();
        const candidateData = {
            fullName:   this.elements.fullName.value.trim(),
            position:   this.elements.position.value,
            email:      this.elements.email.value.trim(),
            phone:      this.elements.phone.value.trim(),
            experience: parseFloat(this.elements.experience.value) || 0,
            status:     this.elements.status.value,
            cvLink:     this.elements.cvLink.value.trim(),
            notes:      this.elements.notes.value.trim(),
            source:     'admin'
        };

        if (!candidateData.fullName || !candidateData.position ||
            !candidateData.email || !candidateData.phone) {
            this.showNotification('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
            return;
        }

        if (this.editId) {
            this.db.updateCandidate(this.editId, candidateData);
            this.showNotification('Cập nhật thành công!', 'success');
        } else {
            this.db.addCandidate(candidateData);
            this.showNotification('Thêm ứng viên thành công!', 'success');
        }
        this.resetForm();
    }

    // ── Render bảng ──────────────────────────────────────────────────────
    renderTable() {
        const filtered  = this.db.filterCandidates(this.currentFilters);
        const pageSize  = this.db.settings.pageSize || 10;
        const start     = (this.currentPage - 1) * pageSize;
        const paginated = filtered.slice(start, start + pageSize);

        if (filtered.length === 0) {
            this.elements.tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="10">
                        <i class="fas fa-folder-open"></i>
                        Không tìm thấy ứng viên nào
                    </td>
                </tr>`;
            if (this.elements.displayCount) this.elements.displayCount.textContent = '0';
            this.updateStats();
            return;
        }

        this.elements.tableBody.innerHTML = paginated.map((c, idx) => {
            const statusClass = this.getStatusClass(c.status);
            const statusText  = this.getStatusText(c.status);
            const sourceBadge = c.source === 'public'
                ? '<span class="badge-public"><i class="fas fa-user"></i> Ứng viên nộp</span>'
                : '<span class="badge-admin"><i class="fas fa-user-tie"></i> Quản lý</span>';

            return `
                <tr>
                    <td>${start + idx + 1}</td>
                    <td><strong>${this.escapeHtml(c.fullName)}</strong></td>
                    <td>${this.escapeHtml(c.position)}</td>
                    <td>${this.escapeHtml(c.email)}</td>
                    <td>${this.escapeHtml(c.phone)}</td>
                    <td>${c.experience || 0} năm</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        ${c.cvLink
                            ? `<a href="${this.escapeHtml(c.cvLink)}" target="_blank" class="cv-link">
                                   <i class="fas fa-file-pdf"></i> Xem
                               </a>`
                            : '<span style="color:#999">Chưa có</span>'}
                    </td>
                    <td class="action-buttons">
                        <button class="btn btn-primary" onclick="uiManager.editCandidate(${c.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="uiManager.deleteCandidate(${c.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                    <td>${sourceBadge}</td>
                </tr>`;
        }).join('');

        if (this.elements.displayCount) this.elements.displayCount.textContent = filtered.length;
        this.updateStats();
    }

    updateStats() {
        const stats = this.db.getStatistics();
        if (this.elements.totalCount)   this.elements.totalCount.textContent   = stats.total;
        if (this.elements.pendingCount) this.elements.pendingCount.textContent = stats.pending;
        if (this.elements.passedCount)  this.elements.passedCount.textContent  = stats.passed;
    }

    // ── Edit / Delete ────────────────────────────────────────────────────
    editCandidate(id) {
        const c = this.db.getCandidateById(id);
        if (!c) return;
        this.editId = c.id;
        this.elements.fullName.value   = c.fullName;
        this.elements.position.value   = c.position;
        this.elements.email.value      = c.email;
        this.elements.phone.value      = c.phone;
        this.elements.experience.value = c.experience || 0;
        this.elements.status.value     = c.status || 'pending';
        this.elements.cvLink.value     = c.cvLink || '';
        this.elements.notes.value      = c.notes || '';

        this.elements.formTitle.innerHTML  = '<i class="fas fa-edit"></i> Chỉnh Sửa Hồ Sơ';
        this.elements.submitBtn.innerHTML  = '<i class="fas fa-save"></i> Cập Nhật';
        this.elements.cancelBtn.style.display = 'inline-block';

        // Chuyển về tab candidates nếu đang ở tab khác
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const btn = document.querySelector('[data-tab="candidates"]');
        if (btn) btn.classList.add('active');
        const tab = document.getElementById('candidatesTab');
        if (tab) tab.classList.add('active');

        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }

    deleteCandidate(id) {
        if (confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) {
            this.db.deleteCandidate(id);
            this.showNotification('Đã xóa hồ sơ!', 'info');
        }
    }

    resetForm() {
        if (this.elements.form) this.elements.form.reset();
        this.editId = null;
        this.elements.formTitle.innerHTML    = '<i class="fas fa-user-plus"></i> Thêm Hồ Sơ Ứng Viên';
        this.elements.submitBtn.innerHTML    = '<i class="fas fa-save"></i> Lưu Hồ Sơ';
        this.elements.cancelBtn.style.display = 'none';
        this.elements.experience.value       = '0';
        this.elements.status.value           = 'pending';
    }

    refresh() {
        this.currentFilters = { search: '', position: '', status: '', source: '' };
        if (this.elements.filterSource)   this.elements.filterSource.value   = '';
        if (this.elements.searchInput)    this.elements.searchInput.value    = '';
        if (this.elements.filterPosition) this.elements.filterPosition.value = '';
        if (this.elements.filterStatus)   this.elements.filterStatus.value   = '';
        this.currentPage = 1;
        this.renderTable();
        this.showNotification('Đã làm mới danh sách!', 'info');
    }

    // ── Backup / Restore ─────────────────────────────────────────────────
    backupData() {
        const blob = new Blob([this.db.exportData()], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `recruitment_backup_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('Đã xuất backup thành công!', 'success');
    }

    restoreData() {
        const input    = document.createElement('input');
        input.type     = 'file';
        input.accept   = '.json';
        input.onchange = (e) => {
            const file   = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (this.db.importData(ev.target.result)) {
                    this.renderTable();
                    this.showNotification('Khôi phục dữ liệu thành công!', 'success');
                } else {
                    this.showNotification('File không hợp lệ!', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    // ── Notification ─────────────────────────────────────────────────────
    showNotification(message, type = 'info') {
        const n = document.createElement('div');
        n.className = `notification notification-${type}`;
        const icon  = type === 'success' ? 'fa-check-circle'
                    : type === 'error'   ? 'fa-exclamation-circle'
                    :                      'fa-info-circle';
        n.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        document.body.appendChild(n);
        setTimeout(() => {
            n.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => n.remove(), 300);
        }, 3000);
    }

    // ── Helpers ───────────────────────────────────────────────────────────
    getStatusClass(status) {
        return { pending:'status-pending', interview:'status-interview',
                 passed:'status-passed',   rejected:'status-rejected' }[status] || 'status-pending';
    }

    getStatusText(status) {
        return { pending:'Đang chờ', interview:'Đã phỏng vấn',
                 passed:'Đã qua vòng', rejected:'Từ chối' }[status] || 'Đang chờ';
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m =>
            ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' })[m]);
    }

    // ── Settings tuyển dụng ───────────────────────────────────────────────
    saveRecruitmentSettings() {
        // Đọc settings hiện có để KHÔNG mất positions khi chỉ thay đổi trường khác
        const existing = this.db.getRecruitmentSettings();
        const s = {
            ...existing,
            recruitmentEnabled: this.elements.recruitmentEnabled ? this.elements.recruitmentEnabled.checked : true,
            companyName:        this.elements.companyName        ? this.elements.companyName.value        : '',
            startDate:          this.elements.recruitStartDate   ? this.elements.recruitStartDate.value   : '',
            endDate:            this.elements.recruitEndDate     ? this.elements.recruitEndDate.value     : '',
        };
        this.db.saveRecruitmentSettings(s);
        this.showNotification('Đã lưu cài đặt tuyển dụng!', 'success');
    }

    loadRecruitmentSettings() {
        const s = this.db.getRecruitmentSettings();
        if (this.elements.recruitmentEnabled) this.elements.recruitmentEnabled.checked = s.recruitmentEnabled;
        if (this.elements.companyName)        this.elements.companyName.value         = s.companyName  || '';
        if (this.elements.recruitStartDate)   this.elements.recruitStartDate.value    = s.startDate    || '';
        if (this.elements.recruitEndDate)     this.elements.recruitEndDate.value      = s.endDate      || '';
        // Render danh sách vị trí và đồng bộ các dropdown
        this.renderPositionsList();
        this.syncAdminPositionDropdown();
        this.syncFilterPositionDropdown();
    }

    // ── Quản lý vị trí tuyển dụng ────────────────────────────────────────
    renderPositionsList() {
        const container = document.getElementById('positionsList');
        if (!container) return;
        const s = this.db.getRecruitmentSettings();
        const positions = s.positions || [];

        if (positions.length === 0) {
            container.innerHTML = '<span style="color:#999;font-size:13px">Chưa có vị trí nào. Thêm vị trí bên trên.</span>';
            return;
        }

        container.innerHTML = positions.map((p, idx) => `
            <div style="display:inline-flex;align-items:center;gap:8px;
                        background:#f0f4ff;border:2px solid #c7d2fe;
                        border-radius:100px;padding:7px 14px;font-size:13px;font-weight:600;color:#4c51bf">
                <i class="fas ${p.icon || 'fa-briefcase'}"></i>
                <span>${this.escapeHtml(p.label)}</span>
                <button onclick="uiManager.deletePosition(${idx})"
                    title="Xóa vị trí này"
                    style="background:none;border:none;cursor:pointer;color:#f56565;
                           font-size:13px;padding:0;margin-left:4px;line-height:1">
                    <i class="fas fa-times-circle"></i>
                </button>
            </div>`).join('');
    }

    addPosition() {
        const input = document.getElementById('newPositionInput');
        if (!input) return;
        const label = input.value.trim();
        if (!label) {
            this.showNotification('Vui lòng nhập tên vị trí!', 'error');
            return;
        }

        const s = this.db.getRecruitmentSettings();
        const positions = s.positions || [];

        // Kiểm tra trùng tên
        if (positions.some(p => p.label.toLowerCase() === label.toLowerCase())) {
            this.showNotification('Vị trí này đã tồn tại!', 'error');
            return;
        }

        // Tự chọn icon theo từ khóa
        const icon = this.guessPositionIcon(label);
        positions.push({ label, icon });
        s.positions = positions;
        this.db.saveRecruitmentSettings(s);

        input.value = '';
        this.renderPositionsList();
        this.syncAdminPositionDropdown();
        this.syncFilterPositionDropdown();
        this.showNotification(`Đã thêm vị trí "${label}"!`, 'success');
    }

    deletePosition(idx) {
        const s = this.db.getRecruitmentSettings();
        const positions = s.positions || [];
        const removed = positions[idx];
        if (!removed) return;

        if (!confirm(`Xóa vị trí "${removed.label}"?`)) return;
        positions.splice(idx, 1);
        s.positions = positions;
        this.db.saveRecruitmentSettings(s);

        this.renderPositionsList();
        this.syncAdminPositionDropdown();
        this.syncFilterPositionDropdown();
        this.showNotification(`Đã xóa vị trí "${removed.label}"!`, 'info');
    }

    // ── Đồng bộ dropdown vị trí trong form admin ─────────────────────────
    syncAdminPositionDropdown() {
        const sel = document.getElementById('position');
        if (!sel) return;
        const s = this.db.getRecruitmentSettings();
        const positions = s.positions || [];
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">Chọn vị trí</option>' +
            positions.map(p =>
                `<option value="${this.escapeHtml(p.label)}">${this.escapeHtml(p.label)}</option>`
            ).join('');
        // Giữ lại giá trị đang chọn nếu vẫn còn trong danh sách
        if (currentVal && positions.some(p => p.label === currentVal)) {
            sel.value = currentVal;
        }
    }

    guessPositionIcon(label) {
        const l = label.toLowerCase();
        if (l.includes('front'))    return 'fa-code';
        if (l.includes('back'))     return 'fa-server';
        if (l.includes('full'))     return 'fa-layer-group';
        if (l.includes('design') || l.includes('ui') || l.includes('ux')) return 'fa-paint-brush';
        if (l.includes('manager') || l.includes('pm')) return 'fa-tasks';
        if (l.includes('test') || l.includes('qa'))    return 'fa-bug';
        if (l.includes('devops') || l.includes('ops')) return 'fa-cloud';
        if (l.includes('data') || l.includes('ai') || l.includes('ml')) return 'fa-brain';
        if (l.includes('mobile') || l.includes('android') || l.includes('ios')) return 'fa-mobile-alt';
        if (l.includes('security') || l.includes('bảo'))  return 'fa-shield-alt';
        if (l.includes('sale') || l.includes('kd'))       return 'fa-chart-line';
        if (l.includes('kế toán') || l.includes('finance')) return 'fa-calculator';
        if (l.includes('nhân sự') || l.includes('hr'))    return 'fa-users';
        return 'fa-briefcase';
    }

    // ── Đồng bộ bộ lọc vị trí ───────────────────────────────────────
    syncFilterPositionDropdown() {
        const sel = document.getElementById('filterPosition');
        if (!sel) return;
        const s = this.db.getRecruitmentSettings();
        const positions = s.positions || [];
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">Tất cả vị trí</option>' +
            positions.map(p =>
                `<option value="${this.escapeHtml(p.label)}">${this.escapeHtml(p.label)}</option>`
            ).join('');
        if (currentVal && positions.some(p => p.label === currentVal)) {
            sel.value = currentVal;
        }
    }

    formatDate(d) {
        if (!d) return 'Chưa đặt';
        const dt = new Date(d);
        return isNaN(dt) ? d : dt.toLocaleDateString('vi-VN');
    }
}

// Animation slideOut cho notification
const _style = document.createElement('style');
_style.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0);    opacity: 1; }
        to   { transform: translateX(100%); opacity: 0; }
    }`;
document.head.appendChild(_style);