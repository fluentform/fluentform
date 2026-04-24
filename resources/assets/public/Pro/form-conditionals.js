import ConditionApp from "./_ConditionClass";

function getFormElement(formReference) {
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

function getFormEventBridge() {
    if (window.fluentFormBridge) {
        return window.fluentFormBridge;
    }

    return {
        emitEvent(eventName, detail, targetElement, jqueryEventArguments) {
            const eventTarget = targetElement || document;
            const eventDetail = typeof jqueryEventArguments !== 'undefined' && jqueryEventArguments.length
                ? jqueryEventArguments[0]
                : detail;
            eventTarget.dispatchEvent(new CustomEvent(eventName, {
                detail: eventDetail,
                bubbles: true
            }));
        },
        onEvent(targetElement, eventNames, handler) {
            const eventTarget = targetElement || document;
            const names = Array.isArray(eventNames)
                ? eventNames
                : String(eventNames || '').split(/\s+/).filter(Boolean);
            const removers = names.map((eventName) => {
                const nativeHandler = function (event) {
                    handler(event, event.detail, [event.detail], 'native');
                };
                eventTarget.addEventListener(eventName, nativeHandler);
                return function () {
                    eventTarget.removeEventListener(eventName, nativeHandler);
                };
            });

            return function () {
                removers.forEach((removeListener) => removeListener());
            };
        }
    };
}

function escapeSelectorValue(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
        return window.CSS.escape(value);
    }

    return String(value).replace(/"/g, '\\"');
}

function getFieldElements(formElement, fieldName) {
    const escapedName = escapeSelectorValue(fieldName);
    const selectors = [
        `[data-name="${escapedName}"]`,
        `[name="${escapedName}"]`,
        `[data-condition_field_name="${escapedName}"]`,
        `[name="${escapedName}[]"]`
    ];

    for (const selector of selectors) {
        const fieldElements = Array.from(formElement.querySelectorAll(selector));
        if (fieldElements.length) {
            return fieldElements;
        }
    }

    return [];
}

function getPrimaryFieldElement(formElement, fieldName) {
    return getFieldElements(formElement, fieldName)[0] || null;
}

function isElementChecked(fieldElement) {
    return !!(fieldElement && fieldElement.checked);
}

function isElementVisibleForConditionalCheck(fieldElement) {
    const conditionalParent = fieldElement.closest('.has-conditions');
    return !conditionalParent || !conditionalParent.classList.contains('ff_excluded');
}

function getConditionalDisplayMode(containerElement) {
    return containerElement.classList.contains('ff-t-container') ? 'flex' : 'block';
}

function showConditionalElement(containerElement) {
    if (containerElement.style.height === '0px') {
        containerElement.removeAttribute('style');
    }

    containerElement.classList.remove('ff_excluded');
    containerElement.classList.add('ff_cond_v');
    containerElement.style.display = getConditionalDisplayMode(containerElement);
}

function hideConditionalElement(containerElement) {
    containerElement.classList.remove('ff_cond_v');
    containerElement.classList.add('ff_excluded');
    containerElement.style.display = 'none';
}

function createDebounce(callback, delay) {
    let timeoutId;

    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback.apply(this, args), delay);
    };
}

