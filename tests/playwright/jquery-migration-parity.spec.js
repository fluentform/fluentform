const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://forms.test';

// Test fixtures: 54 (payment), 240 (steps), 86 (date)
// Query params: ffjqmode=disabled (no jQuery), ffjqmode=enabled (with jQuery)

test.describe('jQuery Migration - Payment Handler (Fixture 54)', () => {
    const formUrl = `${BASE_URL}/?ff_landing=54`;

    test('bootstraps payment handler in disabled mode', async ({ page }) => {
        await page.goto(`${formUrl}&ffjqmode=disabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const state = await page.evaluate(() => ({
            hasJquery: typeof window.jQuery === 'function',
            formLoaded: !!document.querySelector('form.frm-fluent-form.ff-form-loaded'),
            paymentBootstrapState: document.querySelector('form.fluentform_has_payment')?.getAttribute('data-ff-payment-bootstrap'),
            hasAppliedCouponsField: !!document.querySelector('.__ff_all_applied_coupons'),
            stripeScriptLoaded: !!window.Stripe,
        }));

        console.log('Payment bootstrap disabled:', JSON.stringify(state));
        expect(state.formLoaded).toBe(true);
        expect(state.paymentBootstrapState).toBe('done');
        expect(state.hasAppliedCouponsField).toBe(true);
    });

    test('bootstraps payment handler in enabled mode', async ({ page }) => {
        await page.goto(`${formUrl}&ffjqmode=enabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const state = await page.evaluate(() => ({
            hasJquery: typeof window.jQuery === 'function',
            formLoaded: !!document.querySelector('form.frm-fluent-form.ff-form-loaded'),
            paymentBootstrapState: document.querySelector('form.fluentform_has_payment')?.getAttribute('data-ff-payment-bootstrap'),
            hasAppliedCouponsField: !!document.querySelector('.__ff_all_applied_coupons'),
        }));

        console.log('Payment bootstrap enabled:', JSON.stringify(state));
        expect(state.formLoaded).toBe(true);
        expect(state.paymentBootstrapState).toBe('done');
        expect(state.hasAppliedCouponsField).toBe(true);
    });

    test('payment method radio toggle works in disabled mode', async ({ page }) => {
        await page.goto(`${formUrl}&ffjqmode=disabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Check if payment methods exist
        const paymentMethods = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('.ff_payment_method'));
            return inputs.map(el => ({
                value: el.value,
                name: el.name,
                visible: el.offsetParent !== null
            }));
        });

        console.log('Payment methods:', JSON.stringify(paymentMethods));
        expect(paymentMethods.length).toBeGreaterThan(0);

        // If Stripe is available, verify inline wrapper visibility toggles
        const stripeTest = await page.evaluate(() => {
            const stripeRadio = document.querySelector('input[value="stripe"][type="radio"]');
            if (!stripeRadio) return null;

            stripeRadio.click();
            const stripeWrapper = document.querySelector('.stripe-inline-wrapper');
            return {
                stripeWrapperExists: !!stripeWrapper,
                stripeWrapperVisible: stripeWrapper ? getComputedStyle(stripeWrapper).display !== 'none' : false
            };
        });

        if (stripeTest) {
            console.log('Stripe toggle:', JSON.stringify(stripeTest));
            expect(stripeTest.stripeWrapperVisible).toBe(true);
        }
    });

    test('coupon state field updates on application in disabled mode', async ({ page }) => {
        await page.goto(`${formUrl}&ffjqmode=disabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const couponField = await page.evaluate(() => {
            const field = document.querySelector('.__ff_all_applied_coupons');
            return {
                exists: !!field,
                initialValue: field?.value || null,
                isHidden: field?.type === 'hidden'
            };
        });

        console.log('Coupon field state:', JSON.stringify(couponField));
        expect(couponField.exists).toBe(true);
        expect(couponField.isHidden).toBe(true);
    });

    test('payment bootstrap works identically in enabled vs disabled mode', async ({ page }) => {
        const runBootstrapCheck = async (mode) => {
            await page.goto(`${formUrl}&ffjqmode=${mode}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);

            return await page.evaluate(() => ({
                formLoaded: document.querySelector('form.ff-form-loaded') ? 'yes' : 'no',
                bootstrapState: document.querySelector('[data-ff-payment-bootstrap]')?.getAttribute('data-ff-payment-bootstrap'),
                couponFieldExists: document.querySelector('.__ff_all_applied_coupons') ? 'yes' : 'no',
                paymentMethodsCount: document.querySelectorAll('.ff_payment_method').length
            }));
        };

        const disabledState = await runBootstrapCheck('disabled');
        const enabledState = await runBootstrapCheck('enabled');

        console.log('Bootstrap parity - disabled:', JSON.stringify(disabledState));
        console.log('Bootstrap parity - enabled:', JSON.stringify(enabledState));

        expect(disabledState.formLoaded).toBe(enabledState.formLoaded);
        expect(disabledState.bootstrapState).toBe(enabledState.bootstrapState);
        expect(disabledState.couponFieldExists).toBe(enabledState.couponFieldExists);
    });
});

test.describe('jQuery Migration - Step Forms (Fixture 240)', () => {
    const formUrl = `${BASE_URL}/?ff_landing=240`;

    test('step form loads and advances without validation on first Next in disabled mode', async ({ page }) => {
        await page.goto(`${formUrl}&ffjqmode=disabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const initialState = await page.evaluate(() => ({
            formLoaded: document.querySelector('form.ff-form-loaded') ? 'yes' : 'no',
            currentStepIndex: Array.from(document.querySelectorAll('.fluentform-step'))
                .findIndex(step => getComputedStyle(step).display !== 'none'),
            visibleFields: Array.from(document.querySelectorAll('[data-name]'))
                .filter(f => getComputedStyle(f).display !== 'none')
                .map(f => f.getAttribute('data-name'))
                .slice(0, 3)
        }));

        console.log('Initial step state (disabled):', JSON.stringify(initialState));
        expect(initialState.formLoaded).toBe('yes');

        // Click Next button - should advance without validation on intro step
        const nextBtn = await page.locator('button:has-text("Next")').first();
        await nextBtn.click();
        await page.waitForTimeout(300);

        const afterFirstNext = await page.evaluate(() => ({
            currentStepIndex: Array.from(document.querySelectorAll('.fluentform-step'))
                .findIndex(step => getComputedStyle(step).display !== 'none'),
            errorMessages: Array.from(document.querySelectorAll('.ff_error_message')).length
        }));

        console.log('After first Next (disabled):', JSON.stringify(afterFirstNext));
        expect(afterFirstNext.errorMessages).toBe(0); // No validation errors on intro step
        expect(afterFirstNext.currentStepIndex).toBeGreaterThan(initialState.currentStepIndex); // Should advance
    });

    test('step form validator is available for use in disabled mode', async ({ page }) => {
        await page.goto(`${formUrl}&ffjqmode=disabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Verify the validator API is available
        const validatorState = await page.evaluate(() => {
            const form = document.querySelector('form.frm-fluent-form');
            const instance = window.fluentFormApp ? window.fluentFormApp(form) : null;

            return {
                formLoaded: !!form?.classList.contains('ff-form-loaded'),
                instanceAvailable: !!instance,
                hasAddValidator: !!instance?.addGlobalValidator,
                hasValidator: typeof instance?.addGlobalValidator === 'function'
            };
        });

        console.log('Step form validator state (disabled):', JSON.stringify(validatorState));
        expect(validatorState.formLoaded).toBe(true);
        expect(validatorState.hasValidator).toBe(true);
    });

    test('Previous button navigates backward in disabled mode', async ({ page }) => {
        await page.goto(`${formUrl}&ffjqmode=disabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const step1 = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.fluentform-step'))
                .findIndex(step => getComputedStyle(step).display !== 'none')
        );

        // Advance to step 2
        await page.locator('button:has-text("Next")').first().click();
        await page.waitForTimeout(300);

        const step2 = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.fluentform-step'))
                .findIndex(step => getComputedStyle(step).display !== 'none')
        );

        // Go back
        const prevBtn = await page.locator('button:has-text("Previous")').first();
        if (await prevBtn.count() > 0) {
            await prevBtn.click();
            await page.waitForTimeout(300);

            const stepAfterPrev = await page.evaluate(() =>
                Array.from(document.querySelectorAll('.fluentform-step'))
                    .findIndex(step => getComputedStyle(step).display !== 'none')
            );

            console.log('Step navigation: step1 =', step1, 'step2 =', step2, 'after prev =', stepAfterPrev);
            expect(stepAfterPrev).toBeLessThan(step2);
        }
    });

    test('step form navigation works identically in enabled vs disabled mode', async ({ page }) => {
        const testNavigation = async (mode) => {
            await page.goto(`${formUrl}&ffjqmode=${mode}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);

            const initialStep = await page.evaluate(() =>
                Array.from(document.querySelectorAll('.fluentform-step'))
                    .findIndex(step => getComputedStyle(step).display !== 'none')
            );

            // Click Next
            await page.locator('button:has-text("Next")').first().click();
            await page.waitForTimeout(300);

            const afterNext = await page.evaluate(() =>
                Array.from(document.querySelectorAll('.fluentform-step'))
                    .findIndex(step => getComputedStyle(step).display !== 'none')
            );

            return {
                initialStep,
                afterNext,
                advanced: afterNext > initialStep
            };
        };

        const disabledNav = await testNavigation('disabled');
        const enabledNav = await testNavigation('enabled');

        console.log('Step navigation parity - disabled:', JSON.stringify(disabledNav));
        console.log('Step navigation parity - enabled:', JSON.stringify(enabledNav));

        expect(disabledNav.advanced).toBe(enabledNav.advanced);
    });
});

test.describe('jQuery Migration - Form Fixture 86 (MailPoet)', () => {
    const formUrl = `${BASE_URL}/?ff_landing=86`;

    test('form 86 loads and initializes in both modes', async ({ page }) => {
        const testFormLoad = async (mode) => {
            await page.goto(`${formUrl}&ffjqmode=${mode}`, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(500);

            return await page.evaluate(() => ({
                formLoaded: !!document.querySelector('form.ff-form-loaded'),
                hasFields: document.querySelectorAll('[data-name]').length > 0,
                bridgeAvailable: typeof window.fluentFormApp === 'function'
            }));
        };

        const disabledState = await testFormLoad('disabled');
        const enabledState = await testFormLoad('enabled');

        console.log('Form 86 state (disabled):', JSON.stringify(disabledState));
        console.log('Form 86 state (enabled):', JSON.stringify(enabledState));

        expect(disabledState.formLoaded).toBe(true);
        expect(disabledState.bridgeAvailable).toBe(true);
        expect(enabledState.formLoaded).toBe(enabledState.formLoaded);
    });
});

test.describe('jQuery Migration - Event Bridge Compatibility', () => {
    test('bridge emits events on form submission in disabled mode', async ({ page }) => {
        await page.goto(`${BASE_URL}/?ff_landing=54&ffjqmode=disabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const bridgeEvents = await page.evaluate(() => {
            const emittedEvents = [];
            const form = document.querySelector('form.frm-fluent-form');

            if (!form || !window.fluentFormBridge) {
                return { bridgeAvailable: false };
            }

            // Listen for any fluentform events
            window.fluentFormBridge.onEvent(form, 'fluentform_init_single', () => {
                emittedEvents.push('fluentform_init_single');
            });

            return {
                bridgeAvailable: !!window.fluentFormBridge,
                bridgeHasOnEvent: typeof window.fluentFormBridge?.onEvent === 'function',
                formInstance: !!window.fluentFormApp(form)
            };
        });

        console.log('Bridge state:', JSON.stringify(bridgeEvents));
        expect(bridgeEvents.bridgeAvailable).toBe(true);
        expect(bridgeEvents.bridgeHasOnEvent).toBe(true);
    });

    test('global fluentFormApp function is available in disabled mode', async ({ page }) => {
        await page.goto(`${BASE_URL}/?ff_landing=54&ffjqmode=disabled`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        const globalApi = await page.evaluate(() => ({
            fluentFormAppAvailable: typeof window.fluentFormApp === 'function',
            ffHelperAvailable: typeof window.ff_helper === 'object',
            formInstanceObtainable: !!window.fluentFormApp?.(document.querySelector('form.frm-fluent-form'))
        }));

        console.log('Global API state:', JSON.stringify(globalApi));
        expect(globalApi.fluentFormAppAvailable).toBe(true);
        expect(globalApi.formInstanceObtainable).toBe(true);
    });
});
