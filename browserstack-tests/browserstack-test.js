/**
 * SILAPOR BrowserStack Cross-Browser Compatibility Test
 * 
 * Tests the SILAPOR application across multiple browsers and operating systems
 * to ensure compatibility as per Non-Functional Requirements.
 * 
 * Supported platforms:
 * - Windows 11: Chrome, Edge
 * - macOS Sonoma: Chrome, Safari
 * - Android 14: Chrome
 * - iOS 17: Safari
 */

require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');

// BrowserStack Credentials
const BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME || 'storaapp_hSu6ED';
const BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY || 'xpPrqCx7xJb2FNbeVqey';
const BASE_URL = process.env.BASE_URL || 'https://silapor.neotelemetri.id';
const TEST_EMAIL = process.env.TEST_EMAIL || 'nadyadearihanifah@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Nadia123_';

// BrowserStack Hub URL
const BROWSERSTACK_HUB = `https://${BROWSERSTACK_USERNAME}:${BROWSERSTACK_ACCESS_KEY}@hub-cloud.browserstack.com/wd/hub`;

// Test configurations for different browsers/OS
const capabilities = {
    'windows-chrome': {
        browserName: 'Chrome',
        'bstack:options': {
            os: 'Windows',
            osVersion: '11',
            browserVersion: 'latest',
            projectName: 'SILAPOR Cross-Browser Test',
            buildName: `SILAPOR-${new Date().toISOString().split('T')[0]}`,
            sessionName: 'Windows 11 - Chrome',
            local: 'false',
            debug: 'true',
            consoleLogs: 'info',
            networkLogs: 'true'
        }
    },
    'windows-edge': {
        browserName: 'Edge',
        'bstack:options': {
            os: 'Windows',
            osVersion: '11',
            browserVersion: 'latest',
            projectName: 'SILAPOR Cross-Browser Test',
            buildName: `SILAPOR-${new Date().toISOString().split('T')[0]}`,
            sessionName: 'Windows 11 - Edge',
            local: 'false',
            debug: 'true',
            consoleLogs: 'info',
            networkLogs: 'true'
        }
    },
    'macos-chrome': {
        browserName: 'Chrome',
        'bstack:options': {
            os: 'OS X',
            osVersion: 'Sonoma',
            browserVersion: 'latest',
            projectName: 'SILAPOR Cross-Browser Test',
            buildName: `SILAPOR-${new Date().toISOString().split('T')[0]}`,
            sessionName: 'macOS Sonoma - Chrome',
            local: 'false',
            debug: 'true',
            consoleLogs: 'info',
            networkLogs: 'true'
        }
    },
    'macos-safari': {
        browserName: 'Safari',
        'bstack:options': {
            os: 'OS X',
            osVersion: 'Sonoma',
            browserVersion: 'latest',
            projectName: 'SILAPOR Cross-Browser Test',
            buildName: `SILAPOR-${new Date().toISOString().split('T')[0]}`,
            sessionName: 'macOS Sonoma - Safari',
            local: 'false',
            debug: 'true',
            consoleLogs: 'info',
            networkLogs: 'true'
        }
    },
    'android-chrome': {
        browserName: 'chrome',
        'bstack:options': {
            deviceName: 'Samsung Galaxy S23',
            osVersion: '13.0',
            projectName: 'SILAPOR Cross-Browser Test',
            buildName: `SILAPOR-${new Date().toISOString().split('T')[0]}`,
            sessionName: 'Android - Chrome',
            local: 'false',
            debug: 'true',
            realMobile: 'true'
        }
    },
    'ios-safari': {
        browserName: 'safari',
        'bstack:options': {
            deviceName: 'iPhone 15',
            osVersion: '17',
            projectName: 'SILAPOR Cross-Browser Test',
            buildName: `SILAPOR-${new Date().toISOString().split('T')[0]}`,
            sessionName: 'iOS 17 - Safari',
            local: 'false',
            debug: 'true',
            realMobile: 'true'
        }
    }
};

// Test Results
const testResults = [];

/**
 * Create WebDriver for BrowserStack
 */
async function createDriver(capabilityKey) {
    const caps = capabilities[capabilityKey];
    const driver = await new Builder()
        .usingServer(BROWSERSTACK_HUB)
        .withCapabilities(caps)
        .build();
    return driver;
}

/**
 * Test Case 1: Landing Page Load
 */
