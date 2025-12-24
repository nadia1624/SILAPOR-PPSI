const { Builder, By, until, Select } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const assert = require('assert');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

const ADMIN_EMAIL = 'admin@silapor.com';
const ADMIN_PASSWORD = 'admin123';

// Data User Test
const timestamp = Date.now();
const NEW_USER_EMAIL = `crud-${timestamp}@test.com`;
const NEW_USER_NAME = 'User CRUD Baru';
const UPDATED_USER_NAME = 'User Edit Sukses Final';
const UPDATED_ADMIN_NAME = 'Admin Baru Test Auto';
const UPDATED_ADMIN_PHONE = '087654321000';
const DUPLICATE_EMAIL = NEW_USER_EMAIL; // untuk test duplicate

describe('SYSTEM TESTING: User Management & Admin Profile', () => {
    let driver;

    beforeAll(async () => {
        const service = new ServiceBuilder(chromedriver.path);
        const options = new chrome.Options();
        options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();
    }, 45000);

    afterAll(async () => {
        if (driver) await driver.quit();
    });

    // --- LOGIN ADMIN SEBELUM SETIAP TEST ---
    beforeEach(async () => {
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.id('email')), 5000);

        await driver.findElement(By.id('email')).sendKeys(ADMIN_EMAIL);
        await driver.findElement(By.id('password')).sendKeys(ADMIN_PASSWORD);
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.wait(until.urlContains('/admin/'), 10000);
    }, 30000);

    // ======================
    // 1. USER MANAGEMENT CRUD
    // ======================
    describe('1. User Management (CRUD)', () => {

        test('UC-READ-001: Load User List Page', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.wait(until.elementLocated(By.css('table')), 5000);

            const title = await driver.findElement(By.xpath('//h1')).getText();
            expect(title).toContain('Manajemen User');
        }, 15000);

        test('UC-CREATE-001: Successfully create a new user', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.findElement(By.xpath('//button[span="Tambah User"]')).click();
            await driver.wait(until.elementLocated(By.id('createUserModal')), 3000);

            await driver.findElement(By.id('create-nama')).sendKeys(NEW_USER_NAME);
            await driver.findElement(By.id('create-email')).sendKeys(NEW_USER_EMAIL);
            await driver.findElement(By.id('create-password')).sendKeys('Test@123');
            await driver.findElement(By.id('create-confirm-password')).sendKeys('Test@123');
            await driver.findElement(By.id('create-no_telepon')).sendKeys('081234567890');
            await driver.findElement(By.id('create-alamat')).sendKeys('Jl. Test Alamat No. 123, Kota Test');
            await new Select(driver.findElement(By.id('create-role'))).selectByValue('user');

            await driver.findElement(By.xpath('//div[@id="createUserModal"]//button[text()="Simpan User"]')).click();

            await driver.wait(until.urlIs(`${BASE_URL}/admin/userList`), 10000);
            const newUserRow = await driver.findElement(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`));
            expect(await newUserRow.isDisplayed()).toBe(true);
        }, 30000);

        test('UC-UPDATE-001: Update user name & role', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.wait(until.elementLocated(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`)), 5000);

            await driver.findElement(By.xpath(`//tr[td[text()='${NEW_USER_EMAIL}']]//button[@title='Edit']`)).click();
            await driver.wait(until.elementLocated(By.id('editUserModal')), 2000);

            const nameField = await driver.findElement(By.id('edit-nama'));
            await nameField.clear();
            await nameField.sendKeys(UPDATED_USER_NAME);
            await new Select(driver.findElement(By.id('edit-role'))).selectByValue('admin');

            await driver.findElement(By.xpath('//div[@id="editUserModal"]//button[text()="Simpan Perubahan"]')).click();
            await driver.wait(until.urlIs(`${BASE_URL}/admin/userList`), 10000);
            await driver.sleep(1000);

            // Re-navigate to refresh the page and avoid stale element
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.wait(until.elementLocated(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`)), 5000);

            const updatedRowText = await driver.findElement(By.xpath(`//td[text()='${NEW_USER_EMAIL}']/ancestor::tr`)).getText();
            expect(updatedRowText).toContain(UPDATED_USER_NAME);
            expect(updatedRowText).toContain('Admin');
        }, 30000);

        test('UC-DELETE-001: Delete user with SweetAlert2', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.wait(until.elementLocated(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`)), 5000);

            // Downgrade ke 'user' agar tombol delete muncul
            await driver.findElement(By.xpath(`//tr[td[text()='${NEW_USER_EMAIL}']]//button[@title='Edit']`)).click();
            await driver.wait(until.elementLocated(By.id('editUserModal')), 2000);
            await new Select(driver.findElement(By.id('edit-role'))).selectByValue('user');
            await driver.findElement(By.xpath('//div[@id="editUserModal"]//button[text()="Simpan Perubahan"]')).click();
            await driver.wait(until.urlIs(`${BASE_URL}/admin/userList`), 5000);

            await driver.findElement(By.xpath(`//tr[td[text()='${NEW_USER_EMAIL}']]//button[@title='Delete']`)).click();

            const swalConfirmBtn = await driver.wait(until.elementLocated(By.css('.swal2-confirm')), 5000);
            await swalConfirmBtn.click();

            await driver.wait(until.urlIs(`${BASE_URL}/admin/userList`), 10000);
            const usersFound = await driver.findElements(By.xpath(`//td[text()='${NEW_USER_EMAIL}']`));
            expect(usersFound.length).toBe(0);
        }, 40000);

        test('UC-PASSWORD-MISMATCH-001: Should prevent creating user if password mismatch', async () => {
            await driver.get(`${BASE_URL}/admin/userList`);
            await driver.findElement(By.xpath('//button[span="Tambah User"]')).click();
            await driver.wait(until.elementLocated(By.id('createUserModal')), 3000);

            await driver.findElement(By.id('create-nama')).sendKeys('Mismatch User');
            await driver.findElement(By.id('create-email')).sendKeys(`mismatch-${timestamp}@test.com`);
            await driver.findElement(By.id('create-password')).sendKeys('Test@123');
            await driver.findElement(By.id('create-confirm-password')).sendKeys('Test@321');

            await driver.findElement(By.xpath('//div[@id="createUserModal"]//button[text()="Simpan User"]')).click();

            const alertText = await driver.switchTo().alert().getText().catch(() => null);
            expect(alertText).toBeNull(); // SweetAlert2 handled in DOM, tidak alert native
            const errorElement = await driver.findElement(By.css('.swal2-title')).getText();
            expect(errorElement).toContain('Password Tidak Sama');
        }, 15000);
    });

});
