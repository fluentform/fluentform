/**
 * Vanilla port of fluentFormCommonActions.
 *
 * Origin map (dev → vanilla in this file):
 *   initMultiSelect                    dev:1277-1343  → line 21-95
 *     (PR8 C-38: also stores instance via $(el).data('choicesjs') when jQuery exists)
 *   initMask                           dev:1350-1383  → line 99-135
 *     (jQuery Mask plugin has no vanilla equivalent — falls back to jQuery
 *     implementation when present, no-op otherwise)
 *   initNumericFormat                  dev:1401-1416  → line 137-168
 *   initCheckableActive                dev:1385-1399  → line 170-202
 *   initOtherOptionHandlers            dev:1217-1270  → line 214-289
 *   maybeHandleCleanTalkSubmitTime     dev:1202-1214  → line 291-301
 *   generateAndSetToken                dev:1170-1200  → line 303-357
 *     (uses `fetch` instead of `$.post`)
 *   maybeInitSpamTokenProtection       dev:1136-1168  → line 359-417
 *   initChoicesDropdownHandling        dev:1764-1809  → line 419-477  (PR8 C-39)
 *
 * Where a feature has no native equivalent (jQuery Mask), the vanilla path
 * falls back to the jQuery implementation when jQuery is present and otherwise
 * no-ops gracefully.
 */

const { ensureFluentFormJqueryBridge } = require("./event-bridge.js");

const TOKEN_NONCE_KEY = "token_nonce";

let initialized = false;

function getForms() {
    return Array.from(document.querySelectorAll("form.frm-fluent-form"));
}

function initMultiSelect() {
    if (typeof window.Choices !== "function") {
        return;
    }

    const elements = document.querySelectorAll(".ff_has_multi_select");
    if (!elements.length) {
        return;
    }

    elements.forEach(el => {
        if (el._choicesInstance) {
            return; // Avoid double-initializing
        }

        const choiceArgs = {
            removeItemButton: true,
            silent: true,
            shouldSort: false,
            searchEnabled: true,
            searchResultLimit: 50,
            searchFloor: 1,
            searchChoices: true,
            fuseOptions: {
                threshold: 0.1,
                distance: 200,
                ignoreLocation: true,
                tokenize: true,
                matchAllTokens: false,
            },
        };

        const overrides = window.fluentFormVars?.choice_js_vars || {};
        const args = Object.assign({}, choiceArgs, overrides);

        const maxSelection = parseInt(
            el.getAttribute("data-max_selected_options") || "0",
            10
        );
        if (maxSelection) {
            args.maxItemCount = maxSelection;
            args.maxItemText = function (maxItemCount) {
                let message;
                if (maxItemCount === 1) {
                    message = overrides.maxItemTextSingular;
                } else {
                    message = overrides.maxItemTextPlural;
                }
                if (!message) {
                    return "";
                }
                return message.replace("%%maxItemCount%%", maxItemCount);
            };
        }

        args.callbackOnCreateTemplates = function () {
            return {
                option: function (item) {
                    const opt = window.Choices.defaults.templates.option.call(
                        this,
                        item
                    );
                    if (item.customProperties) {
                        opt.dataset.calc_value = item.customProperties;
                    }
                    return opt;
                },
            };
        };

        try {
            const instance = new window.Choices(el, args);
            el._choicesInstance = instance;
            // C-38 (codex): mirror dev `$(el).data('choicesjs', instance)`
            // (form-submission-jquery.js:1340-1341) so any Pro / third-party
            // code that reads via `$(el).data('choicesjs')` keeps working.
            if (typeof window.jQuery === "function") {
                window.jQuery(el).data("choicesjs", instance);
            }
        } catch (error) {
            console.error("Choices.js init failed:", error);
        }
    });
}

function initMask() {
    // The jQuery Mask plugin has no maintained vanilla equivalent. When jQuery
    // is present, defer to it so existing input masks continue to apply.
    if (typeof window.jQuery !== "function" || !window.jQuery.fn.mask) {
        return;
    }

    const $ = window.jQuery;
    const globalOptions = {
        clearIfNotMatch:
            window.fluentFormVars?.input_mask_vars?.clearIfNotMatch || false,
        translation: {
            "*": { pattern: /[0-9a-zA-Z]/ },
            0: { pattern: /\d/ },
            9: { pattern: /\d/, optional: true },
            "#": { pattern: /\d/, recursive: true },
            A: { pattern: /[a-zA-Z0-9]/ },
            S: { pattern: /[a-zA-Z]/ },
        },
    };

    $("input[data-mask]").each(function () {
        const $el = $(this);
        const mask = $el.attr("data-mask");
        if (!mask) {
            return;
        }
        const options = Object.assign({}, globalOptions);
        if ($el.attr("data-mask-reverse")) {
            options.reverse = true;
        }
        if ($el.attr("data-clear-if-not-match")) {
            options.clearIfNotMatch = true;
        }
        $el.mask(mask, options);
    });
}