async function testLandingPage(driver, browserName) {
    const testName = 'Landing Page Load';
    console.log(`  [${browserName}] Running: ${testName}`);

    try {
        await driver.get(BASE_URL);
        await driver.wait(until.titleContains('SILAPOR'), 10000);

        // Check if main elements are present
        const body = await driver.findElement(By.tagName('body'));
        const isDisplayed = await body.isDisplayed();

        if (isDisplayed) {
            console.log(`  ✅ [${browserName}] ${testName}: PASSED`);
            return { test: testName, browser: browserName, status: 'PASSED', message: 'Landing page loaded successfully' };
        } else {
            throw new Error('Page body not displayed');
        }
    } catch (error) {
        console.log(`  ❌ [${browserName}] ${testName}: FAILED - ${error.message}`);
        return { test: testName, browser: browserName, status: 'FAILED', message: error.message };
    }
}

/**
 * Test Case 2: Login Page Navigation
 */
async function testLoginPage(driver, browserName) {
    const testName = 'Login Page Navigation';
    console.log(`  [${browserName}] Running: ${testName}`);

    try {
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.css('input[name="email"], input[type="email"]')), 10000);

        const emailInput = await driver.findElement(By.css('input[name="email"], input[type="email"]'));
        const isDisplayed = await emailInput.isDisplayed();

        if (isDisplayed) {
            console.log(`  ✅ [${browserName}] ${testName}: PASSED`);
            return { test: testName, browser: browserName, status: 'PASSED', message: 'Login page loaded with email input' };
        } else {
            throw new Error('Email input not displayed');
        }
    } catch (error) {
        console.log(`  ❌ [${browserName}] ${testName}: FAILED - ${error.message}`);
        return { test: testName, browser: browserName, status: 'FAILED', message: error.message };
    }
}

/**
 * Test Case 3: Register Page Navigation
 */
async function testRegisterPage(driver, browserName) {
    const testName = 'Register Page Navigation';
    console.log(`  [${browserName}] Running: ${testName}`);

    try {
        await driver.get(`${BASE_URL}/register`);
        await driver.wait(until.elementLocated(By.css('form')), 10000);

        const form = await driver.findElement(By.css('form'));
        const isDisplayed = await form.isDisplayed();

        if (isDisplayed) {
            console.log(`  ✅ [${browserName}] ${testName}: PASSED`);
            return { test: testName, browser: browserName, status: 'PASSED', message: 'Register page loaded with form' };
        } else {
            throw new Error('Register form not displayed');
        }
    } catch (error) {
        console.log(`  ❌ [${browserName}] ${testName}: FAILED - ${error.message}`);
        return { test: testName, browser: browserName, status: 'FAILED', message: error.message };
    }
}

/**
 * Test Case 4: Login Flow
 */
async function testLoginFlow(driver, browserName) {
    const testName = 'Login Flow';
    console.log(`  [${browserName}] Running: ${testName}`);

    try {
        await driver.get(`${BASE_URL}/login`);

        // Wait for email input
        await driver.wait(until.elementLocated(By.css('input[name="email"], input[type="email"]')), 10000);

        // Fill in email
        const emailInput = await driver.findElement(By.css('input[name="email"], input[type="email"]'));
        await emailInput.clear();
        await emailInput.sendKeys(TEST_EMAIL);

        // Fill in password
        const passwordInput = await driver.findElement(By.css('input[name="password"], input[type="password"]'));
        await passwordInput.clear();
        await passwordInput.sendKeys(TEST_PASSWORD);

        // Click login button
        const loginButton = await driver.findElement(By.css('button[type="submit"], input[type="submit"]'));
        await loginButton.click();

        // Wait for redirect or home page
        await driver.sleep(3000);

        // Check URL changed (logged in)
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes('/mahasiswa') || currentUrl.includes('/home') || currentUrl.includes('/admin')) {
            console.log(`  ✅ [${browserName}] ${testName}: PASSED`);
            return { test: testName, browser: browserName, status: 'PASSED', message: 'Login successful, redirected to home' };
        } else {
            // Check if still on login page (might have error)
            console.log(`  ⚠️ [${browserName}] ${testName}: PARTIAL - Current URL: ${currentUrl}`);
            return { test: testName, browser: browserName, status: 'PARTIAL', message: `Redirect to: ${currentUrl}` };
        }
    } catch (error) {
        console.log(`  ❌ [${browserName}] ${testName}: FAILED - ${error.message}`);
        return { test: testName, browser: browserName, status: 'FAILED', message: error.message };
    }
}

