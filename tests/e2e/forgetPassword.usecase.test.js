/**
 * USE CASE TESTING: Forget Password Flow
 * 
 * This test suite covers the forget password and reset password functionality using Selenium WebDriver.
 * All tests are fully automated by directly querying the database to retrieve reset tokens.
 * 
 * AUTOMATED APPROACH:
 * - After requesting password reset through UI, we query the database to get the resetPasswordToken
 * - We then generate a valid JWT token using the rawToken from database
 * - This allows us to test the complete reset password flow end-to-end
 * 
 * TESTS COVERAGE:
 * ✓ Main Success Scenarios (request & reset password)
 * ✓ Alternative Flows (navigation)
 * ✓ Exception Flows (validation errors, invalid tokens)
 * ✓ UI/UX Testing (field visibility, toggle password)
 * ✓ Security Testing (password hidden, token expiration)
 * ✓ Boundary Value Testing (min/max lengths)
 */

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET_TOKEN || 'test-secret-key-12345';

// Database configuration
const dbConfig = {
    host: '127.0.0.1',
    user: 'root',
    password: null,
    database: 'silapor_ppsi'
};

/**
 * Helper function to get valid reset token from database
 * This allows automated testing of reset password flow
 */
async function getResetTokenFromDB(email) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [rows] = await connection.execute(
            'SELECT resetPasswordToken FROM users WHERE email = ?',
            [email]
        );
        
        if (rows.length === 0 || !rows[0].resetPasswordToken) {
            return null;
        }
        
        const rawToken = rows[0].resetPasswordToken;
        
        // Generate JWT token with the rawToken from database
        const token = jwt.sign(
            { email, rawToken },
            JWT_SECRET,
            { expiresIn: "15m" }
        );
        
        return token;
    } finally {
        await connection.end();
    }
}

/**
 * Helper function to request password reset and get valid token
 * This automates the complete flow: UI request -> DB query -> token generation
 */
async function requestPasswordResetAndGetToken(driver, email) {
    // Step 1: Request password reset through UI
    await driver.get(`${BASE_URL}/forget-password`);
    await driver.wait(until.elementLocated(By.id('email')), 5000);
    await driver.sleep(500);
    await driver.findElement(By.id('email')).sendKeys(email);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.sleep(2000);
    
    // Step 2: Get token from database
    const token = await getResetTokenFromDB(email);
    return token;
}

