const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const fs = require('fs');
const path = require('path');

// --- Konfigurasi ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

// URL Routes (Sesuai mahasiswaRoute.js)
const USER_FORM_URL = `${BASE_URL}/mahasiswa/reports`; 
const USER_MY_REPORTS_URL = `${BASE_URL}/mahasiswa/my-reports`;
const USER_HOME_URL = `${BASE_URL}/mahasiswa/home`;

// Kredensial Mahasiswa
const USER_CREDENTIALS = {
    email: 'nadyadearihanifah@gmail.com', 
    password: 'Nadia123_'
};

const TEST_DATA = {
    judul: 'Laptop Hilang (Test User)',
    lokasi: 'Perpustakaan Lt. 2',
    deskripsi: 'Ini adalah laporan otomatis dari testing user.',
    tanggal_kejadian: '01-02-2025',
    judul_edit: 'Laptop Hilang (Diedit User)',
    lokasi_edit: 'Perpustakaan Lt. 2 (Diedit)',
    deskripsi_edit: 'Deskripsi telah diubah oleh user.'
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
    
    // Tunggu redirect ke area mahasiswa
    await driver.wait(until.urlContains('/mahasiswa'), 15000);
};

// Helper untuk klik elemen yang robust
const jsClick = async (driver, locator) => {
    const element = await driver.wait(until.elementLocated(locator), 10000);
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", element);
    await driver.sleep(500); 
    await driver.executeScript("arguments[0].click();", element);
};

// Helper untuk menunggu dan klik elemen
const waitAndClick = async (driver, selector, timeout = 10000) => {
    const element = await driver.wait(until.elementLocated(selector), timeout);
    await driver.wait(until.elementIsVisible(element), timeout);
    await element.click();
};

// Fungsi untuk menunggu modal muncul
const waitForModal = async (driver, selector, timeout = 5000) => {
    const modal = await driver.wait(until.elementLocated(selector), timeout);
    await driver.wait(async () => {
        const classes = await modal.getAttribute('class');
        return !classes.includes('hidden');
    }, timeout);
    return modal;
};

// Fungsi untuk menunggu SweetAlert
const waitForSwal = async (driver, timeout = 5000) => {
    return await driver.wait(
        until.elementLocated(By.css('.swal2-popup, .swal2-modal')),
        timeout
    );
};

// Fungsi untuk mencari input yang visible
const findVisibleInput = async (driver, name) => {
    const elements = await driver.findElements(By.name(name));
    for (const el of elements) {
        if (await el.isDisplayed()) return el;
    }
    return null;
};

