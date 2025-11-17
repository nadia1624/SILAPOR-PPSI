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
       send: jest.fn(), 
    };

    jest.clearAllMocks();
  });


  describe("ReportController - showReportForm", () => {
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
      user: { role: "user" }, // mock user dengan role
    };

    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
    };
  });

  test("should render 'report-form' with correct title and role", async () => {
    await controller.showReportForm(req, res);

    expect(res.render).toHaveBeenCalledWith("report-form", {
      title: "Form Laporan",
      role: req.user.role,
    });
  });

  test("should render 'error' view with 500 status if an exception occurs", async () => {
    // Simulasikan error dengan memaksa res.render throw
    res.render.mockImplementationOnce(() => {
      throw new Error("Render failed");
    });

    await controller.showReportForm(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat memuat halaman form laporan",
    });
  });
});

describe("ReportController - showAdminReportForm", () => {
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
      user: { role: "admin" }, // mock user dengan role admin
    };

    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
    };
  });

  test("should render 'admin/report-form' with correct title and role", async () => {
    await controller.showAdminReportForm(req, res);

    expect(res.render).toHaveBeenCalledWith("admin/report-form", {
      title: "Form Laporan Admin",
      role: req.user.role,
    });
  });

  test("should render 'error' view with 500 status if an exception occurs", async () => {
    // Simulasikan error dengan memaksa res.render throw
    res.render.mockImplementationOnce(() => {
      throw new Error("Render failed");
    });

    await controller.showAdminReportForm(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat memuat halaman form laporan",
    });
  });
});


describe("ReportController - getAdminReports", () => {
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
      user: { email: "admin@example.com", role: "admin" },
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
    };

    jest.clearAllMocks();
  });

  

  test("should render with success query parameter", async () => {
    req.query.success = "true";
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([]);
    mockUser.findOne.mockResolvedValue({ email: "admin@example.com" });

    await controller.getAdminReports(req, res);

    expect(res.render).toHaveBeenCalledWith("admin/my-reports", expect.objectContaining({
      success: "true",
    }));
  });

  test("should render error page if user not found", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([]);
    mockUser.findOne.mockResolvedValue(null); // user tidak ditemukan

    await controller.getAdminReports(req, res);

    expect(res.render).toHaveBeenCalledWith("admin/my-reports", expect.objectContaining({
      user: null,
    }));
  });

  

  test("should render error page if User.findOne throws", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([]);
    mockUser.findOne.mockRejectedValue(new Error("DB error"));

    await controller.getAdminReports(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat memuat data laporan",
    });
  });
});

describe("ReportController - createReport", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    // inject mock reportService
    controller.reportService = mockReportService;

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
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should create report and redirect to '/mahasiswa/my-reports' for normal user", async () => {
    mockLaporan.create.mockResolvedValue({ id_laporan: 1, ...req.body });

    await controller.createReport(req, res);

    expect(mockLaporan.create).toHaveBeenCalledWith(expect.objectContaining({
      email: "test@example.com",
      jenis_laporan: "Hilang",
      nama_barang: "Laptop",
      lokasi: "Kampus",
      deskripsi: "Dicuri",
      foto_barang: "foto.jpg",
      status: "Waiting for upload verification",
      tanggal_kejadian: expect.any(Date),
      tanggal_laporan: expect.any(Date),
    }));

    expect(mockReportService.sendRealtimeNotification).toHaveBeenCalledWith(req, expect.any(Object));
    expect(mockReportService.sendNewReportEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: "test@example.com",
    }));
    expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/my-reports");
  });

 

  test("should return 400 if required fields are missing", async () => {
    req.body.nama_barang = "";
    await controller.createReport(req, res);

    expect(mockReportService.cleanupUploadedFile).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Semua field wajib diisi",
    });
  });

  test("should return 500 if Laporan.create throws", async () => {
    mockLaporan.create.mockRejectedValue(new Error("DB error"));

    await controller.createReport(req, res);

    expect(mockReportService.cleanupUploadedFile).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Terjadi kesalahan saat menyimpan laporan",
    });
  });
});

