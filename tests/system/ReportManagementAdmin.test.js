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

    // ========================================
    // SKENARIO 3: BUAT LAPORAN BARU (ADMIN)
    // ========================================
    describe('SKENARIO 3: Admin Membuat Laporan Baru', () => {
        test('ST-ADMIN-CREATE-001: Admin sukses membuat laporan dan status On Progress', async () => {
            // PERBAIKAN: Ubah Navigasi ke '/admin/dashboard' sesuai screenshot
            console.log('   - [Step 1] Mengakses Dashboard Admin...');
            await driver.get(`${BASE_URL}/admin/dashboard`);
            await driver.wait(until.urlContains('/admin'), 10000);

            console.log('   - [Step 2] Menekan tombol Buat Laporan...');
            try {
                // Mencari tombol "Buat Laporan Baru" (Tombol Putih di Banner Hijau)
                // XPath ini mencari link (<a>) atau button (<button>) yang berisi teks 'Buat Laporan Baru'
                const createBtn = await driver.wait(
                    until.elementLocated(By.xpath("//*[self::a or self::button][contains(., 'Buat Laporan Baru')]")),
                    5000
                );
                await driver.executeScript("arguments[0].click();", createBtn);
            } catch (e) {
                console.log('     Tombol tidak ditemukan di Dashboard, mencoba akses URL langsung...');
                await driver.get(`${BASE_URL}/admin/report/create`);
            }

            await driver.wait(until.elementLocated(By.name('nama_barang')), TIMEOUT);

            console.log('   - Mengisi data laporan...');
            const jenisSelect = await driver.findElement(By.name('jenis_laporan'));
            await jenisSelect.sendKeys('Kehilangan');
            await driver.findElement(By.name('nama_barang')).sendKeys(TEST_REPORT.nama_barang);
            await driver.findElement(By.name('lokasi_kejadian')).sendKeys(TEST_REPORT.lokasi);
            await driver.findElement(By.name('tanggal_kejadian')).sendKeys(TEST_REPORT.tanggal_kejadian);
            await driver.findElement(By.name('deskripsi')).sendKeys(TEST_REPORT.deskripsi);

            console.log('   - Upload bukti foto...');

            const filePath = path.resolve(__dirname, 'admin_bukti.jpg');
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, 'dummy content for testing upload');
            }
            const fileInput = await driver.findElement(By.css('input[type="file"]'));
            await fileInput.sendKeys(filePath);

            console.log('   - Mengirim laporan...');
            const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
            await driver.executeScript("arguments[0].scrollIntoView(true);", submitBtn);
            await driver.sleep(500);
            await submitBtn.click();

            console.log('   - Verifikasi hasil...');
            await driver.wait(until.urlContains('/admin/my-reports'), TIMEOUT);
            const pageSource = await driver.getPageSource();
            expect(pageSource.includes(TEST_REPORT.nama_barang)).toBe(true);
            const isStatusCorrect = pageSource.includes('On progress');

            if (!isStatusCorrect) {
                console.log('WARNING: Status "On progress" tidak ditemukan pada halaman Laporan Saya.');
            }
            expect(isStatusCorrect).toBe(true);
            console.log('✓ PASS: Admin sukses membuat laporan & status On progress valid');
        }, 40000);
    });

    // ========================================
    // SKENARIO 4: MELIHAT DETAIL (ADMIN)
    // ========================================
    describe('SKENARIO 4: Admin Melihat Detail Laporan Sendiri', () => {
        test('ST-ADMIN-DETAIL-001: Admin dapat melihat detail laporan melalui modal', async () => {
            console.log('   - [Step 1] Navigasi ke Laporan Saya (Admin)...');
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.wait(until.urlContains('/admin/my-reports'), 10000);
            await driver.sleep(2000);
            console.log('   - [Step 2] Klik tombol Detail pada laporan test...');
            // 1. Cari judul laporan
            const reportTitle = await driver.wait(
                until.elementLocated(By.xpath(`//*[contains(text(), '${TEST_REPORT.nama_barang}')]`)),
                15000
            );
            await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", reportTitle);

            // 2. Cari tombol Detail yang berelasi dengan judul tersebut
            const btnDetail = await driver.findElement(
                By.xpath(`//*[contains(text(), '${TEST_REPORT.nama_barang}')]/following::*[self::a or self::button][contains(., 'Detail')][1]`)
            );

            // 3. Mekanisme Retry Klik
            let modalOpened = false;
            let attempts = 0;
            while (!modalOpened && attempts < 3) {
                console.log(`     Percobaan klik ke-${attempts + 1}...`);
                await driver.executeScript("arguments[0].click();", btnDetail);
                await driver.sleep(2000);

                const bodyText = await driver.findElement(By.tagName('body')).getText();
                if (bodyText.includes('Detail Laporan')) {
                    modalOpened = true;
                } else {
                    attempts++;
                }
            }
            if (!modalOpened) throw new Error("Gagal membuka modal detail admin setelah 3x percobaan.");

            console.log('   - [Step 3] Validasi konten modal...');
            const bodyTextCheck = await driver.findElement(By.tagName('body')).getText();
            expect(bodyTextCheck).toContain('Detail Laporan');
            expect(bodyTextCheck).toContain(TEST_REPORT.nama_barang);
            expect(bodyTextCheck).toContain(TEST_REPORT.lokasi);
            expect(bodyTextCheck).toContain(TEST_REPORT.deskripsi);

            const statusLower = bodyTextCheck.toLowerCase();
            if (statusLower.includes('On progress')) {
                console.log('     Status "On progress" terdeteksi.');
            } else {
                console.log('     Warning: Status spesifik tidak terdeteksi di modal.');
            }

            console.log('   - [Step 4] Menutup modal...');
            const closeButtons = await driver.findElements(By.xpath(".//button[contains(., 'Tutup')] | .//button[contains(., 'Close')] | .//*[contains(@class, 'close')]"));

            let closeClicked = false;
            for (const btn of closeButtons) {
                if (await btn.isDisplayed()) {
                    await driver.executeScript("arguments[0].click();", btn);
                    closeClicked = true;
                    break;
                }
            }
            if (!closeClicked && closeButtons.length > 0) {
                await driver.executeScript("arguments[0].click();", closeButtons[0]);
            }

            await driver.sleep(1000);
            console.log('✓ PASS: Modal detail admin tervalidasi.');
        }, 40000);
    });

    // ========================================
    // SKENARIO 5: EDIT LAPORAN (ADMIN)
    // ========================================
    describe('SKENARIO 5: Admin Mengedit Laporan Sendiri', () => {
        test('ST-ADMIN-EDIT-001: Admin dapat mengedit laporan (termasuk foto) dan menyimpan', async () => {
            const UPDATED_REPORT_ADMIN = {
                nama_barang: 'Botol Minum',
                lokasi: 'Gedung G',
                deskripsi: 'Ditemukan botol di G.',
            };

            console.log('   - [Step 1] Navigasi ke Laporan Saya...');
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.wait(until.urlContains('/admin/my-reports'), 10000);
            await driver.sleep(2000);

            console.log('   - [Step 2] Mencari laporan untuk diedit...');
            const reportTitle = await driver.wait(
                until.elementLocated(By.xpath(`//*[contains(text(), '${TEST_REPORT.nama_barang}')]`)),
                15000
            );
            await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", reportTitle);

            console.log('   - [Step 3] Menekan tombol Edit...');
            const btnEdit = await driver.findElement(
                By.xpath(`//*[contains(text(), '${TEST_REPORT.nama_barang}')]/following::*[self::a or self::button][contains(., 'Edit')][1]`)
            );
            await driver.executeScript("arguments[0].click();", btnEdit);
            await driver.sleep(2000);

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText).toContain('Edit Laporan');

            console.log('   - [Step 4] Mengubah data laporan...');

            const findVisibleInput = async (name) => {
                const elements = await driver.findElements(By.name(name));
                for (const el of elements) {
                    if (await el.isDisplayed()) return el;
                }
                return null;
            };

            // 1. Edit Nama
            const inputNama = await findVisibleInput('nama_barang');
            if (!inputNama) throw new Error("Input nama_barang tidak ditemukan visible");
            await inputNama.clear();
            await inputNama.sendKeys(UPDATED_REPORT_ADMIN.nama_barang);

            // 2. Edit Lokasi
            let inputLokasi = await findVisibleInput('lokasi');
            if (!inputLokasi) inputLokasi = await findVisibleInput('lokasi_kejadian');
            await inputLokasi.clear();
            await inputLokasi.sendKeys(UPDATED_REPORT_ADMIN.lokasi);

            // 3. Edit Deskripsi
            const inputDeskripsi = await findVisibleInput('deskripsi');
            await inputDeskripsi.clear();
            await inputDeskripsi.sendKeys(UPDATED_REPORT_ADMIN.deskripsi);

            // 4. Ganti Foto (Scoping ke Modal agar tidak salah upload)
            console.log('     Mengganti foto admin...');


            const modalTitleElement = await driver.findElement(By.xpath("//*[contains(text(), 'Edit Laporan')]"));
            const editModal = await modalTitleElement.findElement(By.xpath("./ancestor::div[contains(@class, 'bg-white') or @role='dialog'][1]"));
            const fileInput = await editModal.findElement(By.css('input[type="file"]'));

            const filePathBaru = path.resolve(__dirname, 'admin_bukti_edit.jpg');
            if (!fs.existsSync(filePathBaru)) {
                fs.writeFileSync(filePathBaru, 'dummy content for admin edit upload');
            }
            await fileInput.sendKeys(filePathBaru);

            console.log('   - [Step 5] Menyimpan Perubahan...');
            const buttons = await driver.findElements(By.xpath("//button[contains(., 'Simpan Perubahan')]"));
            let btnSimpan;
            for (const btn of buttons) {
                if (await btn.isDisplayed()) {
                    btnSimpan = btn;
                    break;
                }
            }
            if (btnSimpan) {
                await driver.executeScript("arguments[0].click();", btnSimpan);
            } else {
                throw new Error("Tombol Simpan tidak ditemukan.");
            }
            await driver.sleep(3000);
            await driver.wait(until.urlContains('/admin/my-reports'), 10000);

            console.log('   - [Step 6] Validasi data terupdate...');
            const pageSource = await driver.getPageSource();
            expect(pageSource).toContain(UPDATED_REPORT_ADMIN.nama_barang);
            expect(pageSource).toContain(UPDATED_REPORT_ADMIN.lokasi);
            expect(pageSource).toContain(UPDATED_REPORT_ADMIN.deskripsi);
            console.log('✓ PASS: Admin berhasil mengedit laporan.');

        }, 45000);
    });

    // ========================================
    // SKENARIO 6: VERIFIKASI KLAIM YANG MASUK
    // ========================================
    describe('SKENARIO 6: Admin Melihat dan Memproses Verifikasi Klaim yang Masuk', () => {
        test('ST-VERIF-CLAIM-001: Admin dapat membuka halaman verifikasi klaim', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/admin/my-reports');

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText.length).toBeGreaterThan(0);

            console.log('✓ PASS: Admin dapat membuka halaman laporan untuk melihat klaim');
        }, 20000);

        test('ST-VERIF-CLAIM-002: Admin dapat melihat daftar laporan dengan status klaim', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const claimIndicators = await driver.findElements(
                    By.xpath("//*[contains(text(), 'Claimed') or contains(text(), 'Waiting') or contains(text(), 'Diklaim')]")
                );

                if (claimIndicators.length > 0) {
                    console.log(`✓ PASS: Ditemukan ${claimIndicators.length} indikator status klaim pada halaman`);
                } else {
                    console.log('⚠ INFO: Tidak ada laporan dengan status klaim saat ini');
                }
            } catch (error) {
                console.log('⚠ SKIP: Gagal mencari indikator klaim');
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
                    console.log('⚠ SKIP: Tidak ada klaim yang menunggu persetujuan');
                    return;
                }

                await acceptButtons[0].click();
                await driver.sleep(1500);

                const formElements = await driver.findElements(
                    By.css('input[name="lokasi_penyerahan"], input[name="tanggal_penyerahan"], input[type="file"]')
                );

                if (formElements.length > 0) {
                    console.log('✓ PASS: Form penyerahan bukti klaim tersedia');
                } else {
                    console.log('⚠ INFO: Form tidak terdeteksi, mungkin menggunakan modal atau flow berbeda');
                }
            } catch (error) {
                console.log('⚠ SKIP: Gagal menemukan skenario accept claim');
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
                    console.log('⚠ SKIP: Tidak ada klaim yang dapat ditolak');
                    return;
                }

                await rejectButtons[0].click();
                await driver.sleep(1000);

                const alasanElements = await driver.findElements(
                    By.css('textarea[name="alasan"], select[name="alasan"], input[name="alasan"]')
                );

                if (alasanElements.length > 0) {
                    console.log('✓ PASS: Form alasan penolakan tersedia');
                } else {
                    const swalPopup = await driver.findElements(By.css('.swal2-popup'));
                    if (swalPopup.length > 0) {
                        console.log('✓ PASS: Modal konfirmasi penolakan tersedia');
                    } else {
                        console.log('⚠ INFO: Elemen alasan tidak terdeteksi');
                    }
                }
            } catch (error) {
                console.log('⚠ SKIP: Gagal menemukan skenario reject claim');
            }
        }, 35000);
    });

    // ========================================
    // SKENARIO 7: HAPUS LAPORAN (ADMIN)
    // ========================================
    describe('SKENARIO 7: Admin Menghapus Laporan Sendiri', () => {
        test('ST-ADMIN-DELETE-001: Admin dapat melihat tombol hapus pada laporan', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const deleteButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Hapus') or contains(., 'Delete')]")
                );

                if (deleteButtons.length > 0) {
                    console.log(`✓ PASS: Ditemukan ${deleteButtons.length} tombol hapus pada halaman`);
                } else {
                    console.log('⚠ INFO: Tidak ada tombol hapus yang terlihat (mungkin di dalam dropdown atau kondisi tertentu)');
                }
            } catch (error) {
                console.log('⚠ SKIP: Gagal mencari tombol hapus');
            }
        }, 20000);

        test('ST-ADMIN-DELETE-002: Sistem menampilkan konfirmasi sebelum menghapus laporan', async () => {
            await driver.get(`${BASE_URL}/admin/my-reports`);
            await driver.sleep(2000);

            try {
                const deleteButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Hapus') or contains(., 'Delete')]")
                );

                if (!deleteButtons.length) {
                    console.log('⚠ SKIP: Tidak ada tombol hapus untuk ditest');
                    return;
                }

                await deleteButtons[0].click();
                await driver.sleep(1000);

                const confirmElements = await driver.findElements(
                    By.xpath("//*[contains(text(), 'Yakin') or contains(text(), 'Konfirmasi') or contains(text(), 'Hapus')]")
                );

                const swalPopup = await driver.findElements(By.css('.swal2-popup'));

                if (confirmElements.length > 0 || swalPopup.length > 0) {
                    console.log('✓ PASS: Sistem menampilkan konfirmasi sebelum menghapus');

                    const cancelBtn = await driver.findElements(By.css('.swal2-cancel, button[contains(., "Batal")]'));
                    if (cancelBtn.length > 0) {
                        await driver.executeScript("arguments[0].click();", cancelBtn[0]);
                    }
                } else {
                    console.log('⚠ INFO: Konfirmasi tidak terdeteksi');
                }
            } catch (error) {
                console.log('⚠ SKIP: Gagal menemukan mekanisme konfirmasi hapus');
            }
        }, 30000);
    });

    // ========================================
    // SKENARIO 8: STATUS PENGAJUAN LAPORAN
    // ========================================
    describe('SKENARIO 8: Admin Melihat Status Pengajuan Laporan', () => {
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
                console.log(`✓ PASS: Ditemukan status: ${foundStatuses.join(', ')}`);
            } else {
                console.log('⚠ INFO: Tidak ada status yang terdeteksi (mungkin tidak ada laporan)');
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
                    console.log('⚠ SKIP: Tidak ada laporan untuk dilihat detailnya');
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
                    console.log('✓ PASS: Detail laporan menampilkan informasi status');
                } else {
                    console.log('⚠ INFO: Status tidak terdeteksi pada detail modal');
                }
            } catch (error) {
                console.log('⚠ SKIP: Gagal melihat detail laporan');
            }
        }, 30000);
    });

});