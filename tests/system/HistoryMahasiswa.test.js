const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

jest.setTimeout(120000); // total timeout jest

describe("SYSTEM TESTING: Riwayat Laporan Selesai (Mahasiswa)", () => {
    let driver;
    const BASE_URL = "http://localhost:3000";
    const TIMEOUT = 15000;
    const STUDENT_EMAIL = "2211522022_azizah@student.unand.ac.id";
    const STUDENT_PASSWORD = "Jijah123_";

    // ======================= SETUP DRIVER ==========================
    beforeAll(async () => {
        const service = new ServiceBuilder(chromedriver.path);
        const options = new chrome.Options()
            .addArguments('--headless=new')  // gunakan headless modern
            .addArguments('--no-sandbox')
            .addArguments('--disable-dev-shm-usage')
            .addArguments('--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();

        await driver.manage().setTimeouts({ implicit: 10000 });
    }, 45000);

    // Tutup driver
    afterAll(async () => {
        if (driver) await driver.quit();
    });

    // ========================= LOGIN ============================
    beforeEach(async () => {
        const currentUrl = await driver.getCurrentUrl().catch(() => '');
        if (!currentUrl.includes('/mahasiswa/')) {
            await driver.get(`${BASE_URL}/login`);
            await driver.wait(until.elementLocated(By.id('email')), TIMEOUT);

            await driver.findElement(By.id("email")).sendKeys(STUDENT_EMAIL);
            await driver.findElement(By.id("password")).sendKeys(STUDENT_PASSWORD);
            await driver.findElement(By.css("button[type='submit']")).click();

            await driver.wait(until.urlContains("/mahasiswa/home"), 20000);
        }
    }, TIMEOUT);

    // ======================= TEST 1 ==========================
    test("UC-STUDENT-HISTORY-001: Halaman riwayat laporan tampil", async () => {
        await driver.get(`${BASE_URL}/mahasiswa/history`);
        await driver.wait(until.urlContains("/mahasiswa/history"), TIMEOUT);

        const buttons = await driver.findElements(By.css(".detail-btn"));
        expect(buttons.length).toBeGreaterThan(0);
    }, 20000);

    // ======================= TEST 2 ==========================
    test("UC-STUDENT-HISTORY-002: Menampilkan modal detail laporan", async () => {
        await driver.get(`${BASE_URL}/mahasiswa/history`);
        const button = await driver.findElement(By.css(".detail-btn"));
        await button.click();

        await driver.sleep(1500);
        const modal = await driver.findElement(By.id("detailModal"));
        const isVisible = await modal.isDisplayed();
        expect(isVisible).toBe(true);
    }, 25000);

    // ======================= TEST 3 ==========================
    test("UC-STUDENT-HISTORY-003: Klik tombol download laporan PDF", async () => {
        await driver.get(`${BASE_URL}/mahasiswa/history`);
        const downloadBtn = await driver.findElement(By.css("a.bg-blue-500"));
        await downloadBtn.click();

        await driver.sleep(2000);
        expect(true).toBe(true);
    }, 20000);

});
