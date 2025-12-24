const fs = require("fs");
const path = require("path");
const multer = require("multer");

jest.mock("fs");

jest.mock("multer", () => {
    const mockMulter = jest.fn();
    mockMulter.diskStorage = jest.fn((options) => ({
        destination: options.destination,
        filename: options.filename,
    }));
    return mockMulter;
});

const UploadMiddleware = require("../../../middleware/UploadMiddleware");

describe("UploadMiddleware", () => {
    let uploadMiddleware;

    const uploadDir = path.resolve(__dirname, "../../..", "uploads");

    beforeEach(() => {
        // Mock console.log to suppress messages during tests
        jest.spyOn(console, 'log').mockImplementation(() => { });

        configureDirectorySpy = jest.spyOn(UploadMiddleware.prototype, 'configureDirectory').mockImplementation(() => { });

        fs.existsSync.mockClear();
        fs.mkdirSync.mockClear();
        multer.mockClear();
        multer.diskStorage.mockClear();

        uploadMiddleware = new UploadMiddleware();
    });

    afterEach(() => {
        configureDirectorySpy.mockRestore();
        console.log.mockRestore();
    });

    test("should create upload directory if it does not exist", () => {
        configureDirectorySpy.mockRestore();

        fs.existsSync.mockReturnValue(false);
        fs.mkdirSync.mockImplementation(() => { });

        uploadMiddleware.configureDirectory();

        expect(fs.existsSync).toHaveBeenCalledWith(uploadDir);
        expect(fs.mkdirSync).toHaveBeenCalledWith(uploadDir, { recursive: true });
    });

    test("should not recreate directory if it already exists", () => {
        configureDirectorySpy.mockRestore();

        fs.existsSync.mockReturnValue(true);
        fs.mkdirSync.mockClear();

        uploadMiddleware.configureDirectory();

        expect(fs.existsSync).toHaveBeenCalledWith(uploadDir);
        expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    test("should accept valid JPEG file", () => {
        const file = { mimetype: "image/jpeg", originalname: "foto.jpg" };
        const cb = jest.fn();

        uploadMiddleware.fileFilterLogic({}, file, cb);

        expect(cb).toHaveBeenCalledWith(null, true);
    });

    test("should reject invalid mimetype", () => {
        const file = { mimetype: "application/pdf", originalname: "dokumen.pdf" };
        const cb = jest.fn();

        uploadMiddleware.fileFilterLogic({}, file, cb);

        expect(cb).toHaveBeenCalledWith(
            expect.any(Error),
            false
        );
        expect(cb.mock.calls[0][0].message).toBe(
            "Hanya format JPEG, PNG, dan JPG yang diizinkan"
        );
    });

    test("should reject invalid extension", () => {
        const file = { mimetype: "image/png", originalname: "script.js" };
        const cb = jest.fn();

        uploadMiddleware.fileFilterLogic({}, file, cb);

        expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });

    test("should set correct destination directory", () => {
        const mockCb = jest.fn();
        const storage = uploadMiddleware.createStorageEngine();

        storage.destination({}, {}, mockCb);

        expect(mockCb).toHaveBeenCalledWith(null, uploadDir);
    });

    test("should generate valid filename with correct extension", () => {
        const mockCb = jest.fn();
        const storage = uploadMiddleware.createStorageEngine();

        const file = { fieldname: "foto", originalname: "gambar.png" };
        storage.filename({}, file, mockCb);

        const generatedName = mockCb.mock.calls[0][1];
        expect(generatedName).toMatch(/^foto-\d+\.png$/);
    });

    test("should return error for invalid extension", () => {
        const mockCb = jest.fn();
        const storage = uploadMiddleware.createStorageEngine();

        const file = { fieldname: "file", originalname: "malware.exe" };
        storage.filename({}, file, mockCb);

        expect(mockCb).toHaveBeenCalledWith(expect.any(Error));
        expect(mockCb.mock.calls[0][0].message).toBe("Format file tidak valid");
    });

    test("should create multer instance with correct limits", () => {
        const mockStorageResult = "mockStorage";
        multer.diskStorage.mockImplementationOnce(() => mockStorageResult);

        const mockMulterReturn = "mockMulterInstance";
        multer.mockImplementationOnce(jest.fn().mockReturnValue(mockMulterReturn));

        const instance = uploadMiddleware.createMulterInstance();

        expect(multer).toHaveBeenCalledWith(
            expect.objectContaining({
                storage: mockStorageResult,
                limits: { fileSize: 2 * 1024 * 1024 },
                fileFilter: uploadMiddleware.fileFilterLogic,
            })
        );
        expect(instance).toBe(mockMulterReturn);
    });

    test("getUploader should return multer instance", () => {
        const mockMulterInstance = { single: jest.fn() };
        uploadMiddleware.multerInstance = mockMulterInstance;

        const result = uploadMiddleware.getUploader();
        expect(result).toBe(mockMulterInstance);
    });
});