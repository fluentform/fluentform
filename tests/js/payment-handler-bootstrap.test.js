const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function createJqueryStub(window) {
    const dataStore = new WeakMap();

    function wrap(input, attributes) {
        if (input && input.__isJqueryStub) {
            return input;
        }

        let elements = [];

        if (typeof input === 'string') {
            const htmlTagMatch = input.match(/^<([a-z0-9-]+)\/?>$/i);

            if (htmlTagMatch) {
                const createdElement = window.document.createElement(htmlTagMatch[1]);

                Object.entries(attributes || {}).forEach(([key, value]) => {
                    if (key === 'class') {
                        createdElement.className = value;
                    } else if (key === 'html') {
                        createdElement.innerHTML = value;
                    } else {
                        createdElement.setAttribute(key, value);
                    }
                });

                elements = [createdElement];
            } else {
                elements = Array.from(window.document.querySelectorAll(input));
            }
        } else if (Array.isArray(input)) {
            elements = input;
        } else if (input && input.nodeType) {
            elements = [input];
        } else if (input === window.document) {
            elements = [window.document];
        }

        const api = {
            __isJqueryStub: true,
            elements,
            length: elements.length,
            on() {
                return this;
            },
            off() {
                return this;
            },
            hasClass(className) {
                return !!this.elements[0] && this.elements[0].classList.contains(className);
            },
            attr(name, value) {
                if (!this.elements[0]) {
                    return typeof value === 'undefined' ? undefined : this;
                }

                if (typeof value === 'undefined') {
                    return this.elements[0].getAttribute(name);
                }

                this.elements.forEach((element) => element.setAttribute(name, value));
                return this;
            },
            html(value) {
                if (!this.elements[0]) {
                    return typeof value === 'undefined' ? undefined : this;
                }

                if (typeof value === 'undefined') {
                    return this.elements[0].innerHTML;
                }

                this.elements.forEach((element) => {
                    element.innerHTML = value;
                });

                return this;
            },
            insertAfter(target) {
                const targetElement = target && target.__isJqueryStub ? target.elements[0] : target;

                if (!targetElement || !targetElement.parentNode) {
                    return this;
                }

                this.elements.forEach((element) => {
                    targetElement.parentNode.insertBefore(element, targetElement.nextSibling);
                });

                return this;
            },
            data(name, value) {
                if (!this.elements[0]) {
                    return typeof value === 'undefined' ? undefined : this;
                }

                const store = dataStore.get(this.elements[0]) || {};

                if (typeof value === 'undefined') {
                    return store[name];
                }

                store[name] = value;
                dataStore.set(this.elements[0], store);
                return this;
            },
            removeData(name) {
                this.elements.forEach((element) => {
                    const store = dataStore.get(element);
                    if (!store) {
                        return;
                    }

                    delete store[name];
                    dataStore.set(element, store);
                });

                return this;
            }
        };

        elements.forEach((element, index) => {
            api[index] = element;
        });

        return api;
    }

    wrap.each = function (collection, callback) {
        const items = collection && collection.__isJqueryStub ? collection.elements : Array.from(collection || []);
        items.forEach((item, index) => callback.call(item, index, item));
    };

    return wrap;
}

function createWindow(html, fluentFormAppReturnValue) {
    const dom = new JSDOM(html, {
        runScripts: 'outside-only',
        url: 'https://example.test'
    });

    const { window } = dom;
    const jquery = createJqueryStub(window);

    window.jQuery = jquery;
    window.$ = jquery;
    window.fluentFormVars = {
        pro_payment_script_compatible: false
    };
    window.fluentFormApp = () => fluentFormAppReturnValue;
    window.__paymentInitCalls = [];

    return window;
}

