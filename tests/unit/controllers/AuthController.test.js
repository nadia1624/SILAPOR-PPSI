const AuthController = require('../../../controllers/AuthController');
const EmailService = require('../../../services/EmailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../../services/EmailService');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
    let authController;
    let mockUser;
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();

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
    });
});