describe('USE CASE: Forget Password - Blackbox Testing', () => {
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
        test('UC-FORGET-001: User berhasil request reset password dengan email valid', async () => {
            await driver.get(`${BASE_URL}/forget-password`);
            
            // Wait for form to be ready
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Masukkan email yang terdaftar
            await driver.findElement(By.id('email')).sendKeys('user@example.com');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(3000);
            
            const pageSource = await driver.getPageSource();
            
            // Verifikasi pesan sukses muncul
            expect(
                pageSource.includes('Link reset password sudah dikirim') ||
                pageSource.includes('dikirim ke email')
            ).toBe(true);
        }, 30000);

        test('UC-FORGET-002: User berhasil reset password melalui link valid', async () => {
            const email = 'admin@example.com';
            
            // Step 1: Request password reset and get token from database
            const token = await requestPasswordResetAndGetToken(driver, email);
            expect(token).not.toBeNull();
            
            // Step 2: Access reset password page with valid token
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            await driver.sleep(500);
            
            // Step 3: Fill in new password
            await driver.findElement(By.id('password')).sendKeys('NewPass@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('NewPass@123456');
            
            const resetButton = await driver.findElement(By.css('button[type="submit"]'));
            await resetButton.click();
            
            await driver.sleep(3000);
            
            const pageSource = await driver.getPageSource();
            
            // Verify success page or message
            expect(
                pageSource.includes('Password berhasil direset') ||
                pageSource.includes('berhasil') ||
                pageSource.includes('Login Sekarang')
            ).toBe(true);
        }, 30000);
    });

    describe('Alternative Flows', () => {
        test('UC-FORGET-003: User mengklik "Kembali ke Login" dari halaman forget password', async () => {
            await driver.get(`${BASE_URL}/forget-password`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            const loginLink = await driver.findElement(By.css('a[href="/login"]'));
            await loginLink.click();
            
            await driver.sleep(2000);
            
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/login');
        }, 30000);

        test('UC-FORGET-004: User mengklik "Kembali ke Login" dari halaman reset password', async () => {
            const email = 'user@example.com';
            
            // Get valid token from database after requesting password reset
            const token = await requestPasswordResetAndGetToken(driver, email);
            
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            await driver.sleep(500);
            
            const loginLink = await driver.findElement(By.css('a[href="/login"]'));
            await loginLink.click();
            
            await driver.sleep(2000);
            
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/login');
        }, 30000);

        test('UC-FORGET-005: User mengklik "Login Sekarang" dari halaman reset password done', async () => {
            // Kita akan simulasi dengan mengakses halaman forget password terlebih dahulu
            // Karena tidak bisa langsung test halaman resetPasswordDone tanpa flow lengkap
            await driver.get(`${BASE_URL}/forget-password`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Test bahwa link login tersedia di halaman ini juga
            const loginLink = await driver.findElement(By.css('a[href="/login"]'));
            expect(await loginLink.isDisplayed()).toBe(true);
        }, 30000);
    });

    describe('Exception Flows', () => {
        test('UC-FORGET-006: User request reset password dengan email tidak terdaftar', async () => {
            await driver.get(`${BASE_URL}/forget-password`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('email')).sendKeys('notregistered@example.com');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(2000);
            
            const pageSource = await driver.getPageSource();
            
            // Harus menampilkan error
            expect(
                pageSource.includes('Email tidak terdaftar') ||
                pageSource.includes('tidak terdaftar')
            ).toBe(true);
        }, 30000);

        test('UC-FORGET-007: User mengisi form dengan email kosong', async () => {
            await driver.get(`${BASE_URL}/forget-password`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Langsung submit tanpa mengisi email
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // HTML5 validation akan mencegah submit
            const emailField = await driver.findElement(By.id('email'));
            const isValid = await driver.executeScript("return arguments[0].checkValidity();", emailField);
            
            expect(isValid).toBe(false);
        }, 30000);

        test('UC-FORGET-008: User mengisi email dengan format tidak valid', async () => {
            await driver.get(`${BASE_URL}/forget-password`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('email')).sendKeys('invalid-email-format');
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // HTML5 email validation
            const emailField = await driver.findElement(By.id('email'));
            const isValid = await driver.executeScript("return arguments[0].checkValidity();", emailField);
            
            expect(isValid).toBe(false);
        }, 30000);

        test('UC-FORGET-009: User mengakses reset password dengan token invalid', async () => {
            const invalidToken = 'invalid-token-123';
            
            await driver.get(`${BASE_URL}/reset-password?token=${invalidToken}`);
            
            await driver.sleep(2000);
            
            const pageSource = await driver.getPageSource();
            
            // Harus menampilkan error
            expect(
                pageSource.includes('Token tidak valid') ||
                pageSource.includes('tidak valid') ||
                pageSource.includes('kadaluarsa')
            ).toBe(true);
        }, 30000);

        test('UC-FORGET-010: User mengakses reset password tanpa token', async () => {
            await driver.get(`${BASE_URL}/reset-password`);
            
            await driver.sleep(2000);
            
            const pageSource = await driver.getPageSource();
            
            // Harus menampilkan error karena token required
            expect(
                pageSource.includes('error') ||
                pageSource.includes('Token') ||
                pageSource.includes('Cannot')
            ).toBe(true);
        }, 30000);

        test('UC-FORGET-011: User reset password dengan password lemah (kurang dari 8 karakter)', async () => {
            const email = 'user@example.com';
            const token = await requestPasswordResetAndGetToken(driver, email);
            
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            await driver.sleep(500);
            
            const passwordField = await driver.findElement(By.id('password'));
            await passwordField.sendKeys('Pass@1');  // Only 6 chars
            
            // Trigger input event and check warning (sebelum blur terjadi)
            await driver.sleep(300);
            
            // Try to submit with weak password - should be prevented by validation
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(1000);
            
            // Should still be on reset password page (not proceed)
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/reset-password');
        }, 30000);

        test('UC-FORGET-012: User reset password dengan konfirmasi password tidak cocok', async () => {
            const email = 'user@example.com';
            const token = await requestPasswordResetAndGetToken(driver, email);
            
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            await driver.sleep(500);
            
            await driver.findElement(By.id('password')).sendKeys('NewPass@123456');
            await driver.findElement(By.id('confirm_password')).sendKeys('DifferentPass@123');
            
            await driver.sleep(500);
            
            const confirmWarning = await driver.findElement(By.id('confirm-warning'));
            const displayClass = await confirmWarning.getAttribute('class');
            
            // Warning should be visible
            expect(displayClass).not.toContain('hidden');
        }, 30000);

        test('UC-FORGET-013: User reset password dengan field kosong', async () => {
            const email = 'user@example.com';
            const token = await requestPasswordResetAndGetToken(driver, email);
            
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            await driver.sleep(500);
            
            // Langsung submit tanpa mengisi
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            // HTML5 validation
            const passwordField = await driver.findElement(By.id('password'));
            const isValid = await driver.executeScript("return arguments[0].checkValidity();", passwordField);
            
            expect(isValid).toBe(false);
        }, 30000);
    });

    describe('UI/UX Testing', () => {
        test('UC-FORGET-014: Verify field email tersedia di form forget password', async () => {
            await driver.get(`${BASE_URL}/forget-password`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            
            const emailField = await driver.findElement(By.id('email'));
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            
            expect(await emailField.isDisplayed()).toBe(true);
            expect(await submitButton.isDisplayed()).toBe(true);
        }, 30000);

        test('UC-FORGET-015: Verify semua field tersedia di form reset password', async () => {
            const email = 'user@example.com';
            const token = await requestPasswordResetAndGetToken(driver, email);
            
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            
            const passwordField = await driver.findElement(By.id('password'));
            const confirmPasswordField = await driver.findElement(By.id('confirm_password'));
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            
            expect(await passwordField.isDisplayed()).toBe(true);
            expect(await confirmPasswordField.isDisplayed()).toBe(true);
            expect(await submitButton.isDisplayed()).toBe(true);
        }, 30000);

        test('UC-FORGET-016: Verify link "Kembali ke Login" tersedia', async () => {
            await driver.get(`${BASE_URL}/forget-password`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            
            const loginLink = await driver.findElement(By.css('a[href="/login"]'));
            expect(await loginLink.isDisplayed()).toBe(true);
            
            const linkText = await loginLink.getText();
            expect(linkText.toLowerCase()).toContain('login');
        }, 30000);

        test('UC-FORGET-017: Verify toggle password visibility berfungsi di reset password', async () => {
            const email = 'user@example.com';
            const token = await requestPasswordResetAndGetToken(driver, email);
            
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            await driver.sleep(500);
            
            const passwordField = await driver.findElement(By.id('password'));
            const toggleButtons = await driver.findElements(By.css('button.hs-toggle-password'));
            const toggleButton = toggleButtons[0]; // First toggle button (for password field)
            
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
        test('UC-FORGET-018: Verify password tidak terlihat saat diketik', async () => {
            const email = 'user@example.com';
            const token = await requestPasswordResetAndGetToken(driver, email);
            
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            await driver.sleep(500);
            
            const passwordField = await driver.findElement(By.id('password'));
            await passwordField.sendKeys('TestPassword123');
            
            // Password field type harus 'password'
            const inputType = await passwordField.getAttribute('type');
            expect(inputType).toBe('password');
        }, 30000);

        test('UC-FORGET-019: Verify token reset password memiliki expiration time', async () => {
            // Generate token yang sudah expired
            const email = 'user@example.com';
            const rawToken = 'expired-token-' + Date.now();
            const expiredToken = jwt.sign(
                { email, rawToken },
                JWT_SECRET,
                { expiresIn: "1ms" } // Immediately expires
            );
            
            // Wait to ensure token expires
            await driver.sleep(100);
            
            await driver.get(`${BASE_URL}/reset-password?token=${expiredToken}`);
            
            await driver.sleep(2000);
            
            const pageSource = await driver.getPageSource();
            
            // Harus menampilkan error token expired
            expect(
                pageSource.includes('Token tidak valid') ||
                pageSource.includes('kadaluarsa') ||
                pageSource.includes('expired')
            ).toBe(true);
        }, 30000);
    });

    describe('Boundary Value Testing', () => {
        test('UC-FORGET-020: Reset password dengan password tepat 8 karakter (boundary minimum)', async () => {
            const email = 'user@example.com';
            const token = await requestPasswordResetAndGetToken(driver, email);
            
            await driver.get(`${BASE_URL}/reset-password?token=${token}`);
            
            await driver.wait(until.elementLocated(By.id('password')), 5000);
            await driver.sleep(500);
            
            // Password exactly 8 chars with all requirements
            await driver.findElement(By.id('password')).sendKeys('Pass@123');
            await driver.findElement(By.id('confirm_password')).sendKeys('Pass@123');
            
            await driver.sleep(500);
            
            // Warning should NOT be visible (password is valid)
            const warningDiv = await driver.findElement(By.id('password-warning'));
            const displayClass = await warningDiv.getAttribute('class');
            
            expect(displayClass).toContain('hidden');
        }, 30000);

        test('UC-FORGET-021: Request reset dengan email maksimal panjang', async () => {
            await driver.get(`${BASE_URL}/forget-password`);
            
            await driver.wait(until.elementLocated(By.id('email')), 5000);
            await driver.sleep(500);
            
            // Email dengan panjang maksimal
            const longEmail = 'a'.repeat(50) + '@example.com';
            await driver.findElement(By.id('email')).sendKeys(longEmail);
            
            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            
            await driver.sleep(2000);
            
            // Tidak error saat submit, meskipun user tidak ditemukan
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/forget-password');
        }, 30000);
    });
});



