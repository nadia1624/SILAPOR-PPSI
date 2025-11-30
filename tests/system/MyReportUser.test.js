const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const fs = require('fs');
const path = require('path');

// --- Konfigurasi ---
const BASE_URL = 'http://localhost:3000';

// PERBAIKAN URL DISINI (Sesuai mahasiswaRoute.js)
const USER_FORM_URL = `${BASE_URL}/mahasiswa/reports`; 
const USER_MY_REPORTS_URL = `${BASE_URL}/mahasiswa/my-reports`;

// Kredensial Mahasiswa
const USER_CREDENTIALS = {
    email: 'nadyadearihanifah@gmail.com', 
    password: 'Nadia123_'
};

const TEST_DATA = {
    judul: 'Laptop Hilang (Test User)',
    lokasi: 'Perpustakaan Lt. 2',
    deskripsi: 'Ini adalah laporan otomatis dari testing user.',
    judul_edit: 'Laptop Hilang (Diedit User)',
    lokasi_edit: 'Perpustakaan Lt. 2 (Diedit)'
};

const DUMMY_IMG_PATH = path.resolve(__dirname, 'temp_user_test_image.png');

// --- Helper Functions ---

const loginAsUser = async (driver) => {
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.name('email')), 10000);
    await driver.findElement(By.name('email')).sendKeys(USER_CREDENTIALS.email);
    await driver.findElement(By.name('password')).sendKeys(USER_CREDENTIALS.password);
    
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await driver.executeScript("arguments[0].click();", submitBtn);
    
    // Tunggu redirect ke area mahasiswa (bisa /home atau /my-reports tergantung controller)
    await driver.wait(until.urlContains('/mahasiswa'), 15000);
};

