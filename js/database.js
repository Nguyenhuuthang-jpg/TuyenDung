// Database Management Module
class RecruitmentDatabase {
  constructor() {
    this.storageKey = "recruitment_candidates_v2";
    this.candidates = [];
    this.settings = {
      autoSave: true,
      pageSize: 10,
    };
    this.listeners = [];
  }

  // Load dữ liệu từ localStorage
  loadData() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      if (storedData) {
        this.candidates = JSON.parse(storedData);
      } else {
        // Dữ liệu mẫu
        this.candidates = this.getSampleData();
        this.saveData();
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu:', e);
      this.candidates = this.getSampleData();
    }

    try {
      const storedSettings = localStorage.getItem("recruitment_settings");
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (e) {
      console.error('Lỗi khi tải cài đặt:', e);
    }

    return this.candidates;
  }

  // Lưu dữ liệu vào localStorage
  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.candidates));
      if (this.settings.autoSave) {
        this.notifyListeners();
      }
    } catch (e) {
      console.error('Lỗi khi lưu dữ liệu:', e);
    }
  }

  // Lưu cài đặt
  saveSettings() {
    localStorage.setItem("recruitment_settings", JSON.stringify(this.settings));
  }

  // Thêm ứng viên mới
  addCandidate(candidateData) {
    const newCandidate = {
      id: Date.now(),
      source: "admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...candidateData,
    };
    this.candidates.push(newCandidate);
    this.saveData();
    return newCandidate;
  }

  // Cập nhật ứng viên
  updateCandidate(id, updatedData) {
    const index = this.candidates.findIndex((c) => c.id == id);
    if (index !== -1) {
      this.candidates[index] = {
        ...this.candidates[index],
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
      this.saveData();
      return this.candidates[index];
    }
    return null;
  }

  // Xóa ứng viên
  deleteCandidate(id) {
    this.candidates = this.candidates.filter((c) => c.id != id);
    this.saveData();
    return true;
  }

  // Xóa tất cả
  clearAll() {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?")) {
      this.candidates = [];
      this.saveData();
      return true;
    }
    return false;
  }

  // Lấy ứng viên theo ID
  getCandidateById(id) {
    return this.candidates.find((c) => c.id == id);
  }

  // Lọc ứng viên
  filterCandidates(filters) {
    let result = [...this.candidates];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.fullName && c.fullName.toLowerCase().includes(searchLower)) ||
          (c.email && c.email.toLowerCase().includes(searchLower)) ||
          (c.position && c.position.toLowerCase().includes(searchLower)) ||
          (c.phone && c.phone.includes(searchLower)),
      );
    }

    if (filters.position && filters.position !== "") {
      result = result.filter((c) => c.position === filters.position);
    }

    if (filters.status && filters.status !== "") {
      result = result.filter((c) => c.status === filters.status);
    }

    // Lọc theo nguồn (admin / public)
    if (filters.source && filters.source !== "") {
      result = result.filter((c) => c.source === filters.source);
    }

    return result;
  }

  // Thống kê
  getStatistics() {
    const total = this.candidates.length;
    const pending = this.candidates.filter((c) => c.status === "pending").length;
    const interview = this.candidates.filter((c) => c.status === "interview").length;
    const passed = this.candidates.filter((c) => c.status === "passed").length;
    const rejected = this.candidates.filter((c) => c.status === "rejected").length;

    // Thống kê theo vị trí
    const positionStats = {};
    this.candidates.forEach((c) => {
      positionStats[c.position] = (positionStats[c.position] || 0) + 1;
    });

    // Thống kê theo kinh nghiệm
    const expStats = {
      "0-1 năm": 0,
      "1-3 năm": 0,
      "3-5 năm": 0,
      "5+ năm": 0,
    };

    this.candidates.forEach((c) => {
      const exp = parseFloat(c.experience) || 0;
      if (exp < 1) expStats["0-1 năm"]++;
      else if (exp < 3) expStats["1-3 năm"]++;
      else if (exp < 5) expStats["3-5 năm"]++;
      else expStats["5+ năm"]++;
    });

    return { total, pending, interview, passed, rejected, positionStats, expStats };
  }

  // Export dữ liệu
  exportData() {
    return JSON.stringify(this.candidates, null, 2);
  }

  // Import dữ liệu
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data)) {
        this.candidates = data;
        this.saveData();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Đăng ký listener
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Thông báo thay đổi
  notifyListeners() {
    this.listeners.forEach((callback) => callback(this.candidates));
  }

  // Dữ liệu mẫu
  getSampleData() {
    return [
      {
        id: Date.now() + 1,
        fullName: "Nguyễn Văn A",
        position: "Frontend Developer",
        email: "nguyenvana@email.com",
        phone: "0901234567",
        experience: 3,
        status: "pending",
        source: "admin",
        cvLink: "https://example.com/cv1.pdf",
        notes: "Có kinh nghiệm React, Vue.js",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 2,
        fullName: "Trần Thị B",
        position: "UI/UX Designer",
        email: "tranthib@email.com",
        phone: "0987654321",
        experience: 2,
        status: "interview",
        source: "public",
        cvLink: "https://example.com/cv2.pdf",
        notes: "Giỏi Figma, có portfolio đẹp",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 3,
        fullName: "Lê Văn C",
        position: "Backend Developer",
        email: "levanc@email.com",
        phone: "0912345678",
        experience: 5,
        status: "passed",
        source: "admin",
        cvLink: "https://example.com/cv3.pdf",
        notes: "Thành thạo Node.js, Python",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  // Lấy cài đặt tuyển dụng (mặc định nếu chưa có)
  getRecruitmentSettings() {
    const DEFAULT_POSITIONS = [
      { label: 'Frontend Developer', icon: 'fa-code' },
      { label: 'Backend Developer',  icon: 'fa-server' },
      { label: 'Fullstack Developer',icon: 'fa-layer-group' },
      { label: 'UI/UX Designer',     icon: 'fa-paint-brush' },
      { label: 'Project Manager',    icon: 'fa-tasks' },
      { label: 'Tester',             icon: 'fa-bug' },
    ];
    const defaults = {
      recruitmentEnabled: true,
      companyName: "Công ty Cổ phần ABC",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      positions: DEFAULT_POSITIONS,
    };
    try {
      const raw = localStorage.getItem("recruitment_settings_v2");
      if (raw) {
        const saved = JSON.parse(raw);
        // Nếu dữ liệu cũ chưa có positions, bổ sung mặc định và lưu lại
        if (!saved.positions || !Array.isArray(saved.positions)) {
          saved.positions = DEFAULT_POSITIONS;
          localStorage.setItem("recruitment_settings_v2", JSON.stringify(saved));
        }
        return saved;
      }
    } catch (e) {
      console.error('Lỗi khi đọc cài đặt tuyển dụng:', e);
    }
    // Chưa có dữ liệu → lưu defaults
    localStorage.setItem("recruitment_settings_v2", JSON.stringify(defaults));
    return defaults;
  }

  // Lưu cài đặt tuyển dụng
  saveRecruitmentSettings(settings) {
    localStorage.setItem("recruitment_settings_v2", JSON.stringify(settings));
  }

  // Thêm ứng viên từ form công khai (source = 'public')
  addPublicCandidate(candidateData) {
    const newCandidate = {
      id: Date.now(),
      source: "public",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...candidateData,
      status: "pending",
    };
    this.candidates.push(newCandidate);
    this.saveData();
    return newCandidate;
  }
}

// Khởi tạo database global
const db = new RecruitmentDatabase();
