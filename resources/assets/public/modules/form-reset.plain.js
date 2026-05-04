/**
 * Form reset orchestration — vanilla port of `formResetHandler` from
 * dev:form-submission.js:518–566. Called from the document-level `reset`
 * listener; performs the side effects the browser's native form reset
 * doesn't do on its own (repeater rows, image checks, file uploads, range
 * sliders, conditional-field re-evaluation).
 *
 * The slider snap-back is delegated via the `emitResetSliderEvent` callback
 * so this module stays free of bridge/jquery dependencies.
 */

const resetField = function (fieldEl) {
    if (!fieldEl) {
        return;
    }
    const type = fieldEl.type;
    if (type === undefined) {
        return;
    }
    if (type === "checkbox" || type === "radio") {
        fieldEl.checked = fieldEl.defaultChecked;
    } else if (fieldEl.tagName === "SELECT") {
        Array.from(fieldEl.options).forEach(opt => {
            opt.selected = opt.defaultSelected;
        });
    } else {
        fieldEl.value = fieldEl.defaultValue ?? "";
    }
    fieldEl.dispatchEvent(new Event("change", { bubbles: true }));
};

const trimRepeaterRows = function (formEl) {
    formEl
        .querySelectorAll(".ff-el-repeat .ff-t-cell")
        .forEach(cell => {
            cell.querySelectorAll("input").forEach((input, idx) => {
                if (idx > 0) {
                    input.remove();
                }
            });
        });
    formEl
        .querySelectorAll(
            ".ff-el-repeat .ff-el-repeat-buttons-list .ff-el-repeat-buttons"
        )
        .forEach((buttons, idx) => {
            if (idx > 0) {
                buttons.remove();
            }
        });
};

const syncImageCheckboxClasses = function (formEl) {
    formEl
        .querySelectorAll('input[type="checkbox"], input[type="radio"]')
        .forEach(input => {
            const wrap = input.closest(".ff-el-form-check");
            if (!wrap) {
                return;
            }
            if (input.defaultChecked) {
                wrap.classList.add("ff_item_selected");
            } else {
                wrap.classList.remove("ff_item_selected");
            }
        });
};

const clearFileUploads = function (formEl) {
    formEl.querySelectorAll('input[type="file"]').forEach(fileInput => {
        const container = fileInput.closest("div");
        if (!container) {
            return;
        }
        container
            .querySelectorAll(".ff-uploaded-list")
            .forEach(list => (list.innerHTML = ""));
        container
            .querySelectorAll(".ff-upload-progress")
            .forEach(progress => {
                progress.classList.add("ff-hidden");
                progress
                    .querySelectorAll(".ff-el-progress-bar")
                    .forEach(bar => (bar.style.width = "0%"));
            });
    });
};

const restoreRangeSliders = function (formEl) {
    formEl.querySelectorAll('input[type="range"]').forEach(slider => {
        const calcValue = slider.dataset.calc_value;
        if (calcValue !== undefined) {
            slider.value = calcValue;
        }
        slider.dispatchEvent(new Event("change", { bubbles: true }));
    });
};

const findWatchedField = function (formEl, fieldName) {
    return (
        formEl.querySelector(`[data-name="${CSS.escape(fieldName)}"]`) ||
        formEl.querySelector(`[name="${CSS.escape(fieldName)}"]`) ||
        formEl.querySelector(`[name="${CSS.escape(fieldName)}[]"]`)
    );
};

const resetConditionalFields = function (formEl, formConfig) {
    const conditionals = formConfig?.conditionals;
    if (!conditionals || typeof conditionals !== "object") {
        return;
    }
    Object.keys(conditionals).forEach(fieldName => {
        const field = conditionals[fieldName];
        const conditions = field?.conditions;
        if (!Array.isArray(conditions)) {
            return;
        }
        conditions.forEach(condition => {
            const watched = findWatchedField(formEl, condition.field);
            if (watched) {
                resetField(watched);
            }
        });
    });
};

function performFullFormReset(formEl, formConfig, emitResetSliderEvent) {
    if (typeof emitResetSliderEvent === "function") {
        emitResetSliderEvent(formEl);
    }
    trimRepeaterRows(formEl);
    syncImageCheckboxClasses(formEl);
    clearFileUploads(formEl);
    restoreRangeSliders(formEl);
    resetConditionalFields(formEl, formConfig);
}

module.exports = { performFullFormReset, resetField };
