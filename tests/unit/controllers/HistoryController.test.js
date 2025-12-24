const HistoryController = require("../../../controllers/HistoryController");
const DocumentService = require("../../../services/DocumentService");
const { Op } = require("sequelize");

jest.mock("../../../services/DocumentService");

describe("HistoryController — Standard Unit Test", () => {
    let mockModels, controller, req, res;
    const mockUser = { email: "user@mail.com" };
    const mockReports = [{ id: 1, email: mockUser.email, jenis_laporan: 'Elektronik' }];

    beforeEach(() => {
        // Mock console.error to suppress error messages during tests
        jest.spyOn(console, 'error').mockImplementation(() => { });

        mockModels = {
            Laporan: {
                findAll: jest.fn(),
                findOne: jest.fn(),
            },
            User: {
                findOne: jest.fn(),
            }
        };

        // Atur default user
        mockModels.User.findOne.mockResolvedValue(mockUser);

        controller = new HistoryController(mockModels);

        req = {
            user: { email: mockUser.email },
            params: {},
            query: {},
        };

        // Pastikan DocumentService di-mock untuk setiap test
        DocumentService.mockImplementation(() => ({
            generatePdf: jest.fn().mockResolvedValue({ outputPdf: "file.pdf", outputDocx: "file.docx" }),
            cleanup: jest.fn(),
        }));

        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
            // Mock res.download untuk segera memanggil callback (untuk menguji cleanup)
            download: jest.fn((p, f, cb) => cb && cb(null)),
        };
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    // --- 1. getDoneReports() ---
    describe("getDoneReports()", () => {
        test("should return 404 if user not found", async () => {
            mockModels.User.findOne.mockResolvedValue(null);

            await controller.getDoneReports(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith("User tidak ditemukan"); // Tambah assertion send
        });

        test("should return reports without filter", async () => {
            mockModels.Laporan.findAll.mockResolvedValue(mockReports);

            await controller.getDoneReports(req, res);

            // Perbaikan: Pastikan where clause dipanggil dengan spesifik
            expect(mockModels.Laporan.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { email: mockUser.email, status: "Done" },
                })
            );
            expect(res.render).toHaveBeenCalledWith("user/history", expect.objectContaining({
                reports: mockReports,
            }));
        });

        test("should render with empty array if no reports found", async () => {
            mockModels.Laporan.findAll.mockResolvedValue([]);

            await controller.getDoneReports(req, res);

            // Memastikan Laporan.findAll dipanggil dan render dengan array kosong
            expect(mockModels.Laporan.findAll).toHaveBeenCalled();
            expect(res.render).toHaveBeenCalledWith("user/history", expect.objectContaining({
                reports: [],
            }));
        });


        test("should filter by jenis", async () => {
            req.query.filterJenis = "Elektronik";
            mockModels.Laporan.findAll.mockResolvedValue([]);

            await controller.getDoneReports(req, res);

            expect(mockModels.Laporan.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ jenis_laporan: "Elektronik", email: mockUser.email })
                })
            );
        });

        test("should apply both filters", async () => {
            req.query = { filterJenis: "Elektronik", searchNama: "HP" };
            mockModels.Laporan.findAll.mockResolvedValue([]);

            await controller.getDoneReports(req, res);

            const whereClause = mockModels.Laporan.findAll.mock.calls[0][0].where;

            expect(whereClause.jenis_laporan).toBe("Elektronik");
            expect(whereClause.nama_barang).toEqual({ [Op.like]: "%HP%" });
        });

        test("should return 500 on error during User.findOne", async () => {
            mockModels.User.findOne.mockRejectedValue(new Error("DB Error"));

            await controller.getDoneReports(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan saat mengambil laporan");
        });

        test("should return 500 on error during Laporan.findAll", async () => {
            mockModels.Laporan.findAll.mockRejectedValue(new Error("DB Error"));

            await controller.getDoneReports(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan saat mengambil laporan");
        });
    });

    // --- 2. getDoneReportsAdmin() ---
    describe("getDoneReportsAdmin()", () => {
        // Ganti spyOn dengan pengujian logika No Filter aktual
        test("should render reports without filter (testing actual logic)", async () => {
            mockModels.Laporan.findAll.mockResolvedValue(mockReports);

            await controller.getDoneReportsAdmin(req, res);

            // Perbaikan: Pastikan hanya status:Done dipanggil (menguji #getFilteredReports)
            expect(mockModels.Laporan.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: "Done" },
                })
            );
            expect(res.render).toHaveBeenCalledWith("admin/history", expect.objectContaining({
                reports: mockReports,
                user: mockUser
            }));
        });

        test("should apply both filters", async () => {
            req.query = { filterJenis: "Elektronik", searchNama: "HP" };
            mockModels.Laporan.findAll.mockResolvedValue([]);

            await controller.getDoneReportsAdmin(req, res);

            const whereClause = mockModels.Laporan.findAll.mock.calls[0][0].where;
            expect(whereClause.jenis_laporan).toBe("Elektronik");
            expect(whereClause.nama_barang).toEqual({ [Op.like]: "%HP%" });
        });

        test("should render with empty array if no reports found", async () => {
            mockModels.Laporan.findAll.mockResolvedValue([]);

            await controller.getDoneReportsAdmin(req, res);

            expect(res.render).toHaveBeenCalledWith("admin/history", expect.objectContaining({
                reports: [],
            }));
        });

        test("should render with null user when user not found", async () => {
            mockModels.Laporan.findAll.mockResolvedValue([{ id: 1 }]);
            mockModels.User.findOne.mockResolvedValue(null); // User Admin tidak ditemukan

            await controller.getDoneReportsAdmin(req, res);

            // Karena tidak ada if (!user), ini akan render dengan user: null
            expect(res.render).toHaveBeenCalledWith("admin/history", expect.objectContaining({
                user: null,
            }));
        });

        test("should return 500 when error thrown", async () => {
            mockModels.Laporan.findAll.mockRejectedValue(new Error("DB Error"));

            await controller.getDoneReportsAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Terjadi kesalahan saat mengambil laporan Admin");
        });
    });

    // --- 3. getReportHistoryById() ---
    describe("getReportHistoryById()", () => {
        test("should return 404 when report not found (or not owned)", async () => {
            mockModels.Laporan.findOne.mockResolvedValue(null);
            req.params.id = 1;

            await controller.getReportHistoryById(req, res);

            // Perbaikan: Pastikan dipanggil dengan filter email (kepemilikan)
            expect(mockModels.Laporan.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id_laporan: 1, status: "Done", email: mockUser.email },
                })
            );
            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("should render when report exists (and is owned)", async () => {
            const ownedReport = { id: 1, email: mockUser.email };
            mockModels.Laporan.findOne.mockResolvedValue(ownedReport);
            req.params.id = 1;

            await controller.getReportHistoryById(req, res);

            // Pastikan dipanggil dengan filter email
            expect(mockModels.Laporan.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ email: mockUser.email }),
                })
            );
            expect(res.render).toHaveBeenCalled();
        });

        test("should return 500 on error", async () => {
            mockModels.Laporan.findOne.mockRejectedValue(new Error("Error"));
            req.params.id = 1;

            await controller.getReportHistoryById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    // --- 4. getReportHistoryByIdAdmin() ---
    describe("getReportHistoryByIdAdmin()", () => {
        test("should return 404 if no report", async () => {
            mockModels.Laporan.findOne.mockResolvedValue(null);

            await controller.getReportHistoryByIdAdmin(req, res);

            // Perbaikan: Pastikan dipanggil tanpa filter email
            expect(mockModels.Laporan.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id_laporan: undefined, status: "Done" },
                })
            );
            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("should render when exists", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id: 1 });

            await controller.getReportHistoryByIdAdmin(req, res);

            // Perbaikan: Pastikan dipanggil tanpa filter email
            expect(mockModels.Laporan.findOne).toHaveBeenCalledWith(
                expect.not.objectContaining({ where: expect.objectContaining({ email: expect.anything() }) })
            );
            expect(res.render).toHaveBeenCalled();
        });

        test("should handle error", async () => {
            mockModels.Laporan.findOne.mockRejectedValue(new Error("Error"));

            await controller.getReportHistoryByIdAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    // --- 5. downloadReportPdf() ---
    describe("downloadReportPdf()", () => {
        test("should return 404 if report not found", async () => {
            mockModels.Laporan.findOne.mockResolvedValue(null);
            req.params.id = 1;

            await controller.downloadReportPdf(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith("Data laporan tidak ditemukan atau bukan milik Anda.");
        });

        // Test yang sudah ada, memastikan generatePdf dan download dipanggil
        test("should call generatePdf and download", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });
            req.params.id = 1;

            await controller.downloadReportPdf(req, res);

            expect(res.download).toHaveBeenCalled();
        });

        // Perbaikan/Penambahan: Menguji cleanup pada sukses download
        test("should call cleanup on successful download", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });

            // Re-mock DocumentService agar mockCleanup bisa dilacak
            const mockCleanup = jest.fn();
            controller.documentService.cleanup = mockCleanup;

            req.params.id = 1;
            res.download = jest.fn((path, filename, cb) => cb(null)); // Mock sukses download

            await controller.downloadReportPdf(req, res);

            expect(mockCleanup).toHaveBeenCalledWith("file.docx", "file.pdf");
        });

        // Perbaikan/Penambahan: Menguji cleanup pada error download callback
        test("should call cleanup even if download callback returns error", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });
            const mockCleanup = jest.fn();
            controller.documentService.cleanup = mockCleanup;

            req.params.id = 1;
            res.download = jest.fn((path, filename, cb) => cb(new Error("Download error")));

            await controller.downloadReportPdf(req, res);

            expect(mockCleanup).toHaveBeenCalled();
        });

        test("should return 500 on error", async () => {
            mockModels.Laporan.findOne.mockRejectedValue(new Error("Error"));
            req.params.id = 1;

            await controller.downloadReportPdf(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // --- 6. downloadReportPdfAdmin() ---
    describe("downloadReportPdfAdmin()", () => {
        test("should return 404 when not found", async () => {
            mockModels.Laporan.findOne.mockResolvedValue(null);

            await controller.downloadReportPdfAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith("Data laporan tidak ditemukan.");
        });

        test("should trigger download when found", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });

            await controller.downloadReportPdfAdmin(req, res);

            expect(res.download).toHaveBeenCalled();
        });

        // Perbaikan/Penambahan: Menguji cleanup pada sukses download
        test("should call cleanup on successful download", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });

            const mockCleanup = jest.fn();
            controller.documentService.cleanup = mockCleanup;

            req.params.id = 1;
            res.download = jest.fn((path, filename, cb) => cb(null));

            await controller.downloadReportPdfAdmin(req, res);

            expect(mockCleanup).toHaveBeenCalled();
        });

        // Perbaikan/Penambahan: Menguji cleanup pada error download callback
        test("should call cleanup even if download callback returns error", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });
            const mockCleanup = jest.fn();
            controller.documentService.cleanup = mockCleanup;

            req.params.id = 1;
            res.download = jest.fn((path, filename, cb) => cb(new Error("Download error")));

            await controller.downloadReportPdfAdmin(req, res);

            expect(mockCleanup).toHaveBeenCalled();
        });

        test("should return 500 on error", async () => {
            mockModels.Laporan.findOne.mockRejectedValue(new Error("Error"));

            await controller.downloadReportPdfAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});