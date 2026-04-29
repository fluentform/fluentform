import formSlider from "./Pro/slider";

(function () {
    const saveProgressCleanupStore = new WeakMap();

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

    function getSaveProgressVars() {
        return window.form_state_save_vars || {};
    }

    function getSaveProgressMessage(formId, key, fallback) {
        const messagesVar = "fluentform_save_progress_messages_" + formId;

        if (window[messagesVar] && window[messagesVar][key]) {
            return window[messagesVar][key];
        }

        return fallback;
    }

    function removeNode(node) {
        if (node && node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }

    function removeExistingResponseMessage(formElement, messageId) {
        const existingMessage = formElement.ownerDocument.getElementById(messageId);
        if (existingMessage && formElement.contains(existingMessage)) {
            removeNode(existingMessage);
        }
    }

    function createInputGroupField(options) {
        const wrapper = document.createElement("div");
        wrapper.className = options.groupClassName;

        const content = document.createElement("div");
        content.className = "ff-el-input--content";

        const inputGroup = document.createElement("div");
        inputGroup.className = "ff_input-group";

        const input = document.createElement("input");
        input.className = "ff-el-form-control";
        input.value = options.value || "";

        if (options.readOnly) {
            input.readOnly = true;
        }

        if (options.type) {
            input.type = options.type;
        }

        if (options.placeholder) {
            input.placeholder = options.placeholder;
        }

        const append = document.createElement("div");
        append.className = "ff_input-group-append";

        const button = document.createElement("button");
        button.type = "button";
        button.className = options.buttonClassName;
        button.textContent = options.buttonLabel;

        append.appendChild(button);
        inputGroup.appendChild(input);
        inputGroup.appendChild(append);
        content.appendChild(inputGroup);
        wrapper.appendChild(content);

        return wrapper;
    }

    function insertResponseMessage(referenceElement, messageId, className, html, position) {
        if (!referenceElement || !referenceElement.parentNode) {
            return null;
        }

        const messageNode = document.createElement("div");
        messageNode.id = messageId;
        messageNode.className = className;
        messageNode.innerHTML = html;

        if (position === "before") {
            referenceElement.parentNode.insertBefore(messageNode, referenceElement);
        } else {
            referenceElement.parentNode.insertBefore(messageNode, referenceElement.nextSibling);
        }

        return messageNode;
    }

    function hasExcludedConditionAncestor(fieldElement) {
        return !!fieldElement.closest(".has-conditions.ff_excluded");
    }

    function serializeSaveProgressData(formElement) {
        const params = new URLSearchParams();
        const inputElements = Array.from(formElement.querySelectorAll("input, select, textarea"));

        inputElements.forEach((fieldElement) => {
            if (!fieldElement.name || fieldElement.disabled || hasExcludedConditionAncestor(fieldElement)) {
                return;
            }

            const tagName = fieldElement.tagName;
            const type = (fieldElement.getAttribute("type") || "").toLowerCase();

            if (type === "file" || type === "submit" || type === "button" || type === "reset") {
                return;
            }

            if (type === "checkbox" || type === "radio") {
                if (fieldElement.checked) {
                    params.append(fieldElement.name, fieldElement.value || "on");
                }
                return;
            }

            if (tagName === "SELECT" && fieldElement.multiple) {
                Array.from(fieldElement.selectedOptions).forEach((optionElement) => {
                    params.append(fieldElement.name, optionElement.value);
                });
                return;
            }

            if (tagName === "SELECT" && fieldElement.closest(".ff_repeater_table") && !fieldElement.value) {
                params.append(fieldElement.name, "");
                return;
            }

            params.append(fieldElement.name, fieldElement.value || "");
        });

        Array.from(formElement.querySelectorAll('input[type="file"]')).forEach((fileInput) => {
            const previewSelector = ".ff-uploaded-list .ff-upload-preview[data-src]";
            const previewElements = Array.from(fileInput.closest("div")?.querySelectorAll(previewSelector) || []);

            previewElements.forEach((previewElement) => {
                const source = previewElement.getAttribute("data-src");
                if (source) {
                    params.append(fileInput.name + "[][]", source);
                }
            });
        });

        return params.toString();
    }

    async function postJson(url, data) {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            credentials: "same-origin",
            body: new URLSearchParams(data).toString()
        });
        const payload = await response.json();

        if (!response.ok) {
            throw payload;
        }

        return payload;
    }

    async function getJson(url, query) {
        const requestUrl = url + (url.includes("?") ? "&" : "?") + new URLSearchParams(query).toString();
        const response = await fetch(requestUrl, {
            method: "GET",
            credentials: "same-origin",
            headers: {
                Accept: "application/json"
            }
        });
        const payload = await response.json();

        if (!response.ok) {
            throw payload;
        }

        return payload;
    }

    function getErrorMessage(errorPayload, key) {
        return errorPayload?.responseJSON?.data?.[key]
            || errorPayload?.data?.[key]
            || errorPayload?.message
            || "";
    }

    function createSaveProgressController(formElement, formConfig) {
        const eventBridge = getEventBridge();
        const cleanupCallbacks = [];
        const formSelector = "." + formConfig.form_instance;
        let hash = -1;
        let activeStep = "no";

        if (!formElement.classList.contains("ff-form-has-save-progress")) {
            return function noop() {};
        }

        const existingCleanup = saveProgressCleanupStore.get(formElement);
        if (existingCleanup) {
            existingCleanup();
        }

        if (formElement.classList.contains("ff-form-has-steps")) {
            cleanupCallbacks.push(
                eventBridge.onEvent(formElement, ["ff_to_next_page", "ff_to_prev_page"], function (event, detail, args, source) {
                    const currentStep = source === "jquery" ? args[0] : detail?.step;
                    if (typeof currentStep !== "undefined") {
                        activeStep = currentStep;
                    }
                })
            );
        }

        const handleSaveProgressClick = async function (saveButton) {
            const vars = getSaveProgressVars();
            const saveButtonGroup = saveButton.closest(".ff-el-group");
            const messageId = formConfig.id + "_save_progress_msg";
            const copyIcon = getSaveProgressMessage(formConfig.id, "copy_button", vars.copy_button || "Copy");
            const emailIcon = getSaveProgressMessage(formConfig.id, "email_button", vars.email_button || "Email");
            const emailPlaceholder = getSaveProgressMessage(
                formConfig.id,
                "email_placeholder",
                vars.email_placeholder_str || "Your Email Here"
            );

            saveButton.classList.add("ff-working");

            try {
                const response = await postJson(window.fluentFormVars.ajaxUrl, {
                    source_url: vars.source_url,
                    action: "fluentform_save_form_progress_with_link",
                    data: serializeSaveProgressData(formElement),
                    form_id: formElement.getAttribute("data-form_id"),
                    hash: hash,
                    active_step: activeStep,
                    nonce: vars.nonce,
                    save_progress_btn_name: saveButton.getAttribute("name") || ""
                });

                if (!response?.data) {
                    return;
                }

                hash = response.data.hash;
                removeExistingResponseMessage(formElement, messageId);

                if (response.data.message) {
                    insertResponseMessage(
                        saveButtonGroup,
                        messageId,
                        "ff-message-success ff-el-group",
                        response.data.message,
                        "before"
                    );
                }

                removeNode(formElement.querySelector(".ff-saved-state-link"));
                removeNode(formElement.querySelector(".ff-email-address"));

                const savedStateLinkGroup = createInputGroupField({
                    groupClassName: "ff-el-group ff-saved-state-input ff-saved-state-link ff-hide-group",
                    value: response.data.saved_url,
                    readOnly: true,
                    buttonClassName: "ff-btn ff-btn-md ff_btn_style ff_btn_copy_link ff_input-group-text",
                    buttonLabel: copyIcon
                });

                saveButtonGroup.parentNode.insertBefore(savedStateLinkGroup, saveButtonGroup.nextSibling);
                savedStateLinkGroup.style.display = "block";

                if (saveButton.classList.contains("ff_resume_email_enabled")) {
                    const emailGroup = createInputGroupField({
                        groupClassName: "ff-el-group ff-saved-state-input ff-email-address ff-hide-group",
                        type: "email",
                        placeholder: emailPlaceholder,
                        buttonClassName: "ff-btn ff-btn-md ff_btn_style ff_btn_is_email ff_input-group-text",
                        buttonLabel: emailIcon
                    });

                    savedStateLinkGroup.parentNode.insertBefore(emailGroup, savedStateLinkGroup.nextSibling);
                    emailGroup.style.display = "block";
                }
            } catch (errorPayload) {
                removeExistingResponseMessage(formElement, messageId);
                insertResponseMessage(
                    saveButtonGroup,
                    messageId,
                    "ff-message-success ff-el-group text-danger",
                    getErrorMessage(errorPayload, "message"),
                    "before"
                );
            } finally {
                saveButton.classList.remove("ff-working");
                if (saveButton.parentElement) {
                    saveButton.parentElement.style.display = "none";
                }
            }
        };

        const handleCopyClick = async function (copyButton) {
            const copiedText = copyButton.closest(".ff-el-input--content")?.querySelector(".ff-el-form-control")?.value || "";
            if (!copiedText || !navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
                return;
            }

            await navigator.clipboard.writeText(copiedText);
            copyButton.textContent = getSaveProgressMessage(
                formConfig.id,
                "copy_success",
                getSaveProgressVars().copy_success_button || "Copied"
            );
        };

        const handleEmailClick = async function (emailButton) {
            const vars = getSaveProgressVars();
            const emailGroup = emailButton.closest(".ff-el-group");
            const emailInput = emailGroup?.querySelector("input");
            const responseId = formConfig.id + "_save_progress_email_response";
            const formLink = formElement.querySelector(".ff-saved-state-link input")?.value || "";

            try {
                const response = await postJson(window.fluentFormVars.ajaxUrl, {
                    source_url: vars.source_url,
                    action: "fluentform_email_progress_link",
                    form_id: formElement.getAttribute("data-form_id"),
                    to_email: emailInput?.value || "",
                    link: formLink,
                    hash: hash,
                    nonce: vars.nonce
                });

                if (emailInput) {
                    emailInput.value = "";
                }

                emailGroup?.classList.remove("ff-el-is-error");
                removeExistingResponseMessage(formElement, responseId);
                insertResponseMessage(
                    emailGroup,
                    responseId,
                    "ff-message-success ff-el-group",
                    response?.data?.response || "",
                    "after"
                );
            } catch (errorPayload) {
                emailGroup?.classList.add("ff-el-is-error");
                removeExistingResponseMessage(formElement, responseId);
                insertResponseMessage(
                    emailGroup,
                    responseId,
                    "ff-message-success ff-el-group text-danger",
                    getErrorMessage(errorPayload, "Error"),
                    "after"
                );
            }
        };

        const clickHandler = function (event) {
            const saveButton = event.target.closest(".ff-btn-save-progress");
            if (saveButton && formElement.contains(saveButton)) {
                event.preventDefault();
                handleSaveProgressClick(saveButton);
                return;
            }

            const copyButton = event.target.closest(".ff_btn_copy_link");
            if (copyButton && formElement.contains(copyButton)) {
                event.preventDefault();
                handleCopyClick(copyButton);
                return;
            }

            const emailButton = event.target.closest(".ff_btn_is_email");
            if (emailButton && formElement.contains(emailButton)) {
                event.preventDefault();
                handleEmailClick(emailButton);
            }
        };

        const keydownHandler = function (event) {
            if (event.key !== "Enter") {
                return;
            }

            const copyInput = event.target.closest(".ff-saved-state-link input.ff-el-form-control");
            if (copyInput && formElement.contains(copyInput)) {
                event.preventDefault();
                copyInput.closest(".ff_input-group")?.querySelector(".ff_btn_copy_link")?.click();
                return;
            }

            const emailInput = event.target.closest(".ff-email-address input.ff-el-form-control");
            if (emailInput && formElement.contains(emailInput)) {
                event.preventDefault();
                emailInput.closest(".ff_input-group")?.querySelector(".ff_btn_is_email")?.click();
            }
        };

        formElement.addEventListener("click", clickHandler);
        formElement.addEventListener("keydown", keydownHandler);
        cleanupCallbacks.push(() => formElement.removeEventListener("click", clickHandler));
        cleanupCallbacks.push(() => formElement.removeEventListener("keydown", keydownHandler));

        const hashKey = getSaveProgressVars().key;
        if (hashKey) {
            hash = hashKey;

            let hiddenHashField = formElement.querySelector("input.__fluent_state_hash");
            if (!hiddenHashField) {
                hiddenHashField = document.createElement("input");
                hiddenHashField.type = "hidden";
                hiddenHashField.className = "__fluent_state_hash";
                hiddenHashField.name = "__fluent_state_hash";
                formElement.appendChild(hiddenHashField);
            }
            hiddenHashField.value = hashKey;

            const stepPersistency = formElement.querySelector(".ff-step-container")?.getAttribute("data-enable_step_data_persistency") === "yes";
            if (!stepPersistency) {
                getJson(window.fluentFormVars.ajaxUrl, {
                    form_id: formElement.getAttribute("data-form_id"),
                    action: "fluentform_get_form_state",
                    hash: hashKey,
                    nonce: getSaveProgressVars().nonce
                }).then((data) => {
                    const sliderInstance = formSlider(formElement, window.fluentFormVars, formSelector);
                    sliderInstance.populateFormDataAndSetActiveStep(data);
                }).catch(() => {
                    // Leave the form untouched if resume state lookup fails.
                });
            }
        }

        const cleanup = function cleanupSaveProgressHandlers() {
            cleanupCallbacks.forEach((removeListener) => removeListener());
        };

        saveProgressCleanupStore.set(formElement, cleanup);
        return cleanup;
    }

    function handleFluentFormInit(event, detail, args, source) {
        const formReference = source === "jquery" ? args[0] : detail?.form;
        const formConfig = source === "jquery" ? args[1] : detail?.config;
        const formElement = resolveFormElement(formReference);

        if (!formElement || !formConfig) {
            return;
        }

        createSaveProgressController(formElement, formConfig);
    }

    getEventBridge().onEvent(document.body, "fluentform_init", handleFluentFormInit);

    Array.from(document.querySelectorAll("form.frm-fluent-form.ff-form-loaded.ff-form-has-save-progress")).forEach((formElement) => {
        const formConfig = getLoadedFormConfig(formElement);
        if (!formConfig) {
            return;
        }

        createSaveProgressController(formElement, formConfig);
    });
})();
