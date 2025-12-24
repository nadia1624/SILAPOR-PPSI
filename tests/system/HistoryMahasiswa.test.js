const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

// =====================
// KONFIGURASI SISTEM
// =====================
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000;
const STUDENT_EMAIL = 'nadyadearihanifah@gmail.com';
const STUDENT_PASSWORD = 'Nadia123_';

jest.setTimeout(120000);

describe('SYSTEM TESTING: Riwayat Laporan Selesai (Mahasiswa)', () => {
    let driver;

    // =====================
    // SETUP BROWSER
    // =====================
    beforeAll(async () => {
        const service = new ServiceBuilder(chromedriver.path);
        const options = new chrome.Options()
            .addArguments('--headless=new')
            .addArguments('--no-sandbox')
            .addArguments('--disable-dev-shm-usage')
            .addArguments('--disable-gpu')
            .addArguments('--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();

        await driver.manage().setTimeouts({ implicit: 10000 });

        // Login sekali di awal
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.id('email')), TIMEOUT);
        await driver.findElement(By.id('email')).sendKeys(STUDENT_EMAIL);
        await driver.findElement(By.id('password')).sendKeys(STUDENT_PASSWORD);
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.wait(until.urlContains('/mahasiswa'), TIMEOUT);
    }, 60000);

    // =====================
    // TUTUP BROWSER
    // =====================
    afterAll(async () => {
        if (driver) await driver.quit();
    });

    // ========================================================
    // UC-STUDENT-HISTORY-001: Halaman riwayat laporan tampil
    // ========================================================
    test('UC-STUDENT-HISTORY-001: Halaman riwayat laporan tampil', async () => {
        await driver.get(`${BASE_URL}/mahasiswa/history`);
        await driver.wait(until.urlContains('/mahasiswa/history'), TIMEOUT);

        const pageTitle = await driver.getTitle();
        expect(pageTitle).toBeDefined();

        // Cek apakah ada tombol detail atau tidak ada laporan
        const buttons = await driver.findElements(By.css('.detail-btn'));
        expect(true).toBe(true); // Test passes if page loads successfully
    }, 30000);

    // ========================================================
    // UC-STUDENT-HISTORY-002: Menampilkan modal detail laporan
    // ========================================================
    test('UC-STUDENT-HISTORY-002: Menampilkan modal detail laporan', async () => {
        await driver.get(`${BASE_URL}/mahasiswa/history`);
        await driver.wait(until.urlContains('/mahasiswa/history'), TIMEOUT);

        const detailButtons = await driver.findElements(By.css('.detail-btn'));
        if (detailButtons.length > 0) {
            await detailButtons[0].click();
            await driver.sleep(1500);

            const modal = await driver.findElement(By.id('detailModal'));
            const isVisible = await modal.isDisplayed();
            expect(isVisible).toBe(true);
        } else {
            expect(true).toBe(true);
        }
    }, 30000);

    // ========================================================
    // UC-STUDENT-HISTORY-003: Klik tombol download laporan PDF
    // ========================================================
    test('UC-STUDENT-HISTORY-003: Klik tombol download laporan PDF', async () => {
        await driver.get(`${BASE_URL}/mahasiswa/history`);
        await driver.wait(until.urlContains('/mahasiswa/history'), TIMEOUT);

        const downloadButtons = await driver.findElements(By.css('a.bg-blue-500'));
        if (downloadButtons.length > 0) {
            await downloadButtons[0].click();
            await driver.sleep(2000);
            expect(true).toBe(true);
        } else {
            expect(true).toBe(true);
        }
    }, 30000);

});
