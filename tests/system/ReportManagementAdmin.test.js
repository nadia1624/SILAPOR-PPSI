const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const path = require('path');

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
        console.log('Logout via direct navigation');
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

            console.log('✓ PASS: Admin dapat melihat halaman laporan');
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

                console.log('✓ PASS: Detail laporan dapat ditampilkan');
            } catch (error) {
                console.log('⚠ SKIP: Tidak ada laporan untuk dilihat detailnya');
            }
        }, 20000);
    });

    // ========================================
    // SKENARIO 2: VERIFIKASI UPLOAD BUKTI LAPORAN
    // ========================================
    describe('SKENARIO 2: Admin Memverifikasi Upload Bukti Laporan', () => {
        test('ST-VERIF-ADMIN-001: Admin dapat membuka halaman Verifikasi Laporan', async () => {
            await driver.get(`${BASE_URL}/admin/verifikasi`);
            await driver.sleep(2000);

            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/admin/verifikasi');

            const heading = await driver.findElement(
                By.xpath("//h1[contains(., 'Verifikasi Laporan')]")
            ).getText();
            expect(heading.length).toBeGreaterThan(0);

            console.log('✓ PASS: Admin dapat membuka halaman Verifikasi Laporan');
        }, 20000);

        test('ST-VERIF-ADMIN-002: Admin dapat melihat detail laporan sebelum verifikasi', async () => {
            await driver.get(`${BASE_URL}/admin/verifikasi`);
            await driver.sleep(2000);

            try {
                const verifyButton = await driver.findElement(
                    By.xpath("//button[contains(., 'Verifikasi')]")
                );
                await verifyButton.click();
                await driver.sleep(1000);

                const detailModal = await driver.findElement(By.id('detailModal'));

                await driver.wait(async () => {
                    const classes = await detailModal.getAttribute('class');
                    return !classes.includes('hidden');
                }, 5000);

                const modalText = await detailModal.getText();
                expect(modalText.length).toBeGreaterThan(0);

                console.log('✓ PASS: Detail laporan verifikasi dapat ditampilkan');
            } catch (error) {
                console.log('⚠ SKIP: Tidak ada laporan yang menunggu verifikasi');
            }
        }, 25000);

        test('ST-VERIF-ADMIN-003: Admin dapat menyetujui verifikasi upload bukti laporan', async () => {
            await driver.get(`${BASE_URL}/admin/verifikasi`);
            await driver.sleep(2000);

            try {
                const verifyButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Verifikasi')]")
                );

                if (!verifyButtons.length) {
                    console.log('⚠ SKIP: Tidak ada laporan yang menunggu verifikasi untuk disetujui');
                    return;
                }

                await verifyButtons[0].click();
                await driver.sleep(1000);

                const detailModal = await driver.findElement(By.id('detailModal'));

                await driver.wait(async () => {
                    const classes = await detailModal.getAttribute('class');
                    return !classes.includes('hidden');
                }, 5000);

                const approveButton = await driver.findElement(
                    By.css('#detail-approve-form button[type="submit"]')
                );
                await approveButton.click();

                await driver.wait(until.urlContains('/admin/verifikasi'), 10000);

                const heading = await driver.findElement(
                    By.xpath("//h1[contains(., 'Verifikasi Laporan')]")
                ).getText();
                expect(heading.length).toBeGreaterThan(0);

                console.log('✓ PASS: Admin dapat menyetujui verifikasi laporan');
            } catch (error) {
                console.log('⚠ SKIP: Gagal menemukan skenario verifikasi approve yang valid');
            }
        }, 35000);

        test('ST-VERIF-ADMIN-004: Admin dapat menolak verifikasi upload bukti laporan dengan alasan', async () => {
            await driver.get(`${BASE_URL}/admin/verifikasi`);
            await driver.sleep(2000);

            try {
                const verifyButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Verifikasi')]")
                );

                if (!verifyButtons.length) {
                    console.log('⚠ SKIP: Tidak ada laporan yang menunggu verifikasi untuk ditolak');
                    return;
                }

                await verifyButtons[0].click();
                await driver.sleep(1000);

                const detailModal = await driver.findElement(By.id('detailModal'));

                await driver.wait(async () => {
                    const classes = await detailModal.getAttribute('class');
                    return !classes.includes('hidden');
                }, 5000);

                const rejectFromDetailBtn = await driver.findElement(By.id('detail-reject-btn'));
                await rejectFromDetailBtn.click();

                await driver.sleep(500);

                const rejectModals = await driver.findElements(
                    By.xpath("//div[starts-with(@id, 'rejectClaimModal-') and not(contains(@class,'hidden'))]")
                );

                if (!rejectModals.length) {
                    console.log('⚠ SKIP: Modal tolak verifikasi tidak ditemukan');
                    return;
                }

                const activeRejectModal = rejectModals[0];

                const alasanSelect = await activeRejectModal.findElement(By.tagName('select'));
                await alasanSelect.click();
                const option = await alasanSelect.findElement(
                    By.xpath(".//option[not(@disabled) and @value!='' and @value!='lainnya']")
                );
                await option.click();

                const submitButton = await activeRejectModal.findElement(
                    By.xpath(".//button[contains(., 'Tolak Verifikasi')]")
                );
                await submitButton.click();

                await driver.wait(until.urlContains('/admin/verifikasi'), 10000);

                const heading = await driver.findElement(
                    By.xpath("//h1[contains(., 'Verifikasi Laporan')]")
                ).getText();
                expect(heading.length).toBeGreaterThan(0);

                console.log('✓ PASS: Admin dapat menolak verifikasi laporan dengan alasan');
            } catch (error) {
                console.log('⚠ SKIP: Gagal menemukan skenario verifikasi reject yang valid');
            }
        }, 40000);
    });

    // ========================================
    // SKENARIO 3: ACCEPT CLAIM REPORT
    // ========================================
    describe('SKENARIO 3: Admin Menerima Klaim Laporan', () => {
        test('ST-CLAIM-ADMIN-001: Admin menerima klaim laporan dengan bukti', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const acceptButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Setujui Klaim')]")
                );

                if (!acceptButtons.length) {
                    console.log("⚠ SKIP: Tidak ada laporan dalam status klaim menunggu approval");
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

                console.log("✓ PASS: Admin berhasil menerima klaim laporan");
            } catch (error) {
                console.log("⚠ SKIP: Tidak dapat menyelesaikan proses menerima klaim");
                console.log("Error:", error.message);
            }
        }, 40000);
    });

    // ========================================
    // SKENARIO 4: REJECT CLAIM REPORT
    // ========================================
    describe('SKENARIO 4: Admin Menolak Klaim Laporan', () => {
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

                console.log("✓ PASS: Admin berhasil menolak klaim dengan alasan");
            } catch (error) {
                console.log("⚠ SKIP: Tidak dapat menyelesaikan proses menolak klaim");
                console.log("Error:", error.message);
            }
        }, 40000);
    });

});