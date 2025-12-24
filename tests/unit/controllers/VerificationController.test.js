const VerificationController = require("../../../controllers/VerificationController");

describe("VerificationController", () => {
    let controller, mockModels, mockReq, mockRes;

    beforeEach(() => {
        // Mock console.error to suppress error messages during tests
        jest.spyOn(console, 'error').mockImplementation(() => { });

        mockModels = {
            Laporan: {
                findAll: jest.fn(),
                findByPk: jest.fn(),
            },
            User: {
                findOne: jest.fn(),
            },
        };

        controller = new VerificationController(mockModels);

        mockReq = {
            user: { email: "user@test.com" },
            params: {},
            body: {},
        };

        mockRes = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            redirect: jest.fn(),
        };

        jest.clearAllMocks();
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe("getPendingReports()", () => {
        test("should fetch reports + user and render view", async () => {
            const fakeReports = [{ id: 1 }];
            const fakeUser = { id: 10, email: "user@test.com" };

            mockModels.Laporan.findAll.mockResolvedValue(fakeReports);
            mockModels.User.findOne.mockResolvedValue(fakeUser);

            await controller.getPendingReports(mockReq, mockRes);

            expect(mockModels.Laporan.findAll).toHaveBeenCalledWith({
                where: { status: "Waiting for upload verification" },
                include: [{ model: mockModels.User }],
                order: [["createdAt", "DESC"]],
            });

            expect(mockModels.User.findOne).toHaveBeenCalledWith({
                where: { email: "user@test.com" },
            });

            expect(mockRes.render).toHaveBeenCalledWith(
                "admin/verifikasi",
                { reports: fakeReports, user: fakeUser }
            );
        });

        test("should return 500 when error occurs", async () => {
            mockModels.Laporan.findAll.mockRejectedValue(new Error("DB Error"));

            await controller.getPendingReports(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith(
                "Terjadi kesalahan server saat mengambil data"
            );
        });
    });

    describe("verifyReport()", () => {
        test("should return 404 if laporan not found", async () => {
            mockReq.params.id = 99;
            mockModels.Laporan.findByPk.mockResolvedValue(null);

            await controller.verifyReport(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith("Laporan tidak ditemukan");
        });

        test("should approve report and redirect", async () => {
            mockReq.params.id = 1;
            mockReq.body = { action: "approve" };

            const laporanMock = {
                status: "",
                verifikasi_action: "",
                alasan: "",
                save: jest.fn(),
            };

            mockModels.Laporan.findByPk.mockResolvedValue(laporanMock);

            await controller.verifyReport(mockReq, mockRes);

            expect(laporanMock.status).toBe("On progress");
            expect(laporanMock.verifikasi_action).toBe("approve");
            expect(laporanMock.alasan).toBe(null);
            expect(laporanMock.save).toHaveBeenCalled();

            expect(mockRes.redirect).toHaveBeenCalledWith("/admin/verifikasi");
        });

        test("should reject report with reason and redirect", async () => {
            mockReq.params.id = 2;
            mockReq.body = { action: "denied", alasan: "Tidak sesuai format" };

            const laporanMock = {
                status: "",
                verifikasi_action: "",
                alasan: "",
                save: jest.fn(),
            };

            mockModels.Laporan.findByPk.mockResolvedValue(laporanMock);

            await controller.verifyReport(mockReq, mockRes);

            expect(laporanMock.status).toBe("Upload verification rejected");
            expect(laporanMock.verifikasi_action).toBe("denied");
            expect(laporanMock.alasan).toBe("Tidak sesuai format");
            expect(laporanMock.save).toHaveBeenCalled();

            expect(mockRes.redirect).toHaveBeenCalledWith("/admin/verifikasi");
        });

        test("should return 500 if server error occurs", async () => {
            mockReq.params.id = 3;
            mockModels.Laporan.findByPk.mockRejectedValue(new Error("DB Error"));

            await controller.verifyReport(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith(
                "Terjadi kesalahan server saat verifikasi"
            );
        });
    });
});
