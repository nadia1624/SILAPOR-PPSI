const EmailService = require('../../../services/EmailService');
const nodemailer = require('nodemailer');
const ejs = require('ejs');

jest.mock('nodemailer');
jest.mock('ejs');

describe('EmailService', () => {
    let emailService;
    let mockTransporter;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);

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
