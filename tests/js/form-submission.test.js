const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const runtimeSource = fs.readFileSync(
    path.resolve(__dirname, '../../resources/assets/public/form-submission.js'),
    'utf8'
);

function createRuntimeHtml(formInnerHtml) {
    return `
        <!doctype html>
        <html>
            <body>
                <div class="fluentform">
                    <div class="ff-errors-in-stack"></div>
                    ${formInnerHtml}
                </div>
            </body>
        </html>
    `;
}

function createFormMarkup(extraInnerHtml = '') {
    return `
        <form class="frm-fluent-form form1" data-form_instance="form1" data-form_id="1">
            <input type="text" name="first_name" value="Alice">
            <input type="checkbox" name="terms" value="yes" checked>
            <input type="checkbox" name="empty_group" value="placeholder">
            <select name="colors" multiple>
                <option value="red" selected>Red</option>
                <option value="blue" selected>Blue</option>
                <option value="green">Green</option>
            </select>
            ${extraInnerHtml}
            <button type="submit" class="ff-btn-submit">Submit</button>
            <button type="reset">Reset</button>
        </form>
    `;
}

function createJqueryStub(callLog) {
    function jquery(target) {
        return {
            ready() {
                return this;
            },
            trigger(eventName, args) {
                callLog.push({ target, eventName, args });
                return this;
            }
        };
    }

    return jquery;
}

function createRuntimeWindow(options = {}) {
    const dom = new JSDOM(options.html || createRuntimeHtml(''), {
        runScripts: 'outside-only',
        url: 'https://example.test/form-page'
    });
    const { window } = dom;
    const jqueryCalls = [];

    window.currency = (value) => ({
        value: Number(value || 0),
        format: () => String(value)
    });
    window.fluentFormVars = {
        ajaxUrl: 'https://example.test/wp-admin/admin-ajax.php'
    };
    window.fluentform_submission_messages_global = {
        file_upload_in_progress: 'File upload in progress. Please wait...',
        javascript_handler_failed: 'Javascript handler could not be loaded. Form submission has been failed. Reload the page and try again'
    };
    window.fluent_form_form1 = {
        id: '1',
        form_id_selector: 'fluentform_1',
        ajaxUrl: 'https://example.test/wp-admin/admin-ajax.php',
        rules: {}
    };
    window.fetch = options.fetchImpl || (async () => ({
        json: async () => ({
            data: {
                result: {
                    message: 'Submitted'
                }
            }
        })
    }));

    if (!window.CSS) {
        window.CSS = {};
    }
    if (!window.CSS.escape) {
        window.CSS.escape = (value) => String(value).replace(/"/g, '\\"');
    }
    if (!window.HTMLElement.prototype.scrollIntoView) {
        window.HTMLElement.prototype.scrollIntoView = function () { };
    }
    if (!window.HTMLElement.prototype.focus) {
        window.HTMLElement.prototype.focus = function () { };
    }

    if (options.grecaptcha) {
        window.grecaptcha = options.grecaptcha;
    }
    if (options.withJquery) {
        const jquery = createJqueryStub(jqueryCalls);
        window.jQuery = jquery;
        window.$ = jquery;
    }

    window.eval(runtimeSource);

    return { dom, window, jqueryCalls };
}

async function flushAsync(window, cycles = 4) {
    for (let cycle = 0; cycle < cycles; cycle += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
}

test('boots the vanilla runtime and exposes public globals', () => {
    const { window } = createRuntimeWindow();

    assert.equal(typeof window.fluentFormBridge, 'object');
    assert.equal(typeof window.fluentFormBridge.emitEvent, 'function');
    assert.equal(typeof window.fluentFormApp, 'function');
    assert.equal(typeof window.ff_helper.numericVal, 'function');
    assert.equal(typeof window.ff_helper.formatCurrency, 'function');
});

test('bridge emits legacy jQuery events without dispatching duplicate native DOM events when jQuery is present', () => {
    const { window, jqueryCalls } = createRuntimeWindow({ withJquery: true });
    const nativeEvents = [];

    window.document.addEventListener('fluentform_demo', (event) => {
        nativeEvents.push(event);
    });

    window.fluentFormBridge.emitEvent(
        'fluentform_demo',
        { ok: true },
        window.document,
        [{ legacy: true }],
        { bubbles: false }
    );

    assert.equal(nativeEvents.length, 0);
    assert.equal(jqueryCalls.length, 1);
    assert.equal(jqueryCalls[0].eventName, 'fluentform_demo');
    assert.deepEqual(jqueryCalls[0].args, [{ legacy: true }]);
});

test('fluentFormApp reuses live instances and replaces stale detached ones', () => {
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(createFormMarkup())
    });
    const originalForm = window.document.querySelector('form.frm-fluent-form');

    const firstInstance = window.fluentFormApp(originalForm);
    const secondInstance = window.fluentFormApp(originalForm);

    assert.equal(firstInstance, secondInstance);

    originalForm.remove();

    const replacementHost = window.document.createElement('div');
    replacementHost.innerHTML = createFormMarkup();
    const replacementForm = replacementHost.querySelector('form');
    window.document.querySelector('.fluentform').appendChild(replacementForm);

    const replacementInstance = window.fluentFormApp(replacementForm);

    assert.notEqual(replacementInstance, firstInstance);
    assert.equal(replacementInstance.formElement, replacementForm);
});

