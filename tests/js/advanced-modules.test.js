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

function loadSliderModule(window) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../resources/assets/public/Pro/slider.js'),
        'utf8'
    ).replace('export default function (', 'function defaultExport (') + '\nmodule.exports = defaultExport;';

    const module = { exports: {} };
    const factory = new Function('window', 'document', 'module', 'exports', source);
    factory(window, window.document, module, module.exports);

    return module.exports;
}

function loadFileUploaderModule(window, jQueryInstance) {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../resources/assets/public/Pro/file-uploader.js'),
        'utf8'
    ).replace('export default function', 'function defaultExport') + '\nmodule.exports = defaultExport;';

    const module = { exports: {} };
    const factory = new Function('window', 'document', 'module', 'exports', 'jQuery', '$', source);
    factory(window, window.document, module, module.exports, jQueryInstance, jQueryInstance);

    return module.exports;
}

function createUploaderJquery(window) {
    const eventLog = [];

    class JQueryCollection {
        constructor(elements) {
            this.elements = elements.filter(Boolean);
            this.length = this.elements.length;
            this.elements.forEach((element, index) => {
                this[index] = element;
            });
        }

        each(callback) {
            this.elements.forEach((element, index) => {
                callback.call(element, index, element);
            });

            return this;
        }

        closest(selector) {
            return new JQueryCollection(
                this.elements.map((element) => element.closest(selector)).filter(Boolean)
            );
        }

        is(selector) {
            return this.elements.some((element) => element.matches(selector));
        }

        width() {
            return 240;
        }

        append(child) {
            const childCollection = child instanceof JQueryCollection ? child : jquery(child);
            this.elements.forEach((element) => {
                childCollection.elements.forEach((childElement) => {
                    element.appendChild(childElement);
                });
            });

            return this;
        }

        prop(name, value) {
            if (typeof value === 'undefined') {
                const element = this.elements[0];
                return element ? element[name] : undefined;
            }

            this.elements.forEach((element) => {
                element[name] = value;
            });

            return this;
        }

        find(selector) {
            return new JQueryCollection(
                this.elements.flatMap((element) => Array.from(element.querySelectorAll(selector)))
            );
        }

        empty() {
            this.elements.forEach((element) => {
                element.innerHTML = '';
            });

            return this;
        }

        html(value) {
            if (typeof value === 'undefined') {
                return this.elements[0] ? this.elements[0].innerHTML : undefined;
            }

            this.elements.forEach((element) => {
                element.innerHTML = value;
            });

            return this;
        }

        remove() {
            this.elements.forEach((element) => element.remove());
            return this;
        }

        trigger(eventName, payload) {
            eventLog.push({ eventName, payload });
            return this;
        }

        on() {
            return this;
        }

        serializeArray() {
            return [];
        }

        fileupload(options) {
            this.elements.forEach((element) => {
                element.__fileuploadOptions = options;
            });

            return this;
        }
    }

    function jquery(target, attributes = {}) {
        if (target instanceof JQueryCollection) {
            return target;
        }

        if (typeof target === 'string') {
            if (target.startsWith('<') && target.endsWith('/>')) {
                const tagName = target.slice(1, -2);
                const element = window.document.createElement(tagName);
                Object.entries(attributes).forEach(([key, value]) => {
                    if (key === 'class') {
                        element.className = value;
                    } else if (key === 'html') {
                        element.innerHTML = value;
                    } else if (key === 'text') {
                        element.textContent = value;
                    } else if (key === 'style') {
                        element.setAttribute('style', value);
                    } else {
                        element.setAttribute(key, value);
                    }
                });

                return new JQueryCollection([element]);
            }

            return new JQueryCollection(Array.from(window.document.querySelectorAll(target)));
        }

        if (target && target.nodeType) {
            return new JQueryCollection([target]);
        }

        if (Array.isArray(target)) {
            return new JQueryCollection(target);
        }

        return new JQueryCollection([]);
    }

    jquery.fn = JQueryCollection.prototype;

    return { jquery, eventLog };
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

test('fluentform-advanced bootstraps already loaded forms in no-jquery mode', () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form
                    class="frm-fluent-form ff-form-loaded ff-form-has-steps ff_form_instance_test"
                    data-form_instance="ff_form_instance_test"
                >
                    <div class="ff-step-container" data-animation_type="none" data-disable_auto_focus="yes">
                        <div class="ff-step-header">
                            <div class="ff-el-progress">
                                <div class="ff-el-progress-bar"><span></span></div>
                            </div>
                        </div>
                        <div class="fluentform-step">
                            <div class="step-nav">
                                <button type="button" class="ff-btn-prev" data-action="prev">Prev</button>
                                <button type="button" class="ff-btn-next" data-action="next">Next</button>
                            </div>
                        </div>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const sliderCalls = [];

    window.fluentFormVars = {
        stepAnimationDuration: 0,
        is_rtl: false
    };
    window.fluent_form_ff_form_instance_test = {
        id: 99,
        form_instance: 'ff_form_instance_test'
    };
    window.fluentFormBridge = {
        emitEvent(eventName, detail, targetElement) {
            (targetElement || window.document).dispatchEvent(new window.CustomEvent(eventName, {
                detail,
                bubbles: true
            }));
        },
        onEvent(targetElement, eventNames, handler) {
            const names = Array.isArray(eventNames) ? eventNames : String(eventNames).split(/\s+/).filter(Boolean);
            const removers = names.map((eventName) => {
                const listener = (event) => handler(event, event.detail, [event.detail], 'native');
                targetElement.addEventListener(eventName, listener);
                return () => targetElement.removeEventListener(eventName, listener);
            });

            return () => removers.forEach((removeListener) => removeListener());
        }
    };

    loadFluentformAdvancedModule(window, {
        initNetPromoter() {},
        initRepeatButtons() {},
        initRepeater() {},
        ratingDom() {},
        formConditional() {},
        fileUploader() {},
        formSlider(formReference) {
            sliderCalls.push(formReference);
            return {
                init() {
                    formElement.querySelector('.ff-btn-prev')?.remove();
                    formElement.querySelector('.ff-el-progress-bar').style.width = '100%';
                },
                updateSlider() {}
            };
        },
        calculation() {}
    });

    assert.equal(sliderCalls.length, 1);
    assert.equal(sliderCalls[0], formElement);
    assert.equal(formElement.querySelector('.ff-btn-prev'), null);
    assert.equal(formElement.querySelector('.ff-el-progress-bar').style.width, '100%');
});