const formConditional = function (formReference, form) {
    const formElement = getFormElement(formReference);
    if (!formElement || !form || !form.conditionals) {
        return;
    }

    const fluentFormEventBridge = getFormEventBridge();
    const watchableFields = new Map();

    const registerWatchableField = function (fieldName) {
        const fieldElements = getFieldElements(formElement, fieldName);
        if (!fieldElements.length) {
            return;
        }

        const normalizedName = fieldElements[0].name || fieldName;
        watchableFields.set(normalizedName, fieldElements);
    };

    const getFormData = function () {
        const data = {};

        watchableFields.forEach((fieldElements, originalName) => {
            const firstField = fieldElements[0];
            if (!firstField) {
                return;
            }

            let normalizedName = originalName.replace(/\[\]$/, '');
            const fieldType = firstField.type || firstField.getAttribute('data-type');

            if (fieldType === 'radio') {
                data[normalizedName] = '';
                fieldElements.forEach((fieldElement) => {
                    if (isElementChecked(fieldElement)) {
                        data[normalizedName] = fieldElement.value;
                    }
                });
                return;
            }

            if (fieldType === 'checkbox') {
                data[normalizedName] = [];
                fieldElements.forEach((fieldElement) => {
                    if (isElementChecked(fieldElement)) {
                        data[normalizedName].push(fieldElement.value);
                    }
                });
                return;
            }

            if (fieldType === 'select-multiple') {
                data[normalizedName] = Array.from(firstField.selectedOptions).map((optionElement) => optionElement.value);
                return;
            }

            if (fieldType === 'file') {
                let uploadedFileUrls = '';
                const uploadInput = formElement.querySelector(`input[name="${escapeSelectorValue(originalName)}"]`);
                if (uploadInput) {
                    const uploadedPreviews = uploadInput
                        .closest('.ff-el-input--content')
                        ?.querySelectorAll('.ff-uploaded-list .ff-upload-preview[data-src]') || [];

                    uploadedPreviews.forEach((previewElement) => {
                        uploadedFileUrls += previewElement.dataset.src || '';
                    });
                }
                data[normalizedName] = uploadedFileUrls;
                return;
            }

            data[normalizedName] = firstField.value;
        });

        return data;
    };

    Object.keys(form.conditionals).forEach((fieldName) => {
        const fieldConfig = form.conditionals[fieldName];
        if (!fieldName || !fieldConfig) {
            return;
        }

        if (fieldConfig.type === 'group' && fieldConfig.condition_groups) {
            fieldConfig.condition_groups.forEach((conditionGroup) => {
                (conditionGroup.rules || []).forEach((condition) => {
                    registerWatchableField(condition.field);
                });
            });
            return;
        }

        (fieldConfig.conditions || []).forEach((condition) => {
            registerWatchableField(condition.field);
        });
    });

    let formData = getFormData();
    const conditionAppInstance = new ConditionApp(
        form.conditionals,
        formData,
        (fieldName) => getPrimaryFieldElement(formElement, fieldName)
    );

    const hideShowElements = function (items) {
        let rangeSliderTimeoutId;

        Object.keys(items).forEach((itemName) => {
            const fieldElement = getPrimaryFieldElement(formElement, itemName);
            if (!fieldElement) {
                return;
            }

            const conditionalContainer = fieldElement.closest('.has-conditions');
            if (!conditionalContainer) {
                return;
            }

            if (items[itemName]) {
                showConditionalElement(conditionalContainer);

                if (conditionalContainer.querySelector('input[type="range"]')) {
                    clearTimeout(rangeSliderTimeoutId);
                    rangeSliderTimeoutId = setTimeout(() => {
                        fluentFormEventBridge.emitEvent('reInitRangeSliders', { form: formElement }, formElement, [formElement]);
                    }, 50);
                }
                return;
            }

            hideConditionalElement(conditionalContainer);
        });

        fluentFormEventBridge.emitEvent('do_calculation', { form: formElement }, formElement);
        fluentFormEventBridge.emitEvent(
            'ff_render_dynamic_smartcodes',
            { form: formElement, selector: formElement },
            formElement,
            [formElement]
        );
    };

    const debouncedHideShowElements = createDebounce((statuses) => {
        hideShowElements(statuses);
    }, form.debounce_time || 300);

    const handleFieldChange = function () {
        if (formElement.classList.contains('ff_force_hide') || formElement.classList.contains('ff_submitting')) {
            return;
        }

        formData = getFormData();
        conditionAppInstance.setFormData(formData);
        setTimeout(() => {
            debouncedHideShowElements(conditionAppInstance.getCalculatedStatuses());
        }, 0);
    };

    watchableFields.forEach((fieldElements) => {
        fieldElements.forEach((fieldElement) => {
            fieldElement.addEventListener('keyup', handleFieldChange);
            fieldElement.addEventListener('change', handleFieldChange);
        });
    });

    fluentFormEventBridge.onEvent(document.body, 'fluentform_reset', function (event, detail, args, source) {
        const resetFormReference = source === 'jquery' ? args[0] : (detail && detail.form ? detail.form : args[0]);
        const resetFormElement = getFormElement(resetFormReference);

        if (!resetFormElement || resetFormElement !== formElement || formElement.classList.contains('ff_force_hide')) {
            return;
        }

        setTimeout(() => {
            formData = getFormData();
            conditionAppInstance.setFormData(formData);
            hideShowElements(conditionAppInstance.getCalculatedStatuses());
        }, 0);
    });

    setTimeout(() => {
        hideShowElements(conditionAppInstance.getCalculatedStatuses());
    }, 0);
};

export default formConditional;
