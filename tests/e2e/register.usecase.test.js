const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

describe('USE CASE: User Registration - Blackbox Testing', () => {
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
        test('UC-REG-001: User berhasil mendaftar dengan data valid', async () => {
            const timestamp = Date.now();
            const testData = {
                nama: 'Test User ' + timestamp,
                email: `testuser${timestamp}@example.com`,
                no_telepon: '081234567890',
                alamat: 'Jl. Test No. 123, Padang',
                password: 'Test@123456',
                confirm_password: 'Test@123456'
            };

            await driver.get(`${BASE_URL}/register`);
            
            // Wait for form to be ready
            await driver.wait(until.elementLocated(By.id('nama')), 5000);
            await driver.sleep(500);
            
            // Isi form
            await driver.findElement(By.id('nama')).sendKeys(testData.nama);
            await driver.findElement(By.id('email')).sendKeys(testData.email);
            await driver.findElement(By.id('no_telepon')).sendKeys(testData.no_telepon);
            await driver.findElement(By.id('alamat')).sendKeys(testData.alamat);
            await driver.findElement(By.id('password')).sendKeys(testData.password);
            await driver.findElement(By.id('confirm_password')).sendKeys(testData.confirm_password);

            // Use button click instead of form submit to properly trigger the form
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // Tunggu redirect ke halaman checkEmail
            await driver.sleep(5000);

            const pageSource = await driver.getPageSource();
            
            // Verifikasi halaman sukses
            expect(
                pageSource.includes('Registrasi Berhasil') ||
                pageSource.includes('cek email') || 
                pageSource.includes('verifikasi')
            ).toBe(true);
        }, 30000);
    });

    describe('Alternative Flows', () => {
        test('UC-REG-002: User mengisi password dengan karakter minimal (8 karakter)', async () => {
            const timestamp = Date.now();
            const testData = {
                nama: 'Test Min Password',
                email: `minpass${timestamp}@example.com`,
                no_telepon: '081234567891',
                alamat: 'Jl. Test No. 124',
                password: 'Test@123',  // 8 karakter
                confirm_password: 'Test@123'
            };

            await driver.get(`${BASE_URL}/register`);
            
            // Wait for form to be ready
            await driver.wait(until.elementLocated(By.id('nama')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('nama')).sendKeys(testData.nama);
            await driver.findElement(By.id('email')).sendKeys(testData.email);
            await driver.findElement(By.id('no_telepon')).sendKeys(testData.no_telepon);
            await driver.findElement(By.id('alamat')).sendKeys(testData.alamat);
            await driver.findElement(By.id('password')).sendKeys(testData.password);
            await driver.findElement(By.id('confirm_password')).sendKeys(testData.confirm_password);

            await driver.executeScript("document.getElementById('registerForm').submit();");
            await driver.sleep(3000);

            const pageSource = await driver.getPageSource();
            expect(
                pageSource.includes('Registrasi Berhasil') ||
                pageSource.includes('cek email') || 
                pageSource.includes('verifikasi')
            ).toBe(true);
        }, 30000);

        test('UC-REG-003: User mengisi nama dengan panjang maksimal', async () => {
            const timestamp = Date.now();
            const longName = 'A'.repeat(100);
            
            const testData = {
                nama: longName,
                email: `longname${timestamp}@example.com`,
                no_telepon: '081234567892',
                alamat: 'Jl. Test No. 125',
                password: 'Test@123456',
                confirm_password: 'Test@123456'
            };

            await driver.get(`${BASE_URL}/register`);
            
            // Wait for form to be ready
            await driver.wait(until.elementLocated(By.id('nama')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('nama')).sendKeys(testData.nama);
            await driver.findElement(By.id('email')).sendKeys(testData.email);
            await driver.findElement(By.id('no_telepon')).sendKeys(testData.no_telepon);
            await driver.findElement(By.id('alamat')).sendKeys(testData.alamat);
            await driver.findElement(By.id('password')).sendKeys(testData.password);
            await driver.findElement(By.id('confirm_password')).sendKeys(testData.confirm_password);

            await driver.executeScript("document.getElementById('registerForm').submit();");
            await driver.sleep(3000);

            const pageSource = await driver.getPageSource();
            expect(
                pageSource.includes('Registrasi Berhasil') ||
                pageSource.includes('cek email') || 
                pageSource.includes('verifikasi')
            ).toBe(true);
        }, 30000);
    });

    describe('Exception Flows', () => {
        test('UC-REG-004: User mendaftar dengan email yang sudah terdaftar', async () => {
            const duplicateEmail = 'duplicate@example.com';
            
            // Registrasi pertama
            await driver.get(`${BASE_URL}/register`);
            await driver.findElement(By.id('nama')).sendKeys('First User');
            await driver.findElement(By.id('email')).sendKeys(duplicateEmail);
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567893');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. First');
            await driver.findElement(By.id('password')).sendKeys('Test@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('Test@123456');
            
            await driver.executeScript("document.getElementById('registerForm').submit();");
            await driver.sleep(2000);

            // Registrasi kedua dengan email sama
            await driver.get(`${BASE_URL}/register`);
            await driver.findElement(By.id('nama')).sendKeys('Second User');
            await driver.findElement(By.id('email')).sendKeys(duplicateEmail);
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567894');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Second');
            await driver.findElement(By.id('password')).sendKeys('Test@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('Test@123456');
            
            await driver.executeScript("document.getElementById('registerForm').submit();");
            await driver.sleep(3000);

            const pageSource = await driver.getPageSource();
            // Harus ada pesan error email sudah terdaftar
            expect(
                pageSource.includes('sudah terdaftar') ||
                pageSource.includes('already') ||
                pageSource.includes('Email sudah')
            ).toBe(true);
        }, 40000);

        test('UC-REG-005: User mengisi form dengan field kosong (nama kosong)', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            // Isi semua field kecuali nama
            await driver.findElement(By.id('email')).sendKeys('test@example.com');
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567890');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('Test@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('Test@123456');

            // Coba submit dengan nama kosong
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // HTML5 validation akan mencegah submit
            const namaField = await driver.findElement(By.id('nama'));
            const isValid = await driver.executeScript("return arguments[0].checkValidity();", namaField);
            
            expect(isValid).toBe(false);
        }, 30000);

        test('UC-REG-006: User mengisi password lemah (kurang dari 8 karakter)', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            // Wait for form to be ready
            await driver.wait(until.elementLocated(By.id('nama')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('nama')).sendKeys('Test User');
            await driver.findElement(By.id('email')).sendKeys('test@example.com');
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567890');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            
            const passwordField = await driver.findElement(By.id('password'));
            await passwordField.sendKeys('Test@1');  // Hanya 6 karakter
            
            // Keep password field focused to trigger the warning
            // The blur event hides the warning, so we need to check while it's still focused
            await driver.sleep(500);
            
            const warningDiv = await driver.findElement(By.id('password-warning'));
            const displayStyle = await warningDiv.getCssValue('display');
            
            // The warning should be visible (display: block)
            expect(displayStyle).toBe('block');
        }, 30000);

        test('UC-REG-007: User mengisi password tanpa huruf besar', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            await driver.findElement(By.id('nama')).sendKeys('Test User');
            await driver.findElement(By.id('email')).sendKeys('test@example.com');
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567890');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('test@123456');  // Tidak ada huruf besar
            
            await driver.sleep(500);
            
            const warningDiv = await driver.findElement(By.id('password-warning'));
            const isDisplayed = await warningDiv.isDisplayed();
            
            expect(isDisplayed).toBe(true);
        }, 30000);

        test('UC-REG-008: User mengisi password tanpa angka', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            await driver.findElement(By.id('nama')).sendKeys('Test User');
            await driver.findElement(By.id('email')).sendKeys('test@example.com');
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567890');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('Test@Test');  // Tidak ada angka
            
            await driver.sleep(500);
            
            const warningDiv = await driver.findElement(By.id('password-warning'));
            const isDisplayed = await warningDiv.isDisplayed();
            
            expect(isDisplayed).toBe(true);
        }, 30000);

        test('UC-REG-009: User mengisi password tanpa simbol', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            await driver.findElement(By.id('nama')).sendKeys('Test User');
            await driver.findElement(By.id('email')).sendKeys('test@example.com');
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567890');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('Test123456');  // Tidak ada simbol
            
            await driver.sleep(500);
            
            const warningDiv = await driver.findElement(By.id('password-warning'));
            const isDisplayed = await warningDiv.isDisplayed();
            
            expect(isDisplayed).toBe(true);
        }, 30000);

        test('UC-REG-010: User mengisi konfirmasi password yang tidak cocok', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            await driver.findElement(By.id('nama')).sendKeys('Test User');
            await driver.findElement(By.id('email')).sendKeys('test@example.com');
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567890');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('Test@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('Test@123457');  // Berbeda
            
            await driver.sleep(500);
            
            const confirmWarning = await driver.findElement(By.id('confirm-warning'));
            const isDisplayed = await confirmWarning.isDisplayed();
            
            expect(isDisplayed).toBe(true);
        }, 30000);

        test('UC-REG-011: User mengisi email dengan format tidak valid', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            await driver.findElement(By.id('nama')).sendKeys('Test User');
            await driver.findElement(By.id('email')).sendKeys('invalid-email');  // Format salah
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567890');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('Test@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('Test@123456');

            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // HTML5 email validation
            const emailField = await driver.findElement(By.id('email'));
            const isValid = await driver.executeScript("return arguments[0].checkValidity();", emailField);
            
            expect(isValid).toBe(false);
        }, 30000);
    });

    describe('UI/UX Testing', () => {
        test('UC-REG-012: Verify semua field input tersedia di form', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            const namaField = await driver.findElement(By.id('nama'));
            const emailField = await driver.findElement(By.id('email'));
            const teleponField = await driver.findElement(By.id('no_telepon'));
            const alamatField = await driver.findElement(By.id('alamat'));
            const passwordField = await driver.findElement(By.id('password'));
            const confirmPasswordField = await driver.findElement(By.id('confirm_password'));
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            
            expect(await namaField.isDisplayed()).toBe(true);
            expect(await emailField.isDisplayed()).toBe(true);
            expect(await teleponField.isDisplayed()).toBe(true);
            expect(await alamatField.isDisplayed()).toBe(true);
            expect(await passwordField.isDisplayed()).toBe(true);
            expect(await confirmPasswordField.isDisplayed()).toBe(true);
            expect(await submitButton.isDisplayed()).toBe(true);
        }, 30000);

        test('UC-REG-013: Verify link navigasi ke halaman login tersedia', async () => {
            await driver.get(`${BASE_URL}/register`);
            
            const loginLink = await driver.findElement(By.css('a[href="/login"]'));
            expect(await loginLink.isDisplayed()).toBe(true);
            
            const linkText = await loginLink.getText();
            expect(linkText.toLowerCase()).toContain('login');
        }, 30000);

        test('UC-REG-014: Verify toggle password visibility berfungsi', async () => {
            await driver.get(`${BASE_URL}/register`);
            
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

    describe('Boundary Value Testing', () => {
        test('UC-REG-015: Password dengan tepat 8 karakter (boundary minimum)', async () => {
            const timestamp = Date.now();
            
            await driver.get(`${BASE_URL}/register`);
            
            // Wait for form to be ready
            await driver.wait(until.elementLocated(By.id('nama')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('nama')).sendKeys('Test Boundary');
            await driver.findElement(By.id('email')).sendKeys(`boundary${timestamp}@example.com`);
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567802');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('Test@123'); // Exactly 8 chars
            await driver.findElement(By.id('confirm_password')).sendKeys('Test@123');

            // Use button click instead of form submit
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            await driver.sleep(5000);

            const pageSource = await driver.getPageSource();
            expect(
                pageSource.includes('Registrasi Berhasil') ||
                pageSource.includes('cek email') || 
                pageSource.includes('verifikasi')
            ).toBe(true);
        }, 30000);

        test('UC-REG-016: Email dengan format edge case (subdomain)', async () => {
            const timestamp = Date.now();
            
            await driver.get(`${BASE_URL}/register`);
            
            // Wait for form to be ready
            await driver.wait(until.elementLocated(By.id('nama')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('nama')).sendKeys('Test Subdomain Email');
            await driver.findElement(By.id('email')).sendKeys(`test.user${timestamp}@mail.example.co.id`);
            await driver.findElement(By.id('no_telepon')).sendKeys('081234567803');
            await driver.findElement(By.id('alamat')).sendKeys('Jl. Test');
            await driver.findElement(By.id('password')).sendKeys('Test@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('Test@123456');

            // Use button click instead of form submit
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            await driver.sleep(5000);

            const pageSource = await driver.getPageSource();
            expect(
                pageSource.includes('Registrasi Berhasil') ||
                pageSource.includes('cek email') || 
                pageSource.includes('verifikasi')
            ).toBe(true);
        }, 30000);
    });
});
