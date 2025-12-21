const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const path = require('path');
const fs = require('fs');


const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

const MHS_IMG_PATH = path.resolve(__dirname, 'mahasiswa_profile.jpg');
const ADMIN_IMG_PATH = path.resolve(__dirname, 'admin_profile.jpg');

const MAHASISWA_CREDENTIALS = {
    email: 'nadyadearihanifah@gmail.com',
    password: 'Nadia123_'
};

const ADMIN_CREDENTIALS = {
    email: 'admin@silapor.com',
    password: 'admin123'
};

const UPDATED_PROFILE_MHS = {
    nama: 'Nana Cantik Updated',
    alamat: 'Jl. Kemenangan No. 99, Padang',
    no_telepon: '081234567890'
};

const UPDATED_PROFILE_ADMIN = {
    nama: 'Super Admin Updated',
    alamat: 'Ruang Server Pusat, Gedung Rektorat',
    no_telepon: '081122334455'
};

const loginAsMahasiswa = async (driver) => {
    await driver.get(`${BASE_URL}/login`);
    const emailField = await driver.wait(until.elementLocated(By.name('email')), 20000);
    await emailField.clear();
    await emailField.sendKeys(MAHASISWA_CREDENTIALS.email);
    
    const passField = await driver.findElement(By.name('password'));
    await passField.clear();
    await passField.sendKeys(MAHASISWA_CREDENTIALS.password);
    
    const submitBtn = await driver.findElement(By.xpath("//button[contains(., 'Masuk')]"));
    await driver.executeScript("arguments[0].click();", submitBtn);
    
    try {
        await driver.wait(until.urlContains('/mahasiswa'), 30000); 
    } catch (e) {
        console.error('\n[ERROR LOGIN] Gagal redirect ke dashboard mahasiswa.');
        throw e;
    }
};

const loginAsAdmin = async (driver) => {
    await driver.get(`${BASE_URL}/login`);
    const emailField = await driver.wait(until.elementLocated(By.name('email')), 20000);
    await emailField.clear();
    await emailField.sendKeys(ADMIN_CREDENTIALS.email);
    
    const passField = await driver.findElement(By.name('password'));
    await passField.clear();
    await passField.sendKeys(ADMIN_CREDENTIALS.password);
    
    const submitBtn = await driver.findElement(By.xpath("//button[contains(., 'Masuk')]"));
    await driver.executeScript("arguments[0].click();", submitBtn);
    
    try {
        await driver.wait(until.urlContains('/admin'), 30000); 
    } catch (e) {
        console.error('\n[ERROR LOGIN] Gagal redirect ke dashboard admin.');
        throw e;
    }
};

const logout = async (driver) => {
    try {
        await driver.get(`${BASE_URL}/logout`);
    } catch (error) {
        console.log('Logout session ended');
    }
};


