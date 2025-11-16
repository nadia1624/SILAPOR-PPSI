const EmailService = require('../../../services/EmailService');
const DocumentService = require('../../../services/DocumentService');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

// Mock dependencies
jest.mock('nodemailer');
jest.mock('ejs');
jest.mock('fs');
jest.mock('child_process');
jest.mock('pizzip');
jest.mock('docxtemplater');
jest.mock('docxtemplater-image-module-free');

describe('EmailService', () => {
    let emailService;
    let mockTransporter;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock transporter
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);

        // Mock environment variables
        process.env.EMAIL_USER = 'test@example.com';
        process.env.EMAIL_PASS = 'testpassword';

        emailService = new EmailService();
    });

    describe('constructor', () => {
        it('should initialize with correct transporter configuration', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                service: 'gmail',
                auth: {
                    user: 'test@example.com',
                    pass: 'testpassword',
                },
            });
            expect(emailService.senderEmail).toBe('"SILAPOR" <test@example.com>');
        });
    });

    describe('sendVerificationEmail', () => {
        it('should send verification email successfully', async () => {
            const mockUser = {
                nama: 'Test User',
                email: 'user@example.com',
            };
            const mockToken = 'test-token-123';
            const mockHtml = '<html>Verification Email</html>';

            ejs.renderFile.mockResolvedValue(mockHtml);

            await emailService.sendVerificationEmail(mockUser, mockToken);

            expect(ejs.renderFile).toHaveBeenCalledWith(
                expect.stringContaining('emailRegis.ejs'),
                {
                    nama: 'Test User',
                    verifyLink: 'http://localhost:3000/verify-email?token=test-token-123',
                }
            );

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: '"SILAPOR" <test@example.com>',
                to: 'user@example.com',
                subject: 'Verifikasi Email Anda',
                html: mockHtml,
            });
        });

        it('should handle error during email sending', async () => {
            const mockUser = {
                nama: 'Test User',
                email: 'user@example.com',
            };
            const mockToken = 'test-token-123';

            ejs.renderFile.mockResolvedValue('<html>Test</html>');
            mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

            await expect(emailService.sendVerificationEmail(mockUser, mockToken)).rejects.toThrow('SMTP Error');
        });

        it('should handle error during template rendering', async () => {
            const mockUser = {
                nama: 'Test User',
                email: 'user@example.com',
            };
            const mockToken = 'test-token-123';

            ejs.renderFile.mockRejectedValue(new Error('Template not found'));

            await expect(emailService.sendVerificationEmail(mockUser, mockToken)).rejects.toThrow('Template not found');
        });
    });

    describe('sendResetPasswordEmail', () => {
        it('should send reset password email successfully', async () => {
            const mockUser = {
                nama: 'Test User',
                email: 'user@example.com',
            };
            const mockToken = 'reset-token-123';

            await emailService.sendResetPasswordEmail(mockUser, mockToken);

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: '"SILAPOR" <test@example.com>',
                to: 'user@example.com',
                subject: 'Reset Password SILAPOR',
                html: expect.stringContaining('http://localhost:3000/reset-password?token=reset-token-123'),
            });

            const callArgs = mockTransporter.sendMail.mock.calls[0][0];
            expect(callArgs.html).toContain('Halo Test User');
            expect(callArgs.html).toContain('reset password');
        });

        it('should handle error during reset password email sending', async () => {
            const mockUser = {
                nama: 'Test User',
                email: 'user@example.com',
            };
            const mockToken = 'reset-token-123';

            mockTransporter.sendMail.mockRejectedValue(new Error('Network Error'));

            await expect(emailService.sendResetPasswordEmail(mockUser, mockToken)).rejects.toThrow('Network Error');
        });
    });
});