test('fluentform-advanced bootstraps preview-rendered step forms before ff-form-loaded is applied', () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form
                    class="frm-fluent-form ff-form-has-steps ff_form_instance_test"
                    data-form_instance="ff_form_instance_test"
                >
                    <div class="ff-step-container" data-animation_type="none" data-disable_auto_focus="yes">
                        <div class="ff-step-header">
                            <div class="ff-el-progress">
                                <div class="ff-el-progress-bar"><span></span></div>
                            </div>
                        </div>
                        <div class="fluentform-step">
                            <div class="step-nav">
                                <button type="button" class="ff-btn-prev" data-action="prev">Prev</button>
                                <button type="button" class="ff-btn-next" data-action="next">Next</button>
                            </div>
                        </div>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const sliderCalls = [];

    window.fluentFormVars = {
        stepAnimationDuration: 0,
        is_rtl: false
    };
    window.fluent_form_ff_form_instance_test = {
        id: 234,
        form_instance: 'ff_form_instance_test'
    };
    window.fluentFormBridge = {
        emitEvent(eventName, detail, targetElement) {
            (targetElement || window.document).dispatchEvent(new window.CustomEvent(eventName, {
                detail,
                bubbles: true
            }));
        },
        onEvent(targetElement, eventNames, handler) {
            const names = Array.isArray(eventNames) ? eventNames : String(eventNames).split(/\s+/).filter(Boolean);
            const removers = names.map((eventName) => {
                const listener = (event) => handler(event, event.detail, [event.detail], 'native');
                targetElement.addEventListener(eventName, listener);
                return () => targetElement.removeEventListener(eventName, listener);
            });

            return () => removers.forEach((removeListener) => removeListener());
        }
    };

    loadFluentformAdvancedModule(window, {
        initNetPromoter() {},
        initRepeatButtons() {},
        initRepeater() {},
        ratingDom() {},
        formConditional() {},
        fileUploader() {},
        formSlider(formReference) {
            sliderCalls.push(formReference);
            return {
                init() {
                    formElement.querySelector('.ff-btn-prev')?.remove();
                    formElement.querySelector('.ff-el-progress-bar').style.width = '100%';
                },
                updateSlider() {}
            };
        },
        calculation() {}
    });

    assert.equal(sliderCalls.length, 1);
    assert.equal(sliderCalls[0], formElement);
    assert.equal(formElement.querySelector('.ff-btn-prev'), null);
    assert.equal(formElement.querySelector('.ff-el-progress-bar').style.width, '100%');
});

