const HistoryController = require("../../../controllers/HistoryController");
const DocumentService = require("../../../services/DocumentService");
const { Op } = require("sequelize");

jest.mock("../../../services/DocumentService"); 

describe("HistoryController — Standard Unit Test", () => {
    let mockModels, controller, req, res;

    beforeEach(() => {
        mockModels = {
            Laporan: {
                findAll: jest.fn(),
                findOne: jest.fn(),
            },
            User: {
                findOne: jest.fn(),
            }
        };

        controller = new HistoryController(mockModels);

        req = {
            user: { email: "user@mail.com" },
            params: {},
            query: {},
        };

        res = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
            download: jest.fn((p, f, cb) => cb && cb()),
        };
    });

    describe("getDoneReports()", () => {
        test("should return 404 if user not found", async () => {
            mockModels.User.findOne.mockResolvedValue(null);

            await controller.getDoneReports(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("should return reports without filter", async () => {
            mockModels.User.findOne.mockResolvedValue({ email: "user@mail.com" });
            mockModels.Laporan.findAll.mockResolvedValue([{ id: 1 }]);

            await controller.getDoneReports(req, res);

            expect(mockModels.Laporan.findAll).toHaveBeenCalled();
            expect(res.render).toHaveBeenCalledWith("user/history", {
                reports: [{ id: 1 }],
                user: { email: "user@mail.com" },
                filterJenis: undefined,
                searchNama: undefined,
            });
        });

        test("should filter by jenis", async () => {
            req.query.filterJenis = "Elektronik";

            mockModels.User.findOne.mockResolvedValue({ email: "user@mail.com" });
            mockModels.Laporan.findAll.mockResolvedValue([]);

            await controller.getDoneReports(req, res);

            expect(mockModels.Laporan.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        jenis_laporan: "Elektronik"
                    })
                })
            );
        });

        test("should filter by searchNama", async () => {
            req.query.searchNama = "Laptop";

            mockModels.User.findOne.mockResolvedValue({ email: "user@mail.com" });
            mockModels.Laporan.findAll.mockResolvedValue([]);

            await controller.getDoneReports(req, res);

            expect(mockModels.Laporan.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        nama_barang: { [Op.like]: "%Laptop%" }
                    })
                })
            );
        });

        test("should apply both filters", async () => {
            req.query = { filterJenis: "Elektronik", searchNama: "HP" };

            mockModels.User.findOne.mockResolvedValue({ email: "user@mail.com" });
            mockModels.Laporan.findAll.mockResolvedValue([]);

            await controller.getDoneReports(req, res);

            const call = mockModels.Laporan.findAll.mock.calls[0][0].where;

            expect(call.jenis_laporan).toBe("Elektronik");
            expect(call.nama_barang).toEqual({ [Op.like]: "%HP%" });
        });

        test("should return 500 on error", async () => {
            mockModels.User.findOne.mockRejectedValue(new Error("DB Error"));

            await controller.getDoneReports(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getDoneReportsAdmin()", () => {
        test("should render reports from private method", async () => {
            const spyPriv = jest
                .spyOn(controller, "getDoneReportsAdmin")
                .mockImplementation(async (req, res) => {
                    res.render("admin/history", { reports: [], user: {} });
                });

            await controller.getDoneReportsAdmin(req, res);

            expect(res.render).toHaveBeenCalled();
            spyPriv.mockRestore();
        });

        test("should render with null user when user not found", async () => {
            mockModels.Laporan.findAll.mockResolvedValue([{ id: 1 }]);
            mockModels.User.findOne.mockResolvedValue(null);

            await controller.getDoneReportsAdmin(req, res);

            expect(res.render).toHaveBeenCalledWith("admin/history", {
                reports: [{ id: 1 }],
                user: null,
                filterJenis: undefined,
                searchNama: undefined
            });
        });

        test("should return 500 when error thrown", async () => {
            mockModels.Laporan.findAll.mockRejectedValue(new Error("DB Error"));

            await controller.getDoneReportsAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getReportHistoryById()", () => {
        test("should return 404 when report not found", async () => {
            mockModels.Laporan.findOne.mockResolvedValue(null);
            mockModels.User.findOne.mockResolvedValue({ email: "user@mail.com" });

            req.params.id = 1;

            await controller.getReportHistoryById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("should render when report exists", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id: 1 });
            mockModels.User.findOne.mockResolvedValue({ email: "user@mail.com" });

            req.params.id = 1;

            await controller.getReportHistoryById(req, res);

            expect(res.render).toHaveBeenCalled();
        });

        test("should return 500 on error", async () => {
            mockModels.Laporan.findOne.mockRejectedValue(new Error("Error"));

            req.params.id = 1;

            await controller.getReportHistoryById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("getReportHistoryByIdAdmin()", () => {
        test("should return 404 if no report", async () => {
            mockModels.Laporan.findOne.mockResolvedValue(null);
            mockModels.User.findOne.mockResolvedValue({ email: "user@mail.com" });

            await controller.getReportHistoryByIdAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("should render when exists", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id: 1 });
            mockModels.User.findOne.mockResolvedValue({ email: "user@mail.com" });

            await controller.getReportHistoryByIdAdmin(req, res);

            expect(res.render).toHaveBeenCalled();
        });

        test("should handle error", async () => {
            mockModels.Laporan.findOne.mockRejectedValue(new Error("Error"));

            await controller.getReportHistoryByIdAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe("downloadReportPdf()", () => {
        test("should return 404 if report not found", async () => {
            mockModels.Laporan.findOne.mockResolvedValue(null);

            req.params.id = 1;

            await controller.downloadReportPdf(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("should call generatePdf and download", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });
            DocumentService.mockImplementation(() => ({
                generatePdf: jest.fn().mockResolvedValue({
                    outputPdf: "file.pdf",
                    outputDocx: "file.docx"
                }),
                cleanup: jest.fn(),
            }));

            controller = new HistoryController(mockModels);

            req.params.id = 1;

            await controller.downloadReportPdf(req, res);

            expect(res.download).toHaveBeenCalled();
        });

        test("should handle successful download", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });
            const mockCleanup = jest.fn();
            DocumentService.mockImplementation(() => ({
                generatePdf: jest.fn().mockResolvedValue({
                    outputPdf: "file.pdf",
                    outputDocx: "file.docx"
                }),
                cleanup: mockCleanup,
            }));

            controller = new HistoryController(mockModels);

            req.params.id = 1;
            res.download = jest.fn((path, filename, cb) => cb(null));

            await controller.downloadReportPdf(req, res);

            expect(mockCleanup).toHaveBeenCalled();
        });

        test("should handle download error in callback", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });
            const mockCleanup = jest.fn();
            DocumentService.mockImplementation(() => ({
                generatePdf: jest.fn().mockResolvedValue({
                    outputPdf: "file.pdf",
                    outputDocx: "file.docx"
                }),
                cleanup: mockCleanup,
            }));

            controller = new HistoryController(mockModels);

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

    describe("downloadReportPdfAdmin()", () => {
        test("should return 404 when not found", async () => {
            mockModels.Laporan.findOne.mockResolvedValue(null);

            await controller.downloadReportPdfAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("should trigger download when found", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });

            DocumentService.mockImplementation(() => ({
                generatePdf: jest.fn().mockResolvedValue({
                    outputPdf: "file.pdf",
                    outputDocx: "file.docx"
                }),
                cleanup: jest.fn(),
            }));

            controller = new HistoryController(mockModels);
            req.params.id = 1;

            await controller.downloadReportPdfAdmin(req, res);

            expect(res.download).toHaveBeenCalled();
        });

        test("should handle successful download", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });
            const mockCleanup = jest.fn();
            DocumentService.mockImplementation(() => ({
                generatePdf: jest.fn().mockResolvedValue({
                    outputPdf: "file.pdf",
                    outputDocx: "file.docx"
                }),
                cleanup: mockCleanup,
            }));

            controller = new HistoryController(mockModels);

            req.params.id = 1;
            res.download = jest.fn((path, filename, cb) => cb(null));

            await controller.downloadReportPdfAdmin(req, res);

            expect(mockCleanup).toHaveBeenCalled();
        });

        test("should handle download error in callback", async () => {
            mockModels.Laporan.findOne.mockResolvedValue({ id_laporan: 1 });
            const mockCleanup = jest.fn();
            DocumentService.mockImplementation(() => ({
                generatePdf: jest.fn().mockResolvedValue({
                    outputPdf: "file.pdf",
                    outputDocx: "file.docx"
                }),
                cleanup: mockCleanup,
            }));

            controller = new HistoryController(mockModels);

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
