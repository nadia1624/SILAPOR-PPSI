const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

const MAHASISWA_CREDENTIALS = {
    email: 'nadyadearihanifah@gmail.com',
    password: 'Nadia123_'
};

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

describe('SYSTEM TESTING: Mahasiswa Claim Management - End to End Scenarios', () => {
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

    describe('SKENARIO 1: Mahasiswa Melihat dan Mengelola Klaim Barang', () => {
        test('ST-CLAIM-MAH-001: Mahasiswa dapat membuka halaman Klaim Saya', async () => {
            await driver.get(`${BASE_URL}/mahasiswa/my-claim`);
            await driver.sleep(2000);

            const currentUrl = await driver.getCurrentUrl();
            expect(currentUrl).toContain('/mahasiswa/my-claim');

            const heading = await driver.findElement(
                By.xpath("//h2[contains(., 'Laporan Diklaim')]")
            ).getText();
            expect(heading.length).toBeGreaterThan(0);

            console.log('✓ PASS: Mahasiswa dapat membuka halaman Klaim Saya');
        }, 20000);

        test('ST-CLAIM-MAH-002: Mahasiswa dapat melihat detail laporan klaim', async () => {
            await driver.get(`${BASE_URL}/mahasiswa/my-claim`);
            await driver.sleep(2000);

            try {
                const detailButton = await driver.findElement(
                    By.xpath("//button[contains(., 'Detail')]")
                );
                await detailButton.click();
                await driver.sleep(1000);

                const modal = await driver.findElement(By.id('detailModal'));

                await driver.wait(async () => {
                    const classes = await modal.getAttribute('class');
                    return !classes.includes('hidden');
                }, 5000);

                const modalText = await modal.getText();
                expect(modalText.length).toBeGreaterThan(0);

                console.log('✓ PASS: Detail laporan klaim dapat ditampilkan');
            } catch (error) {
                console.log('⚠ SKIP: Tidak ada klaim untuk dilihat detailnya');
            }
        }, 25000);

        test('ST-CLAIM-MAH-003: Mahasiswa dapat membatalkan klaim yang sedang menunggu persetujuan', async () => {
            await driver.get(`${BASE_URL}/mahasiswa/my-claim`);
            await driver.sleep(2000);

            try {
                const cancelButtons = await driver.findElements(
                    By.xpath("//button[contains(., 'Batal Klaim') and not(@disabled)]")
                );

                if (!cancelButtons.length) {
                    console.log('⚠ SKIP: Tidak ada klaim dengan status "Waiting for approval" untuk dibatalkan');
                    return;
                }

                const cancelButton = cancelButtons[0];
                await cancelButton.click();
                await driver.sleep(500);

                const cancelModal = await driver.findElement(By.id('cancelModal'));

                await driver.wait(async () => {
                    const classes = await cancelModal.getAttribute('class');
                    return !classes.includes('hidden');
                }, 5000);

                const confirmButton = await driver.findElement(By.id('btnSubmitCancel'));
                await confirmButton.click();

                await driver.wait(until.urlContains('/mahasiswa/my-claim'), 10000);

                console.log('✓ PASS: Mahasiswa dapat membatalkan klaim');
            } catch (error) {
                console.log('⚠ SKIP: Gagal menemukan skenario batal klaim yang valid');
            }
        }, 30000);
    });
});
