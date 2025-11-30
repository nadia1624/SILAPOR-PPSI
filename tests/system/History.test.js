const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');  
const assert = require('assert');

// =====================
// KONFIGURASI SISTEM
// =====================
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 15000;
const ADMIN_EMAIL = 'admin@silapor.com';
const ADMIN_PASSWORD = 'admin123';

describe('SYSTEM TESTING: Riwayat Laporan Selesai (Admin)', () => {
    let driver;

    // Setup browser sebelum semua test
    beforeAll(async () => {
        const service = new ServiceBuilder(chromedriver.path);
        const options = new chrome.Options()
            .addArguments('--headless=new')
            .addArguments('--no-sandbox')
            .addArguments('--disable-dev-shm-usage')
            .addArguments('--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();
    }, 45000);

    // Tutup browser setelah semua test selesai
    afterAll(async () => {
        if (driver) await driver.quit();
    });

    // Login sebelum setiap test jika belum login
    beforeEach(async () => {
        const currentUrl = await driver.getCurrentUrl().catch(() => '');
        if (!currentUrl.includes('/admin/')) {
            await driver.get(`${BASE_URL}/login`);
            await driver.wait(until.elementLocated(By.id('email')), TIMEOUT);

            await driver.findElement(By.id('email')).sendKeys(ADMIN_EMAIL);
            await driver.findElement(By.id('password')).sendKeys(ADMIN_PASSWORD);
            await driver.findElement(By.css('button[type="submit"]')).click();

            await driver.wait(until.urlContains('/admin'), 10000);
        }
    }, TIMEOUT);

    // ========================================================
    // TEST UTAMA: BUKA HALAMAN RIWAYAT LAPORAN SELESAI
    // ========================================================
    test('UC-HISTORY-001: Should open /admin/history successfully', async () => {
        await driver.get(`${BASE_URL}/admin/history`);
        await driver.wait(until.urlIs(`${BASE_URL}/admin/history`), TIMEOUT);

        const pageContent = await driver.findElement(By.tagName('body')).getText();
        expect(pageContent.length).toBeGreaterThan(20); // minimal halaman tampil
        expect(pageContent).toContain('Riwayat'); // sesuaikan dengan judul tabel/halaman
    }, 20000);

    // ========================================================
    // TAMBAHAN: BUKA DETAIL LAPORAN (Jika tersedia tombol "Detail")
    // ========================================================
    test('UC-HISTORY-002: Should open detail report if available', async () => {
        await driver.get(`${BASE_URL}/admin/history`);

        // Pastikan ada tombol Detail
        const detailButtons = await driver.findElements(By.xpath("//button[contains(text(),'Detail')]"));
        if (detailButtons.length > 0) {
            await detailButtons[0].click();

            await driver.wait(until.urlContains('/admin/history/'), 10000);
            const detailPage = await driver.findElement(By.tagName('body')).getText();
            expect(detailPage).toContain('Detail');
        } else {
            console.log("⚠️ Tidak ada data laporan untuk dites (skipping UC-HISTORY-002)");
        }
    }, 25000);

    // ========================================================
    // TEST DOWNLOAD PDF (Jika ada tombol download)
    // ========================================================
    test('UC-HISTORY-003: Should click download PDF button', async () => {
        await driver.get(`${BASE_URL}/admin/history`);

        const downloadButtons = await driver.findElements(By.xpath("//button[contains(text(),'Download')]"));
        if (downloadButtons.length > 0) {
            await downloadButtons[0].click();
            console.log("📄 Download PDF button clicked (tidak bisa verifikasi file via Selenium)");
        } else {
            console.log("⚠️ Tidak ada file PDF yang bisa di-download (skipping test)");
        }
    }, 20000);
});
