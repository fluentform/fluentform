import initNetPromoter from "./Pro/dom-net-promoter";
import { initRepeatButtons, initRepeater } from "./Pro/dom-repeat";
import ratingDom from "./Pro/dom-rating";
import formConditional from "./Pro/form-conditionals";
import fileUploader from "./Pro/file-uploader";
import formSlider from "./Pro/slider";
import calculation from "./Pro/calculations";

const advancedFormCleanupStore = new WeakMap();

function getEventBridge() {
    if (window.fluentFormBridge) {
        return window.fluentFormBridge;
    }

    return {
        emitEvent(eventName, detail, targetElement) {
            const browserEvent = new CustomEvent(eventName, {
                detail,
                bubbles: true
            });

            (targetElement || document).dispatchEvent(browserEvent);
        },
        onEvent(targetElement, eventNames, handler) {
            const eventTarget = targetElement || document;
            const names = Array.isArray(eventNames)
                ? eventNames
                : String(eventNames || "").split(/\s+/).filter(Boolean);
            const removers = [];

            names.forEach((eventName) => {
                const nativeHandler = function (event) {
                    handler(event, event.detail, [event.detail], "native");
                };

                eventTarget.addEventListener(eventName, nativeHandler);
                removers.push(() => eventTarget.removeEventListener(eventName, nativeHandler));
            });

            return function removeListeners() {
                removers.forEach((removeListener) => removeListener());
            };
        }
    };
}

function resolveFormElement(formReference) {
    if (!formReference) {
        return null;
    }

    if (formReference.nodeType === 1) {
        return formReference;
    }

    if (formReference[0] && formReference[0].nodeType === 1) {
        return formReference[0];
    }

    return null;
}

function getLoadedFormConfig(formElement) {
    if (!formElement) {
        return null;
    }

    const formInstance = formElement.getAttribute("data-form_instance");
    if (!formInstance) {
        return null;
    }

    const sanitizedInstance = formInstance.replace(/[^a-zA-Z0-9_-]/g, "");
    return window["fluent_form_" + sanitizedInstance] || null;
}

function getCalculationMessages(formId) {
    const messagesVar = "fluentform_calculation_messages_" + formId;

    if (window[messagesVar]) {
        return window[messagesVar];
    }

    return {
        calculation_error: "Calculation error occurred",
        invalid_formula: "Invalid formula provided",
        division_by_zero: "Division by zero error"
    };
}

function sanitizeDynamicValue(input) {
    let safeInput = input;

    if (safeInput === null || typeof safeInput === "undefined") {
        return "";
    }

    if (typeof safeInput !== "string") {
        safeInput = String(safeInput);
    }

    safeInput = safeInput
        .replace(/<script.*?>.*?<\/script>/gis, "")
        .replace(/<iframe.*?>.*?<\/iframe>/gis, "")
        .replace(/<.*?\bon\w+=["'][^"']*["']/gi, "")
        .replace(/javascript:/gi, "");

    safeInput = safeInput.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return safeInput
        .replace(/&lt;br\s*\/?&gt;/gi, "<br/>")
        .replace(/\n/g, "<br/>");
}

function getFieldValues(formElement, fieldName) {
    const directFieldSelector = `.ff-el-form-control[name="${fieldName}"]`;
    let referenceElements = Array.from(formElement.querySelectorAll(directFieldSelector));
    let separator = " ";

    if (!referenceElements.length) {
        const dataNameContainer = formElement.querySelector(`.ff-field_container[data-name="${fieldName}"]`);
        if (dataNameContainer) {
            referenceElements = Array.from(dataNameContainer.querySelectorAll("input"));
        }
    }

    if (!referenceElements.length) {
        referenceElements = Array.from(formElement.querySelectorAll(`[name="${fieldName}"]:checked`));
    }

    if (!referenceElements.length) {
        referenceElements = Array.from(formElement.querySelectorAll(`[name="${fieldName}[]"]:checked`));
        if (referenceElements.length) {
            separator = ", ";
        }
    }

    if (!referenceElements.length) {
        referenceElements = Array.from(formElement.querySelectorAll(`[name="${fieldName}[]"] option:checked`));
        if (referenceElements.length) {
            separator = ", ";
        }
    }

    return {
        separator,
        referenceElements
    };
}