test('submits with native fetch, preserves payload fields, and emits success and reset events', async () => {
    const fetchCalls = [];
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(createFormMarkup()),
        fetchImpl: async (url, options) => {
            fetchCalls.push({ url, options });
            return {
                json: async () => ({
                    data: {
                        result: {
                            message: 'Thanks for submitting'
                        }
                    }
                })
            };
        }
    });
    const form = window.document.querySelector('form.frm-fluent-form');
    const formSuccessEvents = [];
    const bodySuccessEvents = [];
    const resetEvents = [];

    form.addEventListener('fluentform_submission_success', (event) => {
        formSuccessEvents.push(event.detail);
    });
    window.document.body.addEventListener('fluentform_submission_success', (event) => {
        bodySuccessEvents.push(event.detail);
    });
    window.document.body.addEventListener('fluentform_reset', (event) => {
        if (event.detail) {
            resetEvents.push(event.detail);
        }
    });

    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await flushAsync(window);

    assert.equal(fetchCalls.length, 1);
    const requestParams = new window.URLSearchParams(fetchCalls[0].options.body);
    const serializedFields = new window.URLSearchParams(requestParams.get('data'));

    assert.equal(requestParams.get('action'), 'fluentform_submit');
    assert.equal(requestParams.get('form_id'), '1');
    assert.equal(serializedFields.get('first_name'), 'Alice');
    assert.equal(serializedFields.get('terms'), 'yes');
    assert.equal(serializedFields.get('empty_group'), '');
    assert.deepEqual(serializedFields.getAll('colors'), ['red', 'blue']);
    assert.equal(formSuccessEvents.length, 1);
    assert.equal(bodySuccessEvents.length, 1);
    assert.equal(resetEvents.length, 2);
    assert.equal(form.classList.contains('ff_submitting'), false);
    assert.equal(form.querySelector('.ff-btn-submit').disabled, false);
    assert.equal(window.document.getElementById('fluentform_1_success').textContent, 'Thanks for submitting');
});

test('emits failure and resets captcha when request fails', async () => {
    const grecaptcha = {
        resetCalls: [],
        getResponse() {
            return 'captcha-token';
        },
        reset(widgetId) {
            this.resetCalls.push(widgetId);
        }
    };
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(createFormMarkup('<div class="ff-el-recaptcha g-recaptcha" data-g-recaptcha_widget_id="widget-1"></div>')),
        grecaptcha,
        fetchImpl: async () => {
            throw new Error('Request failed');
        }
    });
    const form = window.document.querySelector('form.frm-fluent-form');
    const failureEvents = [];

    form.addEventListener('fluentform_submission_failed', (event) => {
        failureEvents.push(event.detail);
    });

    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await flushAsync(window);

    assert.equal(failureEvents.length, 1);
    assert.equal(failureEvents[0].form, form);
    assert.equal(failureEvents[0].config.id, '1');
    assert.match(String(form.parentElement.querySelector('.ff-errors-in-stack .error').textContent), /Request failed/);
    assert.deepEqual(grecaptcha.resetCalls, ['widget-1']);
});

test('emits next-action events and preserves appended hidden data', async () => {
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(createFormMarkup()),
        fetchImpl: async () => ({
            json: async () => ({
                data: {
                    result: {},
                    nextAction: 'payment',
                    append_data: {
                        payment_token: 'tok_123'
                    }
                }
            })
        })
    });
    const form = window.document.querySelector('form.frm-fluent-form');
    const nextActionEvents = [];
    let resetEvents = 0;

    form.addEventListener('fluentform_next_action_payment', (event) => {
        nextActionEvents.push(event.detail);
    });
    window.document.body.addEventListener('fluentform_reset', () => {
        resetEvents += 1;
    });

    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await flushAsync(window);

    assert.equal(nextActionEvents.length, 1);
    assert.equal(nextActionEvents[0].response.data.nextAction, 'payment');
    assert.equal(form.querySelector('input[name="payment_token"]').value, 'tok_123');
    assert.equal(resetEvents, 0);
    assert.equal(form.querySelector('input[name="first_name"]').value, 'Alice');
    assert.equal(window.document.getElementById('fluentform_1_success'), null);
});

test('reinit guard prevents recursive ff_reinit loops and marks the form as reinitialized', async () => {
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(createFormMarkup())
    });
    const form = window.document.querySelector('form.frm-fluent-form');
    let reinitEvents = 0;

    window.document.addEventListener('ff_reinit', () => {
        reinitEvents += 1;
    });

    window.document.dispatchEvent(new window.CustomEvent('ff_reinit', {
        detail: {
            formItem: form
        }
    }));
    await flushAsync(window);

    assert.equal(form.getAttribute('data-ff_reinit'), 'yes');
    assert.equal(reinitEvents, 2);
});

test('shows the loading-form fallback error when the runtime handler is missing', () => {
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml('<form class="ff-form-loading"><button type="submit">Submit</button></form>')
    });
    const loadingForm = window.document.querySelector('form.ff-form-loading');

    loadingForm.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));

    assert.match(
        window.document.querySelector('.ff_msg_temp').textContent,
        /Javascript handler could not be loaded/
    );
});
