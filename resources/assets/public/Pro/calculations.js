export const mexpToken = [
    {
        type: 8,
        token: 'round',
        show: 'round',
        value: function (value, decimals = 0) {
            if (!decimals && decimals !== 0) {
                decimals = 2;
            }

            value = parseFloat(value).toFixed(decimals);
            return parseFloat(value);
        }
    },
    {
        type: 0,
        token: 'ceil',
        show: 'ceil',
        value: function (a) {
            return Math.ceil(a);
        }
    },
    {
        type: 0,
        token: 'floor',
        show: 'floor',
        value: function (a) {
            return Math.floor(a);
        }
    },
    {
        type: 0,
        token: 'abs',
        show: 'abs',
        value: function (a) {
            return Math.abs(a);
        }
    },
    {
        type: 8,
        token: 'max',
        show: 'max',
        value: function (a, b) {
            if (a > b) {
                return a;
            }

            return b;
        }
    },
    {
        type: 8,
        token: 'min',
        show: 'min',
        value: function (a, b) {
            if (a < b) {
                return a;
            }

            return b;
        }
    }
];

export function findAll(regexPattern, sourceString) {
    const output = [];
    const regexPatternWithGlobal = RegExp(regexPattern, 'g');
    let match;

    while ((match = regexPatternWithGlobal.exec(sourceString))) {
        delete match.input;
        output.push(match);
    }

    return output;
}

export function isContain(item, value) {
    return item.indexOf(value) !== -1;
}

export function getName(item, replace) {
    const regx = new RegExp(replace + '|}', 'g');
    return item.replace(regx, '');
}

function isFormLike(value) {
    return !!(
        value && (
            value.nodeType === 1 ||
            (value[0] && value[0].nodeType === 1)
        )
    );
}

function resolveCalculationArguments(jqueryOrFormReference, formReferenceOrMessages, maybeMessages) {
    if (isFormLike(jqueryOrFormReference)) {
        return {
            formReference: jqueryOrFormReference,
            calculationMessages: formReferenceOrMessages || {}
        };
    }

    return {
        formReference: formReferenceOrMessages,
        calculationMessages: maybeMessages || {}
    };
}

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

function toArray(list) {
    return Array.prototype.slice.call(list || []);
}

function getBridge() {
    if (window.fluentFormBridge && typeof window.fluentFormBridge.onEvent === 'function') {
        return window.fluentFormBridge;
    }

    return {
        onEvent: function (targetElement, eventNames, handler, options) {
            const eventTarget = targetElement || document;
            const names = Array.isArray(eventNames)
                ? eventNames
                : String(eventNames || '').split(/\s+/).filter(Boolean);

            names.forEach((eventName) => {
                eventTarget.addEventListener(eventName, (event) => {
                    handler(event, event.detail, [event.detail], 'native');
                }, options || false);
            });

            return function () {};
        }
    };
}

function escapeAttributeValue(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
        return window.CSS.escape(String(value));
    }

    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function createAttributeSelector(attributeName, attributeValue) {
    return '[' + attributeName + '="' + escapeAttributeValue(attributeValue) + '"]';
}

function triggerNativeChange(targetElement) {
    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
}

