const AuthController = require('../../../controllers/AuthController');
const EmailService = require('../../../services/EmailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../../../services/EmailService');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('fs');

describe('AuthController', () => {
    let authController;
    let mockUser;
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

        // Mock console.error to suppress error messages during tests
        jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock Sequelize User model and its methods
        mockUser = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };

        // Mock Express request and response objects
        mockReq = {
            body: {},
            query: {},
            user: {},
            cookies: {},
            file: null,
        };
        mockRes = {
            render: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            redirect: jest.fn(),
            cookie: jest.fn(),
            clearCookie: jest.fn(),
            json: jest.fn(),
        };

        // Instantiate the controller with the mocked model
        authController = new AuthController({ User: mockUser });
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    describe('register', () => {
        it('should register a new user, send verification email, and render checkEmail view', async () => {
            mockReq.body = {
                nama: 'Test User',
                email: 'test@example.com',
                no_telepon: '12345',
                alamat: 'Test Address',
                password: 'Password123!',
            };

            mockUser.findOne.mockResolvedValue(null); // No existing user
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('hashedPassword');
            mockUser.create.mockResolvedValue({ nama: 'Test User', email: 'test@example.com' });

            await authController.register(mockReq, mockRes);

            expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 'salt');
            expect(mockUser.create).toHaveBeenCalledWith(expect.any(Object));
            expect(EmailService.prototype.sendVerificationEmail).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalledWith('checkEmail', { msg: expect.any(String) });
        });

        it('should render register view with an error if email already exists', async () => {
            mockReq.body = { email: 'test@example.com' };
            mockUser.findOne.mockResolvedValue({ email: 'test@example.com' }); // User exists

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.render).toHaveBeenCalledWith('register', { error: 'Email sudah terdaftar.' });
        });

        it('should handle server errors during registration', async () => {
            mockReq.body = { email: 'test@example.com' };
            mockUser.findOne.mockRejectedValue(new Error('DB error'));

            await authController.register(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server Error');
        });
    });

    describe('login', () => {
        const mockUserData = {
            email: 'test@example.com',
            password: 'hashedPassword',
            isVerified: true,
            role: 'user',
        };

        it('should login a verified user and redirect to user home', async () => {
            mockReq.body = { email: 'test@example.com', password: 'Password123!' };
            mockUser.findOne.mockResolvedValue(mockUserData);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mocked-jwt-token');

            await authController.login(mockReq, mockRes);

            expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'hashedPassword');
            expect(jwt.sign).toHaveBeenCalled();
            expect(mockRes.cookie).toHaveBeenCalledWith('token', 'mocked-jwt-token', { httpOnly: true });
            expect(mockRes.redirect).toHaveBeenCalledWith('/mahasiswa/home');
        });

        it('should redirect admin to admin dashboard', async () => {
            mockReq.body = { email: 'admin@example.com', password: 'Password123!' };
            mockUser.findOne.mockResolvedValue({ ...mockUserData, role: 'admin' });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mocked-jwt-token');

            await authController.login(mockReq, mockRes);

            expect(mockRes.redirect).toHaveBeenCalledWith('/admin/dashboard');
        });

        it('should render login with error for non-existent user', async () => {
            mockReq.body = { email: 'nouser@example.com', password: 'password' };
            mockUser.findOne.mockResolvedValue(null);

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.render).toHaveBeenCalledWith('login', { error: 'Email atau Password salah!' });
        });

        it('should render login with error for unverified user', async () => {
            mockReq.body = { email: 'test@example.com', password: 'password' };
            mockUser.findOne.mockResolvedValue({ ...mockUserData, isVerified: false });

            await authController.login(mockReq, mockRes);



            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.render).toHaveBeenCalledWith('login', { error: 'Email belum diverifikasi. Silakan cek email Anda.' });
        });

        it('should render login with error for invalid password', async () => {
            mockReq.body = { email: 'test@example.com', password: 'wrongpassword' };
            mockUser.findOne.mockResolvedValue(mockUserData);
            bcrypt.compare.mockResolvedValue(false); // Invalid password

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.render).toHaveBeenCalledWith('login', { error: 'Email atau Password salah!' });
        });

        it('should send JSON response for user with unknown role', async () => {
            mockReq.body = { email: 'special@example.com', password: 'Password123!' };
            mockUser.findOne.mockResolvedValue({ ...mockUserData, role: 'moderator' });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mocked-jwt-token');

            await authController.login(mockReq, mockRes);

            expect(mockRes.cookie).toHaveBeenCalledWith('token', 'mocked-jwt-token', { httpOnly: true });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.send).toHaveBeenCalledWith({ auth: true, token: 'mocked-jwt-token' });
        });

        it('should handle login errors', async () => {
            mockReq.body = { email: 'test@example.com', password: 'Password123!' };
            mockUser.findOne.mockRejectedValue(new Error('Database connection error'));

            await authController.login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('verifyEmail', () => {
        const mockUserInstance = {
            email: 'test@example.com',
            isVerified: false,
            emailVerifyToken: 'rawToken123',
            emailVerifyTokenUsed: false,
            save: jest.fn().mockResolvedValue(true),
        };

        it('should verify a user with a valid token', async () => {
            mockReq.query = { token: 'validToken' };
            jwt.verify.mockReturnValue({ email: 'test@example.com', rawToken: 'rawToken123' });
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.verifyEmail(mockReq, mockRes);

            expect(mockUserInstance.isVerified).toBe(true);
            expect(mockUserInstance.emailVerifyTokenUsed).toBe(true);
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalledWith('registerDone', { msg: expect.any(String) });
        });

        it('should fail if token is invalid or expired', async () => {
            mockReq.query = { token: 'invalidToken' };
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            await authController.verifyEmail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('Token tidak valid atau sudah kadaluarsa');
        });

        it('should fail if user is not found', async () => {
            mockReq.query = { token: 'validToken' };
            jwt.verify.mockReturnValue({ email: 'nouser@example.com', rawToken: 'rawToken123' });
            mockUser.findOne.mockResolvedValue(null);

            await authController.verifyEmail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('User tidak ditemukan');
        });

        it('should render login if user is already verified', async () => {
            mockReq.query = { token: 'validToken' };
            jwt.verify.mockReturnValue({ email: 'test@example.com', rawToken: 'rawToken123' });
            mockUser.findOne.mockResolvedValue({ ...mockUserInstance, isVerified: true });

            await authController.verifyEmail(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('login', { msg: expect.any(String) });
        });

        it('should fail if token is already used or mismatched', async () => {
            mockReq.query = { token: 'validToken' };
            jwt.verify.mockReturnValue({ email: 'test@example.com', rawToken: 'differentRawToken' });
            const mismatchedUser = {
                email: 'test@example.com',
                isVerified: false,
                emailVerifyToken: 'rawToken123',
                emailVerifyTokenUsed: false,
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mismatchedUser);

            await authController.verifyEmail(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('Token sudah dipakai atau tidak valid.');
        });
    });

    describe('logout', () => {
        it('should clear the token cookie and redirect to home', async () => {
            await authController.logout(mockReq, mockRes);

            expect(mockRes.clearCookie).toHaveBeenCalledWith('token');
            expect(mockRes.redirect).toHaveBeenCalledWith('/');
        });

        it('should handle errors during logout', async () => {
            mockRes.clearCookie.mockImplementation(() => {
                throw new Error('Cookie error');
            });

            await authController.logout(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
        });
    });

    describe('showProfile', () => {
        it('should render profile view with user data if user is found', async () => {
            mockReq.user = { email: 'test@example.com' };
            const mockUserData = { name: 'Test', email: 'test@example.com' };
            mockUser.findOne.mockResolvedValue(mockUserData);

            await authController.showProfile(mockReq, mockRes);

            expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(mockRes.render).toHaveBeenCalledWith('profile', { user: mockUserData });
        });

        it('should return 404 if user is not found', async () => {
            mockReq.user = { email: 'nouser@example.com' };
            mockUser.findOne.mockResolvedValue(null);

            await authController.showProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('User tidak ditemukan');
        });

        it('should handle server errors', async () => {
            mockReq.user = { email: 'test@example.com' };
            mockUser.findOne.mockRejectedValue(new Error('DB error'));

            await authController.showProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Gagal mengambil data profil');
        });
    });

    describe('forgetPassword', () => {
        it('should send reset password email for registered user', async () => {
            mockReq.body = { email: 'test@example.com' };
            const mockUserInstance = {
                email: 'test@example.com',
                resetPasswordToken: null,
                resetPasswordTokenUsed: false,
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.forgetPassword(mockReq, mockRes);

            expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(EmailService.prototype.sendResetPasswordEmail).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalledWith('forgetPassword', { success: expect.any(String) });
        });

        it('should render error if email not registered', async () => {
            mockReq.body = { email: 'notfound@example.com' };
            mockUser.findOne.mockResolvedValue(null);

            await authController.forgetPassword(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('forgetPassword', { error: 'Email tidak terdaftar.' });
        });

        it('should handle server errors', async () => {
            mockReq.body = { email: 'test@example.com' };
            mockUser.findOne.mockRejectedValue(new Error('DB error'));

            await authController.forgetPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server Error');
        });
    });

    describe('showResetPasswordForm', () => {
        it('should render reset password form with valid token', async () => {
            mockReq.query = { token: 'validToken' };
            jwt.verify.mockReturnValue({ email: 'test@example.com', rawToken: 'rawToken123' });
            const mockUserInstance = {
                email: 'test@example.com',
                resetPasswordToken: 'rawToken123',
                resetPasswordTokenUsed: false,
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.showResetPasswordForm(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('resetPassword', { token: 'validToken' });
        });

        it('should fail if user not found', async () => {
            mockReq.query = { token: 'validToken' };
            jwt.verify.mockReturnValue({ email: 'nouser@example.com', rawToken: 'rawToken123' });
            mockUser.findOne.mockResolvedValue(null);

            await authController.showResetPasswordForm(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('User tidak ditemukan');
        });

        it('should fail if token is already used or invalid', async () => {
            mockReq.query = { token: 'validToken' };
            jwt.verify.mockReturnValue({ email: 'test@example.com', rawToken: 'rawToken123' });
            const mockUserInstance = {
                email: 'test@example.com',
                resetPasswordToken: 'differentToken',
                resetPasswordTokenUsed: false,
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.showResetPasswordForm(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('Token sudah dipakai atau tidak valid.');
        });

        it('should fail if token is invalid or expired', async () => {
            mockReq.query = { token: 'invalidToken' };
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            await authController.showResetPasswordForm(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('Token tidak valid atau sudah kadaluarsa');
        });
    });

    describe('resetPassword', () => {
        it('should reset password with valid token and strong password', async () => {
            mockReq.body = { token: 'validToken', password: 'NewPass123!' };
            jwt.verify.mockReturnValue({ email: 'test@example.com', rawToken: 'rawToken123' });
            const mockUserInstance = {
                email: 'test@example.com',
                resetPasswordToken: 'rawToken123',
                resetPasswordTokenUsed: false,
                password: 'oldHashedPassword',
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('newHashedPassword');

            await authController.resetPassword(mockReq, mockRes);

            expect(mockUserInstance.resetPasswordTokenUsed).toBe(true);
            expect(mockUserInstance.resetPasswordToken).toBe(null);
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalledWith('resetPasswordDone', { msg: expect.any(String) });
        });

        it('should fail if user not found', async () => {
            mockReq.body = { token: 'validToken', password: 'NewPass123!' };
            jwt.verify.mockReturnValue({ email: 'nouser@example.com', rawToken: 'rawToken123' });
            mockUser.findOne.mockResolvedValue(null);

            await authController.resetPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('User tidak ditemukan');
        });

        it('should fail if token is already used or invalid', async () => {
            mockReq.body = { token: 'validToken', password: 'NewPass123!' };
            jwt.verify.mockReturnValue({ email: 'test@example.com', rawToken: 'rawToken123' });
            const mockUserInstance = {
                email: 'test@example.com',
                resetPasswordToken: 'differentToken',
                resetPasswordTokenUsed: false,
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.resetPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('Token sudah dipakai atau tidak valid.');
        });

        it('should render error if password is not strong enough', async () => {
            mockReq.body = { token: 'validToken', password: 'weak' };
            jwt.verify.mockReturnValue({ email: 'test@example.com', rawToken: 'rawToken123' });
            const mockUserInstance = {
                email: 'test@example.com',
                resetPasswordToken: 'rawToken123',
                resetPasswordTokenUsed: false,
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.resetPassword(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('resetPassword', {
                token: 'validToken',
                error: 'Password harus minimal 8 karakter dan kombinasi huruf, angka, simbol.'
            });
        });

        it('should fail if token is invalid or expired', async () => {
            mockReq.body = { token: 'invalidToken', password: 'NewPass123!' };
            jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });

            await authController.resetPassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.send).toHaveBeenCalledWith('Token tidak valid atau sudah kadaluarsa');
        });
    });

    describe('showChangePasswordForm', () => {
        it('should render change password form', async () => {
            await authController.showChangePasswordForm(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('changePassword');
        });
    });

    describe('showChangePasswordAdminForm', () => {
        it('should render admin change password form with user data', async () => {
            mockReq.user = { email: 'admin@example.com' };
            const mockUserData = { email: 'admin@example.com', role: 'admin' };
            mockUser.findOne.mockResolvedValue(mockUserData);

            await authController.showChangePasswordAdminForm(mockReq, mockRes);

            expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: 'admin@example.com' } });
            expect(mockRes.render).toHaveBeenCalledWith('admin/changePasswordadmin', { user: mockUserData });
        });
    });

    describe('changePassword', () => {
        it('should change password successfully for user', async () => {
            mockReq.body = {
                old_password: 'OldPass123!',
                password: 'NewPass123!',
                confirm_password: 'NewPass123!',
            };
            mockReq.user = { email: 'test@example.com' };
            const mockUserInstance = {
                email: 'test@example.com',
                password: 'hashedOldPassword',
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.compare.mockResolvedValue(true);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('newHashedPassword');

            await authController.changePassword(mockReq, mockRes);

            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalledWith('changePassword', { success: 'Password berhasil diganti.', user: null });
        });

        it('should fail if user not found', async () => {
            mockReq.body = { old_password: 'OldPass123!', password: 'NewPass123!', confirm_password: 'NewPass123!' };
            mockReq.user = { email: 'nouser@example.com' };
            mockUser.findOne.mockResolvedValue(null);

            await authController.changePassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('User tidak ditemukan');
        });

        it('should fail if old password is incorrect', async () => {
            mockReq.body = { old_password: 'WrongOld123!', password: 'NewPass123!', confirm_password: 'NewPass123!' };
            mockReq.user = { email: 'test@example.com' };
            const mockUserInstance = { email: 'test@example.com', password: 'hashedOldPassword' };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.compare.mockResolvedValue(false);

            await authController.changePassword(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('changePassword', { error: 'Password lama salah.' });
        });

        it('should fail if new password is not strong enough', async () => {
            mockReq.body = { old_password: 'OldPass123!', password: 'weak', confirm_password: 'weak' };
            mockReq.user = { email: 'test@example.com' };
            const mockUserInstance = { email: 'test@example.com', password: 'hashedOldPassword' };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.compare.mockResolvedValue(true);

            await authController.changePassword(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('changePassword', {
                error: 'Password harus minimal 8 karakter dan kombinasi huruf, angka, simbol.'
            });
        });

        it('should fail if password confirmation does not match', async () => {
            mockReq.body = { old_password: 'OldPass123!', password: 'NewPass123!', confirm_password: 'DifferentPass123!' };
            mockReq.user = { email: 'test@example.com' };
            const mockUserInstance = { email: 'test@example.com', password: 'hashedOldPassword' };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.compare.mockResolvedValue(true);

            await authController.changePassword(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('changePassword', { error: 'Konfirmasi password tidak cocok.' });
        });

        it('should handle server errors', async () => {
            mockReq.body = { old_password: 'OldPass123!', password: 'NewPass123!', confirm_password: 'NewPass123!' };
            mockReq.user = { email: 'test@example.com' };
            mockUser.findOne.mockRejectedValue(new Error('DB error'));

            await authController.changePassword(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server Error');
        });
    });

    describe('changePasswordAdmin', () => {
        it('should change password successfully for admin', async () => {
            mockReq.body = {
                old_password: 'OldPass123!',
                password: 'NewPass123!',
                confirm_password: 'NewPass123!',
            };
            mockReq.user = { email: 'admin@example.com' };
            const mockUserInstance = {
                email: 'admin@example.com',
                password: 'hashedOldPassword',
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.compare.mockResolvedValue(true);
            bcrypt.genSalt.mockResolvedValue('salt');
            bcrypt.hash.mockResolvedValue('newHashedPassword');

            await authController.changePasswordAdmin(mockReq, mockRes);

            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.render).toHaveBeenCalledWith('admin/changePasswordadmin', {
                success: 'Password berhasil diganti.',
                user: mockUserInstance
            });
        });

        it('should fail if admin user not found', async () => {
            mockReq.body = { old_password: 'OldPass123!', password: 'NewPass123!', confirm_password: 'NewPass123!' };
            mockReq.user = { email: 'admin@example.com' };
            mockUser.findOne.mockResolvedValue(null);

            await authController.changePasswordAdmin(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('User tidak ditemukan');
        });

        it('should fail if admin old password is incorrect', async () => {
            mockReq.body = { old_password: 'WrongOld123!', password: 'NewPass123!', confirm_password: 'NewPass123!' };
            mockReq.user = { email: 'admin@example.com' };
            const mockUserInstance = { email: 'admin@example.com', password: 'hashedOldPassword' };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.compare.mockResolvedValue(false);

            await authController.changePasswordAdmin(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('admin/changePasswordadmin', { error: 'Password lama salah.' });
        });

        it('should fail if admin new password is not strong enough', async () => {
            mockReq.body = { old_password: 'OldPass123!', password: 'weak', confirm_password: 'weak' };
            mockReq.user = { email: 'admin@example.com' };
            const mockUserInstance = { email: 'admin@example.com', password: 'hashedOldPassword' };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.compare.mockResolvedValue(true);

            await authController.changePasswordAdmin(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('admin/changePasswordadmin', {
                error: 'Password harus minimal 8 karakter dan kombinasi huruf, angka, simbol.'
            });
        });

        it('should fail if admin password confirmation does not match', async () => {
            mockReq.body = { old_password: 'OldPass123!', password: 'NewPass123!', confirm_password: 'DifferentPass123!' };
            mockReq.user = { email: 'admin@example.com' };
            const mockUserInstance = { email: 'admin@example.com', password: 'hashedOldPassword' };
            mockUser.findOne.mockResolvedValue(mockUserInstance);
            bcrypt.compare.mockResolvedValue(true);

            await authController.changePasswordAdmin(mockReq, mockRes);

            expect(mockRes.render).toHaveBeenCalledWith('admin/changePasswordadmin', { error: 'Konfirmasi password tidak cocok.' });
        });

        it('should handle server errors for admin', async () => {
            mockReq.body = { old_password: 'OldPass123!', password: 'NewPass123!', confirm_password: 'NewPass123!' };
            mockReq.user = { email: 'admin@example.com' };
            mockUser.findOne.mockRejectedValue(new Error('DB error'));

            await authController.changePasswordAdmin(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Server Error');
        });
    });

    describe('showEditProfile', () => {
        it('should render edit profile form with user data', async () => {
            mockReq.user = { email: 'test@example.com' };
            const mockUserData = { name: 'Test', email: 'test@example.com' };
            mockUser.findOne.mockResolvedValue(mockUserData);

            await authController.showEditProfile(mockReq, mockRes);

            expect(mockUser.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(mockRes.render).toHaveBeenCalledWith('editProfile', { user: mockUserData });
        });

        it('should return 404 if user not found', async () => {
            mockReq.user = { email: 'nouser@example.com' };
            mockUser.findOne.mockResolvedValue(null);

            await authController.showEditProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('User tidak ditemukan');
        });

        it('should handle server errors', async () => {
            mockReq.user = { email: 'test@example.com' };
            mockUser.findOne.mockRejectedValue(new Error('DB error'));

            await authController.showEditProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Gagal memuat form edit');
        });
    });

    describe('updateProfile', () => {
        it('should update profile successfully without file upload', async () => {
            mockReq.body = { nama: 'Updated Name', alamat: 'New Address', no_telepon: '98765' };
            mockReq.user = { email: 'test@example.com' };
            mockReq.file = null;
            const mockUserInstance = {
                email: 'test@example.com',
                nama: 'Old Name',
                alamat: 'Old Address',
                no_telepon: '12345',
                foto: 'default.jpg',
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.updateProfile(mockReq, mockRes);

            expect(mockUserInstance.nama).toBe('Updated Name');
            expect(mockUserInstance.alamat).toBe('New Address');
            expect(mockUserInstance.no_telepon).toBe('98765');
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/profile');
        });

        it('should update profile with file upload', async () => {
            mockReq.body = { nama: 'Updated Name', alamat: 'New Address', no_telepon: '98765' };
            mockReq.user = { email: 'test@example.com' };
            mockReq.file = { filename: 'newphoto.jpg' };
            const mockUserInstance = {
                email: 'test@example.com',
                nama: 'Old Name',
                alamat: 'Old Address',
                no_telepon: '12345',
                foto: 'default.jpg',
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.updateProfile(mockReq, mockRes);

            expect(mockUserInstance.foto).toBe('newphoto.jpg');
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/profile');
        });

        it('should delete old photo when uploading new photo (non-default)', async () => {
            fs.existsSync = jest.fn().mockReturnValue(true);
            fs.unlinkSync = jest.fn();

            mockReq.body = { nama: 'Updated Name', alamat: 'New Address', no_telepon: '98765' };
            mockReq.user = { email: 'test@example.com' };
            mockReq.file = { filename: 'newphoto.jpg' };
            const mockUserInstance = {
                email: 'test@example.com',
                nama: 'Old Name',
                alamat: 'Old Address',
                no_telepon: '12345',
                foto: 'oldphoto.jpg', // Non-default photo
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.updateProfile(mockReq, mockRes);

            expect(fs.existsSync).toHaveBeenCalledWith(path.join('public', 'upload', 'oldphoto.jpg'));
            expect(fs.unlinkSync).toHaveBeenCalledWith(path.join('public', 'upload', 'oldphoto.jpg'));
            expect(mockUserInstance.foto).toBe('newphoto.jpg');
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/profile');
        });

        it('should not delete old photo when file does not exist', async () => {
            fs.existsSync = jest.fn().mockReturnValue(false);
            fs.unlinkSync = jest.fn();

            mockReq.body = { nama: 'Updated Name', alamat: 'New Address', no_telepon: '98765' };
            mockReq.user = { email: 'test@example.com' };
            mockReq.file = { filename: 'newphoto.jpg' };
            const mockUserInstance = {
                email: 'test@example.com',
                nama: 'Old Name',
                alamat: 'Old Address',
                no_telepon: '12345',
                foto: 'oldphoto.jpg',
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.updateProfile(mockReq, mockRes);

            expect(fs.existsSync).toHaveBeenCalledWith(path.join('public', 'upload', 'oldphoto.jpg'));
            expect(fs.unlinkSync).not.toHaveBeenCalled();
            expect(mockUserInstance.foto).toBe('newphoto.jpg');
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/profile');
        });

        it('should update profile without deleting default photo', async () => {
            fs.existsSync = jest.fn();
            fs.unlinkSync = jest.fn();

            mockReq.body = { nama: 'Updated Name', alamat: 'New Address', no_telepon: '98765' };
            mockReq.user = { email: 'test@example.com' };
            mockReq.file = { filename: 'newphoto.jpg' };
            const mockUserInstance = {
                email: 'test@example.com',
                nama: 'Old Name',
                alamat: 'Old Address',
                no_telepon: '12345',
                foto: 'default.jpg', // Default photo should not be deleted
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.updateProfile(mockReq, mockRes);

            expect(fs.existsSync).not.toHaveBeenCalled();
            expect(fs.unlinkSync).not.toHaveBeenCalled();
            expect(mockUserInstance.foto).toBe('newphoto.jpg');
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/profile');
        });

        it('should update profile with partial data', async () => {
            mockReq.body = { nama: 'Updated Name' }; // Only nama provided
            mockReq.user = { email: 'test@example.com' };
            const mockUserInstance = {
                email: 'test@example.com',
                nama: 'Old Name',
                alamat: 'Old Address',
                no_telepon: '12345',
                foto: 'default.jpg',
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.updateProfile(mockReq, mockRes);

            expect(mockUserInstance.nama).toBe('Updated Name');
            expect(mockUserInstance.alamat).toBe('Old Address'); // Unchanged
            expect(mockUserInstance.no_telepon).toBe('12345'); // Unchanged
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/profile');
        });

        it('should keep old values when body fields are empty', async () => {
            mockReq.body = { nama: '', alamat: '', no_telepon: '' }; // Empty values
            mockReq.user = { email: 'test@example.com' };
            const mockUserInstance = {
                email: 'test@example.com',
                nama: 'Old Name',
                alamat: 'Old Address',
                no_telepon: '12345',
                foto: 'default.jpg',
                save: jest.fn().mockResolvedValue(true),
            };
            mockUser.findOne.mockResolvedValue(mockUserInstance);

            await authController.updateProfile(mockReq, mockRes);

            expect(mockUserInstance.nama).toBe('Old Name'); // Unchanged due to empty string
            expect(mockUserInstance.alamat).toBe('Old Address'); // Unchanged due to empty string
            expect(mockUserInstance.no_telepon).toBe('12345'); // Unchanged due to empty string
            expect(mockUserInstance.save).toHaveBeenCalled();
            expect(mockRes.redirect).toHaveBeenCalledWith('/profile');
        });

        it('should return 404 if user not found', async () => {
            mockReq.body = { nama: 'Updated Name' };
            mockReq.user = { email: 'nouser@example.com' };
            mockUser.findOne.mockResolvedValue(null);

            await authController.updateProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.send).toHaveBeenCalledWith('User tidak ditemukan');
        });

        it('should handle server errors', async () => {
            mockReq.body = { nama: 'Updated Name' };
            mockReq.user = { email: 'test@example.com' };
            mockUser.findOne.mockRejectedValue(new Error('DB error'));

            await authController.updateProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.send).toHaveBeenCalledWith('Terjadi kesalahan saat update profile');
        });
    });
});