const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

function loadDefaultExport(relativePath) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../', relativePath),
        'utf8'
    );

    let transformedSource = source;

    if (transformedSource.includes('export default function')) {
        transformedSource = transformedSource.replace('export default function', 'function defaultExport');
        transformedSource += '\nmodule.exports = defaultExport;';
    } else {
        transformedSource = transformedSource.replace('export default initNetPromoter;', 'module.exports = initNetPromoter;');
    }

    const module = { exports: {} };
    const factory = new Function('window', 'document', 'module', 'exports', transformedSource);
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        runScripts: 'outside-only',
        url: 'https://example.test'
    });

    factory(dom.window, dom.window.document, module, module.exports);

    return module.exports;
}

function createDom(html) {
    return new JSDOM(html, {
        runScripts: 'outside-only',
        url: 'https://example.test'
    });
}

function loadConditionClassModule(window) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../resources/assets/public/Pro/_ConditionClass.js'),
        'utf8'
    ).replace('export default ConditionApp;', 'module.exports = ConditionApp;');

    const module = { exports: {} };
    const factory = new Function('window', 'document', 'module', 'exports', 'currency', source);
    factory(window, window.document, module, module.exports, window.currency);

    return module.exports;
}

function loadFormConditionalsModule(window, ConditionApp) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../resources/assets/public/Pro/form-conditionals.js'),
        'utf8'
    )
        .replace('import ConditionApp from "./_ConditionClass";', '')
        .replace('export default formConditional;', 'module.exports = formConditional;');

    const module = { exports: {} };
    const factory = new Function('window', 'document', 'module', 'exports', 'ConditionApp', source);
    factory(window, window.document, module, module.exports, ConditionApp);

    return module.exports;
}

function loadFluentformAdvancedModule(window, dependencies) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../resources/assets/public/fluentform-advanced.js'),
        'utf8'
    )
        .replace('import initNetPromoter from "./Pro/dom-net-promoter";\n', '')
        .replace('import { initRepeatButtons, initRepeater } from "./Pro/dom-repeat";\n', '')
        .replace('import ratingDom from "./Pro/dom-rating";\n', '')
        .replace('import formConditional from "./Pro/form-conditionals";\n', '')
        .replace('import fileUploader from "./Pro/file-uploader";\n', '')
        .replace('import formSlider from "./Pro/slider";\n', '')
        .replace('import calculation from "./Pro/calculations";\n', '');

    const factory = new Function(
        'window',
        'document',
        'initNetPromoter',
        'initRepeatButtons',
        'initRepeater',
        'ratingDom',
        'formConditional',
        'fileUploader',
        'formSlider',
        'calculation',
        source
    );

    factory(
        window,
        window.document,
        dependencies.initNetPromoter,
        dependencies.initRepeatButtons,
        dependencies.initRepeater,
        dependencies.ratingDom,
        dependencies.formConditional,
        dependencies.fileUploader,
        dependencies.formSlider,
        dependencies.calculation
    );
}

test('dom-rating keeps active state and rating text in sync without jQuery', async () => {
    const ratingModule = loadDefaultExport('resources/assets/public/Pro/dom-rating.js');
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form id="test-form">
                    <div class="ff-el-input--content">
                        <div class="jss-ff-el-ratings">
                            <label id="label-1">
                                <input id="rating-1" type="radio" name="rating" value="1">
                                <span class="jss-ff-svg"></span>
                            </label>
                            <label id="label-2">
                                <input id="rating-2" type="radio" name="rating" value="2" checked>
                                <span class="jss-ff-svg"></span>
                            </label>
                            <label id="label-3">
                                <input id="rating-3" type="radio" name="rating" value="3">
                                <span class="jss-ff-svg"></span>
                            </label>
                        </div>
                        <span class="ff-el-rating-text" data-id="rating-1">Poor</span>
                        <span class="ff-el-rating-text" data-id="rating-2">Good</span>
                        <span class="ff-el-rating-text" data-id="rating-3">Great</span>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('#test-form');

    ratingModule(formElement);

    const labels = Array.from(window.document.querySelectorAll('.jss-ff-el-ratings label'));
    assert.equal(labels[0].classList.contains('active'), true);
    assert.equal(labels[1].classList.contains('active'), true);
    assert.equal(labels[2].classList.contains('active'), false);

    labels[2].dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }));

    assert.equal(labels[0].classList.contains('active'), true);
    assert.equal(labels[1].classList.contains('active'), true);
    assert.equal(labels[2].classList.contains('active'), true);
    assert.equal(window.document.querySelector('[data-id="rating-3"]').style.display, 'inline-block');

    labels[2].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    const iconElement = labels[2].querySelector('.jss-ff-svg');
    assert.equal(iconElement.classList.contains('scale'), true);
    assert.equal(iconElement.classList.contains('scalling'), true);

    await new Promise((resolve) => window.setTimeout(resolve, 170));
    assert.equal(iconElement.classList.contains('scale'), false);
    assert.equal(iconElement.classList.contains('scalling'), false);

    window.document.querySelector('#rating-2').checked = true;
    window.document.querySelector('.jss-ff-el-ratings').dispatchEvent(new window.MouseEvent('mouseleave', { bubbles: true }));

    assert.equal(labels[0].classList.contains('active'), true);
    assert.equal(labels[1].classList.contains('active'), true);
    assert.equal(labels[2].classList.contains('active'), false);
    assert.equal(window.document.querySelector('[data-id="rating-2"]').style.display, 'inline-block');
});

