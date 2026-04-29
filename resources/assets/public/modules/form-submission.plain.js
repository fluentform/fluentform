/**
 * Fluid Form Vanilla Submission Runtime (Refactored)
 * Handles form submission, initialization, and orchestration
 * Uses modular architecture: validators and error handlers are separate modules
 */

const { ensureFluentFormJqueryBridge } = require("./event-bridge.js");
const { createVanillaValidator } = require("./form-validator.plain.js");
const { createErrorHandler } = require("./form-error-handler.plain.js");

function initVanillaSubmissionRuntime() {
    const jqueryEventBridge = ensureFluentFormJqueryBridge();
    const formInstanceStore = {};
    const reinitializingForms = new WeakSet();

    window.ffValidationError = (function () {
        var ffValidationError = function () {};
        ffValidationError.prototype = Object.create(Error.prototype);
        ffValidationError.prototype.constructor = ffValidationError;
        return ffValidationError;
    })();

    const resolveElement = function (el) {
        if (!el) {
            return null;
        }
        if (el.nodeType === 1) {
            return el;
        }
        if (el[0] && el[0].nodeType === 1) {
            return el[0];
        }
        return null;
    };

    window.ff_helper = {
        numericVal: function (el) {
            const target = resolveElement(el);
            if (!target) {
                return 0;
            }
            if (target.classList.contains("ff_numeric")) {
                try {
                    const formatConfig = JSON.parse(
                        target.getAttribute("data-formatter") || "{}"
                    );
                    return currency(target.value, formatConfig).value;
                } catch (e) {
                    return Number(target.value || 0);
                }
            }
            return target.value || 0;
        },
        formatCurrency: function (el, value) {
            const target = resolveElement(el);
            if (!target) {
                return value;
            }
            if (target.classList.contains("ff_numeric")) {
                try {
                    const formatConfig = JSON.parse(
                        target.getAttribute("data-formatter") || "{}"
                    );
                    return currency(value, formatConfig).format();
                } catch (e) {
                    return value;
                }
            }
            return value;
        },
    };

    const appendCaptchaData = function (formEl, serializedData) {
        const params = new URLSearchParams(serializedData);
        const recaptchaEl = formEl.querySelector(
            ".ff-el-recaptcha.g-recaptcha"
        );
        if (recaptchaEl && window.grecaptcha) {
            const widgetId = recaptchaEl.dataset.gRecaptcha_widget_id;
            if (typeof widgetId !== "undefined") {
                params.append(
                    "g-recaptcha-response",
                    grecaptcha.getResponse(widgetId)
                );
            }
        }
        const hcaptchaEl = formEl.querySelector(".ff-el-hcaptcha.h-captcha");
        if (hcaptchaEl && window.hcaptcha) {
            const widgetId = hcaptchaEl.dataset.hCaptcha_widget_id;
            if (typeof widgetId !== "undefined") {
                params.append(
                    "h-captcha-response",
                    hcaptcha.getResponse(widgetId)
                );
            }
        }
        const turnstileEl = formEl.querySelector(
            ".ff-el-turnstile.cf-turnstile"
        );
        if (turnstileEl && window.turnstile) {
            const widgetId = turnstileEl.dataset.cfTurnstile_widget_id;
            if (typeof widgetId !== "undefined") {
                params.append(
                    "cf-turnstile-response",
                    turnstile.getResponse(widgetId)
                );
            }
        }
        return params.toString();
    };

    const serializeFormData = function (formEl) {
        const dataItems = [];
        const presentNames = new Set();
        const allInputs = Array.from(
            formEl.querySelectorAll("input, select, textarea")
        );
        const processedGroups = new Set();

        allInputs.forEach(input => {
            if (!input.name || input.disabled || input.type === "file") {
                return;
            }
            const repeaterContainer =
                input.getAttribute("data-type") === "repeater_container";
            if (repeaterContainer) {
                const repeaterParent = input.closest(".ff-repeater-container");
                if (
                    repeaterParent &&
                    repeaterParent.classList.contains("ff_excluded")
                ) {
                    return;
                }
                const conditionalParent = input.closest(".has-conditions");
                if (
                    conditionalParent &&
                    conditionalParent.classList.contains("ff_excluded")
                ) {
                    input.value = "";
                }
            } else {
                const conditionalParent = input.closest(".has-conditions");
                if (
                    conditionalParent &&
                    conditionalParent.classList.contains("ff_excluded")
                ) {
                    return;
                }
            }

            if (input.type === "checkbox" || input.type === "radio") {
                if (input.checked) {
                    dataItems.push([input.name, input.value || "on"]);
                    presentNames.add(input.name);
                }
                return;
            }

            if (input.tagName === "SELECT" && input.multiple) {
                Array.from(input.selectedOptions).forEach(opt => {
                    dataItems.push([input.name, opt.value]);
                    presentNames.add(input.name);
                });
                return;
            }

            dataItems.push([input.name, input.value]);
            presentNames.add(input.name);
        });

        allInputs.forEach(input => {
            if (
                !input.name ||
                (input.type !== "checkbox" && input.type !== "radio")
            ) {
                return;
            }
            if (
                !presentNames.has(input.name) &&
                !processedGroups.has(input.name)
            ) {
                const checked = formEl.querySelectorAll(
                    `input[name="${CSS.escape(input.name)}"]:checked`
                );
                if (!checked.length) {
                    dataItems.push([input.name, ""]);
                }
                processedGroups.add(input.name);
            }
        });

        const params = new URLSearchParams();
        dataItems.forEach(([name, value]) => params.append(name, value));

        Array.from(formEl.querySelectorAll("input[type=file]")).forEach(
            fileInput => {
                const fileInputName = fileInput.name + "[]";
                const previews = Array.from(
                    fileInput
                        .closest("div")
                        ?.querySelectorAll(
                            ".ff-uploaded-list .ff-upload-preview[data-src]"
                        ) || []
                );
                previews.forEach(preview => {
                    params.append(fileInputName, preview.dataset.src || "");
                });
            }
        );

        return params.toString();
    };

    const showErrorMessage = function (formEl, message) {
        const stack = formEl.parentElement?.querySelector(
            ".ff-errors-in-stack"
        );
        if (stack) {
            stack.innerHTML = "";
            const errorHtml = document.createElement("div");
            errorHtml.className = "error text-danger";
            errorHtml.textContent = message;
            stack.appendChild(errorHtml);
            stack.style.display = "";
        }
    };

    const getErrorPlacementSetting = function (formConfig) {
        return formConfig?.settings?.layout?.errorMessagePlacement || "";
    };

    const getFieldElement = function (formEl, fieldName) {
        if (!formEl || !fieldName) {
            return null;
        }

        return (
            formEl.querySelector(`[data-name="${CSS.escape(fieldName)}"]`) ||
            formEl.querySelector(`[name="${CSS.escape(fieldName)}"]`) ||
            formEl.querySelector(`[name="${CSS.escape(fieldName)}[]"]`)
        );
    };

    const normalizeErrorMessages = function (fieldErrors) {
        if (Array.isArray(fieldErrors)) {
            return fieldErrors;
        }

        if (fieldErrors && typeof fieldErrors === "object") {
            return Object.values(fieldErrors);
        }

        return [fieldErrors];
    };

    const clearValidationErrors = function (formEl) {
        const stack = formEl.parentElement?.querySelector(
            ".ff-errors-in-stack"
        );
        if (stack) {
            stack.innerHTML = "";
            stack.style.display = "none";
        }

        formEl.querySelectorAll(".ff-el-group").forEach(groupElement => {
            groupElement.classList.remove("ff-el-is-error");
            groupElement
                .querySelectorAll(".error.text-danger, .error")
                .forEach(errorElement => errorElement.remove());
        });

        formEl
            .querySelectorAll('[aria-invalid="true"]')
            .forEach(fieldElement => {
                fieldElement.setAttribute("aria-invalid", "false");
            });
    };

    const showErrorInStack = function (formEl, errors) {
        const stack = formEl.parentElement?.querySelector(
            ".ff-errors-in-stack"
        );
        if (
            !stack ||
            !errors ||
            (typeof errors === "object" &&
                !Array.isArray(errors) &&
                !Object.keys(errors).length)
        ) {
            return;
        }

        stack.innerHTML = "";

        Object.keys(errors).forEach(fieldName => {
            const fieldErrors = normalizeErrorMessages(errors[fieldName]);
            const fieldElement = getFieldElement(formEl, fieldName);

            fieldErrors.forEach(errorText => {
                const errorWrapper = document.createElement("div");
                errorWrapper.className = "error text-danger";
                errorWrapper.setAttribute("role", "alert");

                const textElement = document.createElement("span");
                textElement.className = "error-text";
                textElement.textContent = errorText;
                if (fieldElement?.name) {
                    textElement.dataset.name = fieldElement.name;
                }

                const clearElement = document.createElement("span");
                clearElement.className = "error-clear";
                clearElement.innerHTML = "&times;";
                clearElement.addEventListener("click", function () {
                    errorWrapper.remove();
                    if (!stack.children.length) {
                        stack.style.display = "none";
                    }
                });

                textElement.addEventListener("click", function () {
                    const targetName = textElement.dataset.name;
                    if (!targetName) {
                        return;
                    }
                    const focusTarget = formEl.querySelector(
                        `[name="${CSS.escape(targetName)}"]`
                    );
                    if (focusTarget) {
                        focusTarget.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                        });
                        focusTarget.focus();
                    }
                });

                errorWrapper.append(textElement, clearElement);
                stack.appendChild(errorWrapper);
            });

            if (fieldElement) {
                fieldElement.setAttribute("aria-invalid", "true");
                fieldElement
                    .closest(".ff-el-group")
                    ?.classList.add("ff-el-is-error");
            }
        });

        stack.style.display = "";
    };

    const showErrorBelowElement = function (formEl, fieldName, message) {
        const fieldElement = getFieldElement(formEl, fieldName);
        if (!fieldElement) {
            showErrorInStack(formEl, { [fieldName || "error"]: [message] });
            return;
        }

        fieldElement.setAttribute("aria-invalid", "true");

        const groupElement = fieldElement.closest(".ff-el-group");
        groupElement?.classList.add("ff-el-is-error");

        const errorElement = document.createElement("div");
        errorElement.className = "error text-danger";
        errorElement.setAttribute("role", "alert");
        errorElement.textContent = message;

        const contentWrapper = fieldElement.closest(".ff-el-input--content");
        if (contentWrapper) {
            contentWrapper
                .querySelectorAll("div.error")
                .forEach(existingError => existingError.remove());
            contentWrapper.appendChild(errorElement);
            return;
        }

        if (groupElement) {
            groupElement
                .querySelectorAll(":scope > .error.text-danger")
                .forEach(existingError => existingError.remove());
            groupElement.appendChild(errorElement);
            return;
        }

        fieldElement.parentElement?.appendChild(errorElement);
    };

    const showValidationErrors = function (formEl, formConfig, errors) {
        if (!errors) {
            return;
        }

        clearValidationErrors(formEl);

        if (typeof errors === "string") {
            showErrorInStack(formEl, { error: [errors] });
            return;
        }

        const errorPlacement = getErrorPlacementSetting(formConfig);
        if (!errorPlacement || errorPlacement === "stackToBottom") {
            showErrorInStack(formEl, errors);
            return;
        }

        Object.keys(errors).forEach(fieldName => {
            const fieldErrors = normalizeErrorMessages(errors[fieldName]);
            fieldErrors.forEach(errorText =>
                showErrorBelowElement(formEl, fieldName, errorText)
            );
        });
    };

    const normalizeSubmissionErrors = function (response) {
        if (!response) {
            return response;
        }

        if (response.errors && typeof response.errors === "object") {
            return response.errors;
        }

        if (response.data && response.data.errors) {
            return response.data.errors;
        }

        if (response.data && !response.data.result) {
            return response.data;
        }

        return response;
    };

    const createVanillaValidator = function (formEl, formConfig) {
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

            if (
                fieldElement.type === "checkbox" ||
                fieldElement.type === "radio"
            ) {
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

                if (
                    fieldElement.tagName === "SELECT" &&
                    fieldElement.multiple
                ) {
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
                const value = window.ff_helper
                    .numericVal(fieldElement)
                    .toString();
                if (!rule?.value || !value.length) {
                    return true;
                }
                return !Number.isNaN(Number(value));
            },
            min(fieldElement, rule) {
                const value = window.ff_helper
                    .numericVal(fieldElement)
                    .toString();
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
                const value = window.ff_helper
                    .numericVal(fieldElement)
                    .toString();
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
                const value = window.ff_helper
                    .numericVal(fieldElement)
                    .toString();
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

                clearValidationErrors(formEl);

                fields.forEach(fieldElement => {
                    const fieldName = normalizeFieldName(fieldElement);
                    if (!fieldName || !formConfig.rules?.[fieldName]) {
                        return;
                    }

                    Object.keys(formConfig.rules[fieldName]).forEach(
                        ruleName => {
                            const rule = formConfig.rules[fieldName][ruleName];
                            const validator = validationMethods[ruleName];
                            if (typeof validator !== "function") {
                                return;
                            }

                            if (!validator(fieldElement, rule)) {
                                if (!errors[fieldName]) {
                                    errors[fieldName] = {};
                                }
                                errors[fieldName][ruleName] = rule.message;
                            }
                        }
                    );
                });

                if (Object.keys(errors).length) {
                    const validationError = new window.ffValidationError(
                        "Validation Error!"
                    );
                    validationError.messages = errors;
                    throw validationError;
                }
            },
        };
    };

    const addHiddenData = function (formEl, items) {
        Object.keys(items || {}).forEach(itemName => {
            const itemValue = items[itemName];
            if (!itemValue) {
                return;
            }
            const existing = formEl.querySelector(
                `input[name="${CSS.escape(itemName)}"]`
            );
            if (existing) {
                existing.value = itemValue;
            } else {
                const hidden = document.createElement("input");
                hidden.type = "hidden";
                hidden.name = itemName;
                hidden.value = itemValue;
                formEl.appendChild(hidden);
            }
        });
    };

    const showFormSubmissionProgress = function (formEl) {
        formEl.classList.add("ff_submitting");
        const submitBtn = formEl.querySelector(".ff-btn-submit");
        if (submitBtn) {
            submitBtn.classList.add("disabled", "ff-working");
            submitBtn.disabled = true;
        }
    };

    const hideFormSubmissionProgress = function (formEl) {
        formEl.classList.remove("ff_submitting");
        const submitBtn = formEl.querySelector(".ff-btn-submit");
        if (submitBtn) {
            submitBtn.classList.remove("disabled", "ff-working");
            submitBtn.disabled = false;
        }
        formEl.parentElement
            ?.querySelectorAll(".ff_msg_temp")
            .forEach(el => el.remove());
    };

    const resetCaptchas = function (formEl) {
        if (window.grecaptcha) {
            const el = formEl.querySelector(".ff-el-recaptcha.g-recaptcha");
            if (el && typeof el.dataset.gRecaptcha_widget_id !== "undefined") {
                grecaptcha.reset(el.dataset.gRecaptcha_widget_id);
            }
        }
        if (window.hcaptcha) {
            const el = formEl.querySelector(".ff-el-hcaptcha.h-captcha");
            if (el && typeof el.dataset.hCaptcha_widget_id !== "undefined") {
                hcaptcha.reset(el.dataset.hCaptcha_widget_id);
            }
        }
        if (window.turnstile) {
            const el = formEl.querySelector(".ff-el-turnstile.cf-turnstile");
            if (el && typeof el.dataset.cfTurnstile_widget_id !== "undefined") {
                turnstile.reset(el.dataset.cfTurnstile_widget_id);
            }
        }
    };

    const getFormInstanceClass = function (formEl) {
        return formEl.getAttribute("data-form_instance") || "";
    };

    const getFormConfig = function (formEl) {
        const formInstanceSelector = getFormInstanceClass(formEl).replace(
            /[^a-zA-Z0-9_-]/g,
            ""
        );
        const formConfiguration = window["fluent_form_" + formInstanceSelector];
        return formConfiguration && typeof formConfiguration === "object"
            ? formConfiguration
            : null;
    };

    const getAjaxUrl = function (formConfig) {
        return (
            window.fluentFormVars?.ajaxUrl ||
            formConfig?.ajaxUrl ||
            window.ajaxurl
        );
    };

    const emitResetSliderEvent = function (formEl) {
        if (!formEl || typeof window.jQuery === "function") {
            return;
        }

        if (!formEl.classList.contains("ff-form-has-steps")) {
            return;
        }

        const sliderPayload = {
            goBackToStep: 0,
            animDuration: parseInt(
                window.fluentFormVars?.stepAnimationDuration || 0
            ),
            isScrollTop: false,
            actionType: "next",
        };

        jqueryEventBridge.emitEvent("update_slider", sliderPayload, formEl, [
            sliderPayload,
        ]);
    };

    const emitErrorStepSliderEvent = function (formEl) {
        if (!formEl || typeof window.jQuery === "function") {
            return;
        }

        if (!formEl.classList.contains("ff-form-has-steps")) {
            return;
        }

        const formSteps = Array.from(
            formEl.querySelectorAll(".fluentform-step")
        );
        if (!formSteps.length) {
            return;
        }

        const firstErroredField = formEl.querySelector(
            ".ff-el-group.ff-el-is-error"
        );
        const errorStep = firstErroredField?.closest(".fluentform-step");
        const goBackToStep = errorStep ? formSteps.indexOf(errorStep) : -1;
        if (goBackToStep < 0) {
            return;
        }

        const sliderPayload = {
            goBackToStep: goBackToStep,
            animDuration: parseInt(
                window.fluentFormVars?.stepAnimationDuration || 0
            ),
            isScrollTop: false,
            actionType: "next",
        };

        jqueryEventBridge.emitEvent("update_slider", sliderPayload, formEl, [
            sliderPayload,
        ]);
    };

    const emitInitEvents = function (app, formEl, formConfig) {
        jqueryEventBridge.emitEvent(
            "fluentform_init",
            {
                form: formEl,
                config: formConfig,
            },
            document.body,
            [formEl, formConfig]
        );
        jqueryEventBridge.emitEvent(
            "fluentform_init_" + formConfig.id,
            {
                form: formEl,
                config: formConfig,
            },
            document.body,
            [formEl, formConfig]
        );
        jqueryEventBridge.emitEvent(
            "fluentform_init_single",
            {
                form: formEl,
                app: app,
                config: formConfig,
            },
            formEl,
            [app, formConfig]
        );
    };

    const createAppInstance = function (formEl, formConfig) {
        let isSending = false;
        const globalValidators = {};
        const createBridgePayload = function (response) {
            return {
                form: formEl,
                response: response,
                config: formConfig,
            };
        };
        const createJqueryFormResponse = function (response) {
            return {
                form: formEl,
                response: response,
            };
        };
        const createJquerySuccessPayload = function (response) {
            return {
                form: formEl,
                config: formConfig,
                response: response,
            };
        };
        const createSubmissionRequestPayload = function () {
            return {
                data: appendCaptchaData(formEl, serializeFormData(formEl)),
                action: "fluentform_submit",
                form_id: formEl.getAttribute("data-form_id"),
            };
        };
        const emitSubmissionFailure = function (responseOrError) {
            const submissionFailureEventPayload =
                createBridgePayload(responseOrError);
            const jqueryFailureEventPayload =
                createJqueryFormResponse(responseOrError);
            jqueryEventBridge.emitEvent(
                "fluentform_submission_failed",
                submissionFailureEventPayload,
                formEl,
                [jqueryFailureEventPayload]
            );
        };
        const emitSubmissionNextAction = function (response) {
            const nextActionEventPayload = createBridgePayload(response);
            const jqueryNextActionPayload = createJqueryFormResponse(response);
            jqueryEventBridge.emitEvent(
                "fluentform_next_action_" + response.data.nextAction,
                nextActionEventPayload,
                formEl,
                [jqueryNextActionPayload]
            );
        };
        const emitSubmissionSuccess = function (response) {
            const submissionSuccessEventPayload = createBridgePayload(response);
            const jquerySuccessEventPayload =
                createJquerySuccessPayload(response);

            jqueryEventBridge.emitEvent(
                "fluentform_submission_success",
                submissionSuccessEventPayload,
                formEl,
                [jquerySuccessEventPayload],
                { bubbles: false }
            );
            jqueryEventBridge.emitEvent(
                "fluentform_submission_success",
                submissionSuccessEventPayload,
                document.body,
                [jquerySuccessEventPayload]
            );
        };
        const resetFormAfterSuccessfulSubmission = function (response) {
            if (response.data.result.action === "hide_form") {
                formEl.style.display = "none";
                formEl.classList.add("ff_force_hide");
                formEl.reset();
                return;
            }

            jqueryEventBridge.emitEvent(
                "fluentform_reset",
                {
                    form: formEl,
                    config: formConfig,
                },
                document.body,
                [formEl, formConfig]
            );
            formEl.reset();
        };

        const addFieldValidationRule = function (elName, ruleName, rule) {
            if (!formConfig.rules || typeof formConfig.rules !== "object") {
                formConfig.rules = {};
            }
            if (
                !formConfig.rules[elName] ||
                typeof formConfig.rules[elName] !== "object"
            ) {
                formConfig.rules[elName] = {};
            }
            formConfig.rules[elName][ruleName] = rule;
        };

        const removeFieldValidationRule = function (elName, ruleName) {
            if (!formConfig.rules || !formConfig.rules[elName]) {
                return;
            }
            if (
                Object.prototype.hasOwnProperty.call(
                    formConfig.rules[elName],
                    ruleName
                )
            ) {
                delete formConfig.rules[elName][ruleName];
            }
        };

        const runBeforeSubmitCallbacks = async function (payload) {
            const callbacks = Object.assign({}, globalValidators);

            if (
                formEl.classList.contains("ff_has_v3_recptcha") &&
                window.grecaptcha &&
                typeof window.grecaptcha.execute === "function"
            ) {
                callbacks.ff_v3_recptcha = function (targetFormEl, formData) {
                    const siteKey =
                        targetFormEl.getAttribute("data-recptcha_key");
                    if (!siteKey) {
                        return Promise.resolve();
                    }
                    return window.grecaptcha
                        .execute(siteKey, { action: "submit" })
                        .then(function (token) {
                            const extra = new URLSearchParams({
                                "g-recaptcha-response": token,
                            }).toString();
                            formData.data = formData.data
                                ? formData.data + "&" + extra
                                : extra;
                        });
                };
            }

            const runners = Object.keys(callbacks).map(function (key) {
                return callbacks[key];
            });

            for (const runner of runners) {
                if (typeof runner !== "function") {
                    continue;
                }
                const result = runner(formEl, payload);
                if (result && typeof result.then === "function") {
                    await result;
                    continue;
                }
                if (result === false) {
                    throw new Error(
                        "Submission blocked by a pre-submit validator."
                    );
                }
            }
        };

        const app = {
            formElement: formEl,
            settings: formConfig,
            config: formConfig,
            formSelector: "." + getFormInstanceClass(formEl),
            initFormHandlers: function () {
                formEl.classList.remove("ff-form-loading");
                formEl.classList.add("ff-form-loaded");
            },
            initTriggers: function () {
                emitInitEvents(app, formEl, formConfig);
            },
            reinitExtras: function () {
                resetCaptchas(formEl);
            },
            showFormSubmissionProgress: function () {
                showFormSubmissionProgress(formEl);
            },
            hideFormSubmissionProgress: function () {
                hideFormSubmissionProgress(formEl);
            },
            addGlobalValidator: function (key, callback) {
                globalValidators[key] = callback;
            },
            addFieldValidationRule: addFieldValidationRule,
            removeFieldValidationRule: removeFieldValidationRule,
            validate: function (elements) {
                const validator = createVanillaValidator(formEl, formConfig);
                const fieldList =
                    elements && typeof elements.length !== "undefined"
                        ? elements
                        : formEl.querySelectorAll("input, select, textarea");
                validator.validate(fieldList);
            },
            scrollToFirstError: function () {
                const firstError = formEl.querySelector(
                    ".ff-el-is-error, .error"
                );
                if (firstError) {
                    firstError.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            },
            showErrorMessages: function (errors) {
                showValidationErrors(
                    formEl,
                    formConfig,
                    errors || "Submission failed"
                );
            },
            sendData: async function (targetFormEl, payload) {
                const ajaxUrl = getAjaxUrl(formConfig);
                const requestUrl =
                    ajaxUrl +
                    (ajaxUrl.includes("?") ? "&" : "?") +
                    "t=" +
                    Date.now();
                const encoded = new URLSearchParams(payload).toString();
                const response = await fetch(requestUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded; charset=UTF-8",
                    },
                    credentials: "same-origin",
                    body: encoded,
                });
                const data = await response.json();
                return data;
            },
            submissionAjaxHandler: async function () {
                if (isSending) {
                    return;
                }
                if (formEl.querySelector(".ff_uploading")) {
                    showErrorMessage(
                        formEl,
                        window.fluentform_submission_messages_global
                            ?.file_upload_in_progress ||
                            "File upload in progress. Please wait..."
                    );
                    return;
                }

                const payload = createSubmissionRequestPayload();

                showFormSubmissionProgress(formEl);
                isSending = true;

                try {
                    await runBeforeSubmitCallbacks(payload);
                    const res = await app.sendData(formEl, payload);
                    if (!res || !res.data || !res.data.result) {
                        const errorPayload = normalizeSubmissionErrors(res);
                        emitSubmissionFailure(res);
                        app.showErrorMessages(errorPayload);
                        app.scrollToFirstError();
                        emitErrorStepSliderEvent(formEl);
                        return;
                    }

                    if (res.data.append_data) {
                        addHiddenData(formEl, res.data.append_data);
                    }
                    if (res.data.nextAction) {
                        emitSubmissionNextAction(res);
                        return;
                    }

                    emitSubmissionSuccess(res);

                    const successId = formConfig.form_id_selector + "_success";
                    let successNode = document.getElementById(successId);
                    if (successNode) {
                        successNode.remove();
                    }
                    if (res.data.result.message) {
                        successNode = document.createElement("div");
                        successNode.id = successId;
                        successNode.className = "ff-message-success";
                        successNode.setAttribute("role", "status");
                        successNode.setAttribute("aria-live", "polite");
                        const msgDiv = document.createElement("div");
                        msgDiv.textContent = res.data.result.message;
                        successNode.appendChild(msgDiv);
                        formEl.insertAdjacentElement("afterend", successNode);
                        successNode.focus();
                    }

                    if ("redirectUrl" in res.data.result) {
                        setTimeout(
                            () => hideFormSubmissionProgress(formEl),
                            500
                        );
                        window.location.href = res.data.result.redirectUrl;
                        return;
                    }

                    resetFormAfterSuccessfulSubmission(res);
                } catch (error) {
                    emitSubmissionFailure(error);
                    app.showErrorMessages(error?.message || "Request failed");
                } finally {
                    isSending = false;
                    hideFormSubmissionProgress(formEl);
                    resetCaptchas(formEl);
                }
            },
        };
        return app;
    };

    const getLiveFormInstance = function (instanceClass) {
        const cachedFormInstance = formInstanceStore[instanceClass];
        if (!cachedFormInstance) {
            return null;
        }

        if (
            !cachedFormInstance.formElement ||
            !cachedFormInstance.formElement.isConnected
        ) {
            delete formInstanceStore[instanceClass];
            return null;
        }

        return cachedFormInstance;
    };

    const reinitializeFormInstance = function (formEl) {
        if (reinitializingForms.has(formEl)) {
            return false;
        }

        reinitializingForms.add(formEl);
        const app = window.fluentFormApp(formEl);
        if (!app) {
            reinitializingForms.delete(formEl);
            return false;
        }

        try {
            app.reinitExtras();
            app.initFormHandlers();
            app.initTriggers();
            formEl.setAttribute("data-ff_reinit", "yes");
            jqueryEventBridge.emitEvent(
                "ff_reinit",
                {
                    formItem: formEl,
                    form: formEl,
                    config: getFormConfig(formEl),
                },
                document,
                [formEl]
            );
        } finally {
            reinitializingForms.delete(formEl);
        }

        return true;
    };

    window.fluentFormApp = function (formInput) {
        const formEl =
            resolveElement(formInput) || document.querySelector(formInput);
        if (!formEl) {
            return false;
        }
        const instanceClass = getFormInstanceClass(formEl).replace(
            /[^a-zA-Z0-9_-]/g,
            ""
        );
        if (!instanceClass) {
            return false;
        }
        const liveFormInstance = getLiveFormInstance(instanceClass);
        if (liveFormInstance) {
            return liveFormInstance;
        }
        const formConfig = getFormConfig(formEl);
        if (!formConfig) {
            return false;
        }
        const app = createAppInstance(formEl, formConfig);
        formInstanceStore[instanceClass] = app;
        return app;
    };

    Array.from(document.querySelectorAll("form.frm-fluent-form")).forEach(
        formEl => {
            const app = window.fluentFormApp(formEl);
            if (app) {
                app.initFormHandlers();
                app.initTriggers();
            }
        }
    );

    const handleFluentFormSubmit = function (submitEvent) {
        const formEl = submitEvent.target.closest("form.frm-fluent-form");
        if (!formEl) {
            return false;
        }
        submitEvent.preventDefault();
        const app = window.fluentFormApp(formEl);
        if (!app) {
            return true;
        }
        app.submissionAjaxHandler();
        return true;
    };

    const handleLoadingFormSubmit = function (submitEvent) {
        const loadingFormElement = submitEvent.target.closest(
            ".fluentform .ff-form-loading"
        );
        if (!loadingFormElement) {
            return false;
        }
        submitEvent.preventDefault();
        loadingFormElement.parentElement
            ?.querySelectorAll(".ff_msg_temp")
            .forEach(el => el.remove());
        const msg = document.createElement("div");
        msg.className = "error text-danger ff_msg_temp";
        msg.textContent =
            window.fluentform_submission_messages_global
                ?.javascript_handler_failed ||
            "Javascript handler could not be loaded. Form submission has been failed. Reload the page and try again";
        loadingFormElement.insertAdjacentElement("afterend", msg);
        return true;
    };

    // Define listener functions as variables for proper cleanup
    const submitHandler = function (submitEvent) {
        if (handleFluentFormSubmit(submitEvent)) {
            return;
        }
        handleLoadingFormSubmit(submitEvent);
    };

    const resetHandler = function (e) {
        const formEl = e.target.closest("form.frm-fluent-form");
        if (!formEl) {
            return;
        }
        emitResetSliderEvent(formEl);
        const formConfig = getFormConfig(formEl);
        jqueryEventBridge.emitEvent(
            "fluentform_reset",
            {
                form: formEl,
                config: formConfig,
            },
            document.body,
            [formEl, formConfig]
        );
    };

    const reinitHandler = function (e) {
        const detail = e.detail || {};
        const formItem = detail.formItem || detail.form || null;
        const formEl = resolveElement(formItem);
        if (!formEl || reinitializingForms.has(formEl)) {
            return;
        }
        reinitializeFormInstance(formEl);
    };

    // Attach listeners with stored references for cleanup
    document.addEventListener("submit", submitHandler);
    document.addEventListener("reset", resetHandler);
    document.addEventListener("ff_reinit", reinitHandler);

    // Store cleanup function on window for potential future use (AJAX form reloads)
    window._fluentFormSubmissionCleanup = function () {
        document.removeEventListener("submit", submitHandler);
        document.removeEventListener("reset", resetHandler);
        document.removeEventListener("ff_reinit", reinitHandler);
    };
}

module.exports = { initVanillaSubmissionRuntime };