describe("ReportController - createReportAdmin", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    // inject mock reportService
    controller.reportService = mockReportService;

    req = {
      body: {
        jenis_laporan: "Hilang",
        nama_barang: "Laptop",
        lokasi_kejadian: "Kampus",
        tanggal_kejadian: "2025-11-08",
        deskripsi: "Dicuri",
      },
      user: { email: "admin@example.com", role: "admin" },
      file: { filename: "foto.jpg" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should create report and redirect to '/admin/my-reports' for admin", async () => {
    mockLaporan.create.mockResolvedValue({ id_laporan: 1, ...req.body });

    await controller.createReportAdmin(req, res);

    expect(mockLaporan.create).toHaveBeenCalledWith(expect.objectContaining({
      email: "admin@example.com",
      jenis_laporan: "Hilang",
      nama_barang: "Laptop",
      lokasi: "Kampus",
      deskripsi: "Dicuri",
      foto_barang: "foto.jpg",
      status: "On Progress", // beda dari user biasa
      tanggal_kejadian: expect.any(Date),
      tanggal_laporan: expect.any(Date),
    }));

    // Untuk admin, seharusnya notif/email **tidak dikirim**
    expect(mockReportService.sendRealtimeNotification).not.toHaveBeenCalled();
    expect(mockReportService.sendNewReportEmail).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/admin/my-reports");
  });

  test("should return 400 if required fields are missing", async () => {
    req.body.nama_barang = "";
    await controller.createReportAdmin(req, res);

    expect(mockReportService.cleanupUploadedFile).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Semua field wajib diisi",
    });
  });

  test("should return 500 if Laporan.create throws", async () => {
    mockLaporan.create.mockRejectedValue(new Error("DB error"));

    await controller.createReportAdmin(req, res);

    expect(mockReportService.cleanupUploadedFile).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Terjadi kesalahan saat menyimpan laporan",
    });
  });
});

  describe("ReportController - getUserReports", () => {
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
      user: { email: "test@example.com", role: "user" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should render 'my-reports' with reports and user data", async () => {
    const mockReports = [{ id_laporan: 1, nama_barang: "Laptop" }];
    const mockUserData = { email: "test@example.com", nama: "Test User" };

    controller.Laporan.findAll = jest.fn().mockResolvedValue(mockReports);
    mockUser.findOne.mockResolvedValue(mockUserData);

    await controller.getUserReports(req, res);

    expect(controller.Laporan.findAll).toHaveBeenCalled();
    expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
    expect(res.render).toHaveBeenCalledWith("my-reports", {
      title: "Laporan Saya",
      reports: mockReports,
      user: mockUserData,
    });
  });

  test("should render error page if an exception occurs", async () => {
    controller.Laporan.findAll = jest.fn().mockRejectedValue(new Error("DB error"));

    await controller.getUserReports(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat memuat data laporan",
    });
  });
});

describe("ReportController - getAllReportsUser", () => {
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
      user: { email: "test@example.com", role: "user" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should render 'home' with reports and user data when user exists", async () => {
    const mockReports = [{ id_laporan: 1, nama_barang: "Laptop" }];
    const mockUserData = { email: "test@example.com", nama: "Test User" };

    controller.Laporan.findAll = jest.fn().mockResolvedValue(mockReports);
    mockUser.findOne.mockResolvedValue(mockUserData);

    await controller.getAllReportsUser(req, res);

    expect(controller.Laporan.findAll).toHaveBeenCalled();
    expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
    expect(res.render).toHaveBeenCalledWith("home", {
      reports: mockReports,
      user: mockUserData,
    });
  });

  test("should render 'home' with reports and null user when user not found", async () => {
    const mockReports = [{ id_laporan: 1, nama_barang: "Laptop" }];

    controller.Laporan.findAll = jest.fn().mockResolvedValue(mockReports);
    mockUser.findOne.mockResolvedValue(null);

    await controller.getAllReportsUser(req, res);

    expect(res.render).toHaveBeenCalledWith("home", {
      reports: mockReports,
      user: null,
    });
  });

  test("should render 'home' with null user when req.user is undefined", async () => {
    const mockReports = [{ id_laporan: 1, nama_barang: "Laptop" }];
    req.user = undefined;

    controller.Laporan.findAll = jest.fn().mockResolvedValue(mockReports);

    await controller.getAllReportsUser(req, res);

    expect(res.render).toHaveBeenCalledWith("home", {
      reports: mockReports,
      user: null,
    });
  });

  test("should send 500 if User.findOne throws", async () => {
    controller.Laporan.findAll = jest.fn().mockResolvedValue([{ id_laporan: 3 }]);
    mockUser.findOne.mockRejectedValue(new Error("DB error"));

    await controller.getAllReportsUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });
});

