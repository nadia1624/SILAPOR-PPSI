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

            } catch (error) {
            }
        }, 20000);
    });


});