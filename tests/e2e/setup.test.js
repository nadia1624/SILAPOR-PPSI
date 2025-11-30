const { Builder, By } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const { ServiceBuilder } = require('selenium-webdriver/chrome');

describe('Selenium Setup Verification', () => {
    test('Should open Google homepage', async () => {
        const service = new ServiceBuilder(chromedriver.path);
        
        const options = new chrome.Options();
        options.addArguments('--headless=new');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.setChromeBinaryPath('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');

        const driver = await new Builder()
            .forBrowser('chrome')
            .setChromeService(service)
            .setChromeOptions(options)
            .build();

        try {
            await driver.get('https://www.google.com');
            const title = await driver.getTitle();
            expect(title).toContain('Google');
        } finally {
            await driver.quit();
        }
    }, 30000);
});