export default function (jqueryOrFormReference, formReferenceOrMessages, maybeMessages) {
    const resolvedArguments = resolveCalculationArguments(
        jqueryOrFormReference,
        formReferenceOrMessages,
        maybeMessages
    );
    const formElement = getFormElement(resolvedArguments.formReference);

    if (!formElement) {
        return;
    }

    const messages = {
        calculation_error: 'Calculation error occurred',
        invalid_formula: 'Invalid formula provided',
        division_by_zero: 'Division by zero error',
        ...resolvedArguments.calculationMessages
    };
    const calculationFields = toArray(formElement.querySelectorAll('.ff_has_formula'));

    if (!calculationFields.length) {
        return;
    }

    const repeaterTriggerCache = {};
    const repeaterInputsTriggerCache = {};
    const fluentFormEventBridge = getBridge();
    mexp.addToken(mexpToken);

    function isAccessible(elementOrElements) {
        const elements = Array.isArray(elementOrElements)
            ? elementOrElements
            : (elementOrElements ? [elementOrElements] : []);
        const firstElement = elements[0];

        if (!firstElement) {
            return false;
        }

        return !firstElement.closest('.ff_excluded.has-conditions');
    }

    function getFormElements(selector) {
        return toArray(formElement.querySelectorAll(selector));
    }

    function getDataCalcValue(selector) {
        let itemValue = 0;
        const selectedItems = getFormElements(selector);

        if (!selectedItems.length || !isAccessible(selectedItems)) {
            return itemValue;
        }

        selectedItems.forEach((item) => {
            const eachItemValue = item.getAttribute('data-calc_value');
            if (eachItemValue && !isNaN(eachItemValue)) {
                itemValue += Number(eachItemValue);
            }
        });

        return itemValue;
    }

    function getRadioFieldValue(name, forPaymentField = false) {
        const checkedInput = formElement.querySelector(
            'input[name="' + escapeAttributeValue(name) + '"]:checked'
        );

        if (!checkedInput) {
            return forPaymentField ? undefined : 0;
        }

        if (forPaymentField) {
            return checkedInput.getAttribute('data-payment_value');
        }

        if (isAccessible(checkedInput)) {
            return checkedInput.getAttribute('data-calc_value') || 0;
        }

        return 0;
    }

    function getSelectFieldValue(name, forPaymentField = false) {
        const selectElement = formElement.querySelector(
            'select' + createAttributeSelector('data-name', name)
        );

        if (!selectElement) {
            return forPaymentField ? undefined : 0;
        }

        if (forPaymentField) {
            const selectedOption = selectElement.options[selectElement.selectedIndex];
            return selectedOption ? selectedOption.dataset.payment_value : undefined;
        }

        const value = getDataCalcValue(
            'select' + createAttributeSelector('data-name', name) + ' option:checked'
        );
        selectElement.setAttribute('data-calc_value', value);

        return value;
    }

    function getCheckboxValue(name, forPaymentField = false) {
        if (!forPaymentField) {
            return getDataCalcValue(
                'input' + createAttributeSelector('data-name', name) + ':checked'
            );
        }

        const checkboxElement = formElement.querySelector(
            ':is(input, select, textarea)' + createAttributeSelector('data-name', name)
        );
        if (!checkboxElement) {
            return 0;
        }

        const groupId = checkboxElement.dataset.group_id;
        if (!groupId) {
            return 0;
        }

        const checkedGroupItems = getFormElements(
            'input' + createAttributeSelector('data-group_id', groupId) + ':checked'
        );

        return checkedGroupItems.reduce((groupTotal, groupItem) => {
            const itemPrice = groupItem.dataset.payment_value;
            if (!itemPrice) {
                return groupTotal;
            }

            return groupTotal + parseFloat(itemPrice);
        }, 0);
    }

    function getRepeatFieldValue(name) {
        let value = 0;
        const nameParts = name.split('.');
        let indexName = false;
        let rootName = name;

        if (nameParts.length > 1) {
            rootName = nameParts[0];
            indexName = nameParts[1];
        }

        const targetTable = formElement.querySelector(
            'table' + createAttributeSelector('data-root_name', rootName)
        );

        if (!targetTable) {
            return value;
        }

        if (!repeaterTriggerCache[rootName]) {
            repeaterTriggerCache[rootName] = true;
            fluentFormEventBridge.onEvent(targetTable, 'repeat_change', () => {
                doCalculation();
            });
        }

        if (!isAccessible(targetTable)) {
            return value;
        }

        if (!indexName) {
            return targetTable.querySelectorAll('tbody tr').length;
        }

        const tds = toArray(targetTable.querySelectorAll('tbody tr td:nth-child(' + indexName + ')'));

        tds.forEach((td, tdIndex) => {
            const tdInput = td.querySelector('input, select, textarea');
            if (!tdInput) {
                return;
            }

            const cacheName = rootName + '_' + indexName + '_' + (tdInput.id || tdInput.name || tdIndex);
            if (!repeaterInputsTriggerCache[cacheName]) {
                repeaterInputsTriggerCache[cacheName] = true;
                tdInput.addEventListener('change', doCalculation);
            }

            let parsedValue = 0;
            if (tdInput.tagName === 'SELECT') {
                const selectedOption = tdInput.options[tdInput.selectedIndex];
                parsedValue = parseFloat(selectedOption ? selectedOption.getAttribute('data-calc_value') : 0);
            } else {
                parsedValue = parseFloat(tdInput.value);
            }

            if (!isNaN(parsedValue)) {
                value += parsedValue;
            }
        });

        if (value) {
            return value.toFixed(2);
        }

        return value;
    }

    function getPaymentFieldValue(name) {
        let value = 0;
        const paymentElement = formElement.querySelector(
            ':is(input, select, textarea)' + createAttributeSelector('data-name', name)
        );

        if (!paymentElement || !isAccessible(paymentElement)) {
            return value;
        }

        const elementType = paymentElement.type;
        if (elementType === 'radio') {
            value = getRadioFieldValue(name, true);
        } else if (elementType === 'hidden') {
            value = paymentElement.getAttribute('data-payment_value');
        } else if (elementType === 'number' || elementType === 'text') {
            value = window.ff_helper.numericVal(paymentElement);
        } else if (elementType === 'checkbox') {
            value = getCheckboxValue(name, true);
        } else if (elementType === 'select-one') {
            value = getSelectFieldValue(name, true);
        }

        return value;
    }

    function doCalculation() {
        calculationFields.forEach((field) => {
            let formula = field.dataset.calculation_formula;
            const regEx = /{(.*?)}/g;
            const matches = findAll(regEx, formula);
            const replaces = {};

            matches.forEach((match) => {
                const itemKey = match[0];
                ['{input.', '{select.', '{checkbox.', '{radio.', '{repeat.', '{payment.'].some((prefix) => {
                    if (!isContain(itemKey, prefix)) {
                        return false;
                    }

                    const name = getName(itemKey, prefix);
                    let value = 0;

                    if (prefix === '{select.') {
                        value = getSelectFieldValue(name);
                    } else if (prefix === '{checkbox.') {
                        value = getCheckboxValue(name);
                    } else if (prefix === '{radio.') {
                        value = getRadioFieldValue(name);
                    } else if (prefix === '{repeat.') {
                        value = getRepeatFieldValue(name);
                    } else if (prefix === '{payment.') {
                        value = getPaymentFieldValue(name);
                    } else {
                        const inputElement = formElement.querySelector(
                            'input[name="' + escapeAttributeValue(name) + '"]'
                        );
                        if (isAccessible(inputElement)) {
                            value = window.ff_helper.numericVal(inputElement);
                        }
                    }

                    replaces[itemKey] = value;
                    return true;
                });
            });

            Object.keys(replaces).forEach((key) => {
                let replaceValue = replaces[key];
                if (!replaceValue) {
                    replaceValue = 0;
                }
                formula = formula.split(key).join(replaceValue);
            });

            let calculatedValue = '';
            try {
                formula = formula.replace(/\n/g, '');
                calculatedValue = mexp.eval(formula);

                if (calculatedValue === Infinity || calculatedValue === -Infinity) {
                    console.log(messages.division_by_zero, field);
                    calculatedValue = '';
                } else if (isNaN(calculatedValue)) {
                    console.log(messages.invalid_formula, field);
                    calculatedValue = '';
                }
            } catch (error) {
                console.log(messages.calculation_error + ':', error, field);
                calculatedValue = '';
            }

            if (field.type === 'text') {
                const prevValue = field.value;
                const formattedValue = window.ff_helper.formatCurrency(field, calculatedValue);

                field.value = formattedValue;
                field.defaultValue = formattedValue;

                if (prevValue === '') {
                    return;
                }

                if (prevValue !== formattedValue) {
                    triggerNativeChange(field);
                }
            } else {
                field.textContent = calculatedValue;
            }
        });
    }

    function initNumberCalculations() {
        getFormElements(
            'input[type="number"],input[data-calc_value],select[data-calc_value],.ff_numeric,.ff_payment_item'
        ).forEach((element) => {
            element.addEventListener('change', doCalculation);
            element.addEventListener('keyup', doCalculation);
        });

        doCalculation();

        fluentFormEventBridge.onEvent(formElement, 'do_calculation', () => {
            doCalculation();
        });

        fluentFormEventBridge.onEvent(document.body, 'fluentform_reset', () => {
            calculationFields.forEach((field) => {
                field.value = '';
                field.defaultValue = '';
            });

            setTimeout(() => {
                doCalculation();
            }, 100);
        });
    }

    initNumberCalculations();
}