describe("ReportController - getAllReportsAdmin", () => {
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
      user: { email: "admin@example.com", role: "admin" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
      render: jest.fn(),
      send: jest.fn(), // penting untuk testing error handling
    };

    jest.clearAllMocks();
  });

  test("should render 'admin/report' with reports and user data", async () => {
    const mockReports = [{ id_laporan: 1, nama_barang: "Laptop" }];
    const mockUserData = { email: "admin@example.com", nama: "Admin User" };

    controller.Laporan.findAll = jest.fn().mockResolvedValue(mockReports);
    mockUser.findOne.mockResolvedValue(mockUserData);

    await controller.getAllReportsAdmin(req, res);

    expect(controller.Laporan.findAll).toHaveBeenCalled();
    expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
    expect(res.render).toHaveBeenCalledWith("admin/report", {
      reports: mockReports,
      user: mockUserData,
    });
  });

  test("should send 500 if User.findOne throws", async () => {
    controller.Laporan.findAll = jest.fn().mockResolvedValue([{ id_laporan: 3 }]);
    mockUser.findOne.mockRejectedValue(new Error("DB error"));

    await controller.getAllReportsAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });
});

describe("ReportController - getDashboard", () => {
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
      user: { email: "admin@example.com", role: "admin" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
      render: jest.fn(),
      send: jest.fn(), // penting untuk testing error handling
    };

    jest.clearAllMocks();
  });

  test("should render 'admin/dashboard' with all reports, pending reports, and user", async () => {
    mockLaporan.findAll
      .mockResolvedValueOnce([{ id_laporan: 1, nama_barang: "Laptop" }]) // allReports
      .mockResolvedValueOnce([{ id_laporan: 2, nama_barang: "HP" }]); // pendingReports
    mockUser.findOne.mockResolvedValue({ email: "admin@example.com", role: "admin" });

    await controller.getDashboard(req, res);

    expect(mockLaporan.findAll).toHaveBeenCalledTimes(2);
    expect(mockLaporan.findAll).toHaveBeenNthCalledWith(2, {
      where: { status: "Waiting for upload verification" },
      include: [{ model: mockUser }],
      order: [["createdAt", "DESC"]],
    });
    expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
    expect(res.render).toHaveBeenCalledWith("admin/dashboard", {
      report: [{ id_laporan: 1, nama_barang: "Laptop" }],
      reports: [{ id_laporan: 2, nama_barang: "HP" }],
      user: { email: "admin@example.com", role: "admin" },
    });
  });

  test("should render with empty arrays if no reports found", async () => {
    mockLaporan.findAll
      .mockResolvedValueOnce([]) // allReports
      .mockResolvedValueOnce([]); // pendingReports
    mockUser.findOne.mockResolvedValue({ email: "admin@example.com", role: "admin" });

    await controller.getDashboard(req, res);

    expect(res.render).toHaveBeenCalledWith("admin/dashboard", {
      report: [],
      reports: [],
      user: { email: "admin@example.com", role: "admin" },
    });
  });

  test("should render with null user if User.findOne returns null", async () => {
    mockLaporan.findAll
      .mockResolvedValueOnce([{ id_laporan: 1 }])
      .mockResolvedValueOnce([{ id_laporan: 2 }]);
    mockUser.findOne.mockResolvedValue(null);

    await controller.getDashboard(req, res);

    expect(res.render).toHaveBeenCalledWith("admin/dashboard", {
      report: [{ id_laporan: 1 }],
      reports: [{ id_laporan: 2 }],
      user: null,
    });
  });

  test("should send 500 if Laporan.findAll for allReports throws", async () => {
    mockLaporan.findAll.mockRejectedValueOnce(new Error("DB error"));

    await controller.getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });

  test("should send 500 if Laporan.findAll for pendingReports throws", async () => {
    mockLaporan.findAll
      .mockResolvedValueOnce([{ id_laporan: 1 }])
      .mockRejectedValueOnce(new Error("DB error"));

    await controller.getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });

  test("should send 500 if User.findOne throws", async () => {
    mockLaporan.findAll
      .mockResolvedValueOnce([{ id_laporan: 1 }])
      .mockResolvedValueOnce([{ id_laporan: 2 }]);
    mockUser.findOne.mockRejectedValue(new Error("DB error"));

    await controller.getDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });
});



