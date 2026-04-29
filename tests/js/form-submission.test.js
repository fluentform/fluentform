const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const runtimeSource = fs.readFileSync(
    path.resolve(__dirname, '../../resources/assets/public/form-submission.js'),
    'utf8'
);
const calculationsSource = fs.readFileSync(
    path.resolve(__dirname, '../../resources/assets/public/Pro/calculations.js'),
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

function createJqueryStub(callLog, window) {
    const listeners = new Map();
    const dataStore = new WeakMap();

    function getEventStore(target) {
        if (!listeners.has(target)) {
            listeners.set(target, new Map());
        }

        return listeners.get(target);
    }

    function normalizeElements(target) {
        if (!target) {
            return [];
        }

        if (target.__jqueryStub && Array.isArray(target.elements)) {
            return target.elements;
        }

        if (typeof target === 'string') {
            return Array.from(window.document.querySelectorAll(target));
        }

        if (target === window || target === window.document || target.nodeType) {
            return [target];
        }

        if (Array.isArray(target)) {
            return target;
        }

        if (typeof target.length === 'number' && target[0]) {
            return Array.from(target);
        }

        return [target];
    }

    function getDataBucket(element) {
        if (!element || typeof element !== 'object') {
            return {};
        }

        if (!dataStore.has(element)) {
            dataStore.set(element, {});
        }

        return dataStore.get(element);
    }

    function jquery(target) {
        const elements = normalizeElements(target);
        const wrapper = {
            0: elements[0],
            length: elements.length,
            elements,
            __jqueryStub: true,
            ready(handler) {
                if (typeof handler === 'function') {
                    handler.call(window.document, jquery);
                }

                return this;
            },
            attr(name, value) {
                const element = elements[0];
                if (!element || element.nodeType !== 1) {
                    return undefined;
                }

                if (typeof value === 'undefined') {
                    return element.getAttribute(name);
                }

                element.setAttribute(name, value);
                return this;
            },
            prop(name, value) {
                const element = elements[0];
                if (!element) {
                    return undefined;
                }

                if (typeof value === 'undefined') {
                    return element[name];
                }

                element[name] = value;
                return this;
            },
            on(eventName, handler) {
                elements.forEach((element) => {
                    const eventStore = getEventStore(element);
                    const handlers = eventStore.get(eventName) || [];
                    handlers.push(handler);
                    eventStore.set(eventName, handlers);
                });
                return this;
            },
            one(eventName, handler) {
                elements.forEach((element) => {
                    const onceHandler = function (...args) {
                        jquery(element).off(eventName, onceHandler);
                        return handler.apply(this, args);
                    };

                    jquery(element).on(eventName, onceHandler);
                });
                return this;
            },
            off(eventName, handler) {
                elements.forEach((element) => {
                    const eventStore = getEventStore(element);
                    const handlers = eventStore.get(eventName) || [];
                    eventStore.set(
                        eventName,
                        handlers.filter((registeredHandler) => registeredHandler !== handler)
                    );
                });
                return this;
            },
            trigger(eventName, args) {
                elements.forEach((element) => {
                    callLog.push({ target: element, eventName, args });
                    const eventStore = listeners.get(element);
                    const handlers = eventStore ? (eventStore.get(eventName) || []) : [];
                    handlers.forEach((handler) => {
                        const handlerArguments = [{ type: eventName, target: element }].concat(args || []);
                        handler.apply(element, handlerArguments);
                    });
                });
                return this;
            },
            each(callback) {
                elements.forEach((element, index) => {
                    callback.call(element, index, element);
                });
                return this;
            },
            data(key, value) {
                const element = elements[0];
                if (!element) {
                    return typeof value === 'undefined' ? undefined : this;
                }

                const bucket = getDataBucket(element);
                if (typeof value === 'undefined') {
                    if (Object.prototype.hasOwnProperty.call(bucket, key)) {
                        return bucket[key];
                    }

                    if (element.dataset) {
                        const datasetKey = String(key).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
                        return element.dataset[datasetKey];
                    }

                    return undefined;
                }

                bucket[key] = value;
                return this;
            },
            hasClass(className) {
                const element = elements[0];
                return !!(element && element.classList && element.classList.contains(className));
            },
            addClass(className) {
                elements.forEach((element) => {
                    if (element.classList) {
                        element.classList.add(...String(className).split(/\s+/).filter(Boolean));
                    }
                });
                return this;
            },
            removeClass(className) {
                elements.forEach((element) => {
                    if (element.classList) {
                        element.classList.remove(...String(className).split(/\s+/).filter(Boolean));
                    }
                });
                return this;
            },
            val(value) {
                const element = elements[0];
                if (!element) {
                    return typeof value === 'undefined' ? undefined : this;
                }

                if (typeof value === 'undefined') {
                    return element.value;
                }

                element.value = value;
                return this;
            },
            is(selector) {
                const element = elements[0];
                return !!(element && element.matches && element.matches(selector));
            },
            find(selector) {
                const foundElements = elements.flatMap((element) => Array.from(element.querySelectorAll(selector)));
                return jquery(foundElements);
            },
            closest(selector) {
                const element = elements[0];
                return jquery(element && element.closest ? element.closest(selector) : null);
            },
            filter(callback) {
                return jquery(elements.filter((element, index) => callback.call(element, index, element)));
            },
            first() {
                return jquery(elements[0] || null);
            },
            remove() {
                elements.forEach((element) => {
                    if (element && typeof element.remove === 'function') {
                        element.remove();
                    }
                });
                return this;
            },
            offset() {
                return { top: 0, left: 0 };
            },
            animate() {
                return this;
            },
            height() {
                return 768;
            }
        };

        return wrapper;
    }

    jquery.fn = {};
    jquery.each = function each(collection, callback) {
        if (Array.isArray(collection) || typeof collection.length === 'number') {
            Array.from(collection).forEach((item, index) => callback.call(item, index, item));
            return collection;
        }

        Object.keys(collection || {}).forEach((key) => callback.call(collection[key], key, collection[key]));
        return collection;
    };
    jquery.isFunction = function isFunction(value) {
        return typeof value === 'function';
    };
    jquery.isNumeric = function isNumeric(value) {
        return !Number.isNaN(Number(value));
    };
    jquery.trim = function trim(value) {
        return String(value == null ? '' : value).trim();
    };

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
    if (options.hcaptcha) {
        window.hcaptcha = options.hcaptcha;
    }
    if (options.turnstile) {
        window.turnstile = options.turnstile;
    }
    if (options.withJquery) {
        const jquery = createJqueryStub(jqueryCalls, window);
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

function loadCalculationsModule(window) {
    const module = { exports: {} };
    const source = calculationsSource
        .replace('export const mexpToken =', 'const mexpToken =')
        .replace('export function findAll', 'function findAll')
        .replace('export function isContain', 'function isContain')
        .replace('export function getName', 'function getName')
        .replace('export default function', 'function defaultExport')
        + '\nmodule.exports = { default: defaultExport, mexpToken, findAll, isContain, getName };';

    const factory = new Function('window', 'document', 'module', 'exports', 'Event', 'mexp', source);
    factory(window, window.document, module, module.exports, window.Event, window.mexp);

    return module.exports;
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

test('bridge onEvent listens to custom events in both native and jQuery modes', () => {
    const nativeRuntime = createRuntimeWindow();
    const nativeCalls = [];

    nativeRuntime.window.fluentFormBridge.onEvent(
        nativeRuntime.window.document.body,
        'fluentform_demo',
        (event, detail, args, source) => {
            nativeCalls.push({ event, detail, args, source });
        }
    );
    nativeRuntime.window.fluentFormBridge.emitEvent(
        'fluentform_demo',
        { ok: true },
        nativeRuntime.window.document.body,
        [{ legacy: true }]
    );

    assert.equal(nativeCalls.length, 1);
    assert.equal(nativeCalls[0].source, 'native');
    assert.equal(JSON.stringify(nativeCalls[0].detail), JSON.stringify({ ok: true }));
    assert.equal(JSON.stringify(nativeCalls[0].args), JSON.stringify([{ ok: true }]));

    const jqueryRuntime = createRuntimeWindow({ withJquery: true });
    const jqueryModeCalls = [];

    jqueryRuntime.window.fluentFormBridge.onEvent(
        jqueryRuntime.window.document.body,
        'fluentform_demo',
        (event, detail, args, source) => {
            jqueryModeCalls.push({ event, detail, args, source });
        }
    );
    jqueryRuntime.window.fluentFormBridge.emitEvent(
        'fluentform_demo',
        { ok: true },
        jqueryRuntime.window.document.body,
        [{ legacy: true }]
    );

    assert.equal(jqueryModeCalls.length, 1);
    assert.equal(jqueryModeCalls[0].source, 'jquery');
    assert.equal(JSON.stringify(jqueryModeCalls[0].detail), JSON.stringify({ legacy: true }));
    assert.equal(JSON.stringify(jqueryModeCalls[0].args), JSON.stringify([{ legacy: true }]));
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

test('legacy jQuery fluentFormApp accepts DOM form elements from slider callers', () => {
    const { window } = createRuntimeWindow({ withJquery: true });
    const host = window.document.querySelector('.fluentform');
    host.insertAdjacentHTML('beforeend', createFormMarkup());
    const form = host.querySelector('form.frm-fluent-form');

    const instanceFromDomNode = window.fluentFormApp(form);
    const instanceFromJqueryWrapper = window.fluentFormApp(window.jQuery(form));

    assert.ok(instanceFromDomNode);
    assert.equal(instanceFromDomNode, instanceFromJqueryWrapper);
});

test('legacy jQuery validator accepts DOM field arrays from slider step navigation', () => {
    const { window } = createRuntimeWindow({
        withJquery: true,
        html: createRuntimeHtml(`
            <form class="frm-fluent-form form1" data-form_instance="form1" data-form_id="1">
                <div class="ff-el-group">
                    <input type="text" name="book_title" value="">
                </div>
            </form>
        `)
    });
    window.fluent_form_form1.rules = {
        book_title: {
            required: {
                value: true,
                message: 'Book Title is Required...!'
            }
        }
    };

    const form = window.document.querySelector('form.frm-fluent-form');
    const app = window.fluentFormApp(form);
    let thrownError = null;

    try {
        app.validate([form.querySelector('input[name="book_title"]')]);
    } catch (error) {
        thrownError = error;
    }

    assert.notEqual(thrownError, null);
    assert.equal(thrownError.messages.book_title.required, 'Book Title is Required...!');
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

test('submits uploaded file preview references in the same field naming shape', async () => {
    const fetchCalls = [];
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(createFormMarkup(`
            <div class="ff-el-group">
                <div class="ff-el-input--content">
                    <input type="file" name="resume">
                    <div class="ff-uploaded-list">
                        <div class="ff-upload-preview" data-src="https://example.test/uploads/resume-a.pdf"></div>
                        <div class="ff-upload-preview" data-src="https://example.test/uploads/resume-b.pdf"></div>
                    </div>
                </div>
            </div>
        `)),
        fetchImpl: async (url, options) => {
            fetchCalls.push({ url, options });
            return {
                json: async () => ({
                    data: {
                        result: {
                            message: 'Uploaded'
                        }
                    }
                })
            };
        }
    });
    const form = window.document.querySelector('form.frm-fluent-form');

    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await flushAsync(window);

    assert.equal(fetchCalls.length, 1);
    const requestParams = new window.URLSearchParams(fetchCalls[0].options.body);
    const serializedFields = new window.URLSearchParams(requestParams.get('data'));

    assert.deepEqual(serializedFields.getAll('resume[]'), [
        'https://example.test/uploads/resume-a.pdf',
        'https://example.test/uploads/resume-b.pdf'
    ]);
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

test('blocks submission while upload previews are still marked as uploading', async () => {
    const fetchCalls = [];
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(createFormMarkup(`
            <div class="ff-el-group">
                <div class="ff-el-input--content">
                    <input type="file" name="resume">
                    <div class="ff-uploaded-list">
                        <div class="ff-upload-preview ff_uploading" data-src="https://example.test/uploads/resume-a.pdf"></div>
                    </div>
                </div>
            </div>
        `)),
        fetchImpl: async (url, options) => {
            fetchCalls.push({ url, options });
            return {
                json: async () => ({
                    data: {
                        result: {
                            message: 'Should not submit'
                        }
                    }
                })
            };
        }
    });
    const form = window.document.querySelector('form.frm-fluent-form');

    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await flushAsync(window);

    assert.equal(fetchCalls.length, 0);
    assert.match(
        String(form.parentElement.querySelector('.ff-errors-in-stack .error').textContent),
        /File upload in progress\. Please wait\.\.\./
    );
    assert.equal(form.classList.contains('ff_submitting'), false);
});

test('emits failure and resets hcaptcha and turnstile when request fails', async () => {
    const hcaptcha = {
        resetCalls: [],
        getResponse() {
            return 'hcaptcha-token';
        },
        reset(widgetId) {
            this.resetCalls.push(widgetId);
        }
    };
    const turnstile = {
        resetCalls: [],
        getResponse() {
            return 'turnstile-token';
        },
        reset(widgetId) {
            this.resetCalls.push(widgetId);
        }
    };
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(createFormMarkup(`
            <div class="ff-el-hcaptcha h-captcha" data-h-captcha_widget_id="h-widget-1"></div>
            <div class="ff-el-turnstile cf-turnstile" data-cf-turnstile_widget_id="t-widget-1"></div>
        `)),
        hcaptcha,
        turnstile,
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
    assert.deepEqual(hcaptcha.resetCalls, ['h-widget-1']);
    assert.deepEqual(turnstile.resetCalls, ['t-widget-1']);
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

test('native validator blocks required fields and renders inline errors', () => {
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(`
            <form class="frm-fluent-form form1" data-form_instance="form1" data-form_id="1">
                <div class="ff-el-group">
                    <input type="text" name="book_title" value="" data-name="book_title">
                </div>
            </form>
        `)
    });
    const form = window.document.querySelector('form.frm-fluent-form');
    window.fluent_form_form1.rules = {
        book_title: {
            required: {
                value: true,
                message: 'Book Title is Required...!'
            }
        }
    };

    const app = window.fluentFormApp(form);
    const errorGroup = form.querySelector('.ff-el-group');
    const scrollCalls = [];
    let thrownError = null;

    errorGroup.scrollIntoView = (options) => {
        scrollCalls.push(options);
    };

    try {
        app.validate([form.querySelector('input[name="book_title"]')]);
    } catch (error) {
        thrownError = error;
    }

    assert.notEqual(thrownError, null);
    assert.equal(typeof thrownError.messages, 'object');
    assert.equal(thrownError.messages.book_title.required, 'Book Title is Required...!');

    app.showErrorMessages(thrownError.messages);
    app.scrollToFirstError();

    assert.equal(errorGroup.classList.contains('ff-el-is-error'), true);
    assert.equal(form.querySelector('input[name="book_title"]').getAttribute('aria-invalid'), 'true');
    assert.match(form.parentElement.querySelector('.ff-errors-in-stack').textContent, /Book Title is Required/);
    assert.equal(JSON.stringify(scrollCalls), JSON.stringify([{
        behavior: 'smooth',
        block: 'center'
    }]));
});

test('plain-js calculations module recalculates from native field changes', () => {
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(`
            <form class="frm-fluent-form form1" data-form_instance="form1" data-form_id="1">
                <input type="number" name="quantity" value="2">
                <input type="text" class="ff_has_formula" data-calculation_formula="{input.quantity} * 3" value="">
            </form>
        `),
        withJquery: true
    });
    window.mexp = {
        addToken() {},
        eval(expression) {
            return Function('return (' + expression + ')')();
        }
    };
    window.ff_helper = {
        numericVal(element) {
            return Number(element.value || 0);
        },
        formatCurrency(element, value) {
            return String(value);
        }
    };
    const calculationsModule = loadCalculationsModule(window);
    const form = window.document.querySelector('form');
    const quantityField = form.querySelector('input[name="quantity"]');
    const resultField = form.querySelector('.ff_has_formula');

    calculationsModule.default(window.jQuery, form, {});

    assert.equal(resultField.value, '6');

    quantityField.value = '4';
    quantityField.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(resultField.value, '12');

});

test('native step-form reset emits legacy update_slider payload before fluentform_reset', async () => {
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(`
            <form class="frm-fluent-form form1 ff-form-has-steps" data-form_instance="form1" data-form_id="1">
                <div class="ff-step-container"></div>
                <button type="reset">Reset</button>
            </form>
        `)
    });
    const form = window.document.querySelector('form.frm-fluent-form');
    const eventOrder = [];
    const sliderPayloads = [];
    const resetPayloads = [];

    form.addEventListener('update_slider', (event) => {
        eventOrder.push('update_slider');
        sliderPayloads.push(event.detail);
    });
    window.document.body.addEventListener('fluentform_reset', (event) => {
        eventOrder.push('fluentform_reset');
        resetPayloads.push(event.detail);
    });

    form.dispatchEvent(new window.Event('reset', { bubbles: true, cancelable: true }));
    await flushAsync(window, 1);

    assert.deepEqual(eventOrder, ['update_slider', 'fluentform_reset']);
    assert.equal(sliderPayloads.length, 1);
    assert.equal(JSON.stringify(sliderPayloads[0]), JSON.stringify({
        goBackToStep: 0,
        animDuration: 0,
        isScrollTop: false,
        actionType: 'next'
    }));
    assert.equal(resetPayloads.length, 1);
    assert.equal(resetPayloads[0].form, form);
    assert.equal(resetPayloads[0].config.id, '1');
});

test('native step-form submit emits legacy update_slider payload for server-side step errors', async () => {
    const { window } = createRuntimeWindow({
        html: createRuntimeHtml(`
            <form class="frm-fluent-form form1 ff-form-has-steps" data-form_instance="form1" data-form_id="1">
                <div class="ff-step-container"></div>
                <div class="fluentform-step active">
                    <div class="ff-el-group">
                        <div class="ff-el-input--content">
                            <input type="text" name="first_name" value="Alice">
                        </div>
                    </div>
                </div>
                <div class="fluentform-step" style="display:none;">
                    <div class="ff-el-group">
                        <div class="ff-el-input--content">
                            <input type="text" name="late_field" data-name="late_field" value="">
                        </div>
                    </div>
                </div>
                <button type="submit" class="ff-btn-submit">Submit</button>
            </form>
        `),
        fetchImpl: async () => ({
            json: async () => ({
                errors: {
                    late_field: ['Late field is required']
                }
            })
        })
    });

    window.fluentFormVars.stepAnimationDuration = '350';
    const form = window.document.querySelector('form.frm-fluent-form');
    const sliderPayloads = [];

    form.addEventListener('update_slider', (event) => {
        sliderPayloads.push(event.detail);
    });

    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await flushAsync(window, 2);

    assert.equal(sliderPayloads.length, 1);
    assert.equal(JSON.stringify(sliderPayloads[0]), JSON.stringify({
        goBackToStep: 1,
        animDuration: 350,
        isScrollTop: false,
        actionType: 'next'
    }));
    assert.equal(form.querySelector('input[name="late_field"]').getAttribute('aria-invalid'), 'true');
    assert.equal(form.querySelectorAll('.ff-el-group.ff-el-is-error').length, 1);
});
