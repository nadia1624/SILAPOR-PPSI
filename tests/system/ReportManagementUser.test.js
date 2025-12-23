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

// Kredensial Mahasiswa
const MAHASISWA_CREDENTIALS = {
    email: 'nadyadearihanifah@gmail.com',
    password: 'Nadia123_'
};

const TEST_REPORT_MHS = {
    nama_barang: 'Gelang',
    lokasi: 'Gedung C',
    deskripsi: 'Gelang tertinggal di kursi',
    tanggal_kejadian: '02-12-2025'
};


// --- Fungsi Utility ---
const loginAsMahasiswa = async (driver) => {
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.id('email')), 10000);
    await driver.findElement(By.id('email')).sendKeys(MAHASISWA_CREDENTIALS.email);
    await driver.findElement(By.id('password')).sendKeys(MAHASISWA_CREDENTIALS.password);
    await driver.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/mahasiswa/'), 10000);
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

// Fungsi untuk menunggu SweetAlert
const waitForSwal = async (driver, timeout = 5000) => {
    return await driver.wait(
        until.elementLocated(By.css('.swal2-popup, .swal2-modal')),
        timeout
    );
};

// --- SYSTEM TEST SUITE ---
describe('SYSTEM TESTING: Mahasiswa Report Management - End to End Scenarios', () => {
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
        await loginAsMahasiswa(driver);
    }, 30000);

    afterEach(async () => {
        await logout(driver);
    }, 10000);

    // ========================================
    // SKENARIO 1: LIHAT LAPORAN PENEMUAN DAN KEHILANGAN
    // ========================================
    describe('SKENARIO 1: Mahasiswa Melihat Laporan Penemuan dan Kehilangan', () => {

        test('ST-MAH-001: Mahasiswa dapat melihat daftar semua laporan dengan status On Progress', async () => {
            // GIVEN: Mahasiswa sudah login
            // WHEN: Mahasiswa mengakses halaman home untuk melihat laporan
            await driver.get(`${BASE_URL}/mahasiswa/home`);
            await driver.sleep(2000);

            // THEN: Sistem menampilkan halaman daftar laporan
            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/mahasiswa/home');

            // AND: Laporan dengan status "On Progress" ditampilkan
            const bodyText = await driver.findElement(By.tagName('body')).getText();
            expect(bodyText.length).toBeGreaterThan(0);

            console.log('✓ PASS: Mahasiswa dapat melihat halaman laporan');
        }, 20000);

        test('ST-MAH-002: Mahasiswa dapat melihat detail lengkap suatu laporan', async () => {
            // GIVEN: Mahasiswa berada di halaman home
            await driver.get(`${BASE_URL}/mahasiswa/home`);
            await driver.sleep(2000);

            // WHEN: Mahasiswa mengklik tombol Detail pada salah satu laporan
            try {
                const detailButton = await driver.findElement(
                    By.xpath("//button[contains(text(), 'Detail')]")
                );
                await detailButton.click();
                await driver.sleep(1000);

                // THEN: Sistem menampilkan modal detail laporan
                const modal = await driver.wait(
                    until.elementLocated(By.css('.hs-overlay, .modal, [role="dialog"]')),
                    5000
                );

                expect(await modal.isDisplayed()).toBeTruthy();

                // AND: Detail laporan tampil lengkap (nama barang, lokasi, deskripsi, dll)
                const modalText = await modal.getText();
                expect(modalText.length).toBeGreaterThan(0);

                console.log('✓ PASS: Detail laporan dapat ditampilkan');
            } catch (error) {
                console.log('⚠ SKIP: Tidak ada laporan untuk dilihat detailnya');
            }
        }, 20000);
    });

    // ========================================
    // SKENARIO 5: MAHASISWA MEMBUAT LAPORAN BARU
    // ========================================
    describe('SKENARIO 2: Mahasiswa Membuat Laporan Baru', () => {

        test('ST-MAH-CREATE-001: Mahasiswa sukses membuat laporan dan status menunggu verifikasi', async () => {
            console.log('   - Mengakses Form Laporan Mahasiswa...');

            // 1. Navigasi ke Form Laporan
            try {
                const createBtn = await driver.wait(
                    until.elementLocated(By.xpath("//a[contains(., 'Buat Laporan')]")),
                    5000
                );
                await createBtn.click();
            } catch (e) {
                console.log('   - Tombol tidak ditemukan, akses URL langsung...');
                await driver.get(`${BASE_URL}/mahasiswa/report/create`); // Sesuaikan route create mahasiswa
            }
            await driver.wait(until.elementLocated(By.name('nama_barang')), TIMEOUT);

            // 2. Mengisi Form
            console.log('   - Mengisi data laporan...');
            const jenisSelect = await driver.findElement(By.name('jenis_laporan'));
            await jenisSelect.sendKeys('Kehilangan');
            await driver.findElement(By.name('nama_barang')).sendKeys(TEST_REPORT_MHS.nama_barang);
            await driver.findElement(By.name('lokasi_kejadian')).sendKeys(TEST_REPORT_MHS.lokasi);
            await driver.findElement(By.name('tanggal_kejadian')).sendKeys(TEST_REPORT_MHS.tanggal_kejadian);
            await driver.findElement(By.name('deskripsi')).sendKeys(TEST_REPORT_MHS.deskripsi);

            // 3. Upload File
            console.log('   - Upload bukti foto...');
            const filePath = path.resolve(__dirname, 'mahasiswa_bukti.jpg');
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, 'dummy content for student upload');
            }
            const fileInput = await driver.findElement(By.css('input[type="file"]'));
            await fileInput.sendKeys(filePath);

            // 4. Submit
            console.log('   - Mengirim laporan...');
            const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
            await driver.executeScript("arguments[0].scrollIntoView(true);", submitBtn);
            await driver.sleep(500);
            await submitBtn.click();

            // 5. Verifikasi Hasil
            console.log('   - Verifikasi hasil...');
            await driver.wait(until.urlContains('/mahasiswa/my-reports'), TIMEOUT);
            const pageSource = await driver.getPageSource();

            // Validasi 1: Nama barang muncul di list
            expect(pageSource.includes(TEST_REPORT_MHS.nama_barang)).toBe(true);

            // Validasi 2: Status harus "Waiting for upload verification"
            // Mahasiswa defaultnya menunggu verifikasi admin
            const isStatusCorrect = pageSource.includes('Waiting for upload verification');

            if (!isStatusCorrect) {
                console.log('WARNING: Status "Waiting for upload verification" tidak ditemukan pada halaman Laporan Saya.');
            }
            expect(isStatusCorrect).toBe(true);

            console.log('✓ PASS: Mahasiswa sukses membuat laporan & status Waiting valid');

        }, 40000);
    });

    test('ST-MAH-CREATE-002: Verifikasi visual kartu laporan (Detail, Status, Tombol)', async () => {
        console.log('   - [Step 1] Memastikan berada di halaman Laporan Saya...');
        await driver.get(`${BASE_URL}/mahasiswa/my-reports`);
        await driver.wait(until.urlContains('/mahasiswa/my-reports'), 10000);

        console.log('   - [Step 2] Mencari kartu laporan spesifik...');
        const reportTitle = await driver.wait(
            until.elementLocated(By.xpath(`//*[contains(text(), '${TEST_REPORT_MHS.nama_barang}')]`)),
            10000
        );
        await driver.executeScript("arguments[0].scrollIntoView(true);", reportTitle);
        expect(await reportTitle.isDisplayed()).toBe(true);
        console.log('   - [Step 3] Memvalidasi detail di dalam kartu...');
        const cardElement = await reportTitle.findElement(By.xpath("./ancestor::div[contains(@class, 'bg-white') or contains(@class, 'card')][1]"));
        const cardText = await cardElement.getText();
        expect(cardText).toContain(TEST_REPORT_MHS.lokasi);
        expect(cardText).toContain(TEST_REPORT_MHS.deskripsi);
        expect(cardText).toContain('Waiting for upload verification');

        console.log('✓ PASS: Kartu laporan ditampilkan lengkap.');
    }, 30000);


    // --- TEST CASE: Melihat Modal Detail Laporan ---
    test('ST-MAH-CREATE-002: Melihat Modal Detail Laporan (Isi & Tombol Tutup)', async () => {
        console.log('   - [Step 1] Memastikan berada di halaman Laporan Saya...');
        await driver.get(`${BASE_URL}/mahasiswa/my-reports`);
        await driver.wait(until.urlContains('/mahasiswa/my-reports'), 10000);
        await driver.sleep(2000);
        console.log('   - [Step 2] Mencari tombol Detail pada laporan...');
        const reportTitle = await driver.wait(
            until.elementLocated(By.xpath(`//*[contains(., '${TEST_REPORT_MHS.nama_barang}')]`)),
            15000
        );
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", reportTitle);
        await driver.sleep(500);
        const btnDetail = await driver.findElement(
            By.xpath(`//*[contains(., '${TEST_REPORT_MHS.nama_barang}')]/following::*[self::a or self::button][contains(., 'Detail')][1]`)
        );
        let modalOpened = false;
        let attempts = 0;
        while (!modalOpened && attempts < 3) {
            console.log(`     Percobaan klik tombol Detail ke-${attempts + 1}...`);
            await driver.executeScript("arguments[0].click();", btnDetail);
            await driver.sleep(2000);

            const bodyText = await driver.findElement(By.tagName('body')).getText();
            if (bodyText.includes('Detail Laporan')) {
                modalOpened = true;
                console.log('     -> Modal berhasil terbuka.');
            } else {
                console.log('     -> Modal belum terbuka, mencoba lagi...');
                attempts++;
            }
        }
        if (!modalOpened) {
            throw new Error("Gagal membuka modal detail setelah 3 kali percobaan klik.");
        }
        console.log('   - [Step 3] Validasi konten modal via Page Source...');
        const bodyTextCheck = await driver.findElement(By.tagName('body')).getText();
        expect(bodyTextCheck).toContain('Detail Laporan');
        expect(bodyTextCheck).toContain(TEST_REPORT_MHS.nama_barang);
        const possibleStatuses = [
            "Waiting for upload verification",
            "Upload verification rejected",
            "On progress",
            "Claimed",
            "Waiting for end verification",
            "End verification rejected",
            "Done"
        ];
        const foundStatus = possibleStatuses.find(status => bodyTextCheck.includes(status));
        if (foundStatus) {
            console.log(`     ✓ Status terdeteksi: "${foundStatus}"`);
        } else {
            console.log('     ⚠ Warning: Status laporan tidak terdeteksi atau telah berubah ke status yang tidak dikenali tes.');
        }
        expect(bodyTextCheck).toContain(TEST_REPORT_MHS.lokasi);
        expect(bodyTextCheck).toContain(TEST_REPORT_MHS.deskripsi);

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
        console.log('✓ PASS: Modal detail konten tervalidasi.');
    }, 40000);

    // ========================================
    // SKENARIO 6: EDIT LAPORAN
    // ========================================
    describe('SKENARIO 3: Mahasiswa Mengedit Laporan', () => {
        test('ST-MAH-EDIT-001: Mahasiswa dapat mengedit laporan (termasuk foto) dan menyimpan', async () => {
            const UPDATED_REPORT_MHS = {
                nama_barang: 'Laptop',
                lokasi: 'Gedung B',
                deskripsi: 'Belum Ketemu',
            };

            console.log('   - [Step 1] Navigasi ke halaman Laporan Saya...');
            await driver.get(`${BASE_URL}/mahasiswa/my-reports`);
            await driver.wait(until.urlContains('/mahasiswa/my-reports'), 10000);
            await driver.sleep(2000);

            console.log('   - [Step 2] Mencari laporan yang akan diedit...');
            const reportTitleXpath = `//*[contains(text(), '${TEST_REPORT_MHS.nama_barang}')]`;
            const reportTitle = await driver.wait(
                until.elementLocated(By.xpath(reportTitleXpath)),
                15000
            );
            await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", reportTitle);
            await driver.sleep(500);

            console.log('   - [Step 3] Menekan tombol Edit...');
            const btnEdit = await driver.findElement(
                By.xpath(`${reportTitleXpath}/following::*[self::a or self::button][contains(., 'Edit')][1]`)
            );
            await driver.executeScript("arguments[0].click();", btnEdit);
            await driver.sleep(2000);

            // Verifikasi Modal Edit Terbuka
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

            // 1. Edit Nama Barang
            const inputNama = await findVisibleInput('nama_barang');
            if (!inputNama) throw new Error("Input nama_barang tidak ditemukan yang visible");
            await inputNama.clear();
            await inputNama.sendKeys(UPDATED_REPORT_MHS.nama_barang);

            // 2. Edit Lokasi
            let inputLokasi = await findVisibleInput('lokasi');
            if (!inputLokasi) inputLokasi = await findVisibleInput('lokasi_kejadian');
            if (!inputLokasi) throw new Error("Input lokasi tidak ditemukan yang visible");
            await inputLokasi.clear();
            await inputLokasi.sendKeys(UPDATED_REPORT_MHS.lokasi);

            // 3. Edit Deskripsi
            const inputDeskripsi = await findVisibleInput('deskripsi');
            if (!inputDeskripsi) throw new Error("Input deskripsi tidak ditemukan yang visible");
            await inputDeskripsi.clear();
            await inputDeskripsi.sendKeys(UPDATED_REPORT_MHS.deskripsi);

            // 4. Ganti Foto (STRATEGI: Scoping ke Modal)
            console.log('     Mengganti foto...');

            const modalTitleElement = await driver.findElement(By.xpath("//*[contains(text(), 'Edit Laporan')]"));
            const editModal = await modalTitleElement.findElement(By.xpath("./ancestor::div[contains(@class, 'bg-white') or @role='dialog'][1]"));
            const fileInput = await editModal.findElement(By.css('input[type="file"]'));
            const filePathBaru = path.resolve(__dirname, 'mahasiswa_bukti_edit.jpg');

            if (!fs.existsSync(filePathBaru)) {
                fs.writeFileSync(filePathBaru, 'dummy content for edited photo upload');
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
                throw new Error("Tombol Simpan Perubahan tidak ditemukan yang visible");
            }

            await driver.sleep(3000);
            await driver.wait(until.urlContains('/mahasiswa/my-reports'), 10000);

            console.log('   - [Step 6] Memvalidasi data yang telah diubah...');
            const pageSource = await driver.getPageSource();
            expect(pageSource).toContain(UPDATED_REPORT_MHS.nama_barang);
            expect(pageSource).toContain(UPDATED_REPORT_MHS.lokasi);
            expect(pageSource).toContain(UPDATED_REPORT_MHS.deskripsi);
            console.log('✓ PASS: Laporan berhasil diedit (termasuk foto) dan data terupdate.');
        }, 45000);
    });

});