function evaluateFreePaymentHandler(window) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../resources/assets/public/payment_handler.js'),
        'utf8'
    )
        .replace('import formatPrice from "./formatPrice";\n', '')
        .replace('import { _$t } from "@/admin/helpers";\n', '')
        .replace('export class Payment_handler', 'class Payment_handler')
        .replace(
            /\(new Payment_handler\((?:\$form|bootForm), (?:instance|bootInstance)\)\)\.init\(\);/g,
            'window.__paymentInitCalls.push({ handler: "free", formClass: (bootForm || $form).attr("class") || "", instance: bootInstance || instance });'
        );

    const factory = new Function('window', 'document', 'jQuery', '$', source);
    factory(window, window.document, window.jQuery, window.$);
}

function evaluateProPaymentHandler(window) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../../fluentformpro/src/assets/public/payment_handler_pro.js'),
        'utf8'
    )
        .replace('import { Payment_handler } from \'@fluentform/public/payment_handler.js\';\n', 'class Payment_handler {}\n')
        .replace(
            /\(new Payment_handler_pro\((?:\$form|bootForm), (?:instance|bootInstance)\)\)\.init\(\);/g,
            'window.__paymentInitCalls.push({ handler: "pro", formClass: (bootForm || $form).attr("class") || "", instance: bootInstance || instance });'
        );

    const factory = new Function('window', 'document', 'jQuery', '$', source);
    factory(window, window.document, window.jQuery, window.$);
}

function loadFreePaymentHandlerClass(window) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../resources/assets/public/payment_handler.js'),
        'utf8'
    )
        .replace('import formatPrice from "./formatPrice";\n', '')
        .replace('import { _$t } from "@/admin/helpers";\n', '')
        .replace('export class Payment_handler', 'class Payment_handler')
        .concat('\nwindow.__PaymentHandlerClass = Payment_handler;');

    const factory = new Function('window', 'document', 'jQuery', '$', source);
    factory(window, window.document, window.jQuery, window.$);

    return window.__PaymentHandlerClass;
}

function loadProLegacyPaymentHandlerClass(window) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../../fluentformpro/src/assets/public/payment_handler.js'),
        'utf8'
    )
        .replace('import formatPrice from "./formatPrice";\n', '')
        .concat('\nwindow.__ProLegacyPaymentHandlerClass = Payment_handler;');

    const factory = new Function('window', 'document', 'jQuery', '$', source);
    factory(window, window.document, window.jQuery, window.$);

    return window.__ProLegacyPaymentHandlerClass;
}

test('free payment handler bootstraps already-loaded payment forms', () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment ff-form-loaded"></form></body></html>',
        { settings: { id: 54 } }
    );

    evaluateFreePaymentHandler(window);

    assert.equal(window.__paymentInitCalls.length, 1);
    assert.equal(window.__paymentInitCalls[0].handler, 'free');
});

test('free payment handler does not eagerly bootstrap unloaded forms', () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"></form></body></html>',
        { settings: { id: 54 } }
    );

    evaluateFreePaymentHandler(window);

    assert.equal(window.__paymentInitCalls.length, 0);
});

test('free payment handler boots when a payment form becomes loaded later', async () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"></form></body></html>',
        { settings: { id: 54 } }
    );

    const formElement = window.document.querySelector('form');

    evaluateFreePaymentHandler(window);

    assert.equal(window.__paymentInitCalls.length, 0);

    formElement.classList.add('ff-form-loaded');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(window.__paymentInitCalls.length, 1);
    assert.equal(window.__paymentInitCalls[0].handler, 'free');
});

test('pro payment handler bootstraps already-loaded payment forms', () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment ff-form-loaded"></form></body></html>',
        { settings: { id: 54 } }
    );

    evaluateProPaymentHandler(window);

    assert.equal(window.__paymentInitCalls.length, 1);
    assert.equal(window.__paymentInitCalls[0].handler, 'pro');
});

test('pro payment handler boots when a payment form becomes loaded later', async () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"></form></body></html>',
        { settings: { id: 54 } }
    );

    const formElement = window.document.querySelector('form');

    evaluateProPaymentHandler(window);

    assert.equal(window.__paymentInitCalls.length, 0);

    formElement.classList.add('ff-form-loaded');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(window.__paymentInitCalls.length, 1);
    assert.equal(window.__paymentInitCalls[0].handler, 'pro');
});

