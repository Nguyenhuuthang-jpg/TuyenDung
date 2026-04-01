// Main Application — Admin only
let uiManager;
let chartManager;
let exporter;

document.addEventListener("DOMContentLoaded", () => {
  // Khởi tạo database
  db.loadData();

  // Khởi tạo UI Manager
  uiManager = new UIManager(db);
  window.uiManager = uiManager;

  // Khởi tạo Chart Manager
  chartManager = new ChartManager(db);
  window.chartManager = chartManager;

  // Khởi tạo Export Manager
  exporter = new ExportManager(db);
  window.exporter = exporter;

  // Khởi tạo tabs
  initTabs();

  // Render bảng lần đầu
  uiManager.renderTable();

  // Nút xuất PDF
  const exportStatsPdf = document.getElementById("exportStatsPdf");
  if (exportStatsPdf) {
    exportStatsPdf.addEventListener("click", () => exporter.exportToPDF());
  }

  console.log("Trang quản trị đã sẵn sàng!");
});

function initTabs() {
  const tabBtns     = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");

      // Cập nhật active button
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Ẩn tất cả tab content
      tabContents.forEach((c) => c.classList.remove("active"));

      if (tabId === "candidates") {
        document.getElementById("candidatesTab")?.classList.add("active");

      } else if (tabId === "statistics") {
        document.getElementById("statisticsTab")?.classList.add("active");
        // Cập nhật biểu đồ khi chuyển sang tab thống kê
        if (chartManager) setTimeout(() => chartManager.updateCharts(), 100);

      } else if (tabId === "settings") {
        document.getElementById("settingsTab")?.classList.add("active");
      }
    });
  });
}
