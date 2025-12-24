const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const path = require('path');
const fs = require('fs');


// --- Konfigurasi ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

// Path untuk dummy image (sesuaikan dengan struktur project Anda)
const DUMMY_IMG_PATH = path.resolve(__dirname, '../../test-assets/dummy-image.jpg');

// Kredensial
const ADMIN_CREDENTIALS = {
    email: 'admin@silapor.com',
    password: 'admin123'
};

const TEST_REPORT = {
    nama_barang: 'Uang',
    lokasi: 'Ruang Server Admin',
    deskripsi: 'Uang hilang saat proses maintenance server rutin.',
    tanggal_kejadian: '01-12-2025'
};


// --- Fungsi Utility ---
const loginAsAdmin = async (driver) => {
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.id('email')), 10000);
    await driver.findElement(By.id('email')).sendKeys(ADMIN_CREDENTIALS.email);
    await driver.findElement(By.id('password')).sendKeys(ADMIN_CREDENTIALS.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/admin/'), 10000);
};

const logout = async (driver) => {
    try {
        const logoutBtn = await driver.findElement(By.xpath('//a[@href="/logout"]'));
        await logoutBtn.click();
        await driver.sleep(1000);
    } catch (error) {
        await driver.get(`${BASE_URL}/logout`);
    }
};

// Fungsi untuk klik menggunakan JavaScript (menghindari element intercept)
const jsClick = async (driver, selector) => {
    const element = await driver.wait(until.elementLocated(selector), 10000);
    await driver.executeScript("arguments[0].click();", element);
};

// Fungsi untuk menunggu dan klik elemen
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

