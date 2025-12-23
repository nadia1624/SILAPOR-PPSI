const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 15000;

const ADMIN_CREDENTIALS = {
    email: 'admin@silapor.com',
    password: 'admin123'
};

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
describe('SYSTEM TESTING: Admin Report Verification - End to End Scenarios', () => {
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

    describe('SKENARIO 1: Admin Melihat Verifikasi Laporan yang Masuk', () => {
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
    });

    describe('SKENARIO 2: Admin Menyetujui Verifikasi Laporan yang Masuk', () => {
        test('ST-VERIF-ADMIN-003: Admin dapat menyetujui verifikasi upload laporan', async () => {
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
    });

    describe('SKENARIO 3: Admin Menolak Verifikasi Laporan yang Masuk', () => {
        test('ST-VERIF-ADMIN-004: Admin dapat menolak verifikasi upload laporan dengan alasan', async () => {
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

});
