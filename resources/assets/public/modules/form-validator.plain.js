/**
 * Fluid Form Vanilla Validator
 *
 * Origin: dev:resources/assets/public/form-submission.js:1423-1710 (validationFactory)
 * Migration: each rule (required / email / url / numeric / min / max / digits /
 *   max_file_size / max_file_count / allowed_file_types / allowed_image_types /
 *   force_failed / valid_phone_number) ported to vanilla. Branches preserved:
 *     - required radio/checkbox tabular grid `per_row` (jq:1531-1539) → line 80-94
 *     - required range slider `is-changed=false` short-circuit (jq:1519-1521) → line 137-141
 *       (PR8 C-33: returns false to FAIL untouched required ranges, matching dev's `''`)
 *     - phone `valid_phone_number` dial-code prepend (jq:1700-1746) → line 216-269
 *     - numeric / min / max / digits read via window.ff_helper.numericVal (jq:1599-1668)
 *   Validator entry point: `validate(elements)` mirrors dev:1479-1509 exactly.
 *   `errors[fieldName][ruleName] = (rule.message) || \`${fieldName} is invalid\``
 *   reads `rule.message` from the server response per jq:1498.
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

    const resolveRepeaterRule = function (fieldElement, fieldName) {
        if (!formConfig.rules) {
            return null;
        }
        if (formConfig.rules[fieldName]) {
            return formConfig.rules[fieldName];
        }
        const errorIndex = fieldElement.getAttribute("data-error_index");
        if (errorIndex && formConfig.rules[errorIndex]) {
            // Mirror jQuery branch: rules[elName] = rules[el.data('error_index')]
            formConfig.rules[fieldName] = formConfig.rules[errorIndex];
            return formConfig.rules[fieldName];
        }
        return null;
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
                // Tabular grid (per_row): when the parent .ff-el-group has a
                // data-name, validation is handled per-row, not per-checkbox.
                // Skip the row-level group check when rule.per_row is set, so
                // each row enforces its own required state separately.
                const groupElement = fieldElement.closest(".ff-el-group");
                if (
                    groupElement &&
                    groupElement.getAttribute("data-name") &&
                    !rule.per_row
                ) {
                    return (
                        groupElement.querySelectorAll("input:checked").length >
                        0
                    );
                }

                const checked = formEl.querySelectorAll(
                    `[name="${CSS.escape(fieldElement.name)}"]:checked`
                );

                // "Other option" handling: when the selected value is the
                // sentinel `__ff_other_<name>__`, the linked text input must
                // be filled in for the field to be considered present.
                if (checked.length) {
                    const baseName = String(fieldElement.name || "").replace(
                        /\[\]$/,
                        ""
                    );
                    const otherSentinel = `__ff_other_${baseName}__`;
                    if (checked[0].value === otherSentinel) {
                        const otherInput = formEl.querySelector(
                            `[name="${CSS.escape(
                                baseName + "__ff_other_input__"
                            )}"]`
                        );
                        return !!(
                            otherInput &&
                            String(otherInput.value || "").trim().length
                        );
                    }
                }

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

            // C-33 (codex): a required range slider that the user hasn't moved
            // should FAIL validation. dev returns `''` (falsy) at jq:1519-1521
            // — equivalent to false in the validator's truthy check.
            if (fieldElement.getAttribute("is-changed") === "false") {
                return false;
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

            // Match jQuery path: prepend dial code for non-extended phones.
            if (typeof iti.getSelectedCountryData === "function") {
                const selectedCountry = iti.getSelectedCountryData();
                const inputNumber = fieldElement.value;
                if (
                    !fieldElement.getAttribute("data-original_val") &&
                    inputNumber &&
                    selectedCountry &&
                    selectedCountry.dialCode
                ) {
                    fieldElement.value =
                        "+" + selectedCountry.dialCode + inputNumber;
                    fieldElement.setAttribute(
                        "data-original_val",
                        inputNumber
                    );
                }
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
                if (!fieldName) {
                    return;
                }

                const fieldRules = resolveRepeaterRule(fieldElement, fieldName);
                if (!fieldRules) {
                    return;
                }

                Object.keys(fieldRules).forEach(ruleName => {
                    const rule = fieldRules[ruleName];
                    const ruleValidator = validationMethods[ruleName];
                    if (typeof ruleValidator !== "function") {
                        return;
                    }

                    if (!ruleValidator(fieldElement, rule)) {
                        if (!errors[fieldName]) {
                            errors[fieldName] = {};
                        }
                        // Read from rule.message (server-supplied) to match the
                        // jQuery path. Falls back to a generic message only if
                        // the server omitted one.
                        errors[fieldName][ruleName] =
                            (rule && rule.message) ||
                            `${fieldName} is invalid`;
                    }
                });
            });

            return errors;
        },
        getFieldValue: getFieldValue,
    };
}

module.exports = { createVanillaValidator };
