const { Builder, By, until, Select } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver'); 
const assert = require('assert');

// --- KONFIGURASI LINGKUNGAN ---
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; 
const TIMEOUT = 15000; 

// Data Admin (HARUS ADA di DB untuk login)
const ADMIN_EMAIL = 'admin@silapor.com'; 
const ADMIN_PASSWORD = 'admin123'; 

// Data Test Baru (Variabel Global untuk semua CRUD tests)
const timestamp = Date.now();
const NEW_USER_EMAIL = `crud-${timestamp}@test.com`;
const NEW_USER_NAME = 'User CRUD Baru';
const UPDATED_USER_NAME = 'User Edit Sukses Final';
const UPDATED_ADMIN_NAME = 'Admin Baru Test Auto';
const UPDATED_ADMIN_PHONE = '087654321000';

describe('SYSTEM TESTING: User Management & Admin Profile', () => {
    let driver;

    // --- SETUP DAN CLEANUP BROWSER ---
    beforeAll(async () => {
        // Menggunakan path dari modul npm chromedriver
        const service = new ServiceBuilder(chromedriver.path); 
        const options = new chrome.Options();
        options.addArguments('--headless=new'); 
        options.addArguments('--no-sandbox'); 
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();
    }, 45000); 

    afterAll(async () => {
        if (driver) {
            await driver.quit();
        }
    });

    // --- UTILITY: LOGIN ADMIN & NAVIGASI ---
    beforeEach(async () => {
        // Melakukan login hanya jika sesi tidak aktif atau URL bukan admin
        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes('/admin/')) {
             await driver.get(`${BASE_URL}/login`);
             await driver.wait(until.elementLocated(By.id('email')), 5000);

             await driver.findElement(By.id('email')).sendKeys(ADMIN_EMAIL);
             await driver.findElement(By.id('password')).sendKeys(ADMIN_PASSWORD);
             await driver.findElement(By.css('button[type="submit"]')).click();
             
             await driver.wait(until.urlContains('/admin/'), 10000); 
        }
    }, 30000);

    // ====================================================================
    // I. MANAJEMEN USER (CRUD: listUsers, createUser, updateUser, deleteUser)
    // ====================================================================
    describe('1. User Management (CRUD Flows)', () => {
        
        test('UC-READ-001: Should navigate to User List page successfully (listUsers)', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.wait(until.elementLocated(By.css('table')), 5000);

            const pageTitle = await driver.findElement(By.xpath('//h1')).getText();
            expect(pageTitle).toContain('Manajemen User');
        }, 15000);

        // --- CREATE USER (createUser) ---
        test('UC-CREATE-001: Should successfully create a new user and verify list update', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.findElement(By.xpath('//button[span="Tambah User"]')).click(); 
            await driver.wait(until.elementLocated(By.id('createUserModal')), 3000);

            // 2. Isi Form
            await driver.findElement(By.id('create-nama')).sendKeys(NEW_USER_NAME);
            await driver.findElement(By.id('create-email')).sendKeys(NEW_USER_EMAIL);
            await driver.findElement(By.id('create-password')).sendKeys('Test@123');
            await driver.findElement(By.id('create-confirm-password')).sendKeys('Test@123');
            
            // 3. Submit Form
            await driver.findElement(By.xpath('//div[@id="createUserModal"]//button[text()="Simpan User"]')).click(); 
            
            // 4. Verifikasi Redirect dan Data Muncul
            await driver.wait(until.urlIs(`${BASE_URL}/admin/userList`), 10000); 
            const newUserRow = await driver.findElement(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`));
            expect(await newUserRow.isDisplayed()).toBe(true);
        }, 30000);

        test('UC-CREATE-003: Should show error on existing email (Backend Validation)', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.findElement(By.xpath('//button[span="Tambah User"]')).click(); 
            await driver.wait(until.elementLocated(By.id('createUserModal')), 2000);

            // Isi Form dengan email yang sudah ada (NEW_USER_EMAIL)
            await driver.findElement(By.id('create-email')).sendKeys(NEW_USER_EMAIL); 
            await driver.findElement(By.id('create-password')).sendKeys('Test@123');
            await driver.findElement(By.id('create-confirm-password')).sendKeys('Test@123');
            
            // Submit
            await driver.findElement(By.xpath('//div[@id="createUserModal"]//button[text()="Simpan User"]')).click(); 
            
            // Verifikasi: Controller me-render halaman list lagi dengan error message
            const errorMessage = await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Email sudah terdaftar.")]')), 10000);
            expect(await errorMessage.isDisplayed()).toBe(true);
            
            // Tutup modal agar flow delete tidak terganggu
            await driver.findElement(By.xpath('//div[@id="createUserModal"]//button[@onclick="closeCreateModal()"]')).click();
        }, 30000);


        // --- EDIT USER (updateUser) ---
        test('UC-UPDATE-001: Should successfully update user name and role (updateUser)', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.wait(until.elementLocated(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`)), 5000);

            // 1. Klik tombol Edit
            await driver.findElement(By.xpath(`//tr[td[text()='${NEW_USER_EMAIL}']]//button[@title='Edit']`)).click(); 
            await driver.wait(until.elementLocated(By.id('editUserModal')), 2000);

            // 2. Isi Form Update (Edit Nama)
            const nameField = await driver.findElement(By.id('edit-nama'));
            await nameField.clear();
            await nameField.sendKeys(UPDATED_USER_NAME);
            
            // Ubah Role menjadi admin
            await new Select(driver.findElement(By.id('edit-role'))).selectByValue('admin'); 

            // 3. Submit Update (memanggil updateUser)
            await driver.findElement(By.xpath('//div[@id="editUserModal"]//button[text()="Simpan Perubahan"]')).click();
            
            // 4. Verifikasi Data yang Diperbarui Muncul di List (mengatasi Stale Element)
            await driver.wait(until.urlIs(`${BASE_URL}/admin/userList`), 10000); 
            
            // Cari elemen setelah page refresh
            const updatedRowText = await driver.findElement(By.xpath(`//td[text()='${NEW_USER_EMAIL}']/ancestor::tr`)).getText();
            expect(updatedRowText).toContain(UPDATED_USER_NAME);
            expect(updatedRowText).toContain('Admin');
        }, 30000);

        // --- HAPUS USER (deleteUser) ---
        test('UC-DELETE-001: Should successfully delete user using SweetAlert2 confirmation (deleteUser)', async () => {
            await driver.get(`${BASE_URL}/admin/userList`); 
            await driver.wait(until.elementLocated(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`)), 5000);
            
            // **LANGKAH KRITIS: Downgrade Role ke 'user' agar tombol delete muncul**
            // Karena di UC-UPDATE-001 role diubah ke admin, dan admin tidak bisa menghapus sesama admin.
            await driver.findElement(By.xpath(`//tr[td[text()='${NEW_USER_EMAIL}']]//button[@title='Edit']`)).click(); 
            await driver.wait(until.elementLocated(By.id('editUserModal')), 2000);
            await new Select(driver.findElement(By.id('edit-role'))).selectByValue('user'); 
            await driver.findElement(By.xpath('//div[@id="editUserModal"]//button[text()="Simpan Perubahan"]')).click();
            await driver.wait(until.urlIs(`${BASE_URL}/admin/userList`), 5000);

            // 1. Klik tombol Hapus
            await driver.findElement(By.xpath(`//tr[td[text()='${NEW_USER_EMAIL}']]//button[@title='Delete']`)).click(); 

            // 2. Handle SweetAlert2 Confirmation
            const swalConfirmBtn = await driver.wait(until.elementLocated(By.css('.swal2-confirm')), 5000);
            await swalConfirmBtn.click(); // Klik "Ya, Hapus!"

            // 3. Verifikasi Data Hilang
            await driver.wait(until.urlIs(`${BASE_URL}/admin/userList`), 10000); 
            const usersFound = await driver.findElements(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`));
            expect(usersFound.length).toBe(0);
        }, 40000); 
    });
    
    // ====================================================================
    // II. MANAJEMEN PROFIL ADMIN (showAdminProfile, updateAdminProfile)
    // ====================================================================
    describe('2. Admin Profile Management Flows', () => {
        
        // --- LIHAT PROFIL (showAdminProfile) ---
        test('UC-PROFILE-001: Should display Admin Profile page successfully (showAdminProfile)', async () => {
            await driver.get(`${BASE_URL}/admin/profile`);
            await driver.wait(until.urlIs(`${BASE_URL}/admin/profile`), 5000);
            
            const profileElement = await driver.findElement(By.tagName('body')).getText();
            expect(profileElement).toContain(ADMIN_EMAIL); 
        }, 15000);

        // --- UPDATE PROFIL (updateAdminProfile) ---
        test('UC-PROFILE-003: Should successfully update admin profile data and verify (updateAdminProfile)', async () => {
            await driver.get(`${BASE_URL}/admin/profile`);
            
            // 1. Klik tombol Edit Profile (Memperbaiki selector)
            const editButton = await driver.wait(until.elementLocated(By.xpath('//a[contains(@href, "/admin/profile/edit")]')), 5000);
            await editButton.click();
            
            // 2. Tunggu form edit muncul (showAdminEditProfile)
            await driver.wait(until.urlIs(`${BASE_URL}/admin/profile/edit`), 5000);
            await driver.wait(until.elementLocated(By.id('nama')), 5000); // Tunggu field nama muncul

            // 3. Isi Form Update
            const nameField = await driver.findElement(By.id('nama'));
            await nameField.clear();
            await nameField.sendKeys(UPDATED_ADMIN_NAME);
            
            const phoneField = await driver.findElement(By.id('no_telepon'));
            await phoneField.clear();
            await phoneField.sendKeys(UPDATED_ADMIN_PHONE);
            
            // 4. Submit (memanggil updateAdminProfile)
            await driver.findElement(By.css('button[type="submit"]')).click();
            
            // 5. Verifikasi Redirect ke /admin/profile
            await driver.wait(until.urlIs(`${BASE_URL}/admin/profile`), 10000);
            
            // 6. Verifikasi Data Baru Muncul
            const profileContent = await driver.findElement(By.tagName('body')).getText();
            expect(profileContent).toContain(UPDATED_ADMIN_NAME);
            expect(profileContent).toContain(UPDATED_ADMIN_PHONE);
        }, 30000);
    });
});