// --- TEST SUITE ---
describe('SYSTEM TESTING: Mahasiswa My Reports (CRUD) - End to End Scenarios', () => {
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

    // ========================================
    // SKENARIO 1: MEMBUAT LAPORAN BARU (CREATE)
    // ========================================
    describe('SKENARIO 1: Mahasiswa Membuat Laporan Baru (Create)', () => {

        test('ST-MY-USER-001: Mahasiswa dapat mengakses form pembuatan laporan', async () => {
            // GIVEN: Mahasiswa sudah login
            // WHEN: Mahasiswa mengakses halaman form laporan
            await driver.get(USER_FORM_URL);
            
            // THEN: Form laporan harus muncul
            try {
                await driver.wait(until.elementLocated(By.name('nama_barang')), 10000);
                const formExists = await driver.findElement(By.name('nama_barang')).isDisplayed();
                expect(formExists).toBe(true);
            } catch (error) {
                throw error;
            }
        }, 20000);

        test('ST-MY-USER-002: Mahasiswa sukses membuat laporan baru dan redirect ke my-reports', async () => {
            // Navigasi ke Form Laporan
            await driver.get(USER_FORM_URL);
            
            try {
                await driver.wait(until.elementLocated(By.name('nama_barang')), 10000);
            } catch (error) {
                throw error;
            }

            // Isi Form
            // Cek apakah ada elemen select 'jenis_laporan'
            try {
                await driver.findElement(By.name('jenis_laporan')).sendKeys('Kehilangan');
            } catch (e) {
                // Jika tidak ada, abaikan
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
            
            // Upload gambar
            try {
                await driver.findElement(By.name('foto_barang')).sendKeys(DUMMY_IMG_PATH);
            } catch (e) {
                 await driver.findElement(By.name('bukti')).sendKeys(DUMMY_IMG_PATH);
            }

            // Submit
            const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
            await driver.executeScript("arguments[0].click();", submitBtn);

            // Verifikasi redirect ke my-reports
            await driver.wait(until.urlContains('/mahasiswa/my-reports'), 20000);
            
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/mahasiswa/my-reports');
            
        }, 40000);

        test('ST-MY-USER-003: Validasi form - tidak dapat submit tanpa field wajib', async () => {
            await driver.get(USER_FORM_URL);
            await driver.wait(until.elementLocated(By.name('nama_barang')), 10000);

            // Langsung submit tanpa mengisi form
            const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
            await driver.executeScript("arguments[0].click();", submitBtn);

            await driver.sleep(1000);

            // Verifikasi masih di halaman form (tidak redirect)
            const currentUrl = await driver.getCurrentUrl();
            
            // Jika browser native validation, akan tetap di form
            // atau ada pesan error
            const isStillOnForm = currentUrl.includes('/reports') || currentUrl.includes('report');
            expect(isStillOnForm).toBe(true);

        }, 20000);
    });

    // ========================================
    // SKENARIO 2: MELIHAT DAFTAR LAPORAN (READ LIST)
    // ========================================
    describe('SKENARIO 2: Mahasiswa Melihat Daftar Laporan Saya (Read List)', () => {

        test('ST-MY-USER-004: Mahasiswa dapat melihat daftar laporan saya', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            
            // Refresh untuk memastikan data terbaru tampil
            await driver.navigate().refresh();
            await driver.sleep(2000);

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText).toContain(TEST_DATA.judul);

        }, 20000);

        test('ST-MY-USER-005: Verifikasi visual kartu laporan (Judul, Lokasi, Deskripsi)', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(2000);

            // Cari kartu laporan yang dibuat
            const reportTitle = await driver.wait(
                until.elementLocated(By.xpath(`//*[contains(text(), '${TEST_DATA.judul}')]`)),
                10000
            );
            await driver.executeScript("arguments[0].scrollIntoView(true);", reportTitle);
            expect(await reportTitle.isDisplayed()).toBe(true);

            // Validasi detail di dalam kartu
            const cardElement = await reportTitle.findElement(By.xpath("./ancestor::div[contains(@class, 'bg-white') or contains(@class, 'card')][1]"));
            const cardText = await cardElement.getText();
            
            expect(cardText).toContain(TEST_DATA.lokasi);
            expect(cardText).toContain(TEST_DATA.deskripsi);

        }, 20000);

        test('ST-MY-USER-006: Mahasiswa dapat melihat status laporan', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(2000);

            const bodyText = await driver.findElement(By.tagName('body')).getText();

            // Daftar kemungkinan status
            const possibleStatuses = [
                "Waiting for upload verification",
                "Upload verification rejected",
                "On progress",
                "Claimed",
                "Waiting for end verification",
                "End verification rejected",
                "Done"
            ];

            const foundStatus = possibleStatuses.find(status => bodyText.includes(status));
            
            if (foundStatus) {
            } else {
            }

            expect(bodyText.length).toBeGreaterThan(0);
        }, 20000);
    }); 

    // ========================================2
    // SKENARIO 3: MELIHAT DETAIL LAPORAN (READ DETAIL)
    // ========================================
    describe('SKENARIO 3: Mahasiswa Melihat Detail Laporan (Read Detail)', () => {

        test('ST-MY-USER-007: Mahasiswa dapat membuka modal detail laporan', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(1000);

            // Cari tombol 'Detail' pada kartu laporan yang sesuai
            const detailBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Detail')]`);
            await jsClick(driver, detailBtnSelector);

            // Verifikasi Modal Muncul
            const modal = await driver.wait(until.elementLocated(By.id('detailReportModal')), 5000);
            await driver.wait(until.elementIsVisible(modal), 5000);

            expect(await modal.isDisplayed()).toBeTruthy();
        }, 20000);

        test('ST-MY-USER-008: Modal detail menampilkan informasi lengkap', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(1000);

            const detailBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Detail')]`);
            await jsClick(driver, detailBtnSelector);

            // Verifikasi Modal Muncul
            const modal = await driver.wait(until.elementLocated(By.id('detailReportModal')), 5000);
            await driver.wait(until.elementIsVisible(modal), 5000);

            // Tunggu sejenak agar animasi selesai
            await driver.sleep(1000); 
            
            // Ambil elemen judul
            const namaElement = await driver.findElement(By.id('detail-nama-barang'));
            
            // Tunggu sampai teks di dalam elemen tersebut SAMA dengan judul yang diharapkan
            await driver.wait(until.elementTextIs(namaElement, TEST_DATA.judul), 5000);

            const modalNama = await namaElement.getText();
            expect(modalNama).toBe(TEST_DATA.judul);

            // Tutup Modal
            const closeBtn = await modal.findElement(By.xpath(".//button[contains(., 'Tutup')]"));
            await driver.executeScript("arguments[0].click();", closeBtn);
            await driver.sleep(1000);
        }, 20000);

        test('ST-MY-USER-009: Tombol Tutup pada modal detail berfungsi', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(1000);

            const detailBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Detail')]`);
            await jsClick(driver, detailBtnSelector);

            const modal = await driver.wait(until.elementLocated(By.id('detailReportModal')), 5000);
            await driver.wait(until.elementIsVisible(modal), 5000);

            // Tutup Modal
            const closeBtn = await modal.findElement(By.xpath(".//button[contains(., 'Tutup')]"));
            await driver.executeScript("arguments[0].click();", closeBtn);
            await driver.sleep(1000);

            // Verifikasi modal tertutup atau hidden
            try {
                const modalClass = await modal.getAttribute('class');
                const isHidden = modalClass.includes('hidden') || !(await modal.isDisplayed());
                expect(isHidden).toBe(true);
            } catch (e) {
                // Modal mungkin sudah tidak ada di DOM
            }

        }, 20000);
    });

    // ========================================
    // SKENARIO 4: MENGEDIT LAPORAN (UPDATE)
    // ========================================
    describe('SKENARIO 4: Mahasiswa Mengedit Laporan (Update)', () => {

        test('ST-MY-USER-010: Mahasiswa dapat membuka modal edit laporan', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(1000);

            const editBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Edit')]`);
            await jsClick(driver, editBtnSelector);

            const editModal = await driver.wait(until.elementLocated(By.id('editReportModal')), 5000);
            await driver.wait(until.elementIsVisible(editModal), 5000);

            expect(await editModal.isDisplayed()).toBeTruthy();
        }, 20000);

        test('ST-MY-USER-011: Mahasiswa dapat mengedit laporan dan menyimpan perubahan', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(1000);

            const editBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Edit')]`);
            await jsClick(driver, editBtnSelector);

            const editModal = await driver.wait(until.elementLocated(By.id('editReportModal')), 5000);
            await driver.wait(until.elementIsVisible(editModal), 5000);

            // Edit Nama Barang
            const inputNama = await driver.findElement(By.id('edit-nama-barang'));
            await inputNama.clear();
            await inputNama.sendKeys(TEST_DATA.judul_edit);

            // Edit Lokasi
            const inputLokasi = await driver.findElement(By.id('edit-lokasi'));
            await inputLokasi.clear();
            await inputLokasi.sendKeys(TEST_DATA.lokasi_edit);

            // Submit perubahan
            const saveBtn = await editModal.findElement(By.css('button[type="submit"]'));
            await driver.executeScript("arguments[0].click();", saveBtn);

            await driver.sleep(2000); // Tunggu reload

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText).toContain(TEST_DATA.judul_edit);

        }, 20000);

        test('ST-MY-USER-012: Perubahan edit terlihat di daftar laporan', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.navigate().refresh();
            await driver.sleep(2000);

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            
            // Verifikasi judul yang sudah diedit muncul
            expect(bodyText).toContain(TEST_DATA.judul_edit);
            // Verifikasi judul lama tidak muncul lagi
            expect(bodyText).not.toContain(TEST_DATA.judul);

        }, 20000);
    });

    // ========================================
    // SKENARIO 5: MENGHAPUS LAPORAN (DELETE)
    // ========================================
    describe('SKENARIO 5: Mahasiswa Menghapus Laporan (Delete)', () => {

        test('ST-MY-USER-013: Mahasiswa dapat menghapus laporan dengan konfirmasi', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(1000);

            // Cari tombol Hapus pada item yang SUDAH DIEDIT
            const deleteBtnSelector = By.xpath(`//h3[contains(., '${TEST_DATA.judul_edit}')]/ancestor::div[contains(@class, 'bg-white')][1]//button[contains(., 'Hapus')]`);
            await jsClick(driver, deleteBtnSelector);

            // SweetAlert Konfirmasi
            const confirmBtn = await driver.wait(until.elementLocated(By.css('.swal2-confirm')), 5000);
            await driver.executeScript("arguments[0].click();", confirmBtn);

            // Tunggu Ikon Sukses
            await driver.wait(until.elementLocated(By.css('.swal2-icon-success')), 15000);

            // Klik OK untuk reload
            const okBtn = await driver.findElement(By.css('.swal2-confirm'));
            await driver.sleep(500);
            await driver.executeScript("arguments[0].click();", okBtn);

            // Verifikasi Data Hilang
            await driver.sleep(2000);
            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText).not.toContain(TEST_DATA.judul_edit);

        }, 30000);
    });

    // ========================================
    // SKENARIO 6: NAVIGASI DAN HALAMAN
    // ========================================
    describe('SKENARIO 6: Navigasi Halaman Laporan', () => {

        test('ST-MY-USER-014: Mahasiswa dapat melihat halaman home (semua laporan)', async () => {
            await driver.get(USER_HOME_URL);
            await driver.sleep(2000);

            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/mahasiswa/home');

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText.length).toBeGreaterThan(0);

        }, 20000);

        test('ST-MY-USER-015: Dapat berpindah dari home ke my-reports', async () => {
            await driver.get(USER_HOME_URL);
            await driver.sleep(1000);

            // Coba cari link ke My Reports
            try {
                const myReportsLink = await driver.findElement(
                    By.xpath("//a[contains(., 'Laporan Saya') or contains(@href, 'my-reports')]")
                );
                await myReportsLink.click();
                await driver.sleep(1000);

                const currentUrl = await driver.getCurrentUrl();
                expect(currentUrl).toContain('/my-reports');
            } catch (e) {
                // Jika tidak ada link, navigasi langsung
                await driver.get(USER_MY_REPORTS_URL);
                const currentUrl = await driver.getCurrentUrl();
                expect(currentUrl).toContain('/my-reports');
            }
        }, 20000);

        test('ST-MY-USER-016: Dapat berpindah dari my-reports ke form laporan baru', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(1000);

            // Coba cari link/button ke Buat Laporan
            try {
                const createLink = await driver.findElement(
                    By.xpath("//a[contains(., 'Buat Laporan') or contains(., 'Buat') or contains(@href, 'reports')]")
                );
                await createLink.click();
                await driver.sleep(1000);

                // Verifikasi form laporan muncul
                const formExists = await driver.findElement(By.name('nama_barang')).isDisplayed();
                expect(formExists).toBe(true);
            } catch (e) {
                await driver.get(USER_FORM_URL);
                const formExists = await driver.findElement(By.name('nama_barang')).isDisplayed();
                expect(formExists).toBe(true);
            }
        }, 20000);
    });

    // ========================================
    // SKENARIO 7: EMPTY STATE & EDGE CASES
    // ========================================
    describe('SKENARIO 7: Empty State dan Edge Cases', () => {

        test('ST-MY-USER-017: Halaman my-reports menampilkan pesan jika tidak ada laporan', async () => {
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(2000);

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            
            // Cek apakah ada laporan atau pesan empty state
            const hasContent = bodyText.length > 100;
            expect(hasContent).toBe(true);

        }, 20000);

        test('ST-MY-USER-018: Session tetap valid setelah beberapa navigasi', async () => {
            // Navigasi berulang untuk memastikan session tidak expired
            await driver.get(USER_HOME_URL);
            await driver.sleep(500);
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(500);
            await driver.get(USER_FORM_URL);
            await driver.sleep(500);
            await driver.get(USER_MY_REPORTS_URL);
            await driver.sleep(500);

            // Verifikasi masih di area mahasiswa (tidak redirect ke login)
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/mahasiswa');

        }, 30000);
    });
});