test('dom-net-promoter toggles a single active label without jQuery', () => {
    const netPromoterModule = loadDefaultExport('resources/assets/public/Pro/dom-net-promoter.js');
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form id="test-form">
                    <div class="jss-ff-el-net-promoter">
                        <label id="net-1"><input type="radio" name="net" value="1"></label>
                        <label id="net-2"><input type="radio" name="net" value="2"></label>
                        <label id="net-3"><input type="radio" name="net" value="3"></label>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('#test-form');

    netPromoterModule(formElement);

    const labels = Array.from(window.document.querySelectorAll('.jss-ff-el-net-promoter label'));
    labels[1].dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    assert.equal(labels[0].classList.contains('active'), false);
    assert.equal(labels[1].classList.contains('active'), true);
    assert.equal(labels[2].classList.contains('active'), false);
});

test('ConditionApp evaluates numeric conditional rules without jQuery lookups', () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <input
                    class="ff_numeric"
                    data-formatter='{"symbol":"$","separator":",","decimal":"."}'
                    name="amount"
                    value="$1,250.00"
                >
            </body>
        </html>
    `);
    const { window } = dom;
    window.currency = (value) => ({
        value: Number(String(value).replace(/[^0-9.-]/g, '')) || 0
    });

    const ConditionApp = loadConditionClassModule(window);
    const inputElement = window.document.querySelector('[name="amount"]');
    const app = new ConditionApp(
        {
            total: {
                status: true,
                type: 'all',
                conditions: [
                    {
                        field: 'amount',
                        operator: '>=',
                        value: '$1000'
                    }
                ]
            }
        },
        {
            amount: '$1,250.00'
        },
        () => inputElement
    );

    const statuses = app.getCalculatedStatuses();

    assert.equal(statuses.total, true);
});

test('form-conditionals toggles visibility and emits bridge events without jQuery', async () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form class="frm-fluent-form ff_form_instance_test">
                    <label>
                        <input type="checkbox" name="toggle[]" value="show">
                        Show extra field
                    </label>
                    <div class="ff-el-group has-conditions ff_excluded" id="conditional-group">
                        <input type="text" data-name="target" value="">
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const emittedEvents = [];

    if (!window.CSS) {
        window.CSS = {};
    }
    if (!window.CSS.escape) {
        window.CSS.escape = (value) => String(value).replace(/"/g, '\\"');
    }

    window.currency = (value) => ({
        value: Number(String(value).replace(/[^0-9.-]/g, '')) || 0
    });
    window.fluentFormBridge = {
        emitEvent(eventName, detail, targetElement, jqueryArguments) {
            emittedEvents.push({
                eventName,
                detail,
                jqueryArguments
            });
            (targetElement || window.document).dispatchEvent(new window.CustomEvent(eventName, {
                detail,
                bubbles: true
            }));
        },
        onEvent(targetElement, eventNames, handler) {
            const names = String(eventNames).split(/\s+/).filter(Boolean);
            const removers = names.map((eventName) => {
                const listener = (event) => handler(event, event.detail, [event.detail], 'native');
                targetElement.addEventListener(eventName, listener);
                return () => targetElement.removeEventListener(eventName, listener);
            });

            return () => removers.forEach((removeListener) => removeListener());
        }
    };

    const ConditionApp = loadConditionClassModule(window);
    const formConditionals = loadFormConditionalsModule(window, ConditionApp);

    formConditionals(formElement, {
        form_instance: 'ff_form_instance_test',
        debounce_time: 1,
        conditionals: {
            target: {
                status: true,
                type: 'all',
                conditions: [
                    {
                        field: 'toggle',
                        operator: '=',
                        value: 'show'
                    }
                ]
            }
        }
    });

    const conditionalGroup = window.document.querySelector('#conditional-group');
    const toggleInput = window.document.querySelector('input[name="toggle[]"]');

    await new Promise((resolve) => window.setTimeout(resolve, 10));
    assert.equal(conditionalGroup.classList.contains('ff_excluded'), true);

    toggleInput.checked = true;
    toggleInput.dispatchEvent(new window.Event('change', { bubbles: true }));

    await new Promise((resolve) => window.setTimeout(resolve, 20));
    assert.equal(conditionalGroup.classList.contains('ff_excluded'), false);
    assert.equal(conditionalGroup.classList.contains('ff_cond_v'), true);
    assert.equal(conditionalGroup.style.display, 'block');
    assert.equal(emittedEvents.some((eventItem) => eventItem.eventName === 'do_calculation'), true);
    assert.equal(emittedEvents.some((eventItem) => eventItem.eventName === 'ff_render_dynamic_smartcodes'), true);

    toggleInput.checked = false;
    window.document.body.dispatchEvent(new window.CustomEvent('fluentform_reset', {
        detail: {
            form: formElement
        },
        bubbles: true
    }));

    await new Promise((resolve) => window.setTimeout(resolve, 20));
    assert.equal(conditionalGroup.classList.contains('ff_excluded'), true);
    assert.equal(conditionalGroup.style.display, 'none');
});

test('fluentform-advanced bootstraps migrated modules without requiring jQuery', () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form class="frm-fluent-form ff_form_instance_test ff_has_dynamic_smartcode">
                    <input class="ff-el-form-control" name="full_name" value="Ada Lovelace">
                    <div class="ff_dynamic_value" data-ref="full_name" data-fallback="Unknown"></div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const dynamicValue = window.document.querySelector('.ff_dynamic_value');
    const moduleCalls = [];

    window.fluentFormVars = {};
    window.fluentFormBridge = {
        emitEvent(eventName, detail, targetElement) {
            (targetElement || window.document).dispatchEvent(new window.CustomEvent(eventName, {
                detail,
                bubbles: true
            }));
        },
        onEvent(targetElement, eventNames, handler) {
            const names = String(eventNames).split(/\s+/).filter(Boolean);
            const removers = names.map((eventName) => {
                const listener = (event) => handler(event, event.detail, [event.detail], 'native');
                targetElement.addEventListener(eventName, listener);
                return () => targetElement.removeEventListener(eventName, listener);
            });

            return () => removers.forEach((removeListener) => removeListener());
        }
    };

    loadFluentformAdvancedModule(window, {
        initNetPromoter(formReference) {
            moduleCalls.push(['net-promoter', formReference]);
        },
        initRepeatButtons() {
            moduleCalls.push(['repeat-buttons']);
        },
        initRepeater() {
            moduleCalls.push(['repeater']);
        },
        ratingDom(formReference) {
            moduleCalls.push(['rating', formReference]);
        },
        formConditional(formReference, formConfig, fluentFormVars) {
            moduleCalls.push(['conditional', formReference, formConfig, fluentFormVars]);
        },
        fileUploader() {
            moduleCalls.push(['file-uploader']);
        },
        formSlider() {
            moduleCalls.push(['slider']);
            return {
                init() {},
                updateSlider() {}
            };
        },
        calculation(formReference, messages) {
            moduleCalls.push(['calculation', formReference, messages]);
        }
    });

    window.document.body.dispatchEvent(new window.CustomEvent('fluentform_init', {
        detail: {
            form: formElement,
            config: {
                id: 99,
                form_instance: 'ff_form_instance_test'
            }
        },
        bubbles: true
    }));

    assert.equal(moduleCalls.some(([name]) => name === 'rating'), true);
    assert.equal(moduleCalls.some(([name]) => name === 'net-promoter'), true);
    assert.equal(moduleCalls.some(([name]) => name === 'conditional'), true);
    assert.equal(moduleCalls.some(([name]) => name === 'calculation'), true);
    assert.equal(moduleCalls.some(([name]) => name === 'file-uploader'), false);
    assert.equal(moduleCalls.some(([name]) => name === 'repeater'), false);
    assert.equal(moduleCalls.some(([name]) => name === 'slider'), false);
    assert.equal(dynamicValue.innerHTML, 'Ada Lovelace');
});
