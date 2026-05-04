/**
 * Fluid Form Error Handler
 *
 * Origin: dev:resources/assets/public/form-submission.js:720-865
 * Migration: split dev's three error helpers into one factory:
 *   - showInStack       ← dev:756-819 (showErrorInStack)
 *   - showBelowElement  ← dev:827-846 (showErrorBelowElement)
 *   - showMessage       ← dev:720-749 (showErrorMessages stack-only branch)
 * Field lookup `[data-name] || [name] || [name+"[]"]` matches dev:872-877
 *   (getElement). Stack rendering uses `innerHTML` on the message text node
 *   (PR8 C-37) for parity with dev `.html(errorString)` at jq:780-787 — admin-
 *   authored validation messages can include allowed HTML, same trust model
 *   as the success message (jq:371, jq:397; vanilla uses innerHTML there too).
 */

function createErrorHandler(formEl) {
    const getErrorPlacementSetting = function (formConfig) {
        return formConfig?.settings?.layout?.errorMessagePlacement || "";
    };

    const getFieldElement = function (fieldName) {
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

    const clearValidationErrors = function () {
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

    const showErrorMessage = function (message) {
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

    const showErrorInStack = function (errors) {
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
            const fieldElement = getFieldElement(fieldName);

            fieldErrors.forEach(errorText => {
                const errorWrapper = document.createElement("div");
                errorWrapper.className = "error text-danger";
                errorWrapper.setAttribute("role", "alert");

                const textElement = document.createElement("span");
                textElement.className = "error-text";
                // C-37 (codex): match dev `.html(errorString)` (jq:780-787).
                // Validation rule messages are admin-configured per-field and
                // ride the same trust model as the success message (C-29) —
                // restoring HTML support so admin-formatted validation copy
                // (e.g., a `<a>` link to a help page) renders as intended.
                textElement.innerHTML = errorText;
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

    const showErrorBelowElement = function (fieldName, message) {
        const fieldElement = getFieldElement(fieldName);
        if (!fieldElement) {
            showErrorInStack({ [fieldName || "error"]: [message] });
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

    const showValidationErrors = function (formConfig, errors) {
        if (!errors) {
            return;
        }

        clearValidationErrors();

        if (typeof errors === "string") {
            showErrorInStack({ error: [errors] });
            return;
        }

        const errorPlacement = getErrorPlacementSetting(formConfig);
        if (!errorPlacement || errorPlacement === "stackToBottom") {
            showErrorInStack(errors);
            return;
        }

        Object.keys(errors).forEach(fieldName => {
            const fieldErrors = normalizeErrorMessages(errors[fieldName]);
            fieldErrors.forEach(errorText =>
                showErrorBelowElement(fieldName, errorText)
            );
        });
    };

    return {
        clear: clearValidationErrors,
        showMessage: showErrorMessage,
        showInStack: showErrorInStack,
        showBelowElement: showErrorBelowElement,
        showValidationErrors: showValidationErrors,
        normalizeErrors: normalizeErrorMessages,
    };
}

module.exports = { createErrorHandler };