function initNumericFormat() {
    if (typeof window.currency !== "function" || !window.ff_helper) {
        return;
    }

    const numericFields = document.querySelectorAll(
        "form.frm-fluent-form .ff_numeric"
    );
    numericFields.forEach(field => {
        if (field._ffNumericInited) {
            return;
        }
        field._ffNumericInited = true;

        let formatConfig;
        try {
            formatConfig = JSON.parse(field.getAttribute("data-formatter") || "{}");
        } catch (error) {
            formatConfig = {};
        }

        if (field.value) {
            field.value = window.ff_helper.formatCurrency(field, field.value);
        }

        const reformat = function () {
            field.value = window.currency(field.value, formatConfig).format();
        };
        field.addEventListener("blur", reformat);
        field.addEventListener("change", reformat);
    });
}

function initCheckableActive() {
    document.addEventListener("change", function (event) {
        const target = event.target;
        if (
            !(target instanceof HTMLInputElement) ||
            !target.closest(".ff-el-form-check")
        ) {
            return;
        }

        const wrapper = target.closest(".ff-el-form-check");
        if (!wrapper) {
            return;
        }

        if (target.type === "radio") {
            if (!target.checked) {
                return;
            }
            const fieldGroup = target.closest(".ff-el-input--content");
            if (fieldGroup) {
                fieldGroup
                    .querySelectorAll(".ff-el-form-check")
                    .forEach(node =>
                        node.classList.remove("ff_item_selected")
                    );
            }
            wrapper.classList.add("ff_item_selected");
        } else if (target.type === "checkbox") {
            wrapper.classList.toggle("ff_item_selected", target.checked);
        }
    });
}

function focusOtherInput(wrapper) {
    if (!wrapper) {
        return;
    }
    const input = wrapper.querySelector(".ff-el-form-control");
    if (input) {
        setTimeout(() => input.focus(), 50);
    }
}

function initOtherOptionHandlers() {
    document.addEventListener("change", function (event) {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }

        const otherOption = target.closest(".ff-other-option");
        const fieldContainer = target.closest(".ff-el-input--content");

        if (otherOption && target.type === "checkbox") {
            const wrapper = fieldContainer?.querySelector(
                ".ff-other-input-wrapper"
            );
            if (!wrapper) {
                return;
            }
            if (target.checked) {
                wrapper.style.display = "";
                const input = wrapper.querySelector(".ff-el-form-control");
                if (input && !String(input.value || "").trim()) {
                    focusOtherInput(wrapper);
                }
            } else {
                wrapper.style.display = "none";
                const input = wrapper.querySelector(".ff-el-form-control");
                if (input) {
                    input.value = "";
                }
            }
            return;
        }

        if (otherOption && target.type === "radio") {
            if (!target.checked || !fieldContainer) {
                return;
            }
            let wrapper = fieldContainer.querySelector(
                ".ff-other-input-wrapper"
            );
            if (!wrapper) {
                const label = target.closest("label");
                wrapper = label?.nextElementSibling?.classList?.contains(
                    "ff-other-input-wrapper"
                )
                    ? label.nextElementSibling
                    : null;
            }
            if (wrapper) {
                fieldContainer
                    .querySelectorAll(".ff-other-input-wrapper")
                    .forEach(node => (node.style.display = "none"));
                wrapper.style.display = "";
                focusOtherInput(wrapper);
            }
            return;
        }

        if (
            target.type === "radio" &&
            fieldContainer &&
            !target.closest(".ff-other-option")
        ) {
            // Hide "Other" wrappers when a non-Other radio is selected.
            fieldContainer
                .querySelectorAll(".ff-other-input-wrapper")
                .forEach(node => {
                    node.style.display = "none";
                    const input = node.querySelector(".ff-el-form-control");
                    if (input) {
                        input.value = "";
                    }
                });
        }
    });
}

function maybeHandleCleanTalkSubmitTime() {
    if (!window.fluentFormVars?.has_cleantalk) {
        return;
    }
    getForms().forEach(formEl => {
        const loadTimeField = formEl.querySelector(".ff_ct_form_load_time");
        if (loadTimeField) {
            loadTimeField.value = String(Math.floor(Date.now() / 1000));
        }
    });
}

function generateAndSetToken(formEl, tokenField, retry) {
    const formId = formEl.getAttribute("data-form_id");
    const ajaxBase = window.fluentFormVars?.ajaxUrl;
    if (!formId || !ajaxBase) {
        formEl.classList.remove("ff_tokenizing");
        return;
    }
    const url =
        ajaxBase + (ajaxBase.includes("?") ? "&" : "?") + "t=" + Date.now();
    const body = new URLSearchParams();
    body.set("action", "fluentform_generate_protection_token");
    body.set("form_id", formId);
    if (window.fluentFormVars?.[TOKEN_NONCE_KEY]) {
        body.set("nonce", window.fluentFormVars[TOKEN_NONCE_KEY]);
    }

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
        },
        credentials: "same-origin",
        body: body.toString(),
    })
        .then(response => response.json())
        .then(response => {
            if (response && response.success && response.data?.token) {
                tokenField.value = response.data.token;
                formEl.classList.add("ff_tokenized");
            } else {
                tokenField.value = "";
                console.error(
                    "Token generation failed for form ID:",
                    formId
                );
            }
        })
        .catch(error => {
            console.error(
                "Error generating token for form ID:",
                formId,
                error
            );
            if (retry) {
                setTimeout(
                    () => generateAndSetToken(formEl, tokenField, false),
                    1000
                );
            }
        })
        .finally(() => {
            formEl.classList.remove("ff_tokenizing");
        });
}