test('slider navigates step forms without requiring jQuery', async () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form class="frm-fluent-form ff-form-has-steps ff_form_instance_test" data-form_id="221">
                    <div class="ff-step-container" data-animation_type="none" data-disable_auto_focus="yes">
                        <ul class="ff-step-titles">
                            <li>Step 1</li>
                            <li>Step 2</li>
                        </ul>
                        <div class="ff-step-header">
                            <div class="ff-el-progress">
                                <div class="ff-el-progress-bar"><span></span></div>
                            </div>
                            <div class="ff-el-progress-status"></div>
                            <ul class="ff-el-progress-title">
                                <li>Intro</li>
                                <li>Details</li>
                            </ul>
                        </div>
                        <div class="fluentform-step">
                            <div class="ff-el-group">
                                <input type="text" name="first_name" value="Ada">
                            </div>
                            <div class="step-nav">
                                <button type="button" class="ff-btn-next" data-action="next">Next</button>
                            </div>
                        </div>
                        <div class="fluentform-step">
                            <div class="ff-el-group">
                                <input type="text" name="last_name" value="Lovelace">
                            </div>
                            <div class="step-nav">
                                <button type="button" class="ff-btn-prev" data-action="prev">Prev</button>
                            </div>
                        </div>
                        <button type="submit">Submit</button>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const events = [];

    window.fluentFormVars = {
        is_rtl: false,
        stepAnimationDuration: 0,
        step_text: 'Step %activeStep% of %totalStep% - %stepTitle%'
    };
    window.ffTransitionTimeOut = 0;
    window.fluentFormBridge = {
        emitEvent(eventName, detail, targetElement) {
            events.push({ eventName, detail, target: targetElement === window.document ? 'document' : 'form' });
            (targetElement || window.document).dispatchEvent(new window.CustomEvent(eventName, {
                detail,
                bubbles: true
            }));
        },
        onEvent(targetElement, eventNames, handler) {
            const names = Array.isArray(eventNames) ? eventNames : String(eventNames).split(/\s+/).filter(Boolean);
            const removers = names.map((eventName) => {
                const listener = (event) => handler(event, event.detail, [event.detail], 'native');
                targetElement.addEventListener(eventName, listener);
                return () => targetElement.removeEventListener(eventName, listener);
            });

            return () => removers.forEach((removeListener) => removeListener());
        }
    };
    window.fluentFormApp = () => ({
        validate() {},
        showErrorMessages() {},
        scrollToFirstError() {}
    });

    const sliderFactory = loadSliderModule(window);
    const sliderInstance = sliderFactory(formElement, window.fluentFormVars, '.ff_form_instance_test');

    sliderInstance.init();

    let steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[0].classList.contains('active'), true);
    assert.equal(steps[1].classList.contains('active'), false);
    assert.equal(window.document.querySelector('.ff-el-progress-bar').style.width, '50%');

    steps[0].querySelector('.ff-btn-next').click();
    await new Promise((resolve) => window.setTimeout(resolve, 20));

    steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[0].classList.contains('active'), false);
    assert.equal(steps[1].classList.contains('active'), true);
    assert.equal(events.some((item) => item.eventName === 'ff_to_next_page'), true);
    assert.equal(window.document.querySelector('.ff-el-progress-bar').style.width, '100%');

    steps[1].querySelector('.ff-btn-prev').click();
    await new Promise((resolve) => window.setTimeout(resolve, 20));

    steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[0].classList.contains('active'), true);
    assert.equal(steps[1].classList.contains('active'), false);
    assert.equal(events.some((item) => item.eventName === 'ff_to_prev_page'), true);

    const navigationEvents = events.filter((item) => ['ff_to_next_page', 'ff_to_prev_page'].includes(item.eventName));
    assert.deepEqual(navigationEvents.map((item) => `${item.eventName}:${item.target}`), [
        'ff_to_next_page:form',
        'ff_to_next_page:document',
        'ff_to_prev_page:form',
        'ff_to_prev_page:document'
    ]);
});