test('free payment handler toggles inline payment wrappers without jQuery change helpers', () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"><div class="ff-el-input--content"><label><input class="ff_payment_method" type="radio" name="payment_method_1" value="stripe"></label><label><input class="ff_payment_method" type="radio" name="payment_method_1" value="paypal"></label><div class="stripe-inline-wrapper ff_pay_inline" style="display: none"></div><div class="square-inline-wrapper ff_pay_inline" style="display: none"></div></div></form></body></html>',
        { settings: { id: 54 } }
    );

    const PaymentHandlerClass = loadFreePaymentHandlerClass(window);
    const formElement = window.document.querySelector('form');
    const stripeInput = window.document.querySelector('input[value="stripe"]');
    const paypalInput = window.document.querySelector('input[value="paypal"]');
    const stripeWrapper = window.document.querySelector('.stripe-inline-wrapper');

    const handler = Object.create(PaymentHandlerClass.prototype);
    handler.$form = window.jQuery(formElement);
    handler.paymentMethod = '';

    handler.initPaymentMethodChange();

    stripeInput.checked = true;
    stripeInput.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(handler.paymentMethod, 'stripe');
    assert.equal(stripeWrapper.style.display, 'block');

    stripeInput.checked = false;
    paypalInput.checked = true;
    paypalInput.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(handler.paymentMethod, 'paypal');
    assert.equal(stripeWrapper.style.display, 'none');
});

test('pro legacy payment handler toggles inline payment wrappers without jQuery change helpers', () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"><div class="ff-el-input--content"><label><input class="ff_payment_method" type="radio" name="payment_method_1" value="square"></label><label><input class="ff_payment_method" type="radio" name="payment_method_1" value="paypal"></label><div class="stripe-inline-wrapper ff_pay_inline" style="display: none"></div><div class="square-inline-wrapper ff_pay_inline" style="display: none"></div></div></form></body></html>',
        { settings: { id: 54 } }
    );

    const PaymentHandlerClass = loadProLegacyPaymentHandlerClass(window);
    const formElement = window.document.querySelector('form');
    const squareInput = window.document.querySelector('input[value="square"]');
    const paypalInput = window.document.querySelector('input[value="paypal"]');
    const squareWrapper = window.document.querySelector('.square-inline-wrapper');

    const handler = Object.create(PaymentHandlerClass.prototype);
    handler.$form = window.jQuery(formElement);
    handler.paymentMethod = '';

    handler.initPaymentMethodChange();

    squareInput.checked = true;
    squareInput.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(handler.paymentMethod, 'square');
    assert.equal(squareWrapper.style.display, 'block');

    squareInput.checked = false;
    paypalInput.checked = true;
    paypalInput.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(handler.paymentMethod, 'paypal');
    assert.equal(squareWrapper.style.display, 'none');
});

test('free payment handler creates coupon state field once and updates it', () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"></form></body></html>',
        { settings: { id: 54 } }
    );

    const PaymentHandlerClass = loadFreePaymentHandlerClass(window);
    const formElement = window.document.querySelector('form');

    const handler = Object.create(PaymentHandlerClass.prototype);
    handler.$form = window.jQuery(formElement);
    handler.appliedCoupons = { SAVE10: { code: 'SAVE10' } };

    const firstField = handler.ensureAppliedCouponsField();
    const secondField = handler.ensureAppliedCouponsField();

    assert.equal(firstField, secondField);
    assert.equal(window.document.querySelectorAll('.__ff_all_applied_coupons').length, 1);

    handler.setAppliedCouponsFieldValue();

    assert.equal(firstField.value, JSON.stringify(['SAVE10']));
});

