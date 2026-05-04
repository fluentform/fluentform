/**
 * Fluid Form Vanilla Submission Runtime
 * Handles form submission, initialization, and orchestration without jQuery.
 * Uses dedicated modules for validation, error display, common actions, and
 * CAPTCHA rendering so the same logic can be reused/tested independently.
 */

const { ensureFluentFormJqueryBridge } = require("./event-bridge.js");
const { createVanillaValidator } = require("./form-validator.plain.js");
const { createErrorHandler } = require("./form-error-handler.plain.js");
const {
    initFluentFormCommonActions,
} = require("./form-common-actions.plain.js");
const {
    maybeRenderCaptchas,
    reinitCaptchasForReinit,
} = require("./form-captcha-renderer.plain.js");
const { performFullFormReset } = require("./form-reset.plain.js");

function initVanillaSubmissionRuntime() {
    const jqueryEventBridge = ensureFluentFormJqueryBridge();
    const formInstanceStore = {};
    const reinitializingForms = new WeakSet();

    // Origin: dev:form-submission.js:20-25 (ffValidationError)
    // Current: form-submission.plain.js:28
    // Migration: verbatim — same Error subclass, used by validator + handlers.
    window.ffValidationError = (function () {
        var ffValidationError = function () {};
        ffValidationError.prototype = Object.create(Error.prototype);
        ffValidationError.prototype.constructor = ffValidationError;
        return ffValidationError;
    })();

    // Origin: dev:form-submission.js:4-23 (fluentFormrecaptchaSuccessCallback)
    // Current: form-submission.plain.js:41
    // Migration: ported to vanilla — replaces `jQuery('.g-recaptcha').filter(...)` +
    //   `jQuery('html, body').animate({scrollTop})` with `document.querySelectorAll`
    //   + `el.scrollIntoView({block: 'center'})`. C-09. Recaptcha.php:117 renders
    //   the data-callback attribute that triggers this.
    window.fluentFormrecaptchaSuccessCallback = function (response) {
        const isSmallIphone =
            window.innerWidth < 768 &&
            /iPhone|iPod/.test(navigator.userAgent) &&
            !window.MSStream;
        if (!isSmallIphone || !window.grecaptcha) {
            return;
        }
        const widgets = Array.from(document.querySelectorAll(".g-recaptcha"));
        const matched = widgets.find(
            (_, i) => window.grecaptcha.getResponse(i) === response
        );
        matched?.scrollIntoView({ block: "center" });
    };

    // Origin: dev:form-submission.js:77-83 (getSubmissionMessage)
    // Current: form-submission.plain.js:61
    // Migration: per-form translated map via window['fluentform_submission_messages_'+formId]
    //   (Component.php:1536). PR2 added the global fallback for the
    //   `javascript_handler_failed` literal. C-15.
    const resolveSubmissionMessage = function (formId, key, fallback) {
        const perForm = window["fluentform_submission_messages_" + formId];
        if (perForm?.[key]) {
            return perForm[key];
        }
        if (window.fluentform_submission_messages_global?.[key]) {
            return window.fluentform_submission_messages_global[key];
        }
        return fallback;
    };

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

    // Origin: dev:form-submission.js:27-42 (window.ff_helper)
    // Current: form-submission.plain.js:91
    // Migration: numericVal now returns raw `target.value` for empty plain inputs
    //   (was `|| 0` in dev) so the validator's `!value.length` short-circuit
    //   fires uniformly with the ff_numeric branch. PR1 C-08. formatCurrency is
    //   verbatim — guarded `currency()` lookup, returns input untouched if absent.
    window.ff_helper = {
        numericVal: function (el) {
            const target = resolveElement(el);
            if (!target) {
                return 0;
            }
            if (target.classList.contains("ff_numeric")) {
                // Return raw value for empty fields (validation will skip empty via !value.length check)
                if (!target.value || target.value.trim() === "") {
                    return "";
                }
                try {
                    const formatConfig = JSON.parse(
                        target.getAttribute("data-formatter") || "{}"
                    );
                    // If currency() is available, use it to parse formatted value
                    if (typeof window.currency === "function") {
                        return currency(target.value, formatConfig).value;
                    }
                    // Fallback: extract numeric value when currency() not available
                    // Remove all non-digit chars except decimal point (dot or comma)
                    const rawValue = target.value.toString();
                    const digitsAndSeps = rawValue.replace(/[^\d.,]/g, "");
                    // Assume last occurrence of . or , is the decimal separator
                    const lastDotIdx = digitsAndSeps.lastIndexOf(".");
                    const lastCommaIdx = digitsAndSeps.lastIndexOf(",");
                    const lastSepIdx = Math.max(lastDotIdx, lastCommaIdx);

                    if (lastSepIdx > -1 && lastSepIdx > digitsAndSeps.length - 4) {
                        // Separator near the end (likely decimal): keep it, remove others
                        const beforeSep = digitsAndSeps.slice(0, lastSepIdx).replace(/[.,]/g, "");
                        const afterSep = digitsAndSeps.slice(lastSepIdx + 1);
                        return Number(beforeSep + "." + afterSep) || 0;
                    }
                    // No decimal or separator far from end: remove all separators
                    return Number(digitsAndSeps.replace(/[,.]/g, "")) || 0;
                } catch (e) {
                    // If JSON.parse fails or any error, return raw numeric value
                    return Number(target.value || 0) || 0;
                }
            }
            // Plain numeric inputs: return the raw value so empty inputs surface as ""
            // (length 0). The vanilla validators bail on `!value.length` — returning 0 here
            // would make an empty <input type="number"> fail every `min` rule with rule.value > 0.
            return target.value;
        },
        formatCurrency: function (el, value) {
            const target = resolveElement(el);
            if (!target) {
                return value;
            }
            if (target.classList.contains("ff_numeric")) {
                // Guard: if currency() not available, return value as-is
                if (typeof window.currency !== "function") {
                    return value;
                }
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

    // Origin: dev:form-submission.js:155-298 (submissionAjaxHandler — captcha branch)
    // Current: form-submission.plain.js:164
    // Migration: split into a focused helper. Reads via `dataset.gRecaptcha_widget_id`
    //   etc. (camelCase from the hyphenated `data-` attrs the renderer writes — C-30).
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

    // Origin: dev:form-submission.js:163-208 (submissionAjaxHandler — serialize block)
    // Current: form-submission.plain.js:208
    // Migration: native URLSearchParams instead of jQuery `.serializeArray()` +
    //   `$.param()`. Repeater + conditional `ff_excluded` carve-outs preserved
    //   (jq:165-178). C-32 added the tabular-grid skip in PR8.
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

        // C-32 (codex): skip checkbox/radio inputs that live inside a `<table>`
        // wrapper (checkable-grid, net-promoter-score, etc.) before adding empty
        // values — those tabular widgets serialize per-row and don't want a
        // bare `name=""` fallback. Mirrors dev:179-182.
        const isInsideTabularGrid = function (input) {
            const content = input.closest(".ff-el-input--content");
            return !!content?.querySelector("table");
        };

        allInputs.forEach(input => {
            if (
                !input.name ||
                (input.type !== "checkbox" && input.type !== "radio")
            ) {
                return;
            }
            if (isInsideTabularGrid(input)) {
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

    // Origin: dev:form-submission.js:1079-1094 (addHiddenData)
    // Current: form-submission.plain.js:345
    // Migration: native createElement, same "update existing else append" behavior.
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

    // Origin: dev:form-submission.js:499-506 (showFormSubmissionProgress)
    // Current: form-submission.plain.js:369
    // Migration: classList replaces .addClass; same disabled+working button state.
    const showFormSubmissionProgress = function (formEl) {
        formEl.classList.add("ff_submitting");
        const submitBtn = formEl.querySelector(".ff-btn-submit");
        if (submitBtn) {
            submitBtn.classList.add("disabled", "ff-working");
            submitBtn.disabled = true;
        }
    };

    // Origin: dev:form-submission.js:508-516 (hideFormSubmissionProgress)
    // Current: form-submission.plain.js:381
    // Migration: classList replaces .removeClass; also removes `.ff_msg_temp`.
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

    // Origin: dev:form-submission.js:476-498 (always-block captcha reset)
    // Current: form-submission.plain.js:397
    // Migration: reads via `dataset.gRecaptcha_widget_id` etc. matching the
    //   hyphenated attributes set by form-captcha-renderer.plain.js (C-30).
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

    // Origin: dev:form-submission.js:121-128 (fireUpdateSlider — reset variant)
    // Current: form-submission.plain.js:447
    // Migration: vanilla emits `update_slider` via the bridge with the same
    //   payload keys (goBackToStep:0, animDuration, isScrollTop:false).
    //   Short-circuits if jQuery is on the page so the legacy slider listener
    //   isn't double-fired.
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

    // Origin: dev:form-submission.js:454-466 (fireUpdateSlider — submit-error variant)
    // Current: form-submission.plain.js:474
    // Migration: locate the first errored field's step index, emit `update_slider`
    //   so multi-step forms snap back to that step on validation failure.
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

    // Origin: dev:form-submission.js:917-919 (initTriggers — init events)
    // Current: form-submission.plain.js:520
    // Migration: emit via the bridge so both jQuery `$.trigger` and native
    //   CustomEvent listeners receive the events. Native detail uses
    //   `{ form, config }` (modern shape); jQuery `extraParameters` use
    //   `[formEl, formConfig]` so legacy `function (e, $form, form)` handlers
    //   continue to receive the expected positional args.
    const emitInitEvents = function (app, formEl, formConfig) {
        jqueryEventBridge.emitEvent(
            "fluentform_init",
            { form: formEl, config: formConfig },
            document.body,
            [formEl, formConfig]
        );
        jqueryEventBridge.emitEvent(
            "fluentform_init_" + formConfig.id,
            { form: formEl, config: formConfig },
            document.body,
            [formEl, formConfig]
        );
        jqueryEventBridge.emitEvent(
            "fluentform_init_single",
            { form: formEl, app: app, config: formConfig },
            formEl,
            [app, formConfig]
        );
    };

    // Origin: dev:form-submission.js:923 ($theForm.data('is_initialized', 'yes'))
    // Current: form-submission.plain.js:545
    // Migration: setAttribute instead of `.data()`. Pro / third-party code
    //   that polls for the attribute keeps working. C-21.
    const markFormInitialized = function (formEl) {
        formEl.setAttribute("data-is_initialized", "yes");
    };

    // Origin: dev:form-submission.js:925-930 (initTriggers — input.ff-read-only loop)
    // Current: form-submission.plain.js:554
    // Migration: native forEach + setAttribute. The `.ff-read-only` class is
    //   applied server-side to inputs that take programmatic values but not
    //   user keystrokes. C-22.
    const applyReadOnlyAttributes = function (formEl) {
        formEl
            .querySelectorAll("input.ff-read-only")
            .forEach(input => {
                input.setAttribute("tabindex", "-1");
                input.setAttribute("readonly", "readonly");
            });
    };

    // Origin: dev:form-submission.js:932-966 (initTriggers — tooltip handler)
    // Current: form-submission.plain.js:569
    // Migration: replaces jQuery `.appendTo(document.body)` + `.css({top, left, max-width})`
    //   with native createElement + getBoundingClientRect math. Same `<script>/<iframe>/
    //   on*=…/javascript:` regex sanitizer chain. Mouseleave removes
    //   `.ff-el-pop-content`. C-20.
    const wireTooltipHandler = function (formEl) {
        const sanitize = raw =>
            String(raw || "")
                .replace(/<script.*?>.*?<\/script>/gis, "")
                .replace(/<iframe.*?>.*?<\/iframe>/gis, "")
                .replace(/<.*?\bon\w+=["'][^"']*["']/gi, "")
                .replace(/javascript:/gi, "");

        const ensurePopContent = () => {
            let pop = document.querySelector(".ff-el-pop-content");
            if (!pop) {
                pop = document.createElement("div");
                pop.className = "ff-el-pop-content";
                document.body.appendChild(pop);
            }
            return pop;
        };

        const removePopContent = () => {
            document
                .querySelectorAll(".ff-el-pop-content")
                .forEach(node => node.remove());
        };

        formEl.querySelectorAll(".ff-el-tooltip").forEach(tip => {
            tip.addEventListener("mouseenter", function () {
                const content = sanitize(this.dataset.content);
                if (!content) {
                    return;
                }
                const pop = ensurePopContent();
                pop.innerHTML = content;
                const formWidth = formEl.clientWidth - 20;
                pop.style.maxWidth = formWidth + "px";

                const iconRect = this.getBoundingClientRect();
                const popRect = pop.getBoundingClientRect();
                const scrollY = window.scrollY || window.pageYOffset;
                const scrollX = window.scrollX || window.pageXOffset;
                let left =
                    iconRect.left + scrollX -
                    popRect.width / 2 +
                    10;
                if (left < 15) {
                    left = 15;
                }
                pop.style.top =
                    iconRect.top + scrollY - popRect.height - 5 + "px";
                pop.style.left = left + "px";
            });
            tip.addEventListener("mouseleave", removePopContent);
        });
    };

    // Origin: dev:form-submission.js:968-971 (initTriggers — lity:open listener)
    // Current: form-submission.plain.js:628
    // Migration: registered once globally (guarded by `_ffLityCaptchaRerenderWired`)
    //   since lity dispatches on `document`. Re-runs `maybeRenderCaptchas` for
    //   every form on the page after the lightbox opens. C-23.
    const wireLityCaptchaReRender = function (formEl) {
        if (window._ffLityCaptchaRerenderWired) {
            return;
        }
        window._ffLityCaptchaRerenderWired = true;
        document.addEventListener("lity:open", function () {
            window.turnstile?.remove();
            // Re-run for every form on the page since the lightbox event is global.
            document
                .querySelectorAll("form.frm-fluent-form")
                .forEach(node => maybeRenderCaptchas(node));
        });
    };

    // Origin: dev:form-submission.js:973-985 (initTriggers — focusin + step + captcha render)
    // Current: form-submission.plain.js:650
    // Migration: emits `fluentform_first_interaction` once on focusin, lazy-renders
    //   captchas on first interaction + step navigation. PR4 switched
    //   `ff_to_next_page` / `ff_to_prev_page` from raw addEventListener to
    //   bridge.onEvent so jQuery `$.trigger` from Pro slider is caught (C-25).
    //   PR3 added the per-form init bits (markFormInitialized, applyReadOnlyAttributes,
    //   wireTooltipHandler, wireLityCaptchaReRender).
    const wireFirstInteractionAndCaptchaTriggers = function (formEl) {
        if (formEl._ffFirstInteractionWired) {
            return;
        }
        formEl._ffFirstInteractionWired = true;

        const fireFirstInteractionOnce = function () {
            jqueryEventBridge.emitEvent(
                "fluentform_first_interaction",
                { form: formEl },
                formEl,
                [formEl]
            );
            formEl.removeEventListener("focusin", fireFirstInteractionOnce);
        };
        formEl.addEventListener("focusin", fireFirstInteractionOnce);

        // CAPTCHA lazy-render bindings — match jQuery path behavior.
        formEl.addEventListener("fluentform_first_interaction", function () {
            maybeRenderCaptchas(formEl);
        });

        const renderOnStepChange = function () {
            maybeRenderCaptchas(formEl);
        };
        // C-25: Pro slider fires `ff_to_next_page`/`ff_to_prev_page` via
        // jQuery `.trigger(...)`, which does NOT propagate as a native
        // CustomEvent for custom event names. Use bridge.onEvent (which uses
        // `$.on(...)` when jQuery is available) so we catch the trigger fire.
        jqueryEventBridge.onEvent(
            formEl,
            "ff_to_next_page ff_to_prev_page",
            renderOnStepChange
        );

        // Initial render — matches jQuery `mayBeRenderCaptchas()` at end of initTriggers.
        maybeRenderCaptchas(formEl);

        // C-20 / C-21 / C-22 / C-23: per-form init bits that the dev `initTriggers`
        // also wires alongside the captcha triggers.
        applyReadOnlyAttributes(formEl);
        wireTooltipHandler(formEl);
        wireLityCaptchaReRender(formEl);
        markFormInitialized(formEl);
    };

    const createAppInstance = function (formEl, formConfig) {
        let isSending = false;
        const globalValidators = {};
        const errorHandler = createErrorHandler(formEl);

        const showValidationErrorsWithEvents = function (errors) {
            if (!errors) {
                return;
            }

            errorHandler.clear();

            if (typeof errors === "string") {
                errorHandler.showInStack({ error: [errors] });
                emitStackErrorEvents(errors, "error");
                return;
            }

            const errorPlacement =
                formConfig?.settings?.layout?.errorMessagePlacement || "";
            if (!errorPlacement || errorPlacement === "stackToBottom") {
                errorHandler.showInStack(errors);
                Object.keys(errors).forEach(fieldName => {
                    errorHandler
                        .normalizeErrors(errors[fieldName])
                        .forEach(message =>
                            emitStackErrorEvents(message, fieldName)
                        );
                });
                return;
            }

            Object.keys(errors).forEach(fieldName => {
                errorHandler
                    .normalizeErrors(errors[fieldName])
                    .forEach(message => {
                        errorHandler.showBelowElement(fieldName, message);
                        emitBelowElementErrorEvent(fieldName, message);
                    });
            });
        };

        const emitStackErrorEvents = function (message, fieldName) {
            jqueryEventBridge.emitEvent(
                "fluentform_error_in_stack",
                {
                    form: formEl,
                    element: getFieldElement(formEl, fieldName),
                    message: message,
                },
                document.body
            );
        };

        const emitBelowElementErrorEvent = function (fieldName, message) {
            jqueryEventBridge.emitEvent(
                "fluentform_error_below_element",
                {
                    form: formEl,
                    element: getFieldElement(formEl, fieldName),
                    message: message,
                },
                document.body
            );
        };

        const getFieldElement = function (formNode, fieldName) {
            if (!formNode || !fieldName) {
                return null;
            }
            return (
                formNode.querySelector(
                    `[data-name="${CSS.escape(fieldName)}"]`
                ) ||
                formNode.querySelector(`[name="${CSS.escape(fieldName)}"]`) ||
                formNode.querySelector(`[name="${CSS.escape(fieldName)}[]"]`)
            );
        };

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
                { form: formEl, config: formConfig },
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

        // Origin: dev:form-submission.js:130-153 (fireGlobalBeforeSendCallbacks)
        // Current: form-submission.plain.js:894
        // Migration: jQuery `$.when(...)` of `Deferred` → async/await over
        //   `Promise.resolve(runner())`. v3 reCAPTCHA token append preserved.
        //   `false` return blocks submission (codex flagged this is stricter than
        //   dev's `$.when(false)` which would resolve — kept the stricter
        //   semantics intentionally; documented in PARITY-MATRIX).
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

        // Origin: dev:form-submission.js:163-180 (submissionAjaxHandler — pre-validate filter)
        // Current: form-submission.plain.js:948
        // Migration: same pre-filter that excludes `.has-conditions.ff_excluded`
        //   inputs and skips `data-type="repeater_container"` inside excluded
        //   wrappers. PR7 switched the filter to `closest()` for self-inclusive
        //   parity with dev. Throws `ffValidationError` carrying `messages`.
        const runClientValidation = function () {
            const validator = createVanillaValidator(formEl, formConfig);
            // Skip fields hidden by conditional logic — matches dev `.closest()`
            // semantics (form-submission-jquery.js:177): if any ancestor *or self*
            // has both `.has-conditions` and `.ff_excluded`, skip the field.
            const fields = Array.from(
                formEl.querySelectorAll("input, select, textarea")
            ).filter(el => !el.closest(".has-conditions.ff_excluded"));
            const errors = validator.validate(fields);
            if (Object.keys(errors).length) {
                const validationError = new window.ffValidationError(
                    "Validation Error!"
                );
                validationError.messages = errors;
                throw validationError;
            }
        };

        // Origin: dev:form-submission.js:848-864 (initInlineErrorItems)
        // Current: form-submission.plain.js:972
        // Migration: delegated `change` listener on the form (one listener vs
        //   per-group jQuery `.on('change', 'input,select,textarea', ...)`).
        //   Honors `window.ff_disable_error_clear`. Sets aria-invalid='false'
        //   and removes `.error.text-danger` from the parent group. C-14.
        const initInlineErrorClearing = function () {
            if (formEl._ffInlineErrorClearWired) {
                return;
            }
            formEl._ffInlineErrorClearWired = true;
            formEl.addEventListener("change", function (e) {
                const target = e.target;
                if (
                    !target ||
                    !target.matches?.("input, select, textarea") ||
                    !target.closest(
                        ".ff-el-group, .ff_repeater_table, .ff_repeater_container"
                    )
                ) {
                    return;
                }
                if (window.ff_disable_error_clear) {
                    return;
                }
                target.setAttribute("aria-invalid", "false");
                const errorSetting =
                    formConfig?.settings?.layout?.errorMessagePlacement;
                // Original logic from dev: clear unless explicitly stack-only.
                if (errorSetting && errorSetting === "stackToBottom") {
                    return;
                }
                const groupEl = target.closest(".ff-el-group");
                if (groupEl?.classList.contains("ff-el-is-error")) {
                    groupEl.classList.remove("ff-el-is-error");
                    groupEl
                        .querySelectorAll(".error.text-danger")
                        .forEach(node => node.remove());
                }
            });
        };

        // Origin: dev:form-submission.js:106-108 (initFormHandlers — show_element_error listener)
        // Current: form-submission.plain.js:1016
        // Migration: registered via `bridge.onEvent` (not raw addEventListener)
        //   so it fires from both `$.trigger` (Pro/file-uploader.js:73 emits
        //   this way with `element: stringFieldName`) and native CustomEvent.
        //   Listener accepts string field names AND DOM/jQuery payloads. C-16.
        //   PR4 fixed C-26 (HTMLFormElement[0] array-like trap) so the listener
        //   actually registers on the form rather than the first input.
        const wireShowElementErrorListener = function () {
            if (formEl._ffShowElementErrorWired) {
                return;
            }
            formEl._ffShowElementErrorWired = true;
            jqueryEventBridge.onEvent(
                formEl,
                "show_element_error",
                function (event, payload) {
                    const data = payload || event?.detail || {};
                    if (!data.message) {
                        return;
                    }
                    let fieldName = "";
                    if (typeof data.element === "string") {
                        fieldName = data.element.replace(/\[\]$/, "");
                    } else {
                        const node = resolveElement(data.element);
                        if (node) {
                            fieldName =
                                node.getAttribute("data-name") ||
                                String(node.name || "").replace(/\[\]$/, "");
                        }
                    }
                    if (!fieldName) {
                        return;
                    }
                    errorHandler.showBelowElement(fieldName, data.message);
                }
            );
        };

        // Origin: dev:form-submission.js:115-119 (maybeInlineForm)
        // Current: form-submission.plain.js:1053
        // Migration: matches `.ff-form-inline` (the class public CSS actually
        //   references) and sets `submitBtn.style.height = "50px"`. The earlier
        //   PR2 attempt matched the wrong class — fixed in PR8 C-34.
        const maybeInlineForm = function () {
            if (!formEl.classList.contains("ff-form-inline")) {
                return;
            }
            formEl.querySelectorAll("button.ff-btn-submit").forEach(btn => {
                btn.style.height = "50px";
            });
        };

        const app = {
            formElement: formEl,
            settings: formConfig,
            config: formConfig,
            formSelector: "." + getFormInstanceClass(formEl),
            initFormHandlers: function () {
                formEl.classList.remove("ff-form-loading");
                formEl.classList.add("ff-form-loaded");
                maybeInlineForm();
                initInlineErrorClearing();
                wireShowElementErrorListener();
            },
            initTriggers: function () {
                emitInitEvents(app, formEl, formConfig);
                wireFirstInteractionAndCaptchaTriggers(formEl);
            },
            reinitExtras: function () {
                reinitCaptchasForReinit(formEl);
            },
            // C-10: vanilla uses document-level delegation in initVanillaSubmissionRuntime,
            // so submit/reset listeners are already active for AJAX-injected forms.
            // Kept on the public API for legacy callers (Pro / third-party) that expect it.
            registerFormSubmissionHandler: function () {
                // No-op in vanilla — see document-level submitHandler/resetHandler.
            },
            // C-11: same call shape as the jQuery appInstance — exposed for parity.
            maybeInlineForm: maybeInlineForm,
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
                // No-arg branch matches the jQuery default: skip conditionally hidden fields.
                // When elements are passed explicitly, validate exactly that set (caller's choice).
                const fieldList =
                    elements && typeof elements.length !== "undefined"
                        ? elements
                        : Array.from(
                              formEl.querySelectorAll(
                                  "input, select, textarea"
                              )
                          ).filter(
                              el => !el.closest(".has-conditions.ff_excluded")
                          );
                const errors = validator.validate(fieldList);
                if (Object.keys(errors).length) {
                    const validationError = new window.ffValidationError(
                        "Validation Error!"
                    );
                    validationError.messages = errors;
                    throw validationError;
                }
            },
            // C-24: match dev `scrollToFirstError` (jq:648) — only scroll for
            // below-element error placement, only when the first error is
            // off-screen, accounting for the WP admin bar offset when present.
            scrollToFirstError: function () {
                const errorPlacement =
                    formConfig?.settings?.layout?.errorMessagePlacement;
                if (!errorPlacement || errorPlacement === "stackToBottom") {
                    return;
                }
                const firstError = formEl.querySelector(
                    ".ff-el-is-error, .error"
                );
                if (!firstError) {
                    return;
                }
                const rect = firstError.getBoundingClientRect();
                const inViewport =
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= window.innerHeight &&
                    rect.right <= window.innerWidth;
                if (inViewport) {
                    return;
                }
                const adminBarOffset = document.getElementById("wpadminbar")
                    ? 32
                    : 0;
                window.scrollTo({
                    top:
                        rect.top +
                        (window.scrollY || window.pageYOffset) -
                        adminBarOffset -
                        20,
                    behavior: "smooth",
                });
            },
            showErrorMessages: function (errors) {
                showValidationErrorsWithEvents(errors || "Submission failed");
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
                    errorHandler.showMessage(
                        resolveSubmissionMessage(
                            formConfig.id,
                            "file_upload_in_progress",
                            "File upload in progress. Please wait..."
                        )
                    );
                    return;
                }

                let payload;

                try {
                    runClientValidation();
                    payload = createSubmissionRequestPayload();
                } catch (validationError) {
                    if (
                        !(validationError instanceof window.ffValidationError)
                    ) {
                        throw validationError;
                    }
                    jqueryEventBridge.emitEvent(
                        "fluentform_validation_failed",
                        {
                            form: formEl,
                            response: validationError.messages,
                        },
                        formEl,
                        [
                            {
                                form: formEl,
                                response: validationError.messages,
                            },
                        ]
                    );
                    showValidationErrorsWithEvents(validationError.messages);
                    app.scrollToFirstError();
                    emitErrorStepSliderEvent(formEl);
                    return;
                }

                showFormSubmissionProgress(formEl);
                isSending = true;

                let resForRedirect = null;
                try {
                    await runBeforeSubmitCallbacks(payload);
                    const res = await app.sendData(formEl, payload);
                    resForRedirect = res;
                    if (!res || !res.data || !res.data.result) {
                        // C-35 (codex): mirror dev:446-448 — append_data may be
                        // present on FAIL responses too (e.g., server returning
                        // hidden fields needed for the next attempt).
                        if (res?.data?.append_data) {
                            addHiddenData(formEl, res.data.append_data);
                        }
                        const errorPayload = normalizeSubmissionErrors(res);
                        emitSubmissionFailure(res);
                        showValidationErrorsWithEvents(errorPayload);
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

                    // C-19: clear leftover field error highlights so a successful
                    // resubmission doesn't leave the form looking errored. Mirrors
                    // dev:375, dev:402.
                    formEl
                        .querySelectorAll(".ff-el-is-error")
                        .forEach(el => el.classList.remove("ff-el-is-error"));

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
                        // Match dev `.html(message)` (form-submission-jquery.js:371,397).
                        // The success message is sanitized server-side via
                        // `wp_kses_post` (app/Modules/Form/Settings/FormSettings.php:233)
                        // before reaching the client, so admin-authored markup
                        // (links, paragraphs, etc.) renders as intended.
                        msgDiv.innerHTML = res.data.result.message;
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
                    showValidationErrorsWithEvents(
                        error?.message || "Request failed"
                    );
                } finally {
                    isSending = false;
                    // C-35 (codex): mirror dev:473-476 — when the server returned
                    // a redirectUrl, the dedicated 500ms-delayed hide above already
                    // schedules the cleanup; avoid hiding twice immediately so the
                    // user still sees progress while the navigation happens.
                    if (!resForRedirect?.data?.result?.redirectUrl) {
                        hideFormSubmissionProgress(formEl);
                        resetCaptchas(formEl);
                    }
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

    // Origin: dev:form-submission.js:1715-1737 (initSingleForm)
    // Current: form-submission.plain.js:1405
    // Migration: same setInterval polling — 1s × 10 attempts — for forms
    //   whose `fluent_form_<instance>` JSON global hasn't been emitted yet
    //   (page builders, async script tags). Final `console.log("Form could not
    //   be loaded")` matches dev. C-17.
    const initSingleFormWithRetry = function (formEl) {
        const app = window.fluentFormApp(formEl);
        if (app) {
            app.initFormHandlers();
            app.initTriggers();
            return;
        }
        let attempts = 0;
        const intervalId = setInterval(function () {
            attempts++;
            const retried = window.fluentFormApp(formEl);
            if (retried) {
                clearInterval(intervalId);
                retried.initFormHandlers();
                retried.initTriggers();
                return;
            }
            if (attempts > 10) {
                clearInterval(intervalId);
                console.log("Form could not be loaded");
            }
        }, 1000);
    };

    // Origin: dev:form-submission.js:1739-1745 (per-form initSingleForm loop)
    // Current: form-submission.plain.js:1434
    //   plus dev:1810-1817 (initChoicesDropdownHandling on DOMContentLoaded).
    // Migration: every form goes through `initSingleFormWithRetry`. The
    //   common-actions module handles its own DOMContentLoaded init.
    const initAllForms = function () {
        Array.from(document.querySelectorAll("form.frm-fluent-form")).forEach(
            initSingleFormWithRetry
        );
        // Wire shared behaviors (Choices.js, masks, "Other" option, spam tokens, ...)
        initFluentFormCommonActions();
    };

    // Origin: dev:form-submission.js:579-595 (registerFormSubmissionHandler — submit branch)
    // Current: form-submission.plain.js:1446
    // Migration: document-level delegation instead of per-form jQuery `.on('submit', ...)`.
    //   Calls app.submissionAjaxHandler() rather than the dev-private function.
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

    // Origin: dev:form-submission.js:1820-1830 (jQuery('.fluentform').on('submit', '.ff-form-loading', ...))
    // Current: form-submission.plain.js:1464
    // Migration: document delegation instead of jQuery delegation. Surfaces a
    //   diagnostic message under the form when the JS handler couldn't initialize.
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

    const submitHandler = function (submitEvent) {
        if (handleFluentFormSubmit(submitEvent)) {
            return;
        }
        handleLoadingFormSubmit(submitEvent);
    };

    // Origin: dev:form-submission.js:518-566 (formResetHandler)
    // Current: form-submission.plain.js:1498
    // Migration: orchestration extracted to `form-reset.plain.js` — repeater
    //   trim, image-checkbox sync, file upload UI clear, range slider restore,
    //   conditional field re-evaluation. Slider snap-back is injected as a
    //   callback so the new module is pure DOM. C-12 / C-13.
    const resetHandler = function (e) {
        const formEl = e.target.closest("form.frm-fluent-form");
        if (!formEl) {
            return;
        }
        const formConfig = getFormConfig(formEl);
        // Slider snap-back is bridge/jquery-aware and lives here; the rest of
        // the orchestration is pure DOM and lives in form-reset.plain.js.
        performFullFormReset(formEl, formConfig, emitResetSliderEvent);
        jqueryEventBridge.emitEvent(
            "fluentform_reset",
            { form: formEl, config: formConfig },
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

    // Origin: dev:form-submission.js:597-615 (registerFormSubmissionHandler — keydown branch)
    // Current: form-submission.plain.js:1531
    // Migration: document-level delegation. On radio/checkbox: Enter toggles
    //   `checked` and dispatches `change` (PR8 C-31). On `.ff-el-form-control`
    //   text inputs: Enter prevents form submission (PR2 C-10). TEXTAREA is
    //   excluded from the guard so multi-line input keeps Enter for newlines.
    const enterKeyGuard = function (e) {
        if (e.key !== "Enter" && e.keyCode !== 13) {
            return;
        }
        const target = e.target;
        if (!target) {
            return;
        }
        const formEl = target.closest?.("form.frm-fluent-form");
        if (formEl && (target.type === "radio" || target.type === "checkbox")) {
            e.preventDefault();
            if (target.type === "radio") {
                target.checked = true;
            } else {
                target.checked = !target.checked;
            }
            target.dispatchEvent(new Event("change", { bubbles: true }));
            e.stopPropagation();
            return;
        }
        if (
            target.tagName !== "TEXTAREA" &&
            target.classList?.contains("ff-el-form-control")
        ) {
            e.preventDefault();
        }
    };

    document.addEventListener("submit", submitHandler);
    document.addEventListener("reset", resetHandler);
    document.addEventListener("ff_reinit", reinitHandler);
    document.addEventListener("keydown", enterKeyGuard);

    window._fluentFormSubmissionCleanup = function () {
        document.removeEventListener("submit", submitHandler);
        document.removeEventListener("reset", resetHandler);
        document.removeEventListener("ff_reinit", reinitHandler);
        document.removeEventListener("keydown", enterKeyGuard);
    };

    // C-05: defer per-form initialization until DOMContentLoaded so forms
    // injected later (Elementor, AJAX templates, deferred scripts) still get
    // their handlers attached.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAllForms);
    } else {
        initAllForms();
    }
}

module.exports = { initVanillaSubmissionRuntime };
