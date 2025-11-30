const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const fs = require('fs');
const path = require('path');

// --- Konfigurasi ---
const BASE_URL = 'http://localhost:3000';
const ADMIN_FORM_URL = `${BASE_URL}/admin/reports`; 

const ADMIN_CREDENTIALS = {
    email: 'admin@silapor.com', 
    password: 'admin123'
};

const TEST_DATA = {
    judul: 'Barang Test Automation',
    lokasi: 'Gedung Test Center',
    deskripsi: 'Ini adalah laporan otomatis untuk testing CRUD Admin.',
    judul_edit: 'Barang Test Automation (Diedit)',
    lokasi_edit: 'Gedung Test Center (Diedit)'
};

const DUMMY_IMG_PATH = path.resolve(__dirname, 'temp_test_image.png');

// --- Helper Functions ---

const loginAsAdmin = async (driver) => {
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.name('email')), 10000);
    await driver.findElement(By.name('email')).sendKeys(ADMIN_CREDENTIALS.email);
    await driver.findElement(By.name('password')).sendKeys(ADMIN_CREDENTIALS.password);
    
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await driver.executeScript("arguments[0].click();", submitBtn);
    
    await driver.wait(until.urlContains('/admin'), 15000);
};

// Helper untuk klik elemen yang mungkin tertutup atau off-screen
const jsClick = async (driver, locator) => {
    const element = await driver.wait(until.elementLocated(locator), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", element);
    await driver.sleep(500); // Stabilisasi setelah scroll
    await driver.executeScript("arguments[0].click();", element);
};

// --- TEST SUITE ---
describe('SYSTEM TESTING: Admin My Reports (CRUD)', () => {
    let driver;

    // 1. Setup Driver & Dummy File
    beforeAll(async () => {
        if (!fs.existsSync(DUMMY_IMG_PATH)) {
            const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            fs.writeFileSync(DUMMY_IMG_PATH, buffer);
        }

        const service = new ServiceBuilder(chromedriver.path);
        const options = new chrome.Options();
        options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();
            
        await driver.manage().setTimeouts({ implicit: 5000 });
        
        await loginAsAdmin(driver);
    }, 60000);

    // 2. Cleanup
    afterAll(async () => {
        if (driver) await driver.quit();
        if (fs.existsSync(DUMMY_IMG_PATH)) {
            fs.unlinkSync(DUMMY_IMG_PATH);
        }
    });

    // --- TEST CASES ---

    test('0. Setup: Admin membuat laporan baru (Create)', async () => {
        await driver.get(ADMIN_FORM_URL);
        await driver.wait(until.elementLocated(By.name('nama_barang')), 10000);

        await driver.findElement(By.name('jenis_laporan')).sendKeys('Kehilangan');
        await driver.findElement(By.name('nama_barang')).sendKeys(TEST_DATA.judul);
        
        try {
            await driver.findElement(By.name('lokasi_kejadian')).sendKeys(TEST_DATA.lokasi);
        } catch (e) {
            await driver.findElement(By.name('lokasi')).sendKeys(TEST_DATA.lokasi);
        }

        try {
            const dateInput = await driver.findElement(By.name('tanggal_kejadian'));
            await driver.executeScript("arguments[0].value = '2025-01-01';", dateInput);
        } catch (e) { /* ignore */ }

        await driver.findElement(By.name('deskripsi')).sendKeys(TEST_DATA.deskripsi);
        await driver.findElement(By.name('foto_barang')).sendKeys(DUMMY_IMG_PATH);

        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].click();", submitBtn);

        await driver.wait(until.urlContains('/admin/my-reports'), 20000);
    }, 40000);

    test('1. Admin dapat Melihat Daftar Laporan Saya (Read List)', async () => {
        await driver.get(`${BASE_URL}/admin/my-reports`);
        const bodyText = await driver.findElement(By.tagName('body')).getText();
        expect(bodyText).toContain(TEST_DATA.judul);
    });

    test('2. Admin dapat Melihat Detail Laporan Saya (Read Detail)', async () => {
        await driver.get(`${BASE_URL}/admin/my-reports`);
        await driver.sleep(1000);

        // XPath Diperbaiki: Menggunakan (.) daripada text() untuk handle spasi
        const detailBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Detail')]`);
        
        // Gunakan helper click yang lebih robust
        await jsClick(driver, detailBtnSelector);

        // Verifikasi Modal
        const modal = await driver.wait(until.elementLocated(By.id('detailReportModal')), 5000);
        await driver.wait(until.elementIsVisible(modal), 5000);

        const modalNama = await driver.findElement(By.id('detail-nama-barang')).getText();
        expect(modalNama).toBe(TEST_DATA.judul);

        // Tutup Modal
        const closeBtn = await modal.findElement(By.xpath(".//button[contains(., 'Tutup')]"));
        await driver.executeScript("arguments[0].click();", closeBtn);
        await driver.sleep(1000);
    }, 20000);

    test('3. Admin dapat Mengedit Laporan Saya (Update)', async () => {
        await driver.get(`${BASE_URL}/admin/my-reports`);
        await driver.sleep(1000);

        // XPath Diperbaiki
        const editBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Edit')]`);
        await jsClick(driver, editBtnSelector);

        const editModal = await driver.wait(until.elementLocated(By.id('editReportModal')), 5000);
        await driver.wait(until.elementIsVisible(editModal), 5000);

        const inputNama = await driver.findElement(By.id('edit-nama-barang'));
        await inputNama.clear();
        await inputNama.sendKeys(TEST_DATA.judul_edit);

        const inputLokasi = await driver.findElement(By.id('edit-lokasi'));
        await inputLokasi.clear();
        await inputLokasi.sendKeys(TEST_DATA.lokasi_edit);

        const saveBtn = await editModal.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].click();", saveBtn);

        await driver.sleep(2000);

        const bodyText = await driver.findElement(By.tagName('body')).getText();
        expect(bodyText).toContain(TEST_DATA.judul_edit);
    }, 20000);

    test('4. Admin dapat Menghapus Laporan Saya (Delete)', async () => {
        await driver.get(`${BASE_URL}/admin/my-reports`);
        await driver.sleep(1000);

        // 1. Cari tombol Hapus pada item yang SUDAH DIEDIT
        const deleteBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul_edit}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Hapus')]`);
        await jsClick(driver, deleteBtnSelector);

        // 2. SweetAlert Konfirmasi (Dialog Warning)
        const confirmBtn = await driver.wait(until.elementLocated(By.css('.swal2-confirm')), 5000);
        await driver.executeScript("arguments[0].click();", confirmBtn);

        // 3. SweetAlert Sukses (Dialog Berhasil)
        // Tunggu sampai IKON SUKSES muncul. Ini lebih aman daripada mencari struktur tombol spesifik.
        await driver.wait(until.elementLocated(By.css('.swal2-icon-success')), 15000);

        // 4. Klik OK untuk reload
        const okBtn = await driver.findElement(By.css('.swal2-confirm'));
        await driver.sleep(500); // Tunggu animasi SweetAlert selesai
        await driver.executeScript("arguments[0].click();", okBtn);

        // 5. Verifikasi Data Hilang
        await driver.sleep(2000); // Tunggu reload
        const bodyText = await driver.findElement(By.tagName('body')).getText();
        expect(bodyText).not.toContain(TEST_DATA.judul_edit);
    }, 30000); 
});