describe('DocumentService', () => {
    let documentService;
    let mockZip;
    let mockDoc;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock file system
        fs.existsSync.mockReturnValue(true);
        fs.mkdirSync.mockReturnValue(undefined);
        fs.readFileSync.mockReturnValue('mock-file-content');
        fs.writeFileSync.mockReturnValue(undefined);
        fs.unlinkSync.mockReturnValue(undefined);

        // Mock PizZip and Docxtemplater
        mockZip = {
            generate: jest.fn().mockReturnValue('mock-zip-buffer'),
        };
        mockDoc = {
            render: jest.fn(),
            getZip: jest.fn().mockReturnValue(mockZip),
        };
        PizZip.mockReturnValue({});
        Docxtemplater.mockReturnValue(mockDoc);
        ImageModule.mockReturnValue({});

        documentService = new DocumentService();
    });

    describe('constructor', () => {
        it('should initialize directories correctly', () => {
            expect(documentService.templateDir).toContain('src');
            expect(documentService.templateDir).toContain('templates');
            expect(documentService.tempDir).toContain('temp');
        });

        it('should create temp directory if it does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            new DocumentService();
            expect(fs.mkdirSync).toHaveBeenCalled();
        });

        it('should not create temp directory if it already exists', () => {
            fs.existsSync.mockReturnValue(true);
            jest.clearAllMocks();
            new DocumentService();
            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });
    });

    describe('generatePdf', () => {
        const mockLaporan = {
            id_laporan: 123,
            jenis_laporan: 'Kehilangan',
            nama_barang: 'Laptop',
            status: 'Pending',
            tanggal_kejadian: new Date('2025-01-01'),
            lokasi: 'Gedung A',
            tanggal_laporan: new Date('2025-01-02'),
            deskripsi: 'Laptop hilang di kelas',
            tanggal_penyerahan: new Date('2025-01-03'),
            lokasi_penyerahan: 'Gedung B',
            pengklaim: 'Pengklaim Test',
            no_hp_pengklaim: '081234567890',
            foto_bukti: 'foto.jpg',
            User: {
                nama: 'User Test',
                email: 'user@test.com',
                alamat: 'Jl. Test',
                no_telepon: '081234567890',
            },
        };

        it('should generate PDF successfully', async () => {
            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            const result = await documentService.generatePdf(mockLaporan);

            expect(fs.readFileSync).toHaveBeenCalled();
            expect(PizZip).toHaveBeenCalled();
            expect(Docxtemplater).toHaveBeenCalled();
            expect(mockDoc.render).toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(exec).toHaveBeenCalledWith(expect.stringContaining('soffice'), expect.any(Function));
            expect(result.outputPdf).toContain('laporan_123.pdf');
            expect(result.outputDocx).toContain('laporan_123.docx');
        });

        it('should throw error if template file not found', async () => {
            fs.existsSync.mockReturnValue(false);

            await expect(documentService.generatePdf(mockLaporan)).rejects.toThrow('Template file tidak ditemukan.');
        });

        it('should handle missing optional fields in laporan data', async () => {
            const incompleteLaporan = {
                id_laporan: 456,
            };

            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            await documentService.generatePdf(incompleteLaporan);

            expect(mockDoc.render).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_laporan: 456,
                    jenis_laporan: '-',
                    nama_barang: '-',
                    status: '-',
                })
            );
        });

        it('should handle laporan without User data', async () => {
            const laporanNoUser = {
                id_laporan: 789,
            };

            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            await documentService.generatePdf(laporanNoUser);

            expect(mockDoc.render).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_nama: '-',
                    user_email: '-',
                    user_alamat: '-',
                    user_telp: '-',
                })
            );
        });

        it('should handle foto_bukti path correctly', async () => {
            const laporanWithFoto = {
                id_laporan: 100,
                foto_bukti: 'test-foto.jpg',
            };

            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            await documentService.generatePdf(laporanWithFoto);

            expect(mockDoc.render).toHaveBeenCalledWith(
                expect.objectContaining({
                    foto_bukti: expect.stringContaining('test-foto.jpg'),
                })
            );
        });

        it('should handle missing foto_bukti', async () => {
            const laporanNoFoto = {
                id_laporan: 101,
                foto_bukti: null,
            };

            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            await documentService.generatePdf(laporanNoFoto);

            expect(mockDoc.render).toHaveBeenCalledWith(
                expect.objectContaining({
                    foto_bukti: null,
                })
            );
        });

        it('should handle all falsy date fields', async () => {
            const laporanWithFalsyDates = {
                id_laporan: 102,
                tanggal_kejadian: null,
                tanggal_laporan: undefined,
                tanggal_penyerahan: '',
            };

            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            await documentService.generatePdf(laporanWithFalsyDates);

            expect(mockDoc.render).toHaveBeenCalledWith(
                expect.objectContaining({
                    tanggal_kejadian: '-',
                    tanggal_laporan: '-',
                    tanggal_penyerahan: '-',
                })
            );
        });

        it('should handle mixed valid and falsy date fields', async () => {
            const laporanMixedDates = {
                id_laporan: 103,
                tanggal_kejadian: new Date('2025-01-15'),
                tanggal_laporan: null,
                tanggal_penyerahan: new Date('2025-01-20'),
            };

            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            await documentService.generatePdf(laporanMixedDates);

            const renderCall = mockDoc.render.mock.calls[mockDoc.render.mock.calls.length - 1][0];
            expect(renderCall.tanggal_kejadian).not.toBe('-');
            expect(renderCall.tanggal_laporan).toBe('-');
            expect(renderCall.tanggal_penyerahan).not.toBe('-');
        });

        it('should handle falsy values for all optional string fields', async () => {
            const laporanWithFalsyStrings = {
                id_laporan: 104,
                jenis_laporan: '',
                nama_barang: null,
                status: undefined,
                lokasi: 0,
                deskripsi: false,
                lokasi_penyerahan: '',
                pengklaim: null,
                no_hp_pengklaim: undefined,
            };

            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            await documentService.generatePdf(laporanWithFalsyStrings);

            expect(mockDoc.render).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_laporan: 104,
                    jenis_laporan: '-',
                    nama_barang: '-',
                    status: '-',
                    lokasi: '-',
                    deskripsi: '-',
                    lokasi_penyerahan: '-',
                    pengklaim: '-',
                    no_hp_pengklaim: '-',
                })
            );
        });

        it('should handle all truthy string fields', async () => {
            const laporanWithTruthyStrings = {
                id_laporan: 105,
                jenis_laporan: 'Kehilangan',
                nama_barang: 'Tas',
                status: 'Approved',
                lokasi: 'Kampus',
                deskripsi: 'Tas hilang',
                lokasi_penyerahan: 'Kantor',
                pengklaim: 'John Doe',
                no_hp_pengklaim: '08123456789',
            };

            exec.mockImplementation((cmd, callback) => callback(null, 'success'));

            await documentService.generatePdf(laporanWithTruthyStrings);

            expect(mockDoc.render).toHaveBeenCalledWith(
                expect.objectContaining({
                    id_laporan: 105,
                    jenis_laporan: 'Kehilangan',
                    nama_barang: 'Tas',
                    status: 'Approved',
                    lokasi: 'Kampus',
                    deskripsi: 'Tas hilang',
                    lokasi_penyerahan: 'Kantor',
                    pengklaim: 'John Doe',
                    no_hp_pengklaim: '08123456789',
                })
            );
        });

        it('should reject if LibreOffice conversion fails', async () => {
            exec.mockImplementation((cmd, callback) => callback(new Error('LibreOffice error'), null));

            await expect(documentService.generatePdf(mockLaporan)).rejects.toThrow(
                'Gagal mengonversi file ke PDF (LibreOffice error).'
            );
        });

        it('should reject if PDF file is not created after conversion', async () => {
            jest.useFakeTimers();
            
            exec.mockImplementation((cmd, callback) => callback(null, 'success'));
            
            // Mock file doesn't exist even after waiting
            fs.existsSync.mockImplementation((filePath) => {
                if (filePath.endsWith('.pdf')) return false;
                return true;
            });

            const generatePromise = documentService.generatePdf(mockLaporan);
            
            // Fast-forward through all timers
            jest.runAllTimers();
            
            await expect(generatePromise).rejects.toThrow(
                'File PDF gagal dibuat atau belum muncul.'
            );
            
            jest.useRealTimers();
        });

        it('should handle ImageModule configuration', async () => {
            // Clear previous mocks
            ImageModule.mockClear();
            Docxtemplater.mockClear();
            
            exec.mockImplementation((cmd, callback) => callback(null, 'success'));
            
            await documentService.generatePdf(mockLaporan);
            
            // Get the ImageModule configuration
            const imageModuleConfig = ImageModule.mock.calls[0][0];
            
            expect(imageModuleConfig.centered).toBe(true);
            expect(typeof imageModuleConfig.getImage).toBe('function');
            expect(typeof imageModuleConfig.getSize).toBe('function');
            
            // Test getSize
            const size = imageModuleConfig.getSize();
            expect(size).toEqual([150, 150]);
            
            // Test getImage with missing file
            fs.existsSync.mockReturnValue(false);
            fs.readFileSync.mockReturnValue('noimage-content');
            let result = imageModuleConfig.getImage('non-existent-path.jpg');
            expect(result).toBe('noimage-content');
            
            // Test getImage with valid file
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('valid-image-content');
            result = imageModuleConfig.getImage('valid-path.jpg');
            expect(result).toBe('valid-image-content');
            
            // Test getImage with null tagValue
            fs.readFileSync.mockReturnValue('noimage-content');
            result = imageModuleConfig.getImage(null);
            expect(result).toBe('noimage-content');
            
            // Test getImage with error during file read
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation((filePath) => {
                if (filePath.includes('noimage.png')) return 'noimage-content';
                throw new Error('Read error');
            });
            result = imageModuleConfig.getImage('error-path.jpg');
            expect(result).toBe('noimage-content');
            
            // Test Docxtemplater nullGetter
            const docxConfig = Docxtemplater.mock.calls[0][1];
            expect(docxConfig.nullGetter()).toBe('-');
        });
    });

    describe('cleanup', () => {
        it('should delete both docx and pdf files successfully', () => {
            fs.existsSync.mockReturnValue(true);
            fs.unlinkSync.mockReturnValue(undefined);

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            documentService.cleanup('/path/to/file.docx', '/path/to/file.pdf');

            expect(fs.unlinkSync).toHaveBeenCalledWith('/path/to/file.docx');
            expect(fs.unlinkSync).toHaveBeenCalledWith('/path/to/file.pdf');
            expect(consoleLogSpy).toHaveBeenCalledWith('🧹 File sementara dihapus.');

            consoleLogSpy.mockRestore();
        });

        it('should skip deletion if files do not exist', () => {
            fs.existsSync.mockReturnValue(false);

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            documentService.cleanup('/path/to/nonexistent.docx', '/path/to/nonexistent.pdf');

            expect(fs.unlinkSync).not.toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith('🧹 File sementara dihapus.');

            consoleLogSpy.mockRestore();
        });

        it('should handle error during file deletion', () => {
            fs.existsSync.mockReturnValue(true);
            fs.unlinkSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

            documentService.cleanup('/path/to/file.docx', '/path/to/file.pdf');

            expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Tidak bisa hapus file temp:', 'Permission denied');

            consoleWarnSpy.mockRestore();
        });

        it('should handle partial file deletion', () => {
            fs.existsSync.mockImplementation((filePath) => filePath.includes('.docx'));
            fs.unlinkSync.mockReturnValue(undefined);

            const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

            documentService.cleanup('/path/to/file.docx', '/path/to/file.pdf');

            expect(fs.unlinkSync).toHaveBeenCalledTimes(1);
            expect(fs.unlinkSync).toHaveBeenCalledWith('/path/to/file.docx');
            expect(consoleLogSpy).toHaveBeenCalledWith('🧹 File sementara dihapus.');

            consoleLogSpy.mockRestore();
        });
    });
});