test('slider validates the first data step after an intro step without advancing', async () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form class="frm-fluent-form ff-form-has-steps ff_form_instance_test" data-form_id="240">
                    <div class="ff-step-container" data-animation_type="none" data-disable_auto_focus="yes">
                        <ul class="ff-step-titles">
                            <li>Intro</li>
                            <li>Details</li>
                            <li>Review</li>
                        </ul>
                        <div class="ff-step-header">
                            <div class="ff-el-progress">
                                <div class="ff-el-progress-bar"><span></span></div>
                            </div>
                            <div class="ff-el-progress-status"></div>
                            <ul class="ff-el-progress-title">
                                <li>Intro</li>
                                <li>Details</li>
                                <li>Review</li>
                            </ul>
                        </div>
                        <div class="fluentform-step" data-name="step_start-240_4">
                            <div class="step-nav">
                                <button type="button" class="ff-btn-next" data-action="next">Next</button>
                            </div>
                        </div>
                        <div class="fluentform-step" data-name="form_step-240_1">
                            <div class="ff-el-group">
                                <input type="text" name="book_title" data-name="book_title" value="">
                            </div>
                            <div class="step-nav">
                                <button type="button" class="ff-btn-prev" data-action="prev">Prev</button>
                                <button type="button" class="ff-btn-next" data-action="next">Next</button>
                            </div>
                        </div>
                        <div class="fluentform-step" data-name="form_step-240_2">
                            <div class="ff-el-group">
                                <input type="text" name="review_text" data-name="review_text" value="">
                            </div>
                            <div class="step-nav">
                                <button type="button" class="ff-btn-prev" data-action="prev">Prev</button>
                            </div>
                        </div>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const eventNames = [];
    const appCalls = {
        validate: [],
        showErrorMessages: [],
        scrollToFirstError: []
    };

    window.fluentFormVars = {
        is_rtl: false,
        stepAnimationDuration: 0,
        step_text: 'Step %activeStep% of %totalStep% - %stepTitle%'
    };
    window.ffTransitionTimeOut = 0;
    window.ffValidationError = class ffValidationError extends Error {};
    window.fluentFormBridge = {
        emitEvent(eventName, detail, targetElement) {
            eventNames.push(eventName);
            (targetElement || window.document).dispatchEvent(new window.CustomEvent(eventName, {
                detail,
                bubbles: true
            }));
        },
        onEvent() {
            return () => {};
        }
    };

    window.fluentFormApp = () => ({
        validate(elements) {
            const fieldNames = Array.from(elements).map((element) => element.getAttribute('name'));
            appCalls.validate.push(fieldNames);

            if (fieldNames.includes('book_title')) {
                const error = new window.ffValidationError('Validation Error!');
                error.messages = {
                    book_title: {
                        required: 'Book Title is Required...!'
                    }
                };
                throw error;
            }
        },
        showErrorMessages(errors) {
            appCalls.showErrorMessages.push(errors);
        },
        scrollToFirstError(duration) {
            appCalls.scrollToFirstError.push(duration);
        }
    });

    const sliderFactory = loadSliderModule(window);
    const sliderInstance = sliderFactory(formElement, window.fluentFormVars, '.ff_form_instance_test');
    sliderInstance.init();

    let steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[0].classList.contains('active'), true);
    assert.equal(steps[1].classList.contains('active'), false);

    steps[0].querySelector('.ff-btn-next').click();
    await new Promise((resolve) => window.setTimeout(resolve, 20));

    steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[0].classList.contains('active'), false);
    assert.equal(steps[1].classList.contains('active'), true);
    assert.deepEqual(appCalls.validate, []);
    assert.deepEqual(eventNames.filter((eventName) => eventName === 'ff_to_next_page'), [
        'ff_to_next_page',
        'ff_to_next_page'
    ]);

    steps[1].querySelector('.ff-btn-next').click();
    await new Promise((resolve) => window.setTimeout(resolve, 20));

    steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[1].classList.contains('active'), true);
    assert.equal(steps[2].classList.contains('active'), false);
    assert.deepEqual(appCalls.validate, [['book_title']]);
    assert.deepEqual(appCalls.showErrorMessages, [{
        book_title: {
            required: 'Book Title is Required...!'
        }
    }]);
    assert.deepEqual(appCalls.scrollToFirstError, [350]);
    assert.deepEqual(eventNames.filter((eventName) => eventName === 'ff_to_next_page'), [
        'ff_to_next_page',
        'ff_to_next_page'
    ]);
});