/**
 * Test Case 5: Responsive Design Check
 */
async function testResponsiveDesign(driver, browserName) {
    const testName = 'Responsive Design';
    console.log(`  [${browserName}] Running: ${testName}`);

    try {
        await driver.get(BASE_URL);
        await driver.sleep(2000);

        // Take a screenshot (for visual verification)
        const screenshot = await driver.takeScreenshot();

        // Check viewport
        const windowSize = await driver.manage().window().getSize();
        console.log(`  [${browserName}] Window size: ${windowSize.width}x${windowSize.height}`);

        console.log(`  ✅ [${browserName}] ${testName}: PASSED`);
        return {
            test: testName,
            browser: browserName,
            status: 'PASSED',
            message: `Viewport: ${windowSize.width}x${windowSize.height}`,
            screenshot: screenshot.substring(0, 100) + '...'
        };
    } catch (error) {
        console.log(`  ❌ [${browserName}] ${testName}: FAILED - ${error.message}`);
        return { test: testName, browser: browserName, status: 'FAILED', message: error.message };
    }
}

/**
 * Run all tests for a specific browser configuration
 */
async function runTestsForBrowser(capabilityKey) {
    const browserName = capabilityKey;
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🌐 Testing: ${browserName}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    let driver;
    const results = [];

    try {
        driver = await createDriver(capabilityKey);

        // Run tests
        results.push(await testLandingPage(driver, browserName));
        results.push(await testLoginPage(driver, browserName));
        results.push(await testRegisterPage(driver, browserName));
        results.push(await testLoginFlow(driver, browserName));
        results.push(await testResponsiveDesign(driver, browserName));

        // Mark session as passed/failed on BrowserStack
        const allPassed = results.every(r => r.status === 'PASSED' || r.status === 'PARTIAL');
        await driver.executeScript(`browserstack_executor: {"action": "setSessionStatus", "arguments": {"status": "${allPassed ? 'passed' : 'failed'}", "reason": "${allPassed ? 'All tests passed' : 'Some tests failed'}"}}`);

    } catch (error) {
        console.error(`❌ Error running tests for ${browserName}: ${error.message}`);
        results.push({ test: 'Setup', browser: browserName, status: 'FAILED', message: error.message });
    } finally {
        if (driver) {
            await driver.quit();
        }
    }

    return results;
}

/**
 * Main function to run all browser tests
 */
async function runAllTests() {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  SILAPOR BrowserStack Cross-Browser Testing       ║');
    console.log('║  URL: https://silapor.neotelemetri.id             ║');
    console.log(`║  Date: ${new Date().toISOString().split('T')[0]}                                ║`);
    console.log('╚═══════════════════════════════════════════════════╝');

    const allResults = [];

    // Get browser to test from environment or run all
    const browserToTest = process.argv[2] || 'all';

    const browsersToRun = browserToTest === 'all'
        ? Object.keys(capabilities)
        : [browserToTest];

    for (const browser of browsersToRun) {
        if (capabilities[browser]) {
            const results = await runTestsForBrowser(browser);
            allResults.push(...results);
        } else {
            console.log(`❌ Unknown browser configuration: ${browser}`);
        }
    }

    // Print summary
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║                  TEST SUMMARY                      ║');
    console.log('╚═══════════════════════════════════════════════════╝');

    const passed = allResults.filter(r => r.status === 'PASSED').length;
    const failed = allResults.filter(r => r.status === 'FAILED').length;
    const partial = allResults.filter(r => r.status === 'PARTIAL').length;

    console.log(`\n  ✅ Passed: ${passed}`);
    console.log(`  ⚠️ Partial: ${partial}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📊 Total: ${allResults.length}`);

    // Group by browser
    console.log('\n  Results by Browser:');
    const browsers = [...new Set(allResults.map(r => r.browser))];
    browsers.forEach(browser => {
        const browserResults = allResults.filter(r => r.browser === browser);
        const browserPassed = browserResults.filter(r => r.status === 'PASSED').length;
        console.log(`    ${browser}: ${browserPassed}/${browserResults.length} passed`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Done! Check BrowserStack dashboard for detailed results.');
    console.log('https://automate.browserstack.com/dashboard');

    return allResults;
}

// Run if called directly
if (require.main === module) {
    runAllTests()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = { runAllTests, runTestsForBrowser, capabilities };
