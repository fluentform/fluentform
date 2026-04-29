const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/playwright',
    testMatch: '**/*.spec.js',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 1,
    reporter: 'html',

    use: {
        baseURL: 'https://forms.test',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // webServer disabled - WordPress should already be running on https://forms.test
});