test('condition-driven hidden step fields stay excluded from slider validation until shown', async () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form class="frm-fluent-form ff_form_instance_test">
                    <div class="ff-step-container">
                        <div class="fluentform-step active" data-name="form_step-conditional_0">
                            <label>
                                <input type="checkbox" name="toggle[]" value="show">
                                Show book title
                            </label>
                            <div class="ff-el-group has-conditions ff_excluded" id="conditional-book-title">
                                <input type="text" name="book_title" data-name="book_title" value="">
                            </div>
                            <div class="step-nav">
                                <button type="button" class="ff-btn-next" data-action="next">Next</button>
                            </div>
                        </div>
                        <div class="fluentform-step" data-name="form_step-conditional_1">
                            <div class="ff-el-group">
                                <input type="text" name="review_text" data-name="review_text" value="">
                            </div>
                            <div class="step-nav">
                                <button type="button" class="ff-btn-prev" data-action="prev">Prev</button>
                            </div>
                        </div>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const formElement = window.document.querySelector('form');
    const toggleInput = window.document.querySelector('input[name="toggle[]"]');
    const conditionalGroup = window.document.querySelector('#conditional-book-title');
    const appCalls = {
        validate: [],
        showErrorMessages: [],
        scrollToFirstError: []
    };

    if (!window.CSS) {
        window.CSS = {};
    }
    if (!window.CSS.escape) {
        window.CSS.escape = (value) => String(value).replace(/"/g, '\\"');
    }

    window.currency = (value) => ({
        value: Number(String(value).replace(/[^0-9.-]/g, '')) || 0
    });
    window.fluentFormVars = {
        is_rtl: false,
        stepAnimationDuration: 0,
        step_text: 'Step %activeStep% of %totalStep% - %stepTitle%'
    };
    window.ffTransitionTimeOut = 0;
    window.ffValidationError = class ffValidationError extends Error {};
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

    const ConditionApp = loadConditionClassModule(window);
    const formConditionals = loadFormConditionalsModule(window, ConditionApp);
    formConditionals(formElement, {
        form_instance: 'ff_form_instance_test',
        debounce_time: 1,
        conditionals: {
            book_title: {
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

    window.fluentFormApp = () => ({
        validate(elements) {
            const fieldNames = Array.from(elements).map((element) => element.getAttribute('name'));
            appCalls.validate.push(fieldNames);

            if (fieldNames.includes('book_title')) {
                const error = new window.ffValidationError('Validation Error!');
                error.messages = {
                    book_title: {
                        required: 'Book Title is Required...!'
                    }
                };
                throw error;
            }
        },
        showErrorMessages(errors) {
            appCalls.showErrorMessages.push(errors);
        },
        scrollToFirstError(duration) {
            appCalls.scrollToFirstError.push(duration);
        }
    });

    const sliderFactory = loadSliderModule(window);
    const sliderInstance = sliderFactory(formElement, window.fluentFormVars, '.ff_form_instance_test');
    sliderInstance.init();

    await new Promise((resolve) => window.setTimeout(resolve, 15));
    assert.equal(conditionalGroup.classList.contains('ff_excluded'), true);

    formElement.querySelector('.ff-btn-next').click();
    await new Promise((resolve) => window.setTimeout(resolve, 20));

    let steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[0].classList.contains('active'), false);
    assert.equal(steps[1].classList.contains('active'), true);
    assert.deepEqual(appCalls.validate, [['toggle[]']]);
    assert.deepEqual(appCalls.showErrorMessages, []);

    steps[1].querySelector('.ff-btn-prev').click();
    await new Promise((resolve) => window.setTimeout(resolve, 20));

    steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[0].classList.contains('active'), true);
    assert.equal(steps[1].classList.contains('active'), false);

    toggleInput.checked = true;
    toggleInput.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise((resolve) => window.setTimeout(resolve, 20));
    assert.equal(conditionalGroup.classList.contains('ff_excluded'), false);

    steps[0].querySelector('.ff-btn-next').click();
    await new Promise((resolve) => window.setTimeout(resolve, 20));

    steps = Array.from(window.document.querySelectorAll('.fluentform-step'));
    assert.equal(steps[0].classList.contains('active'), true);
    assert.equal(steps[1].classList.contains('active'), false);
    assert.deepEqual(appCalls.validate, [['toggle[]'], ['toggle[]', 'book_title']]);
    assert.deepEqual(appCalls.showErrorMessages, [{
        book_title: {
            required: 'Book Title is Required...!'
        }
    }]);
    assert.deepEqual(appCalls.scrollToFirstError, [350]);
});

test('file-uploader treats negative max_file_count as unlimited instead of rejecting valid files', () => {
    const dom = createDom(`
        <!doctype html>
        <html>
            <body>
                <form id="form1">
                    <div id="form1_errors"></div>
                    <div class="ff-el-group">
                        <div>
                            <input type="file" name="file-upload">
                            <div class="error"></div>
                        </div>
                    </div>
                </form>
            </body>
        </html>
    `);
    const { window } = dom;
    const { jquery, eventLog } = createUploaderJquery(window);
    const formElement = window.document.querySelector('#form1');
    const fileInput = formElement.querySelector('input[type="file"]');
    const fileUploader = loadFileUploaderModule(window, jquery);

    window.jQuery = jquery;
    window.$ = jquery;

    const form = {
        id: 234,
        rules: {
            'file-upload': {
                max_file_count: {
                    value: '-1',
                    message: 'Too many files'
                },
                allowed_file_types: {
                    value: ['pdf']
                }
            }
        }
    };

    fileUploader(
        jquery,
        jquery(formElement),
        form,
        {
            ajaxUrl: 'https://example.test/wp-admin/admin-ajax.php',
            upload_start_txt: 'Upload started',
            uploading_txt: 'Uploading',
            upload_completed_txt: '100% Completed'
        },
        '#form1'
    );

    const uploaderOptions = fileInput.__fileuploadOptions;

    assert.equal(typeof uploaderOptions.change, 'function');
    assert.equal(form.rules['file-upload'].max_file_count.remaining, null);
    assert.equal(fileInput.accept, '.pdf');

    const result = uploaderOptions.change.call(fileInput, {}, {
        files: [
            {
                name: 'general.pdf',
                size: 42000,
                type: 'application/pdf'
            }
        ]
    });

    assert.equal(result, true);
    assert.equal(eventLog.length, 0);
    assert.equal(form.rules['file-upload'].max_file_count.remaining, null);
});