function getRepeaterValues(formElement, fieldName) {
    const repeaterRows = Array.from(
        formElement.querySelectorAll(`.ff-el-repeater[data-name="${fieldName}"] tbody tr`)
    );
    const repeaterValues = [];

    repeaterRows.forEach((rowElement, rowIndex) => {
        const rowValues = [];
        const fieldInputs = Array.from(rowElement.querySelectorAll("input, select"));

        fieldInputs.forEach((inputElement, columnIndex) => {
            const inputValue = inputElement.value;

            if (!inputValue) {
                return;
            }

            const cellElement = inputElement.closest("td");
            const label = cellElement && cellElement.dataset.label
                ? cellElement.dataset.label
                : "Column-" + (columnIndex + 1);

            rowValues.push(label + ": " + inputValue);
        });

        if (rowValues.length) {
            repeaterValues.push("#" + (rowIndex + 1) + "- " + rowValues.join(" | "));
        }
    });

    return repeaterValues;
}

function maybeUpdateDynamicLabels(formElement, scopeElement) {
    const eventBridge = getEventBridge();
    const dynamicRoot = scopeElement || formElement;
    const dynamicElements = Array.from(dynamicRoot.querySelectorAll(".ff_dynamic_value"));

    dynamicElements.forEach((dynamicElement) => {
        const referenceName = dynamicElement.dataset.ref;

        if (referenceName === "payment_summary") {
            const paymentSummaryTarget = typeof window.jQuery === "function"
                ? window.jQuery(dynamicElement)
                : dynamicElement;

            eventBridge.emitEvent(
                "calculate_payment_summary",
                {
                    element: dynamicElement,
                    form: formElement
                },
                formElement,
                [{ element: paymentSummaryTarget }]
            );
            return;
        }

        const { separator, referenceElements } = getFieldValues(formElement, referenceName);
        const resolvedValues = [];

        if (!referenceElements.length) {
            const repeaterValues = getRepeaterValues(formElement, referenceName);
            if (repeaterValues.length) {
                dynamicElement.innerHTML = sanitizeDynamicValue(repeaterValues.join("<br/>"));
                return;
            }
        }

        referenceElements.forEach((referenceElement) => {
            const conditionallyHidden = referenceElement.closest(".ff-el-group.has-conditions.ff_excluded");
            if (conditionallyHidden || !referenceElement.value) {
                return;
            }

            resolvedValues.push(referenceElement.value);
        });

        const fallbackValue = dynamicElement.dataset.fallback || "";
        const replacementValue = resolvedValues.length
            ? resolvedValues.join(separator)
            : fallbackValue;

        dynamicElement.innerHTML = sanitizeDynamicValue(replacementValue);
    });
}

function setupDynamicSmartcodes(formElement) {
    const eventBridge = getEventBridge();
    const cleanupCallbacks = [];
    const renderDynamicLabels = function (scopeReference) {
        const scopeElement = resolveFormElement(scopeReference) || formElement;
        maybeUpdateDynamicLabels(formElement, scopeElement);
    };

    cleanupCallbacks.push(
        eventBridge.onEvent(formElement, "ff_render_dynamic_smartcodes", function (event, detail, args, source) {
            const scopeReference = source === "jquery" ? args[0] : detail;
            renderDynamicLabels(scopeReference);
        })
    );

    const handleFormChange = function (event) {
        if (!event.target || !event.target.matches("input, select, textarea")) {
            return;
        }

        renderDynamicLabels(formElement);
    };

    formElement.addEventListener("keyup", handleFormChange);
    formElement.addEventListener("change", handleFormChange);
    cleanupCallbacks.push(() => formElement.removeEventListener("keyup", handleFormChange));
    cleanupCallbacks.push(() => formElement.removeEventListener("change", handleFormChange));

    renderDynamicLabels(formElement);

    return function removeDynamicSmartcodeHandlers() {
        cleanupCallbacks.forEach((cleanup) => cleanup());
    };
}

