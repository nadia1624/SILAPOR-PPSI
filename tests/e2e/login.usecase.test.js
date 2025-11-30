const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('USE CASE: User Login - Blackbox Testing', () => {
    let driver;

    beforeAll(async () => {
        const service = new ServiceBuilder(chromedriver.path);
        
        const options = new chrome.Options();
        options.addArguments('--headless=new');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');
        options.setChromeBinaryPath('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();
    });

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    describe('Main Success Scenario', () => {
        test('UC-LOGIN-001: User berhasil login dengan kredensial valid (user role)', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            // Wait for form to be ready
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Login dengan user yang sudah terverifikasi
            await driver.findElement(By.id('email')).sendKeys('user@example.com');
            await driver.findElement(By.id('password')).sendKeys('User@123456');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // Tunggu redirect
            await driver.sleep(3000);
            
            const currentUrl = await driver.getCurrentUrl();
            
            // Verifikasi redirect ke halaman mahasiswa/home
            expect(currentUrl).toContain('/mahasiswa/home');
        }, 30000);

        test('UC-LOGIN-002: Admin berhasil login dengan kredensial valid (admin role)', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Login dengan admin
            await driver.findElement(By.id('email')).sendKeys('admin@example.com');
            await driver.findElement(By.id('password')).sendKeys('Admin@123456');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(3000);
            
            const currentUrl = await driver.getCurrentUrl();
            
            // Verifikasi redirect ke halaman admin/dashboard
            expect(currentUrl).toContain('/admin/dashboard');
        }, 30000);
    });

    describe('Alternative Flows', () => {
        test('UC-LOGIN-003: User menggunakan fitur "Ingat saya"', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('email')).sendKeys('user@example.com');
            await driver.findElement(By.id('password')).sendKeys('User@123456');
            
            // Check "Ingat saya" checkbox
            const rememberCheckbox = await driver.findElement(By.id('remember'));
            await rememberCheckbox.click();
            
            const isChecked = await rememberCheckbox.isSelected();
            expect(isChecked).toBe(true);
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(3000);
            
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/mahasiswa/home');
        }, 30000);

        test('UC-LOGIN-004: User mengklik link "Lupa kata sandi"', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            const forgetPasswordLink = await driver.findElement(By.css('a[href="/forget-password"]'));
            await forgetPasswordLink.click();
            
            await driver.sleep(2000);
            
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/forget-password');
        }, 30000);

        test('UC-LOGIN-005: User mengklik link "Daftar di sini"', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            const registerLink = await driver.findElement(By.css('a[href="/register"]'));
            await registerLink.click();
            
            await driver.sleep(2000);
            
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/register');
        }, 30000);
    });

    describe('Exception Flows', () => {
        test('UC-LOGIN-006: User login dengan email yang tidak terdaftar', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('email')).sendKeys('notregistered@example.com');
            await driver.findElement(By.id('password')).sendKeys('Password@123');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(2000);
            
            const pageSource = await driver.getPageSource();
            
            // Harus menampilkan error
            expect(
                pageSource.includes('Email atau Password salah') ||
                pageSource.includes('salah')
            ).toBe(true);
        }, 30000);

        test('UC-LOGIN-007: User login dengan password yang salah', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('email')).sendKeys('user@example.com');
            await driver.findElement(By.id('password')).sendKeys('WrongPassword@123');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(2000);
            
            const pageSource = await driver.getPageSource();
            
            expect(
                pageSource.includes('Email atau Password salah') ||
                pageSource.includes('salah')
            ).toBe(true);
        }, 30000);

        test('UC-LOGIN-008: User login dengan email yang belum diverifikasi', async () => {
            // Pertama register user baru (tidak akan diverifikasi)
            const timestamp = Date.now();
            const unverifiedEmail = `unverified${timestamp}@example.com`;
            
            await driver.get(`${BASE_URL}/register`);
            await driver.wait(until.elementLocated(By.id('nama')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('nama')).sendKeys('Unverified User');
            await driver.findElement(By.id('email')).sendKeys(unverifiedEmail);
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567899');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('Test@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('Test@123456');
            
            const registerButton = await driver.findElement(By.css('button[type="submit"]'));
            await registerButton.click();
            await driver.sleep(3000);
            
            // Sekarang coba login tanpa verifikasi
            await driver.get(`${BASE_URL}/login`);
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('email')).sendKeys(unverifiedEmail);
            await driver.findElement(By.id('password')).sendKeys('Test@123456');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(2000);
            
            const pageSource = await driver.getPageSource();
            
            expect(
                pageSource.includes('belum diverifikasi') ||
                pageSource.includes('verifikasi')
            ).toBe(true);
        }, 30000);

        test('UC-LOGIN-009: User mengisi form dengan field kosong (email kosong)', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Hanya isi password
            await driver.findElement(By.id('password')).sendKeys('Password@123');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // HTML5 validation akan mencegah submit
            const emailField = await driver.findElement(By.id('email'));
            const isValid = await driver.executeScript("return arguments[0].checkValidity();", emailField);
            
            expect(isValid).toBe(false);
        }, 30000);

        test('UC-LOGIN-010: User mengisi form dengan field kosong (password kosong)', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Hanya isi email
            await driver.findElement(By.id('email')).sendKeys('test@example.com');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // HTML5 validation akan mencegah submit
            const passwordField = await driver.findElement(By.id('password'));
            const isValid = await driver.executeScript("return arguments[0].checkValidity();", passwordField);
            
            expect(isValid).toBe(false);
        }, 30000);

        test('UC-LOGIN-011: User mengisi email dengan format tidak valid', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('email')).sendKeys('invalid-email');
            await driver.findElement(By.id('password')).sendKeys('Password@123');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // HTML5 email validation
            const emailField = await driver.findElement(By.id('email'));
            const isValid = await driver.executeScript("return arguments[0].checkValidity();", emailField);
            
            expect(isValid).toBe(false);
        }, 30000);
    });

    describe('UI/UX Testing', () => {
        test('UC-LOGIN-012: Verify semua field input tersedia di form', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            
            const emailField = await driver.findElement(By.id('email'));
            const passwordField = await driver.findElement(By.id('password'));
            const rememberCheckbox = await driver.findElement(By.id('remember'));
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            
            expect(await emailField.isDisplayed()).toBe(true);
            expect(await passwordField.isDisplayed()).toBe(true);
            expect(await rememberCheckbox.isDisplayed()).toBe(true);
            expect(await submitButton.isDisplayed()).toBe(true);
        }, 30000);

        test('UC-LOGIN-013: Verify link "Lupa kata sandi" tersedia', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            
            const forgetPasswordLink = await driver.findElement(By.css('a[href="/forget-password"]'));
            expect(await forgetPasswordLink.isDisplayed()).toBe(true);
            
            const linkText = await forgetPasswordLink.getText();
            expect(linkText.toLowerCase()).toContain('lupa');
        }, 30000);

        test('UC-LOGIN-014: Verify link "Daftar di sini" tersedia', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            
            const registerLink = await driver.findElement(By.css('a[href="/register"]'));
            expect(await registerLink.isDisplayed()).toBe(true);
            
            const linkText = await registerLink.getText();
            expect(linkText.toLowerCase()).toContain('daftar');
        }, 30000);

        test('UC-LOGIN-015: Verify toggle password visibility berfungsi', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            const passwordField = await driver.findElement(By.id('password'));
            const toggleButton = await driver.findElement(By.css('button.hs-toggle-password'));
            
            // Cek type awal (password)
            let inputType = await passwordField.getAttribute('type');
            expect(inputType).toBe('password');
            
            // Klik toggle
            await toggleButton.click();
            await driver.sleep(300);
            
            // Cek type berubah ke text
            inputType = await passwordField.getAttribute('type');
            expect(inputType).toBe('text');
        }, 30000);
    });

    describe('Security Testing', () => {
        test('UC-LOGIN-016: Verify password tidak terlihat saat diketik', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            const passwordField = await driver.findElement(By.id('password'));
            await passwordField.sendKeys('TestPassword123');
            
            // Password field type harus 'password'
            const inputType = await passwordField.getAttribute('type');
            expect(inputType).toBe('password');
        }, 30000);

        test('UC-LOGIN-017: Verify error message tidak membocorkan informasi spesifik', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Test dengan email yang tidak terdaftar
            await driver.findElement(By.id('email')).sendKeys('notexist@example.com');
            await driver.findElement(By.id('password')).sendKeys('Password@123');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(2000);
            
            const pageSource = await driver.getPageSource();
            
            // Error message seharusnya generic "Email atau Password salah"
            // Tidak boleh spesifik "Email tidak terdaftar"
            expect(pageSource.includes('Email atau Password salah')).toBe(true);
        }, 30000);
    });

    describe('Boundary Value Testing', () => {
        test('UC-LOGIN-018: Login dengan email maksimal panjang (edge case)', async () => {
            await driver.get(`${BASE_URL}/login`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Email dengan panjang maksimal
            const longEmail = 'a'.repeat(50) + '@example.com';
            await driver.findElement(By.id('email')).sendKeys(longEmail);
            await driver.findElement(By.id('password')).sendKeys('Password@123');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(2000);
            
            // Tidak error saat submit, meskipun user tidak ditemukan
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/login');
        }, 30000);
    });
});
