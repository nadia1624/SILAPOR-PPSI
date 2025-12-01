const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const path = require('path');
const fs = require('fs');

// --- Konfigurasi ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

// --- Konfigurasi File Gambar ---
const PROFILE_IMG_PATH = path.resolve(__dirname, 'profile_pic.jpg');

// Kredensial Mahasiswa
const MAHASISWA_CREDENTIALS = {
    email: 'nadyadearihanifah@gmail.com',
    password: 'Nadia123_'
};

// Data Update Profil Baru
const UPDATED_PROFILE = {
    nama: 'Nana Cantik Updated',
    alamat: 'Jl. Kemenangan No. 99, Padang',
    no_telepon: '081234567890'
};

// --- Fungsi Utility ---
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

const logout = async (driver) => {
    try {
        await driver.get(`${BASE_URL}/logout`);
    } catch (error) {
        console.log('Logout session ended');
    }
};

// --- SYSTEM TEST SUITE ---
describe('SYSTEM TESTING: Mahasiswa Profile Management', () => {
    let driver;

    beforeAll(async () => {
        const service = new ServiceBuilder(chromedriver.path);
        const options = new chrome.Options();
        options.addArguments(
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1366,768'
            // '--headless=new' 
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
    }, 45000);

    afterEach(async () => {
        await logout(driver);
    }, 15000);

    // ========================================
    // CASE 1: MELIHAT PROFIL
    // ========================================
    test('ST-MAH-PROFILE-001: Mahasiswa dapat melihat halaman profil', async () => {
        console.log('   - [Step 1] Membuka Dropdown Menu Profil...');
        
        // 1. Cari Avatar/Foto Profil (Trigger Dropdown)
        const profileMenuTrigger = await driver.wait(
            until.elementLocated(By.xpath("//img[contains(@class, 'rounded-full')] | //button[.//img]")), 
            10000
        );
        // Klik trigger dropdown
        await driver.executeScript("arguments[0].click();", profileMenuTrigger);
        
        // PERBAIKAN: Gunakan wait agar Selenium menunggu menu muncul, bukan langsung mencari
        console.log('   - [Step 2] Menunggu menu "Profil Saya" muncul...');
        const profileLink = await driver.wait(
            until.elementLocated(By.xpath("//a[contains(., 'Profil Saya')]")), 
            10000
        );
        
        // Pastikan terlihat sebelum diklik
        await driver.wait(until.elementIsVisible(profileLink), 5000);
        
        // 2. Klik Link "Profil Saya"
        await driver.executeScript("arguments[0].click();", profileLink);

        // 3. Verifikasi Masuk Halaman Profil
        console.log('   - [Step 3] Verifikasi Konten Halaman Profil...');
        await driver.wait(until.urlContains('/profile'), 10000);
        
        const pageSource = await driver.findElement(By.tagName('body')).getText();
        expect(pageSource).toContain('Detail Informasi');
        expect(pageSource).toContain(MAHASISWA_CREDENTIALS.email); 
        expect(pageSource).toContain('Edit Profile'); 

        console.log('✓ PASS: Mahasiswa berhasil masuk dan melihat halaman profil.');
    }, 30000);

    // ========================================
    // CASE 2: MELIHAT FORM EDIT PROFIL
    // ========================================
    test('ST-MAH-PROFILE-002: Mahasiswa dapat membuka form edit profil', async () => {
        console.log('   - [Step 1] Navigasi ke Halaman Profil...');
        await driver.get(`${BASE_URL}/profile`);
        await driver.wait(until.urlContains('/profile'), 10000);

        console.log('   - [Step 2] Klik tombol "Edit Profile"...');
        const editBtn = await driver.wait(
            until.elementLocated(By.xpath("//a[contains(., 'Edit Profile')] | //button[contains(., 'Edit Profile')]")),
            10000
        );
        await driver.executeScript("arguments[0].click();", editBtn);

        console.log('   - [Step 3] Verifikasi Halaman Edit...');
        const inputNama = await driver.wait(until.elementLocated(By.name('nama')), 10000);
        const inputAlamat = await driver.findElement(By.name('alamat'));
        const inputTelp = await driver.findElement(By.name('no_telepon'));

        expect(await inputNama.isDisplayed()).toBe(true);
        expect(await inputAlamat.isDisplayed()).toBe(true);
        expect(await inputTelp.isDisplayed()).toBe(true);

        console.log('✓ PASS: Form edit profil terbuka dengan benar.');
    }, 30000);

    // ========================================
    // CASE 3: UPDATE PROFIL
    // ========================================
    test('ST-MAH-PROFILE-003: Mahasiswa dapat mengupdate data profil dan foto', async () => {
        console.log('   - [Step 1] Navigasi ke Form Edit...');
        await driver.get(`${BASE_URL}/profile`);
        const editBtn = await driver.wait(
            until.elementLocated(By.xpath("//a[contains(., 'Edit Profile')] | //button[contains(., 'Edit Profile')]")),
            10000
        );
        await driver.executeScript("arguments[0].click();", editBtn);
        await driver.wait(until.elementLocated(By.name('nama')), 10000);
        
        console.log('   - [Step 2] Mengisi form update profil...');
        
        const inputNama = await driver.findElement(By.name('nama'));
        await inputNama.clear();
        await inputNama.sendKeys(UPDATED_PROFILE.nama);

        const inputAlamat = await driver.findElement(By.name('alamat'));
        await inputAlamat.clear();
        await inputAlamat.sendKeys(UPDATED_PROFILE.alamat);

        const inputTelp = await driver.findElement(By.name('no_telepon'));
        await inputTelp.clear();
        await inputTelp.sendKeys(UPDATED_PROFILE.no_telepon);

        console.log('   - [Step 3] Upload Foto Profil Baru...');
        
        const fileInput = await driver.findElement(By.css('input[type="file"]'));
        
        if (!fs.existsSync(PROFILE_IMG_PATH)) {
            console.log('     (Info: Membuat file gambar dummy sementara...)');
            fs.writeFileSync(PROFILE_IMG_PATH, 'dummy content image'); 
        }
        
        await fileInput.sendKeys(PROFILE_IMG_PATH);

        console.log('   - [Step 4] Simpan Perubahan...');
        const saveBtn = await driver.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].scrollIntoView(true);", saveBtn);
        await driver.executeScript("arguments[0].click();", saveBtn);

        // Verifikasi Redirect Kembali ke Profil
        console.log('   - [Step 5] Verifikasi Data Terupdate...');
        await driver.wait(until.urlIs(`${BASE_URL}/profile`), 20000);
        
        const updatedPageSource = await driver.findElement(By.tagName('body')).getText();
        
        expect(updatedPageSource).toContain(UPDATED_PROFILE.nama);
        expect(updatedPageSource).toContain(UPDATED_PROFILE.alamat);
        expect(updatedPageSource).toContain(UPDATED_PROFILE.no_telepon);

        console.log('✓ PASS: Profil mahasiswa berhasil diupdate.');

    }, 45000);

});