function setupStepSlider(formElement, formConfig) {
    if (!formElement.classList.contains("ff-form-has-steps")) {
        return function noop() {};
    }

    const eventBridge = getEventBridge();
    const formSelector = "." + formConfig.form_instance;
    const sliderInstance = formSlider(formElement, window.fluentFormVars, formSelector);

    sliderInstance.init();

    return eventBridge.onEvent(formElement, "update_slider", function (event, detail, args, source) {
        const sliderData = source === "jquery" ? (args[0] || {}) : (detail || {});

        sliderInstance.updateSlider(
            sliderData.goBackToStep,
            sliderData.animDuration,
            sliderData.isScrollTop,
            sliderData.actionType
        );
    });
}

function setupAdvancedForm(formElement, formConfig) {
    if (!formElement || !formConfig) {
        return;
    }

    const existingCleanup = advancedFormCleanupStore.get(formElement);
    if (existingCleanup) {
        existingCleanup();
    }

    const cleanupCallbacks = [];
    const jquery = window.jQuery;

    if (typeof jquery === "function") {
        const jqueryForm = jquery(formElement);
        const formSelector = "." + formConfig.form_instance;

        fileUploader(jquery, jqueryForm, formConfig, window.fluentFormVars, formSelector);
        initRepeater(jqueryForm);
        initRepeatButtons(jquery, jqueryForm);
    }

    formConditional(formElement, formConfig, window.fluentFormVars);
    calculation(formElement, getCalculationMessages(formConfig.id));
    ratingDom(formElement);
    initNetPromoter(formElement);

    cleanupCallbacks.push(setupStepSlider(formElement, formConfig));

    if (formElement.classList.contains("ff_has_dynamic_smartcode")) {
        cleanupCallbacks.push(setupDynamicSmartcodes(formElement));
    }

    advancedFormCleanupStore.set(formElement, function cleanupFormHandlers() {
        cleanupCallbacks.forEach((cleanup) => cleanup());
    });
}

function handleFluentFormInit(event, detail, args, source) {
    const formReference = source === "jquery" ? args[0] : detail && detail.form;
    const formConfig = source === "jquery" ? args[1] : detail && detail.config;
    const formElement = resolveFormElement(formReference);

    if (!formConfig) {
        console.log("No Fluent form JS vars found!");
        return;
    }

    setupAdvancedForm(formElement, formConfig);
}

getEventBridge().onEvent(document.body, "fluentform_init", handleFluentFormInit);

Array.from(document.querySelectorAll("form.frm-fluent-form.ff-form-loaded")).forEach((formElement) => {
    const formConfig = getLoadedFormConfig(formElement);

    if (!formConfig) {
        return;
    }

    setupAdvancedForm(formElement, formConfig);
});

// Polyfill for startsWith and endsWith
(function (sp) {
    if (!sp.startsWith) {
        sp.startsWith = function (search, pos) {
            pos = !pos || pos < 0 ? 0 : +pos;
            return this.substring(pos, pos + search.length) === search;
        };
    }

    if (!sp.endsWith) {
        sp.endsWith = function (search, thisLen) {
            if (thisLen === undefined || thisLen > this.length) {
                thisLen = this.length;
            }
            return this.substring(thisLen - search.length, thisLen) === search;
        };
    }

    if (!sp.includes) {
        sp.includes = function (search, start) {
            if (search instanceof RegExp) {
                throw TypeError("first argument must not be a RegExp");
            }
            if (start === undefined) {
                start = 0;
            }
            return this.indexOf(search, start) !== -1;
        };
    }
})(String.prototype);
