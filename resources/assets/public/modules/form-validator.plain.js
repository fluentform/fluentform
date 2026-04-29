/**
 * Fluid Form Vanilla Validator
 * Handles all validation logic (required, email, phone, numeric, etc.)
 * Extracted from vanilla-form-handler.js for reusability
 */

function createVanillaValidator(formEl, formConfig) {
    const normalizeFieldName = function (fieldElement) {
        if (!fieldElement) {
            return "";
        }

        if (
            fieldElement.dataset.type === "repeater_item" ||
            fieldElement.dataset.type === "repeater_container"
        ) {
            return fieldElement.getAttribute("data-name") || "";
        }

        return String(fieldElement.name || "").replace(/\[\]$/, "");
    };

    const getFieldValue = function (fieldElement) {
        if (!fieldElement) {
            return "";
        }

        if (fieldElement.type === "checkbox" || fieldElement.type === "radio") {
            const checked = formEl.querySelectorAll(
                `[name="${CSS.escape(fieldElement.name)}"]:checked`
            );
            return checked.length ? checked[0].value || "on" : "";
        }

        if (fieldElement.tagName === "SELECT" && fieldElement.multiple) {
            return Array.from(fieldElement.selectedOptions).map(
                option => option.value
            );
        }

        if (fieldElement.type === "file") {
            return (
                fieldElement
                    .closest("div")
                    ?.querySelectorAll(
                        ".ff-uploaded-list .ff-upload-preview[data-src]"
                    ).length || 0
            );
        }

        return fieldElement.value || "";
    };

    const validationMethods = {
        required(fieldElement, rule) {
            if (!rule?.value) {
                return true;
            }

            if (
                fieldElement.type === "checkbox" ||
                fieldElement.type === "radio"
            ) {
                const checked = formEl.querySelectorAll(
                    `[name="${CSS.escape(fieldElement.name)}"]:checked`
                );
                return checked.length > 0;
            }

            if (fieldElement.tagName === "SELECT" && fieldElement.multiple) {
                return Array.from(fieldElement.selectedOptions).length > 0;
            }

            if (fieldElement.tagName === "SELECT") {
                return Boolean(fieldElement.value);
            }

            if (fieldElement.type === "file") {
                return getFieldValue(fieldElement) > 0;
            }

            return String(getFieldValue(fieldElement)).trim().length > 0;
        },
        url(fieldElement, rule) {
            const value = String(getFieldValue(fieldElement) || "");
            if (!rule?.value || !value.length) {
                return true;
            }
            return /^(ftp|http|https):\/\/[^ "]+$/.test(value);
        },
        email(fieldElement, rule) {
            const value = String(getFieldValue(fieldElement) || "");
            if (!rule?.value || !value.length) {
                return true;
            }
            return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}(\.[0-9]{1,3}){3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                value.toLowerCase()
            );
        },
        numeric(fieldElement, rule) {
            const value = window.ff_helper.numericVal(fieldElement).toString();
            if (!rule?.value || !value.length) {
                return true;
            }
            return !Number.isNaN(Number(value));
        },
        min(fieldElement, rule) {
            const value = window.ff_helper.numericVal(fieldElement).toString();
            if (
                !value.length ||
                !rule?.value ||
                !validationMethods.numeric(fieldElement, rule)
            ) {
                return true;
            }
            return Number(value) >= Number(rule.value);
        },
        max(fieldElement, rule) {
            const value = window.ff_helper.numericVal(fieldElement).toString();
            if (
                !value.length ||
                !rule?.value ||
                !validationMethods.numeric(fieldElement, rule)
            ) {
                return true;
            }
            return Number(value) <= Number(rule.value);
        },
        digits(fieldElement, rule) {
            const value = window.ff_helper.numericVal(fieldElement).toString();
            if (
                !value.length ||
                !rule?.value ||
                !validationMethods.numeric(fieldElement, rule)
            ) {
                return true;
            }
            return value.length === Number(rule.value);
        },
        max_file_size() {
            return true;
        },
        max_file_count() {
            return true;
        },
        allowed_file_types() {
            return true;
        },
        allowed_image_types() {
            return true;
        },
        force_failed() {
            return false;
        },
        valid_phone_number(fieldElement) {
            const value = String(getFieldValue(fieldElement) || "");
            if (!value) {
                return true;
            }

            let iti;
            if (typeof window.intlTelInputGlobals !== "undefined") {
                iti = window.intlTelInputGlobals.getInstance(fieldElement);
            } else if (fieldElement._iti) {
                iti = fieldElement._iti;
            }

            if (!iti) {
                return true;
            }

            if (
                fieldElement.classList.contains(
                    "ff_el_with_extended_validation"
                )
            ) {
                const isValid =
                    fieldElement.dataset.strict_validation === "yes" &&
                    typeof iti.isValidNumberPrecise === "function"
                        ? iti.isValidNumberPrecise()
                        : iti.isValidNumber();
                if (isValid && typeof iti.getNumber === "function") {
                    fieldElement.value = iti.getNumber();
                }
                return isValid;
            }

            return true;
        },
    };

    return {
        validate(elements) {
            const fields = Array.from(
                elements && typeof elements.length !== "undefined"
                    ? elements
                    : []
            );
            const errors = {};

            fields.forEach(fieldElement => {
                const fieldName = normalizeFieldName(fieldElement);
                if (!fieldName || !formConfig.rules?.[fieldName]) {
                    return;
                }

                Object.keys(formConfig.rules[fieldName]).forEach(ruleName => {
                    const rule = formConfig.rules[fieldName][ruleName];
                    const ruleValidator = validationMethods[ruleName];

                    if (ruleValidator && !ruleValidator(fieldElement, rule)) {
                        if (!errors[fieldName]) {
                            errors[fieldName] = [];
                        }
                        const errorMessage =
                            formConfig.messages?.[fieldName]?.[ruleName] ||
                            `${fieldName} is invalid`;
                        errors[fieldName].push(errorMessage);
                    }
                });
            });

            return errors;
        },
        getFieldValue: getFieldValue,
    };
}

module.exports = { createVanillaValidator };