describe("ReportController - rejectClaim", () => {
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
      params: { id_laporan: 1 },
      body: { alasan: "Alasan tidak valid" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should return 404 if claim not found", async () => {
    mockClaim.findOne.mockResolvedValue(null);

    await controller.rejectClaim(req, res);

    expect(mockClaim.findOne).toHaveBeenCalledWith({
      where: { id_laporan: 1, status: "Waiting for approval" },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Claim tidak ditemukan atau sudah diproses",
    });
  });

  test("should reject claim and update laporan status", async () => {
    const claimMock = { status: "Waiting for approval", save: jest.fn() };
    const laporanMock = { status: "Claimed", save: jest.fn() };

    mockClaim.findOne.mockResolvedValue(claimMock);
    mockLaporan.findByPk.mockResolvedValue(laporanMock);

    await controller.rejectClaim(req, res);

    // Claim updated
    expect(claimMock.status).toBe("Rejected");
    expect(claimMock.alasan).toBe("Alasan tidak valid");
    expect(claimMock.save).toHaveBeenCalled();

    // Laporan updated
    expect(laporanMock.status).toBe("On progress");
    expect(laporanMock.save).toHaveBeenCalled();

    // Response
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Claim berhasil ditolak",
    });
  });

  test("should reject claim even if laporan not found", async () => {
    const claimMock = { status: "Waiting for approval", save: jest.fn() };

    mockClaim.findOne.mockResolvedValue(claimMock);
    mockLaporan.findByPk.mockResolvedValue(null); // laporan tidak ditemukan

    await controller.rejectClaim(req, res);

    expect(claimMock.status).toBe("Rejected");
    expect(claimMock.alasan).toBe("Alasan tidak valid");
    expect(claimMock.save).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Claim berhasil ditolak",
    });
  });

  test("should return 500 if an exception occurs", async () => {
    mockClaim.findOne.mockRejectedValue(new Error("DB error"));

    await controller.rejectClaim(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Terjadi kesalahan saat menolak klaim",
    });
  });
});

describe("ReportController - reapplyReportAdmin", () => {
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
      params: { id_laporan: 1 },
      body: {
        nama_barang: "Laptop Baru",
        lokasi: "Lab Komputer",
        deskripsi: "Dicuri lagi",
      },
      file: { filename: "foto-baru.jpg" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should return 404 if laporan not found", async () => {
    mockLaporan.findByPk.mockResolvedValue(null);

    await controller.reapplyReportAdmin(req, res);

    expect(mockLaporan.findByPk).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Laporan tidak ditemukan");
  });

  test("should update laporan and redirect for admin", async () => {
    const laporanMock = { 
      nama_barang: "Laptop Lama", 
      lokasi: "Kampus", 
      deskripsi: "Dicuri", 
      status: "Claimed", 
      alasan: "Some reason", 
      save: jest.fn() 
    };

    mockLaporan.findByPk.mockResolvedValue(laporanMock);

    await controller.reapplyReportAdmin(req, res);

    expect(laporanMock.nama_barang).toBe("Laptop Baru");
    expect(laporanMock.lokasi).toBe("Lab Komputer");
    expect(laporanMock.deskripsi).toBe("Dicuri lagi");
    expect(laporanMock.foto_barang).toBe("foto-baru.jpg");
    expect(laporanMock.status).toBe("Waiting for upload verification");
    expect(laporanMock.alasan).toBeNull();
    expect(laporanMock.save).toHaveBeenCalled();

    expect(res.redirect).toHaveBeenCalledWith("/admin/my-reports");
  });

  test("should update laporan without new file", async () => {
    const laporanMock = { 
      nama_barang: "Laptop Lama", 
      lokasi: "Kampus", 
      deskripsi: "Dicuri", 
      status: "Claimed", 
      alasan: "Some reason", 
      foto_barang: "old-foto.jpg",
      save: jest.fn() 
    };

    mockLaporan.findByPk.mockResolvedValue(laporanMock);
    req.file = null;

    await controller.reapplyReportAdmin(req, res);

    expect(laporanMock.foto_barang).toBe("old-foto.jpg"); // tidak berubah
    expect(laporanMock.status).toBe("Waiting for upload verification");
    expect(laporanMock.alasan).toBeNull();
    expect(res.redirect).toHaveBeenCalledWith("/admin/my-reports");
  });

  test("should return 500 if an exception occurs", async () => {
    mockLaporan.findByPk.mockRejectedValue(new Error("DB error"));

    await controller.reapplyReportAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });
});