describe('SYSTEM TESTING: Profile Management (Mahasiswa & Admin)', () => {
    let driver;

    beforeAll(async () => {
        if (!fs.existsSync(MHS_IMG_PATH)) {
            fs.writeFileSync(MHS_IMG_PATH, 'dummy mahasiswa profile image content'); 
        }

        // Buat dummy image ADMIN jika belum ada
        if (!fs.existsSync(ADMIN_IMG_PATH)) {
            fs.writeFileSync(ADMIN_IMG_PATH, 'dummy admin profile image content'); 
        }

        const service = new ServiceBuilder(chromedriver.path);
        const options = new chrome.Options();
        options.addArguments(
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1366,768'
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

    // ===============================================================
    // GROUP 1: TEST PROFIL MAHASISWA
    // ===============================================================
    describe('GROUP A: Profil Mahasiswa', () => {
        
        beforeEach(async () => {
            await loginAsMahasiswa(driver);
        }, 45000);

        afterEach(async () => {
            await logout(driver);
        }, 15000);

        test('ST-MAH-PROFILE-001: Mahasiswa dapat melihat halaman profil', async () => {
            console.log('   [Mahasiswa] Mencoba membuka Profil...');
            
    
            let menuVisible = false;
            let attempts = 0;
            
            try {
                const profileMenuTrigger = await driver.wait(
                    until.elementLocated(By.xpath("//img[contains(@class, 'rounded-full')] | //button[.//img]")), 
                    10000
                );

                while (!menuVisible && attempts < 3) {
                    await driver.executeScript("arguments[0].click();", profileMenuTrigger);
                    await driver.sleep(1000); 
                    const links = await driver.findElements(By.xpath("//a[contains(., 'Profil Saya')]"));
                    
                    if (links.length > 0 && await links[0].isDisplayed()) {
                        console.log('     Dropdown terbuka, klik "Profil Saya"...');
                        await driver.executeScript("arguments[0].click();", links[0]);
                        menuVisible = true;
                    } else {
                        attempts++;
                        console.log(`     Percobaan klik dropdown ke-${attempts} belum berhasil...`);
                    }
                }
            } catch (e) {
                console.log('     Gagal berinteraksi dengan dropdown.');
            }

            if (!menuVisible) {
                console.log('     ⚠ Dropdown tidak responsif, fallback akses URL profil langsung...');
                await driver.get(`${BASE_URL}/profile`);
            }

            console.log('   [Mahasiswa] Verifikasi halaman profil...');
            await driver.wait(until.urlContains('/profile'), 10000);
            
            const pageSource = await driver.findElement(By.tagName('body')).getText();
            expect(pageSource).toContain('Detail Informasi');
            expect(pageSource).toContain(MAHASISWA_CREDENTIALS.email); 
            expect(pageSource).toContain('Edit Profile'); 

            console.log('✓ PASS: Mahasiswa berhasil masuk dan melihat halaman profil.');
        }, 30000);

        test('ST-MAH-PROFILE-002: Mahasiswa dapat membuka form edit profil', async () => {
            console.log('   [Mahasiswa] Navigasi ke Halaman Profil...');
            await driver.get(`${BASE_URL}/profile`);
            await driver.wait(until.urlContains('/profile'), 10000);

            console.log('   [Mahasiswa] Klik tombol "Edit Profile"...');
            const editBtn = await driver.wait(
                until.elementLocated(By.xpath("//a[contains(., 'Edit Profile')] | //button[contains(., 'Edit Profile')]")),
                10000
            );
            await driver.executeScript("arguments[0].click();", editBtn);

            console.log('   [Mahasiswa] Verifikasi Halaman Edit...');
            const inputNama = await driver.wait(until.elementLocated(By.name('nama')), 10000);
            const inputAlamat = await driver.findElement(By.name('alamat'));
            const inputTelp = await driver.findElement(By.name('no_telepon'));

            expect(await inputNama.isDisplayed()).toBe(true);
            expect(await inputAlamat.isDisplayed()).toBe(true);
            expect(await inputTelp.isDisplayed()).toBe(true);

            console.log('✓ PASS: Form edit profil terbuka dengan benar.');
        }, 30000);

        test('ST-MAH-PROFILE-003: Mahasiswa dapat mengupdate data profil dan foto', async () => {
            console.log('   [Mahasiswa] Navigasi ke Form Edit...');
            await driver.get(`${BASE_URL}/profile`);
            const editBtn = await driver.wait(
                until.elementLocated(By.xpath("//a[contains(., 'Edit Profile')] | //button[contains(., 'Edit Profile')]")),
                10000
            );
            await driver.executeScript("arguments[0].click();", editBtn);
            await driver.wait(until.elementLocated(By.name('nama')), 10000);
            
            console.log('   [Mahasiswa] Mengisi form update profil...');
            const inputNama = await driver.findElement(By.name('nama'));
            await inputNama.clear();
            await inputNama.sendKeys(UPDATED_PROFILE_MHS.nama);

            const inputAlamat = await driver.findElement(By.name('alamat'));
            await inputAlamat.clear();
            await inputAlamat.sendKeys(UPDATED_PROFILE_MHS.alamat);

            const inputTelp = await driver.findElement(By.name('no_telepon'));
            await inputTelp.clear();
            await inputTelp.sendKeys(UPDATED_PROFILE_MHS.no_telepon);

            console.log('   [Mahasiswa] Upload Foto Profil Baru...');
            const fileInput = await driver.findElement(By.css('input[type="file"]'));
            await fileInput.sendKeys(MHS_IMG_PATH);

            console.log('   [Mahasiswa] Simpan Perubahan...');
            const saveBtn = await driver.findElement(By.css('button[type="submit"]'));
            await driver.executeScript("arguments[0].scrollIntoView(true);", saveBtn);
            await driver.executeScript("arguments[0].click();", saveBtn);

            console.log('   [Mahasiswa] Verifikasi Data Terupdate...');
            await driver.wait(until.urlIs(`${BASE_URL}/profile`), 20000);
            const updatedPageSource = await driver.findElement(By.tagName('body')).getText();
            
            expect(updatedPageSource).toContain(UPDATED_PROFILE_MHS.nama);
            expect(updatedPageSource).toContain(UPDATED_PROFILE_MHS.alamat);
            expect(updatedPageSource).toContain(UPDATED_PROFILE_MHS.no_telepon);

            console.log('✓ PASS: Profil mahasiswa berhasil diupdate.');
        }, 45000);
    });

    // ===============================================================
    // GROUP 2: TEST PROFIL ADMIN
    // ===============================================================
    describe('GROUP B: Profil Admin', () => {
        
        beforeEach(async () => {
            await loginAsAdmin(driver);
        }, 45000);

        afterEach(async () => {
            await logout(driver);
        }, 15000);

        test('ST-ADMIN-PROFILE-001: Admin dapat melihat halaman profil', async () => {
            console.log('   [Admin] Mengklik Foto Profil Admin (Direct Link)...');
            try {
                const profileLink = await driver.wait(
                    until.elementLocated(By.xpath("//a[contains(@href, '/admin/profile')] | //img[contains(@class, 'rounded-circle')]/parent::a")), 
                    10000
                );
                await driver.executeScript("arguments[0].click();", profileLink);
            } catch (e) {
                console.log('     ⚠ Link profil tidak ditemukan, fallback ke URL langsung...');
                await driver.get(`${BASE_URL}/admin/profile`);
            }

            console.log('   [Admin] Verifikasi halaman profil...');
            await driver.wait(until.urlContains('/admin/profile'), 10000);
            const pageSource = await driver.findElement(By.tagName('body')).getText();
            expect(pageSource).toContain('Detail Informasi'); 
            
            const editBtnCheck = await driver.findElements(By.xpath("//a[contains(., 'Edit Profile')] | //button[contains(., 'Edit Profile')]"));
            expect(editBtnCheck.length).toBeGreaterThan(0);

            console.log('✓ PASS: Admin berhasil masuk dan melihat halaman profil.');
        }, 45000);

        test('ST-ADMIN-PROFILE-002: Admin dapat membuka form edit profil', async () => {
            console.log('   [Admin] Navigasi ke Halaman Profil Admin...');
            await driver.get(`${BASE_URL}/admin/profile`);
            await driver.wait(until.urlContains('/admin/profile'), 10000);

            console.log('   [Admin] Klik tombol "Edit Profile"...');
            const editBtn = await driver.wait(
                until.elementLocated(By.xpath("//a[contains(., 'Edit Profile')] | //button[contains(., 'Edit Profile')]")),
                10000
            );
            await driver.executeScript("arguments[0].click();", editBtn);

            console.log('   [Admin] Verifikasi Halaman Edit...');
            const inputNama = await driver.wait(until.elementLocated(By.name('nama')), 10000);
            const inputAlamat = await driver.findElement(By.name('alamat'));
            const inputTelp = await driver.findElement(By.name('no_telepon'));

            expect(await inputNama.isDisplayed()).toBe(true);
            expect(await inputAlamat.isDisplayed()).toBe(true);
            expect(await inputTelp.isDisplayed()).toBe(true);

            console.log('✓ PASS: Form edit profil admin terbuka dengan benar.');
        }, 30000);

        test('ST-ADMIN-PROFILE-003: Admin dapat mengupdate data profil dan foto', async () => {
            console.log('   [Admin] Navigasi ke Form Edit Admin...');
            await driver.get(`${BASE_URL}/admin/profile`);
            const editBtn = await driver.wait(
                until.elementLocated(By.xpath("//a[contains(., 'Edit Profile')] | //button[contains(., 'Edit Profile')]")),
                10000
            );
            await driver.executeScript("arguments[0].click();", editBtn);
            await driver.wait(until.elementLocated(By.name('nama')), 10000);
            
            console.log('   [Admin] Mengisi form update profil...');
            
            const inputNama = await driver.findElement(By.name('nama'));
            await inputNama.clear();
            await inputNama.sendKeys(UPDATED_PROFILE_ADMIN.nama);

            const inputAlamat = await driver.findElement(By.name('alamat'));
            await inputAlamat.clear();
            await inputAlamat.sendKeys(UPDATED_PROFILE_ADMIN.alamat);

            const inputTelp = await driver.findElement(By.name('no_telepon'));
            await inputTelp.clear();
            await inputTelp.sendKeys(UPDATED_PROFILE_ADMIN.no_telepon);

            console.log('   [Admin] Upload Foto Profil Baru...');
            const fileInput = await driver.findElement(By.css('input[type="file"]'));
            await fileInput.sendKeys(ADMIN_IMG_PATH);

            console.log('   [Admin] Simpan Perubahan...');
            const saveBtn = await driver.findElement(By.css('button[type="submit"]'));
            await driver.executeScript("arguments[0].scrollIntoView(true);", saveBtn);
            await driver.sleep(500); 
            await driver.executeScript("arguments[0].click();", saveBtn);

            console.log('   [Admin] Verifikasi Data Terupdate...');
            await driver.wait(until.urlIs(`${BASE_URL}/admin/profile`), 20000);
            const updatedPageSource = await driver.findElement(By.tagName('body')).getText();
            
            expect(updatedPageSource).toContain(UPDATED_PROFILE_ADMIN.nama);
            expect(updatedPageSource).toContain(UPDATED_PROFILE_ADMIN.alamat);
            expect(updatedPageSource).toContain(UPDATED_PROFILE_ADMIN.no_telepon);

            console.log('✓ PASS: Profil admin berhasil diupdate.');
        }, 45000);
    });

});