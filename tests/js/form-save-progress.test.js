const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function createDom(html) {
    return new JSDOM(html, {
        runScripts: 'outside-only',
        url: 'https://example.test'
    });
}

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 10));
}

function createBridge(window) {
    return {
        emitEvent(eventName, detail, targetElement) {
            (targetElement || window.document).dispatchEvent(new window.CustomEvent(eventName, {
                detail,
                bubbles: true
            }));
        },
        onEvent(targetElement, eventNames, handler) {
            const names = Array.isArray(eventNames)
                ? eventNames
                : String(eventNames).split(/\s+/).filter(Boolean);
            const removers = names.map((eventName) => {
                const listener = (event) => handler(event, event.detail, [event.detail], 'native');
                targetElement.addEventListener(eventName, listener);
                return () => targetElement.removeEventListener(eventName, listener);
            });

            return () => removers.forEach((removeListener) => removeListener());
        }
    };
}

function loadFormSaveProgressModule(window, formSlider) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../resources/assets/public/form-save-progress.js'),
        'utf8'
    ).replace('import formSlider from "./Pro/slider";\n\n', '');

    const factory = new Function('window', 'document', 'formSlider', 'fetch', 'navigator', source);
    factory(window, window.document, formSlider, window.fetch, window.navigator);
}

test('form-save-progress posts saved state without requiring jQuery', async () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form
                    class="frm-fluent-form ff-form-loaded ff-form-has-save-progress ff_form_instance_test"
                    data-form_instance="ff_form_instance_test"
                    data-form_id="42"
                >
                    <div class="ff-el-group">
                        <input type="text" name="full_name" value="Ada Lovelace">
                    </div>
                    <div class="ff-el-group has-conditions ff_excluded">
                        <input type="text" name="hidden_field" value="ignore me">
                    </div>
                    <div class="ff-el-group">
                        <button type="button" class="ff-btn-save-progress" name="save_button">Save</button>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const requests = [];

    window.fluentFormVars = { ajaxUrl: 'https://example.test/wp-admin/admin-ajax.php' };
    window.form_state_save_vars = {
        source_url: 'https://example.test/source',
        nonce: 'save-nonce',
        copy_button: 'Copy',
        copy_success_button: 'Copied',
        email_button: 'Email',
        email_placeholder_str: 'Email here'
    };
    window.fluentFormBridge = createBridge(window);
    window.navigator.clipboard = {
        writeText: async () => {}
    };
    window.fetch = async (url, options) => {
        requests.push({ url, options });
        return {
            ok: true,
            json: async () => ({
                data: {
                    hash: 'hash-1',
                    message: 'Saved successfully',
                    saved_url: 'https://example.test/resume/hash-1'
                }
            })
        };
    };

    loadFormSaveProgressModule(window, () => ({
        populateFormDataAndSetActiveStep() {}
    }));

    window.document.body.dispatchEvent(new window.CustomEvent('fluentform_init', {
        detail: {
            form: formElement,
            config: {
                id: 42,
                form_instance: 'ff_form_instance_test'
            }
        },
        bubbles: true
    }));

    formElement.querySelector('.ff-btn-save-progress').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await flushPromises();

    assert.equal(requests.length, 1);
    const body = requests[0].options.body;
    assert.match(body, /action=fluentform_save_form_progress_with_link/);
    assert.match(body, /form_id=42/);
    assert.match(body, /active_step=no/);
    assert.match(body, /data=full_name%3DAda%2BLovelace/);
    assert.doesNotMatch(body, /hidden_field%3D/);
    assert.equal(formElement.querySelector('.ff-saved-state-link input').value, 'https://example.test/resume/hash-1');
    assert.equal(formElement.querySelector('.ff-btn-save-progress').parentElement.style.display, 'none');
});

test('form-save-progress tracks current step from native bridge events', async () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form
                    class="frm-fluent-form ff-form-loaded ff-form-has-save-progress ff-form-has-steps ff_form_instance_test"
                    data-form_instance="ff_form_instance_test"
                    data-form_id="88"
                >
                    <div class="ff-step-container" data-enable_step_data_persistency="yes"></div>
                    <div class="ff-el-group">
                        <button type="button" class="ff-btn-save-progress" name="save_button">Save</button>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const requests = [];

    window.fluentFormVars = { ajaxUrl: 'https://example.test/wp-admin/admin-ajax.php' };
    window.form_state_save_vars = {
        source_url: 'https://example.test/source',
        nonce: 'save-nonce'
    };
    window.fluentFormBridge = createBridge(window);
    window.fetch = async (url, options) => {
        requests.push({ url, options });
        return {
            ok: true,
            json: async () => ({
                data: {
                    hash: 'hash-2',
                    message: '',
                    saved_url: 'https://example.test/resume/hash-2'
                }
            })
        };
    };

    loadFormSaveProgressModule(window, () => ({
        populateFormDataAndSetActiveStep() {}
    }));

    window.document.body.dispatchEvent(new window.CustomEvent('fluentform_init', {
        detail: {
            form: formElement,
            config: {
                id: 88,
                form_instance: 'ff_form_instance_test'
            }
        },
        bubbles: true
    }));

    formElement.dispatchEvent(new window.CustomEvent('ff_to_next_page', {
        detail: {
            step: 2
        },
        bubbles: true
    }));

    formElement.querySelector('.ff-btn-save-progress').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await flushPromises();

    assert.equal(requests.length, 1);
    assert.match(requests[0].options.body, /active_step=2/);
});

test('form-save-progress bootstraps already-loaded forms and restores saved state without jQuery', async () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form
                    class="frm-fluent-form ff-form-loaded ff-form-has-save-progress ff-form-has-steps ff_form_instance_test"
                    data-form_instance="ff_form_instance_test"
                    data-form_id="91"
                >
                    <div class="ff-step-container" data-enable_step_data_persistency="no"></div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const fetchCalls = [];
    const sliderCalls = [];
    const sliderPayloads = [];

    window.fluentFormVars = { ajaxUrl: 'https://example.test/wp-admin/admin-ajax.php' };
    window.form_state_save_vars = {
        key: 'resume-hash',
        nonce: 'restore-nonce'
    };
    window.fluent_form_ff_form_instance_test = {
        id: 91,
        form_instance: 'ff_form_instance_test'
    };
    window.fluentFormBridge = createBridge(window);
    window.fetch = async (url, options) => {
        fetchCalls.push({ url, options });
        return {
            ok: true,
            json: async () => ({
                data: {
                    form_data_raw: {
                        full_name: 'Ada'
                    },
                    active_step: 1
                }
            })
        };
    };

    loadFormSaveProgressModule(window, (formReference, fluentFormVars, formSelector) => {
        sliderCalls.push({ formReference, fluentFormVars, formSelector });
        return {
            populateFormDataAndSetActiveStep(payload) {
                sliderPayloads.push(payload);
            }
        };
    });

    await flushPromises();

    assert.equal(formElement.querySelector('input.__fluent_state_hash').value, 'resume-hash');
    assert.equal(fetchCalls.length, 1);
    assert.match(fetchCalls[0].url, /action=fluentform_get_form_state/);
    assert.match(fetchCalls[0].url, /hash=resume-hash/);
    assert.equal(sliderCalls.length, 1);
    assert.equal(sliderCalls[0].formReference, formElement);
    assert.equal(sliderCalls[0].formSelector, '.ff_form_instance_test');
    assert.equal(sliderPayloads.length, 1);
    assert.equal(sliderPayloads[0].data.active_step, 1);
});
