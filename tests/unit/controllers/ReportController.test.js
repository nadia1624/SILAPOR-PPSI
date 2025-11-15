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

  test("should render 'admin/my-reports' with reports and user", async () => {
    // Mock public method getReportsWithIncludes
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([
      { id_laporan: 1, nama_barang: "Laptop" },
    ]);

    mockUser.findOne.mockResolvedValue({ email: "admin@example.com", role: "admin" });

    await controller.getAdminReports(req, res);

    expect(controller.getReportsWithIncludes).toHaveBeenCalledWith({ email: "admin@example.com" });
    expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
    expect(res.render).toHaveBeenCalledWith("admin/my-reports", {
      title: "Laporan Saya - Admin",
      reports: [{ id_laporan: 1, nama_barang: "Laptop" }],
      user: { email: "admin@example.com", role: "admin" },
      success: undefined,
    });
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

  test("should render error page if getReportsWithIncludes throws", async () => {
    const error = new Error("DB error");
    controller.getReportsWithIncludes = jest.fn().mockRejectedValue(error);

    await controller.getAdminReports(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", {
      message: "Terjadi kesalahan saat memuat data laporan",
    });
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

  test("should create report and redirect to '/admin/my-reports' for admin", async () => {
    req.user.role = "admin";
    // langsung panggil private method via bind atau call
    const privateProcess = controller["#processCreateReport"].bind(controller);
    mockLaporan.create.mockResolvedValue({ id_laporan: 1, ...req.body });

    await privateProcess(req, res, true); // isAdmin = true

    expect(mockLaporan.create).toHaveBeenCalledWith(expect.objectContaining({
      status: "On Progress",
    }));
    expect(res.redirect).toHaveBeenCalledWith("/admin/my-reports");
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






  describe("ReportController - getAllReportsUser", () => {
  test("should render 'home' with reports and user", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([{ id_laporan: 1 }]);
    mockUser.findOne.mockResolvedValue({ email: "test@example.com", role: "user" });

    await controller.getAllReportsUser(req, res);

    expect(controller.getReportsWithIncludes).toHaveBeenCalledWith({ status: "On Progress" });
    expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
    expect(res.render).toHaveBeenCalledWith("home", expect.objectContaining({
      reports: [{ id_laporan: 1 }],
      user: { email: "test@example.com", role: "user" },
    }));
  });

  test("should render 'home' with reports and null user if req.user undefined", async () => {
    req.user = null;
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([{ id_laporan: 2 }]);

    await controller.getAllReportsUser(req, res);

    expect(controller.getReportsWithIncludes).toHaveBeenCalledWith({ status: "On Progress" });
    expect(res.render).toHaveBeenCalledWith("home", expect.objectContaining({
      reports: [{ id_laporan: 2 }],
      user: null,
    }));
  });

  test("should render 'home' with empty reports array if no reports found", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([]);
    mockUser.findOne.mockResolvedValue({ email: "test@example.com", role: "user" });

    await controller.getAllReportsUser(req, res);

    expect(res.render).toHaveBeenCalledWith("home", expect.objectContaining({
      reports: [],
      user: { email: "test@example.com", role: "user" },
    }));
  });

  test("should send 500 if getReportsWithIncludes throws", async () => {
    controller.getReportsWithIncludes = jest.fn().mockRejectedValue(new Error("DB error"));

    await controller.getAllReportsUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });

  test("should send 500 if User.findOne throws", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([{ id_laporan: 3 }]);
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

  test("should render 'admin/report' with reports and user", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([{ id_laporan: 1, nama_barang: "Laptop" }]);
    mockUser.findOne.mockResolvedValue({ email: "admin@example.com", role: "admin" });

    await controller.getAllReportsAdmin(req, res);

    expect(controller.getReportsWithIncludes).toHaveBeenCalledWith({ status: "On Progress" });
    expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
    expect(res.render).toHaveBeenCalledWith("admin/report", {
      reports: [{ id_laporan: 1, nama_barang: "Laptop" }],
      user: { email: "admin@example.com", role: "admin" },
    });
  });

  test("should render 'admin/report' with empty reports array if no reports found", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([]);
    mockUser.findOne.mockResolvedValue({ email: "admin@example.com", role: "admin" });

    await controller.getAllReportsAdmin(req, res);

    expect(res.render).toHaveBeenCalledWith("admin/report", {
      reports: [],
      user: { email: "admin@example.com", role: "admin" },
    });
  });

  test("should render 'admin/report' with null user if User.findOne returns null", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([{ id_laporan: 2 }]);
    mockUser.findOne.mockResolvedValue(null);

    await controller.getAllReportsAdmin(req, res);

    expect(res.render).toHaveBeenCalledWith("admin/report", {
      reports: [{ id_laporan: 2 }],
      user: null,
    });
  });

  test("should send 500 if getReportsWithIncludes throws", async () => {
    controller.getReportsWithIncludes = jest.fn().mockRejectedValue(new Error("DB error"));

    await controller.getAllReportsAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan pada server");
  });

  test("should send 500 if User.findOne throws", async () => {
    controller.getReportsWithIncludes = jest.fn().mockResolvedValue([{ id_laporan: 3 }]);
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







});