function maybeInitSpamTokenProtection(bridge) {
    getForms().forEach(formEl => {
        const tokenField = formEl.querySelector(".fluent-form-token-field");
        if (!tokenField || formEl._ffTokenInited) {
            return;
        }
        formEl._ffTokenInited = true;

        const generateIfNeeded = function () {
            if (
                !formEl.classList.contains("ff_tokenized") &&
                !formEl.classList.contains("ff_tokenizing")
            ) {
                formEl.classList.add("ff_tokenizing");
                generateAndSetToken(formEl, tokenField, true);
            }
        };

        let stepListenerActive = true;
        const onStepChange = function () {
            if (!stepListenerActive) {
                return;
            }
            stepListenerActive = false;
            generateIfNeeded();
        };

        if (bridge && typeof bridge.onEvent === "function") {
            bridge.onEvent(
                formEl,
                "ff_to_next_page ff_to_prev_page",
                onStepChange
            );
            bridge.onEvent(
                formEl,
                "fluentform_first_interaction",
                generateIfNeeded
            );
        } else {
            formEl.addEventListener("ff_to_next_page", onStepChange, {
                once: true,
            });
            formEl.addEventListener("ff_to_prev_page", onStepChange, {
                once: true,
            });
            formEl.addEventListener(
                "fluentform_first_interaction",
                generateIfNeeded
            );
        }
    });
}

// C-39 (codex): port `initChoicesDropdownHandling` from dev:1764-1809.
// Wires per-Choices-instance dropdown sizing + focus/Tab open-close behavior.
// Runs 100ms after Choices initialization so the instance is available.
function initChoicesDropdownHandling() {
    document.querySelectorAll(".ff_has_multi_select").forEach(el => {
        const instance = el._choicesInstance;
        if (!instance || !instance.passedElement) {
            return;
        }
        const passedEl = instance.passedElement.element;
        passedEl.addEventListener(
            "showDropdown",
            function () {
                const container = passedEl.closest(".choices");
                if (!container) return;
                const dropdown = container.querySelector(
                    ".choices__list--dropdown"
                );
                if (!dropdown) return;
                dropdown.style.maxHeight = "300px";
                dropdown.style.overflowY = "auto";
                const scrollable =
                    dropdown.querySelector(
                        '.choices__list[role="listbox"]'
                    ) ||
                    dropdown.querySelector(
                        ".choices__list:not(.choices__list--dropdown)"
                    );
                if (scrollable) {
                    scrollable.style.maxHeight = "280px";
                    scrollable.style.overflowY = "auto";
                    scrollable.style.webkitOverflowScrolling = "touch";
                    scrollable.style.touchAction = "pan-y";
                }
            },
            { passive: true }
        );

        const container = passedEl.closest(".choices");
        if (container) {
            container.addEventListener(
                "focus",
                function () {
                    if (!container.classList.contains("is-open")) {
                        instance.showDropdown();
                    }
                },
                true
            );
            container.addEventListener("keydown", function (e) {
                if (
                    e.key === "Tab" &&
                    container.classList.contains("is-open")
                ) {
                    instance.hideDropdown();
                }
            });
        }
    });
}

function initCommonActions(bridge) {
    if (initialized) {
        // Re-run the items that need to operate on freshly inserted forms.
        setTimeout(() => {
            initMultiSelect();
            initChoicesDropdownHandling();
        }, 100);
        initMask();
        initNumericFormat();
        maybeHandleCleanTalkSubmitTime();
        maybeInitSpamTokenProtection(bridge);
        return;
    }
    initialized = true;

    setTimeout(() => {
        initMultiSelect();
        // 100ms after init so the Choices instance is on the element.
        initChoicesDropdownHandling();
    }, 100);
    initMask();
    initNumericFormat();
    initCheckableActive();
    initOtherOptionHandlers();
    maybeHandleCleanTalkSubmitTime();
    maybeInitSpamTokenProtection(bridge);
}

function initFluentFormCommonActions() {
    return initCommonActions(ensureFluentFormJqueryBridge());
}

module.exports = {
    initFluentFormCommonActions,
    initCommonActions,
    initMultiSelect,
    initMask,
    initNumericFormat,
    initCheckableActive,
    initOtherOptionHandlers,
    maybeHandleCleanTalkSubmitTime,
    maybeInitSpamTokenProtection,
};