describe("ReportController - reapplyReport", () => {
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
      params: { id_laporan: 1 },
      body: {
        nama_barang: "Laptop Baru",
        lokasi: "Lab Komputer",
        deskripsi: "Dicuri lagi",
      },
      file: { filename: "foto-baru.jpg" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should return 404 if laporan not found", async () => {
    mockLaporan.findByPk.mockResolvedValue(null);

    await controller.reapplyReport(req, res);

    expect(mockLaporan.findByPk).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Laporan tidak ditemukan");
  });

  test("should update laporan and redirect for user", async () => {
    const laporanMock = { 
      nama_barang: "Laptop Lama", 
      lokasi: "Kampus", 
      deskripsi: "Dicuri", 
      status: "Claimed", 
      alasan: "Some reason", 
      save: jest.fn() 
    };

    mockLaporan.findByPk.mockResolvedValue(laporanMock);

    await controller.reapplyReport(req, res);

    expect(laporanMock.nama_barang).toBe("Laptop Baru");
    expect(laporanMock.lokasi).toBe("Lab Komputer");
    expect(laporanMock.deskripsi).toBe("Dicuri lagi");
    expect(laporanMock.foto_barang).toBe("foto-baru.jpg");
    expect(laporanMock.status).toBe("Waiting for upload verification");
    expect(laporanMock.alasan).toBeNull();
    expect(laporanMock.save).toHaveBeenCalled();

    expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/my-reports");
  });

  test("should update laporan without new file", async () => {
    const laporanMock = { 
      nama_barang: "Laptop Lama", 
      lokasi: "Kampus", 
      deskripsi: "Dicuri", 
      status: "Claimed", 
      alasan: "Some reason", 
      foto_barang: "old-foto.jpg",
      save: jest.fn() 
    };

    mockLaporan.findByPk.mockResolvedValue(laporanMock);
    req.file = null;

    await controller.reapplyReport(req, res);

    expect(laporanMock.foto_barang).toBe("old-foto.jpg"); // tetap sama
    expect(laporanMock.status).toBe("Waiting for upload verification");
    expect(laporanMock.alasan).toBeNull();
    expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/my-reports");
  });

  test("should return 500 if an exception occurs", async () => {
    mockLaporan.findByPk.mockRejectedValue(new Error("DB error"));

    await controller.reapplyReport(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });
});


