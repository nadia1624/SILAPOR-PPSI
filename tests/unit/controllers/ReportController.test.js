const ReportController = require("../../../controllers/ReportController");

// Mock dependencies
const mockLaporan = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  destroy: jest.fn(),
};
const mockUser = {
  findOne: jest.fn(),
};
const mockClaim = {
  create: jest.fn(),
  findOne: jest.fn(),
};

const mockReportService = {
  sendRealtimeNotification: jest.fn(),
  sendNewReportEmail: jest.fn(),
  cleanupUploadedFile: jest.fn(),
  deleteOldFile: jest.fn(),
};

// Mock constructor to return our mocked service
jest.mock("../../../services/ReportService", () => {
  return jest.fn().mockImplementation(() => mockReportService);
});

describe("ReportController Unit Tests", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    req = {
      body: {
        jenis_laporan: "Hilang",
        nama_barang: "Laptop",
        lokasi_kejadian: "Kampus",
        tanggal_kejadian: "2025-11-08",
        deskripsi: "Dicuri",
      },
      user: { email: "test@example.com", role: "user" },
      file: { filename: "foto.jpg" },
      params: { id: 1, id_laporan: 1 },
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
      render: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // -------------------- SHOW FORM --------------------
  // describe("showReportForm & showAdminReportForm", () => {
  //   it("should render report form for user", () => {
  //     controller.showReportForm(req, res);
  //     expect(res.render).toHaveBeenCalledWith("report-form", { title: "Form Laporan", role: "user" });
  //   });

  //   it("should render report form for admin", () => {
  //     req.user.role = "admin";
  //     controller.showAdminReportForm(req, res);
  //     expect(res.render).toHaveBeenCalledWith("admin/report-form", { title: "Form Laporan Admin", role: "admin" });
  //   });
  // });

  // // -------------------- CREATE --------------------
  // describe("createReport & createReportAdmin", () => {
  //   it("should create report successfully for user", async () => {
  //     mockLaporan.create.mockResolvedValue({ id_laporan: 1 });
  //     await controller.createReport(req, res);

  //     expect(mockReportService.sendRealtimeNotification).toHaveBeenCalled();
  //     expect(mockReportService.sendNewReportEmail).toHaveBeenCalled();
  //     expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/my-reports");
  //   });

  //   it("should create report successfully for admin", async () => {
  //     mockLaporan.create.mockResolvedValue({ id_laporan: 1 });
  //     await controller.createReportAdmin(req, res);
  //     expect(res.redirect).toHaveBeenCalledWith("/admin/my-reports");
  //   });
  // });

  // // -------------------- GET --------------------
  // describe("getUserReports & getAdminReports & getAllReportsUser/Admin & getDashboard", () => {
  //   it("should render my-reports for user", async () => {
  //     const fakeReports = [{ id_laporan: 1 }];
  //     const fakeUser = { email: "test@example.com", nama: "Test" };
  //     mockLaporan.findAll.mockResolvedValue(fakeReports);
  //     mockUser.findOne.mockResolvedValue(fakeUser);

  //     await controller.getUserReports(req, res);
  //     expect(res.render).toHaveBeenCalledWith("my-reports", { title: "Laporan Saya", reports: fakeReports, user: fakeUser });
  //   });

  //   it("should render admin reports", async () => {
  //     const fakeReports = [{ id_laporan: 1 }];
  //     const fakeUser = { email: "admin@test.com", nama: "Admin" };
  //     req.user.email = "admin@test.com";
  //     mockLaporan.findAll.mockResolvedValue(fakeReports);
  //     mockUser.findOne.mockResolvedValue(fakeUser);

  //     await controller.getAdminReports(req, res);
  //     expect(res.render).toHaveBeenCalledWith("admin/my-reports", {
  //       title: "Laporan Saya - Admin",
  //       reports: fakeReports,
  //       user: fakeUser,
  //       success: undefined,
  //     });
  //   });

  //   it("should render all reports for user home", async () => {
  //     const fakeReports = [{ id_laporan: 1 }];
  //     const fakeUser = { email: "test@example.com" };
  //     mockLaporan.findAll.mockResolvedValue(fakeReports);
  //     mockUser.findOne.mockResolvedValue(fakeUser);

  //     await controller.getAllReportsUser(req, res);
  //     expect(res.render).toHaveBeenCalledWith("home", { reports: fakeReports, user: fakeUser });
  //   });

  //   it("should render all reports for admin", async () => {
  //     const fakeReports = [{ id_laporan: 1 }];
  //     mockLaporan.findAll.mockResolvedValue(fakeReports);
  //     mockUser.findOne.mockResolvedValue({ email: "admin@test.com" });

  //     await controller.getAllReportsAdmin(req, res);
  //     expect(res.render).toHaveBeenCalledWith("admin/report", { reports: fakeReports, user: { email: "admin@test.com" } });
  //   });

  //   it("should render dashboard", async () => {
  //     const allReports = [{ id_laporan: 1 }];
  //     const pendingReports = [{ id_laporan: 2 }];
  //     mockLaporan.findAll
  //       .mockResolvedValueOnce(allReports)
  //       .mockResolvedValueOnce(pendingReports);
  //     mockUser.findOne.mockResolvedValue({ email: "admin@test.com" });

  //     await controller.getDashboard(req, res);
  //     expect(res.render).toHaveBeenCalledWith("admin/dashboard", { report: allReports, reports: pendingReports, user: { email: "admin@test.com" } });
  //   });
  // });

  // // -------------------- UPDATE --------------------
  // describe("updateReport & updateReportAdmin", () => {
  //   it("should update report successfully", async () => {
  //     const laporanInstance = { id_laporan: 1, email: "test@example.com", nama_barang: "Old Laptop", lokasi: "Old", deskripsi: "Old", save: jest.fn() };
  //     mockLaporan.findOne.mockResolvedValue(laporanInstance);

  //     await controller.updateReport(req, res);
  //     expect(laporanInstance.nama_barang).toBe("Laptop");
  //     expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/my-reports");
  //   });

  //   it("should return 404 if report not found", async () => {
  //     mockLaporan.findOne.mockResolvedValue(null);
  //     await controller.updateReport(req, res);
  //     expect(res.status).toHaveBeenCalledWith(404);
  //   });
  // });

  // // -------------------- DELETE --------------------
  // describe("deleteReport & deleteReportAdmin", () => {
  //   it("should delete report successfully", async () => {
  //     const laporanInstance = { foto_barang: "file.jpg", destroy: jest.fn() };
  //     mockLaporan.findOne.mockResolvedValue(laporanInstance);

  //     await controller.deleteReport(req, res);
  //     expect(mockReportService.deleteOldFile).toHaveBeenCalledWith("file.jpg");
  //     expect(res.json).toHaveBeenCalledWith({ success: true, message: "Laporan berhasil dihapus" });
  //   });

  //   it("should return error if report not found", async () => {
  //     mockLaporan.findOne.mockResolvedValue(null);
  //     await controller.deleteReport(req, res);
  //     expect(res.json).toHaveBeenCalledWith({ success: false, message: "Laporan tidak ditemukan" });
  //   });
  // });

  // // -------------------- CLAIM --------------------
  // describe("claimReport", () => {
  //   it("should claim report successfully", async () => {
  //     const laporanInstance = { email: "other@test.com", status: "On Progress", save: jest.fn() };
  //     mockLaporan.findByPk.mockResolvedValue(laporanInstance);
  //     mockUser.findOne.mockResolvedValue({ nama: "Pelapor", email: "other@test.com" });

  //     await controller.claimReport(req, res);
  //     expect(laporanInstance.status).toBe("Claimed");
  //     expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  //   });

  //   it("should return 404 if laporan not found", async () => {
  //     mockLaporan.findByPk.mockResolvedValue(null);
  //     await controller.claimReport(req, res);
  //     expect(res.status).toHaveBeenCalledWith(404);
  //   });
  // });

  // // -------------------- ACCEPT CLAIM --------------------
  // describe("acceptClaim & acceptClaimAdmin", () => {
  //   it("should accept claim successfully", async () => {
  //     const laporanInstance = { email: "test@example.com", save: jest.fn() };
  //     mockLaporan.findByPk.mockResolvedValue(laporanInstance);
  //     req.file = { filename: "bukti.jpg" };
  //     req.body = { lokasi_penyerahan: "Kampus", tanggal_penyerahan: "2025-11-08", nama_pengklaim: "John", no_telepon_pengklaim: "081234" };

  //     await controller.acceptClaim(req, res);
  //     expect(laporanInstance.status).toBe("Done");
  //     expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/history");
  //   });
  // });

  // // -------------------- REJECT CLAIM --------------------
  // describe("rejectClaim", () => {
  //   it("should reject claim successfully", async () => {
  //     const claimRecord = { status: "Waiting for approval", save: jest.fn(), alasan: null };
  //     const laporanInstance = { status: "On progress", save: jest.fn() };
  //     mockClaim.findOne.mockResolvedValue(claimRecord);
  //     mockLaporan.findByPk.mockResolvedValue(laporanInstance);
  //     req.body.alasan = "Salah klaim";

  //     await controller.rejectClaim(req, res);
  //     expect(claimRecord.status).toBe("Rejected");
  //     expect(laporanInstance.status).toBe("On progress");
  //     expect(res.json).toHaveBeenCalledWith({ success: true, message: "Claim berhasil ditolak" });
  //   });
  // });

  // // -------------------- REAPPLY --------------------
  // describe("reapplyReport & reapplyReportAdmin", () => {
  //   it("should reapply report successfully for user", async () => {
  //     const laporanInstance = { status: "Rejected", save: jest.fn() };
  //     mockLaporan.findByPk.mockResolvedValue(laporanInstance);

  //     await controller.reapplyReport(req, res);
  //     expect(laporanInstance.status).toBe("Waiting for upload verification");
  //     expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/my-reports");
  //   });

  //   it("should reapply report successfully for admin", async () => {
  //     const laporanInstance = { status: "Rejected", save: jest.fn() };
  //     mockLaporan.findByPk.mockResolvedValue(laporanInstance);

  //     await controller.reapplyReportAdmin(req, res);
  //     expect(laporanInstance.status).toBe("Waiting for upload verification");
  //     expect(res.redirect).toHaveBeenCalledWith("/admin/my-reports");
  //   });
  // });
});