// Helper untuk klik elemen yang robust
const jsClick = async (driver, locator) => {
    const element = await driver.wait(until.elementLocated(locator), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", element);
    await driver.sleep(500); 
    await driver.executeScript("arguments[0].click();", element);
};

// --- TEST SUITE ---
describe('SYSTEM TESTING: Mahasiswa My Reports (CRUD)', () => {
    let driver;

    // 1. Setup Driver & Dummy File
    beforeAll(async () => {
        // Buat file dummy
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
        
        await loginAsUser(driver);
    }, 60000);

    // 2. Cleanup
    afterAll(async () => {
        if (driver) await driver.quit();
        if (fs.existsSync(DUMMY_IMG_PATH)) {
            fs.unlinkSync(DUMMY_IMG_PATH);
        }
    });

    // --- TEST CASES ---

    test('0. Setup: Mahasiswa membuat laporan baru (Create)', async () => {
        // Navigasi ke Form Laporan
        await driver.get(USER_FORM_URL);
        
        // Verifikasi kita benar-benar ada di halaman form (cari input judul)
        try {
            await driver.wait(until.elementLocated(By.name('nama_barang')), 10000);
        } catch (error) {
            console.error(`Gagal memuat form di ${USER_FORM_URL}. Pastikan route benar.`);
            throw error;
        }

        // Isi Form
        // Cek apakah ada elemen select 'jenis_laporan' (jika ada)
        try {
            await driver.findElement(By.name('jenis_laporan')).sendKeys('Kehilangan');
        } catch (e) {
            // Jika tidak ada (mungkin hidden input atau default), abaikan
        }

        await driver.findElement(By.name('nama_barang')).sendKeys(TEST_DATA.judul);
        
        // Handle variasi nama input lokasi
        try {
            await driver.findElement(By.name('lokasi_kejadian')).sendKeys(TEST_DATA.lokasi);
        } catch (e) {
            await driver.findElement(By.name('lokasi')).sendKeys(TEST_DATA.lokasi);
        }

        // Handle input tanggal
        try {
            const dateInput = await driver.findElement(By.name('tanggal_kejadian'));
            await driver.executeScript("arguments[0].value = '2025-02-01';", dateInput);
        } catch (e) { /* ignore */ }

        await driver.findElement(By.name('deskripsi')).sendKeys(TEST_DATA.deskripsi);
        
        // Upload gambar (Coba 'foto_barang' lalu 'bukti')
        try {
            await driver.findElement(By.name('foto_barang')).sendKeys(DUMMY_IMG_PATH);
        } catch (e) {
             await driver.findElement(By.name('bukti')).sendKeys(DUMMY_IMG_PATH);
        }

        // Submit
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].click();", submitBtn);

        // Verifikasi redirect
        await driver.wait(until.urlContains('/mahasiswa/my-reports'), 20000);
        
    }, 40000);

    test('1. Mahasiswa dapat Melihat Daftar Laporan Saya (Read List)', async () => {
        await driver.get(USER_MY_REPORTS_URL);
        
        // Refresh untuk memastikan data terbaru tampil
        await driver.navigate().refresh();
        await driver.sleep(2000);

        const bodyText = await driver.findElement(By.tagName('body')).getText();
        expect(bodyText).toContain(TEST_DATA.judul);
    });

    test('2. Mahasiswa dapat Melihat Detail Laporan Saya (Read Detail)', async () => {
        await driver.get(USER_MY_REPORTS_URL);
        await driver.sleep(1000);

        // Cari tombol 'Detail' pada kartu laporan yang sesuai
        const detailBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Detail')]`);
        await jsClick(driver, detailBtnSelector);

        // Verifikasi Modal Muncul
        const modal = await driver.wait(until.elementLocated(By.id('detailReportModal')), 5000);
        await driver.wait(until.elementIsVisible(modal), 5000);

        // --- PERBAIKAN DI SINI ---
        // Tunggu sejenak agar animasi selesai dan teks di-render oleh JS
        await driver.sleep(1000); 
        
        // Ambil elemen judul
        const namaElement = await driver.findElement(By.id('detail-nama-barang'));
        
        // Tunggu secara eksplisit sampai teks di dalam elemen tersebut SAMA dengan judul yang diharapkan
        await driver.wait(until.elementTextIs(namaElement, TEST_DATA.judul), 5000);

        const modalNama = await namaElement.getText();
        expect(modalNama).toBe(TEST_DATA.judul);

        // Tutup Modal
        const closeBtn = await modal.findElement(By.xpath(".//button[contains(., 'Tutup')]"));
        await driver.executeScript("arguments[0].click();", closeBtn);
        await driver.sleep(1000);
    }, 20000);

    test('3. Mahasiswa dapat Mengedit Laporan Saya (Update)', async () => {
        await driver.get(USER_MY_REPORTS_URL);
        await driver.sleep(1000);

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

        await driver.sleep(2000); // Tunggu reload

        const bodyText = await driver.findElement(By.tagName('body')).getText();
        expect(bodyText).toContain(TEST_DATA.judul_edit);
    }, 20000);

    test('4. Mahasiswa dapat Menghapus Laporan Saya (Delete)', async () => {
        await driver.get(USER_MY_REPORTS_URL);
        await driver.sleep(1000);

        // Cari item yang SUDAH DIEDIT
        const deleteBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul_edit}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Hapus')]`);
        await jsClick(driver, deleteBtnSelector);

        // SweetAlert Konfirmasi
        const confirmBtn = await driver.wait(until.elementLocated(By.css('.swal2-confirm')), 5000);
        await driver.executeScript("arguments[0].click();", confirmBtn);

        // Tunggu Ikon Sukses (Tanda berhasil)
        await driver.wait(until.elementLocated(By.css('.swal2-icon-success')), 15000);

        // Klik OK
        const okBtn = await driver.findElement(By.css('.swal2-confirm'));
        await driver.sleep(500);
        await driver.executeScript("arguments[0].click();", okBtn);

        // Verifikasi
        await driver.sleep(2000);
        const bodyText = await driver.findElement(By.tagName('body')).getText();
        expect(bodyText).not.toContain(TEST_DATA.judul_edit);
    }, 30000); 
});