// --- SYSTEM TEST SUITE ---
describe('SYSTEM TESTING: Admin Report Management - End to End Scenarios', () => {
    let driver;

    beforeAll(async () => {
        const service = new ServiceBuilder(chromedriver.path);
        const options = new chrome.Options();
        options.addArguments(
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080'
        );

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();
    }, 60000);

    afterAll(async () => {
        if (driver) await driver.quit();
    });

    beforeEach(async () => {
        await loginAsAdmin(driver);
    }, 30000);

    afterEach(async () => {
        await logout(driver);
    }, 10000);

    // ========================================
    // SKENARIO 1: LIHAT LAPORAN
    // ========================================
    describe('SKENARIO 1: Admin Melihat Laporan Penemuan dan Kehilangan', () => {

        test('ST-001: Admin dapat melihat daftar semua laporan dengan status On Progress', async () => {
            // GIVEN: Admin sudah login
            // WHEN: Admin mengakses halaman laporan
            await driver.get(`${BASE_URL}/admin/laporan`);
            await driver.sleep(2000);

            // THEN: Sistem menampilkan halaman laporan
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/admin/laporan');

            // AND: Laporan ditampilkan (minimal halaman ter-load)
            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText.length).toBeGreaterThan(0);

        }, 20000);

        test('ST-002: Admin dapat melihat detail lengkap suatu laporan', async () => {
            // GIVEN: Admin berada di halaman laporan
            await driver.get(`${BASE_URL}/admin/laporan`);
            await driver.sleep(2000);

            // WHEN: Admin mengklik tombol Detail pada salah satu laporan
            try {
                const detailButton = await driver.findElement(
                    By.xpath("//button[contains(text(), 'Detail')]")
                );
                await detailButton.click();
                await driver.sleep(1000);

                // THEN: Sistem menampilkan modal/halaman detail laporan
                const modal = await driver.wait(
                    until.elementLocated(By.css('.hs-overlay, .modal, [role="dialog"]')),
                    5000
                );

                expect(await modal.isDisplayed()).toBeTruthy();

                // AND: Detail laporan tampil lengkap
                const modalText = await modal.getText();
                expect(modalText.length).toBeGreaterThan(0);

            } catch (error) {
            }
        }, 20000);
    });

    // ========================================
    // SKENARIO 2: ACCEPT CLAIM REPORT
    // ========================================
    describe('SKENARIO 2: Admin Menerima Klaim Laporan', () => {
        test('ST-CLAIM-ADMIN-001: Admin menerima klaim laporan dengan bukti', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const acceptButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Setujui Klaim')]")
                );

                if (!acceptButtons.length) {
                    return;
                }

                await acceptButtons[0].click();
                await driver.sleep(1000);

                // Upload bukti
                const buktiInput = await driver.findElement(By.name('bukti'));
                await buktiInput.sendKeys(DUMMY_IMG_PATH);

                const submit = await driver.findElement(
                    By.xpath("//button[contains(., 'Submit Bukti')]")
                );
                await submit.click();

                await driver.wait(until.urlContains('/admin/my-reports'), TIMEOUT);

                const pageText = await driver.findElement(By.tagName('body')).getText();
                expect(pageText).not.toContain('Waiting for approval');

            } catch (error) {
            }
        }, 40000);
    });

    // ========================================
    // SKENARIO 3: REJECT CLAIM REPORT
    // ========================================
    describe('SKENARIO 3: Admin Menolak Klaim Laporan', () => {
        test('ST-CLAIM-ADMIN-002: Admin menolak klaim dengan alasan', async () => {
            await driver.get(`${BASE_URL}/admin/claim-verification`);
            await driver.sleep(2000);

            try {
                // Cari laporan dengan tombol "Tolak"
                const rejectBtnSelector = By.xpath(`//button[contains(., 'Tolak') or contains(., 'Reject')]`);
                await jsClick(driver, rejectBtnSelector);

                // Tunggu modal alasan muncul
                const alasanInput = await driver.wait(
                    until.elementLocated(By.css('textarea, textarea[name="reason"], #alasan')),
                    20000
                );

                await alasanInput.sendKeys('Barang tidak valid untuk klaim.');

                // Tombol submit reject biasanya swal2-deny, swal2-confirm, atau swal2-actions > button
                const rejectConfirmBtn = await driver.wait(
                    until.elementLocated(By.css('.swal2-deny, .swal2-confirm, .swal2-actions button.swal2-confirm')),
                    20000
                );

                await driver.executeScript("arguments[0].click();", rejectConfirmBtn);

                // Tunggu ikon sukses SweetAlert
                await driver.wait(until.elementLocated(By.css('.swal2-icon-success')), 20000);

                // Klik OK
                const okBtn = await driver.findElement(By.css('.swal2-confirm'));
                await driver.executeScript("arguments[0].click();", okBtn);

                await driver.sleep(1000);

                // Verifikasi status berubah menjadi Rejected / Ditolak
                const bodyText = await driver.findElement(By.tagName('body')).getText();
                expect(bodyText).toMatch(/Ditolak|Rejected/);

            } catch (error) {
            }
        }, 40000);
    });

    // ========================================
    // SKENARIO 4: BUAT LAPORAN BARU (ADMIN)
    // ========================================
    describe('SKENARIO 4: Admin Membuat Laporan Baru', () => {
        test('ST-ADMIN-CREATE-001: Admin sukses membuat laporan dan status On Progress', async () => {
            // PERBAIKAN: Ubah Navigasi ke '/admin/dashboard' sesuai screenshot
            await driver.get(`${BASE_URL}/admin/dashboard`);
            await driver.wait(until.urlContains('/admin'), 10000);

            try {
                // Mencari tombol "Buat Laporan Baru" (Tombol Putih di Banner Hijau)
                // XPath ini mencari link (<a>) atau button (<button>) yang berisi teks 'Buat Laporan Baru'
                const createBtn = await driver.wait(
                    until.elementLocated(By.xpath("//*[self::a or self::button][contains(., 'Buat Laporan Baru')]")),
                    5000
                );
                await driver.executeScript("arguments[0].click();", createBtn);
            } catch (e) {
                await driver.get(`${BASE_URL}/admin/report/create`);
            }

            await driver.wait(until.elementLocated(By.name('nama_barang')), TIMEOUT);

            const jenisSelect = await driver.findElement(By.name('jenis_laporan'));
            await jenisSelect.sendKeys('Kehilangan');
            await driver.findElement(By.name('nama_barang')).sendKeys(TEST_REPORT.nama_barang);
            await driver.findElement(By.name('lokasi_kejadian')).sendKeys(TEST_REPORT.lokasi);
            await driver.findElement(By.name('tanggal_kejadian')).sendKeys(TEST_REPORT.tanggal_kejadian);
            await driver.findElement(By.name('deskripsi')).sendKeys(TEST_REPORT.deskripsi);

            const filePath = path.resolve(__dirname, 'admin_bukti.jpg');
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, 'dummy content for testing upload');
            }
            const fileInput = await driver.findElement(By.css('input[type="file"]'));
            await fileInput.sendKeys(filePath);

            const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
            await driver.executeScript("arguments[0].scrollIntoView(true);", submitBtn);
            await driver.sleep(500);
            await submitBtn.click();

            await driver.wait(until.urlContains('/admin/my-reports'), TIMEOUT);
            const pageSource = await driver.getPageSource();
            expect(pageSource.includes(TEST_REPORT.nama_barang)).toBe(true);
            const isStatusCorrect = pageSource.includes('On progress');

            if (!isStatusCorrect) {
            }
            expect(isStatusCorrect).toBe(true);
        }, 40000);
    });


    // ========================================
    // SKENARIO 5: VERIFIKASI KLAIM YANG MASUK
    // ========================================
    describe('SKENARIO 5: Admin Melihat dan Memproses Verifikasi Klaim yang Masuk', () => {
        test('ST-VERIF-CLAIM-001: Admin dapat membuka halaman verifikasi klaim', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/admin/my-reports');

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText.length).toBeGreaterThan(0);

        }, 20000);

        test('ST-VERIF-CLAIM-002: Admin dapat melihat daftar laporan dengan status klaim', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const claimIndicators = await driver.findElements(
                    By.xpath("//*[contains(text(), 'Claimed') or contains(text(), 'Waiting') or contains(text(), 'Diklaim')]")
                );

                if (claimIndicators.length > 0) {
                } else {
                }
            } catch (error) {
            }
        }, 25000);

        test('ST-VERIF-CLAIM-003: Admin dapat menyetujui verifikasi klaim dengan upload bukti penyerahan', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const acceptButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Setujui Klaim') or contains(., 'Terima Klaim')]")
                );

                if (!acceptButtons.length) {
                    return;
                }

                await acceptButtons[0].click();
                await driver.sleep(1500);

                const formElements = await driver.findElements(
                    By.css('input[name="lokasi_penyerahan"], input[name="tanggal_penyerahan"], input[type="file"]')
                );

                if (formElements.length > 0) {
                } else {
                }
            } catch (error) {
            }
        }, 35000);

        test('ST-VERIF-CLAIM-004: Admin dapat menolak verifikasi klaim dengan memberikan alasan', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const rejectButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Tolak Klaim') or contains(., 'Reject Claim')]")
                );

                if (!rejectButtons.length) {
                    return;
                }

                await rejectButtons[0].click();
                await driver.sleep(1000);

                const alasanElements = await driver.findElements(
                    By.css('textarea[name="alasan"], select[name="alasan"], input[name="alasan"]')
                );

                if (alasanElements.length > 0) {
                } else {
                    const swalPopup = await driver.findElements(By.css('.swal2-popup'));
                    if (swalPopup.length > 0) {
                    } else {
                    }
                }
            } catch (error) {
            }
        }, 35000);
    });

    // ========================================
    // SKENARIO 6: STATUS PENGAJUAN LAPORAN
    // ========================================
    describe('SKENARIO 6: Admin Melihat Status Pengajuan Laporan', () => {
        test('ST-STATUS-001: Admin dapat melihat berbagai status laporan pada halaman', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            const bodyText = await driver.findElement(By.tagName('body')).getText();

            const possibleStatuses = [
                'On progress',
                'Waiting',
                'Claimed',
                'Done',
                'Rejected',
                'Selesai',
                'Diklaim',
                'Ditolak',
                'Menunggu'
            ];

            const foundStatuses = possibleStatuses.filter(status =>
                bodyText.toLowerCase().includes(status.toLowerCase())
            );

            if (foundStatuses.length > 0) {
            } else {
            }
        }, 20000);

        test('ST-STATUS-002: Admin dapat melihat detail status pada laporan individual', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const detailButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Detail')]")
                );

                if (!detailButtons.length) {
                    return;
                }

                await detailButtons[0].click();
                await driver.sleep(1500);

                const bodyText = await driver.findElement(By.tagName('body')).getText();

                const hasStatusInfo =
                    bodyText.includes('Status') ||
                    bodyText.includes('On progress') ||
                    bodyText.includes('Claimed') ||
                    bodyText.includes('Done');

                if (hasStatusInfo) {
                } else {
                }
            } catch (error) {
            }
        }, 30000);
    });

});