test('pro legacy payment handler creates coupon state field once and updates it', () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"></form></body></html>',
        { settings: { id: 54 } }
    );

    const PaymentHandlerClass = loadProLegacyPaymentHandlerClass(window);
    const formElement = window.document.querySelector('form');

    const handler = Object.create(PaymentHandlerClass.prototype);
    handler.$form = window.jQuery(formElement);
    handler.appliedCoupons = { SAVE10: { code: 'SAVE10' } };

    const firstField = handler.ensureAppliedCouponsField();
    const secondField = handler.ensureAppliedCouponsField();

    assert.equal(firstField, secondField);
    assert.equal(window.document.querySelectorAll('.__ff_all_applied_coupons').length, 1);

    handler.setAppliedCouponsFieldValue();

    assert.equal(firstField.value, JSON.stringify(['SAVE10']));
});

test('free payment handler appends stripe payment method id via promise validator', async () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"></form></body></html>',
        { settings: { id: 54 } }
    );

    const PaymentHandlerClass = loadFreePaymentHandlerClass(window);
    const formElement = window.document.querySelector('form');
    let registeredValidator = null;
    let hideProgressCalls = 0;

    const handler = Object.create(PaymentHandlerClass.prototype);
    handler.$form = window.jQuery(formElement);
    handler.formId = 54;
    handler.paymentMethod = 'stripe';
    handler.hasPaymentItems = false;
    handler.formInstance = {
        addGlobalValidator(name, callback) {
            registeredValidator = callback;
            assert.equal(name, 'stripeInlinePayment');
        },
        showFormSubmissionProgress() {},
        hideFormSubmissionProgress() {
            hideProgressCalls += 1;
        }
    };
    handler.stripe = {
        createPaymentMethod() {
            return Promise.resolve({
                paymentMethod: {
                    id: 'pm_test_123'
                }
            });
        }
    };
    handler.stripeCard = {
        update() {}
    };
    handler.getPaymentMessage = (key, fallback) => fallback;
    handler.toggleStripeInlineCardError = () => {};

    handler.registerStripePaymentToken('ff_missing_inline');

    const formData = { data: 'foo=bar' };

    await registeredValidator(handler.$form, formData);

    assert.match(formData.data, /foo=bar/);
    assert.match(formData.data, /__stripe_payment_method_id=pm_test_123/);
    assert.equal(hideProgressCalls, 1);
});

test('pro legacy payment handler appends square tokens via promise validator', async () => {
    const window = createWindow(
        '<!doctype html><html><body><form class="frm-fluent-form fluentform_has_payment"></form></body></html>',
        { settings: { id: 54 } }
    );

    const PaymentHandlerClass = loadProLegacyPaymentHandlerClass(window);
    const formElement = window.document.querySelector('form');
    let registeredValidator = null;

    const handler = Object.create(PaymentHandlerClass.prototype);
    handler.$form = window.jQuery(formElement);
    handler.formId = 54;
    handler.paymentMethod = 'square';
    handler.hasPaymentItems = false;
    handler.totalAmount = 25;
    handler.formPaymentConfig = {
        currency_settings: {
            currency: 'USD'
        }
    };
    handler.formInstance = {
        addGlobalValidator(name, callback) {
            registeredValidator = callback;
            assert.equal(name, 'squareInlinePayment');
        },
        showFormSubmissionProgress() {},
        hideFormSubmissionProgress() {}
    };
    handler.squareCard = {
        tokenize() {
            return Promise.resolve({
                status: 'OK',
                token: 'sq_tok_123'
            });
        }
    };
    handler.square = {
        verifyBuyer() {
            return Promise.resolve({
                token: 'buyer_tok_123'
            });
        }
    };
    handler.$t = (key) => key;
    handler.toggleSquareInlineCardError = () => {};

    handler.registerSquarePaymentToken('ff_missing_square_inline');

    const formData = { data: 'foo=bar' };

    await registeredValidator(handler.$form, formData);

    assert.match(formData.data, /__square_payment_method_id=sq_tok_123/);
    assert.match(formData.data, /__square_verify_buyer_id=buyer_tok_123/);
});