describe("ReportController - acceptClaim", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    // Inject mock service
    controller.reportService = mockReportService;

    req = {
      params: { id_laporan: 1 },
      body: {
        lokasi_penyerahan: "Lab Komputer",
        tanggal_penyerahan: "2025-11-15",
        nama_pengklaim: "Azizah",
        no_telepon_pengklaim: "08123456789",
      },
      user: { email: "test@example.com" },
      file: { filename: "bukti.jpg" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should return 400 if required fields are missing", async () => {
    req.body.lokasi_penyerahan = null;
    await controller.acceptClaim(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Semua field wajib diisi",
    });
  });

  test("should return 404 if claim not found", async () => {
    mockClaim.findOne.mockResolvedValue(null);

    await controller.acceptClaim(req, res);

    expect(mockClaim.findOne).toHaveBeenCalledWith({
      where: { id_laporan: 1, status: "Waiting for approval" },
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Claim tidak ditemukan atau sudah diproses",
    });
  });

  test("should return 404 if laporan not found", async () => {
    const claimMock = { status: "Waiting for approval", save: jest.fn() };
    mockClaim.findOne.mockResolvedValue(claimMock);
    mockLaporan.findByPk.mockResolvedValue(null);

    await controller.acceptClaim(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Laporan tidak ditemukan",
    });
  });

  test("should return 403 if user not owner of laporan", async () => {
    const claimMock = { status: "Waiting for approval", save: jest.fn() };
    const laporanMock = { email: "other@example.com" };
    mockClaim.findOne.mockResolvedValue(claimMock);
    mockLaporan.findByPk.mockResolvedValue(laporanMock);

    await controller.acceptClaim(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Kamu tidak berhak menerima claim untuk laporan ini",
    });
  });

  test("should update claim & laporan and redirect", async () => {
    const claimMock = { status: "Waiting for approval", save: jest.fn() };
    const laporanMock = { 
      email: "test@example.com",
      save: jest.fn(),
      status: "Pending",
      lokasi_penyerahan: null,
      tanggal_penyerahan: null,
      pengklaim: null,
      no_hp_pengklaim: null,
      foto_bukti: null
    };

    mockClaim.findOne.mockResolvedValue(claimMock);
    mockLaporan.findByPk.mockResolvedValue(laporanMock);

    await controller.acceptClaim(req, res);

    expect(claimMock.status).toBe("Done");
    expect(claimMock.save).toHaveBeenCalled();

    expect(laporanMock.status).toBe("Done");
    expect(laporanMock.lokasi_penyerahan).toBe("Lab Komputer");
    expect(laporanMock.tanggal_penyerahan).toBeInstanceOf(Date);
    expect(laporanMock.pengklaim).toBe("Azizah");
    expect(laporanMock.no_hp_pengklaim).toBe("08123456789");
    expect(laporanMock.foto_bukti).toBe("bukti.jpg");
    expect(laporanMock.save).toHaveBeenCalled();

    expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/history");
  });

  test("should handle errors and call cleanupUploadedFile", async () => {
    mockClaim.findOne.mockRejectedValue(new Error("DB error"));

    await controller.acceptClaim(req, res);

    expect(controller.reportService.cleanupUploadedFile).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Terjadi kesalahan saat menerima claim",
    });
  });
});

describe("ReportController - acceptClaimAdmin", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    controller.reportService = mockReportService;

    req = {
      params: { id_laporan: 1 },
      body: {
        lokasi_penyerahan: "Lab Komputer",
        tanggal_penyerahan: "2025-11-15",
        nama_pengklaim: "Azizah",
        no_telepon_pengklaim: "08123456789",
      },
      user: { email: "admin@example.com" },
      file: { filename: "bukti.jpg" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should return 400 if required fields are missing", async () => {
    req.body.lokasi_penyerahan = null;
    await controller.acceptClaimAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Semua field wajib diisi",
    });
  });

  test("should return 404 if claim not found", async () => {
    mockClaim.findOne.mockResolvedValue(null);

    await controller.acceptClaimAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Claim tidak ditemukan atau sudah diproses",
    });
  });

  test("should return 404 if laporan not found", async () => {
    const claimMock = { status: "Waiting for approval", save: jest.fn() };
    mockClaim.findOne.mockResolvedValue(claimMock);
    mockLaporan.findByPk.mockResolvedValue(null);

    await controller.acceptClaimAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Laporan tidak ditemukan",
    });
  });

  test("should return 403 if user not owner of laporan", async () => {
    const claimMock = { status: "Waiting for approval", save: jest.fn() };
    const laporanMock = { email: "other@example.com" };
    mockClaim.findOne.mockResolvedValue(claimMock);
    mockLaporan.findByPk.mockResolvedValue(laporanMock);

    await controller.acceptClaimAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Kamu tidak berhak menerima claim untuk laporan ini",
    });
  });

  test("should update claim & laporan and redirect to admin/history", async () => {
    const claimMock = { status: "Waiting for approval", save: jest.fn() };
    const laporanMock = { 
      email: "admin@example.com",
      save: jest.fn(),
      status: "Pending",
      lokasi_penyerahan: null,
      tanggal_penyerahan: null,
      pengklaim: null,
      no_hp_pengklaim: null,
      foto_bukti: null
    };

    mockClaim.findOne.mockResolvedValue(claimMock);
    mockLaporan.findByPk.mockResolvedValue(laporanMock);

    await controller.acceptClaimAdmin(req, res);

    expect(claimMock.status).toBe("Done");
    expect(claimMock.save).toHaveBeenCalled();

    expect(laporanMock.status).toBe("Done");
    expect(laporanMock.lokasi_penyerahan).toBe("Lab Komputer");
    expect(laporanMock.tanggal_penyerahan).toBeInstanceOf(Date);
    expect(laporanMock.pengklaim).toBe("Azizah");
    expect(laporanMock.no_hp_pengklaim).toBe("08123456789");
    expect(laporanMock.foto_bukti).toBe("bukti.jpg");
    expect(laporanMock.save).toHaveBeenCalled();

    expect(res.redirect).toHaveBeenCalledWith("/admin/history");
  });

  test("should handle errors and call cleanupUploadedFile", async () => {
    mockClaim.findOne.mockRejectedValue(new Error("DB error"));

    await controller.acceptClaimAdmin(req, res);

    expect(controller.reportService.cleanupUploadedFile).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Terjadi kesalahan saat menerima claim",
    });
  });
});

describe("ReportController - deleteReportAdmin", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    controller.reportService = mockReportService;

    req = {
      params: { id: 1 },
      user: { email: "admin@example.com" },
    };

    res = {
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should return success if laporan found and deleted", async () => {
    const laporanMock = { foto_barang: "foto.jpg", destroy: jest.fn() };
    mockLaporan.findOne.mockResolvedValue(laporanMock);

    await controller.deleteReportAdmin(req, res);

    expect(controller.reportService.deleteOldFile).toHaveBeenCalledWith("foto.jpg");
    expect(laporanMock.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Laporan berhasil dihapus" });
  });

  test("should return failure if laporan not found", async () => {
    mockLaporan.findOne.mockResolvedValue(null);

    await controller.deleteReportAdmin(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Laporan tidak ditemukan" });
  });

  test("should handle errors gracefully", async () => {
    mockLaporan.findOne.mockRejectedValue(new Error("DB error"));

    await controller.deleteReportAdmin(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Terjadi kesalahan saat menghapus laporan" });
  });
});

describe("ReportController - deleteReport (self delete)", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    controller.reportService = mockReportService;

    req = {
      params: { id: 1 },
      user: { email: "user@example.com" },
    };

    res = {
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should only delete laporan owned by user", async () => {
    const laporanMock = { email: "user@example.com", foto_barang: "foto.jpg", destroy: jest.fn() };
    mockLaporan.findOne.mockResolvedValue(laporanMock);

    await controller.deleteReport(req, res);

    expect(mockLaporan.findOne).toHaveBeenCalledWith({ where: { id_laporan: 1, email: "user@example.com" } });
    expect(controller.reportService.deleteOldFile).toHaveBeenCalledWith("foto.jpg");
    expect(laporanMock.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Laporan berhasil dihapus" });
  });

  test("should not delete laporan if not owned by user", async () => {
    mockLaporan.findOne.mockResolvedValue(null);

    await controller.deleteReport(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Laporan tidak ditemukan" });
  });

  test("should handle errors gracefully", async () => {
    mockLaporan.findOne.mockRejectedValue(new Error("DB error"));

    await controller.deleteReport(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Terjadi kesalahan saat menghapus laporan" });
  });
});


describe("ReportController - updateReport (self update)", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    controller.reportService = mockReportService;

    req = {
      params: { id: 1 },
      body: { nama_barang: "Laptop Baru", lokasi_kejadian: "Kampus", deskripsi: "Updated" },
      user: { email: "user@example.com" },
      file: { filename: "newfoto.jpg" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should update report and redirect for self", async () => {
    const laporanMock = { 
      email: "user@example.com", 
      foto_barang: "oldfoto.jpg", 
      save: jest.fn() 
    };
    mockLaporan.findOne.mockResolvedValue(laporanMock);

    await controller.updateReport(req, res);

    expect(controller.reportService.deleteOldFile).toHaveBeenCalledWith("oldfoto.jpg");
    expect(laporanMock.nama_barang).toBe("Laptop Baru");
    expect(laporanMock.lokasi).toBe("Kampus");
    expect(laporanMock.deskripsi).toBe("Updated");
    expect(laporanMock.foto_barang).toBe("newfoto.jpg");
    expect(laporanMock.save).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/mahasiswa/my-reports");
  });

  test("should return 404 if report not found", async () => {
    mockLaporan.findOne.mockResolvedValue(null);

    await controller.updateReport(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Laporan tidak ditemukan" });
  });

  test("should handle errors gracefully", async () => {
    mockLaporan.findOne.mockRejectedValue(new Error("DB error"));

    await controller.updateReport(req, res);

    expect(controller.reportService.cleanupUploadedFile).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });
});

describe("ReportController - updateReportAdmin", () => {
  let controller;
  let req;
  let res;

  beforeEach(() => {
    controller = new ReportController({
      Laporan: mockLaporan,
      User: mockUser,
      Claim: mockClaim,
    });

    controller.reportService = mockReportService;

    req = {
      params: { id: 1 },
      body: { nama_barang: "Laptop Admin", lokasi_kejadian: "Lab", deskripsi: "Admin update" },
      user: { email: "admin@example.com" },
      file: { filename: "adminfoto.jpg" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      redirect: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should update report and redirect for admin", async () => {
    const laporanMock = { 
      email: "admin@example.com", 
      foto_barang: "oldadminfoto.jpg", 
      save: jest.fn() 
    };
    mockLaporan.findOne.mockResolvedValue(laporanMock);

    await controller.updateReportAdmin(req, res);

    expect(controller.reportService.deleteOldFile).toHaveBeenCalledWith("oldadminfoto.jpg");
    expect(laporanMock.nama_barang).toBe("Laptop Admin");
    expect(laporanMock.lokasi).toBe("Lab");
    expect(laporanMock.deskripsi).toBe("Admin update");
    expect(laporanMock.foto_barang).toBe("adminfoto.jpg");
    expect(laporanMock.save).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/admin/my-reports");
  });

  test("should return 403 if admin tries to update someone else's report", async () => {
    const laporanMock = { email: "user@example.com" };
    mockLaporan.findOne.mockResolvedValue(laporanMock);

    await controller.updateReportAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Anda tidak berhak mengedit laporan ini." });
  });

  test("should return 404 if report not found", async () => {
    mockLaporan.findOne.mockResolvedValue(null);

    await controller.updateReportAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Laporan tidak ditemukan" });
  });

  test("should handle errors gracefully", async () => {
    mockLaporan.findOne.mockRejectedValue(new Error("DB error"));

    await controller.updateReportAdmin(req, res);

    expect(controller.reportService.cleanupUploadedFile).toHaveBeenCalledWith(req);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "DB error" });
  });
});

describe("ReportController - claimReport", () => {
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
      body: { id_laporan: 1 },
      user: { email: "claimer@example.com" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  test("should claim report successfully", async () => {
    const laporanMock = { 
      id_laporan: 1, 
      email: "owner@example.com", 
      status: "Waiting for upload verification", 
      save: jest.fn() 
    };
    const pelaporMock = { nama: "Owner", email: "owner@example.com", no_telepon: "081234", alamat: "Jl. Test" };

    mockLaporan.findByPk.mockResolvedValue(laporanMock);
    mockClaim.create.mockResolvedValue({ id_laporan: 1, email: "claimer@example.com" });
    mockUser.findOne.mockResolvedValue(pelaporMock);

    await controller.claimReport(req, res);

    expect(mockClaim.create).toHaveBeenCalledWith({
      id_laporan: 1,
      email: "claimer@example.com",
      tanggal_claim: expect.any(Date),
    });
    expect(laporanMock.status).toBe("Claimed");
    expect(laporanMock.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Laporan berhasil diklaim",
      kontakPelapor: pelaporMock,
    });
  });

  test("should return 404 if report not found", async () => {
    mockLaporan.findByPk.mockResolvedValue(null);

    await controller.claimReport(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Laporan tidak ditemukan",
    });
  });

  test("should return 400 if user tries to claim own report", async () => {
    const laporanMock = { id_laporan: 1, email: "claimer@example.com" };
    mockLaporan.findByPk.mockResolvedValue(laporanMock);

    await controller.claimReport(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Kamu tidak bisa klaim laporan milikmu sendiri",
    });
  });

  test("should handle errors gracefully", async () => {
    mockLaporan.findByPk.mockRejectedValue(new Error("DB error"));

    await controller.claimReport(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Terjadi kesalahan saat klaim laporan",
    });
  });
});


});