    (function () {
        function ensureFluentFormJqueryBridge() {
            if (window.fluentFormBridge) {
                return window.fluentFormBridge;
            }
            window.fluentFormBridge = {
                emitEvent: function (eventName, detail, targetElement, jqueryEventArguments, options) {
                    const eventOptions = options || {};
                    const eventTarget = targetElement || document;
                    const browserEvent = new CustomEvent(eventName, {
                        detail: detail,
                        bubbles: typeof eventOptions.bubbles === 'boolean' ? eventOptions.bubbles : true
                    });
                    eventTarget.dispatchEvent(browserEvent);

                    if (typeof window.jQuery === 'function') {
                        const $jqueryEventTarget = window.jQuery(eventTarget);
                        if (typeof jqueryEventArguments !== 'undefined') {
                            $jqueryEventTarget.trigger(eventName, jqueryEventArguments);
                        } else if (typeof detail !== 'undefined') {
                            $jqueryEventTarget.trigger(eventName, [detail]);
                        } else {
                            $jqueryEventTarget.trigger(eventName);
                        }
                    }
                }
            };
            return window.fluentFormBridge;
        }

        function initVanillaSubmissionRuntime() {
        const jqueryEventBridge = ensureFluentFormJqueryBridge();
        const formInstanceStore = {};

        window.ffValidationError = (function () {
            var ffValidationError = function () { };
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
                if (target.classList.contains('ff_numeric')) {
                    try {
                        const formatConfig = JSON.parse(target.getAttribute('data-formatter') || '{}');
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
                if (target.classList.contains('ff_numeric')) {
                    try {
                        const formatConfig = JSON.parse(target.getAttribute('data-formatter') || '{}');
                        return currency(value, formatConfig).format();
                    } catch (e) {
                        return value;
                    }
                }
                return value;
            }
        };

        const appendCaptchaData = function (formEl, serializedData) {
            const params = new URLSearchParams(serializedData);
            const recaptchaEl = formEl.querySelector('.ff-el-recaptcha.g-recaptcha');
            if (recaptchaEl && window.grecaptcha) {
                const widgetId = recaptchaEl.dataset.gRecaptcha_widget_id;
                if (typeof widgetId !== 'undefined') {
                    params.append('g-recaptcha-response', grecaptcha.getResponse(widgetId));
                }
            }
            const hcaptchaEl = formEl.querySelector('.ff-el-hcaptcha.h-captcha');
            if (hcaptchaEl && window.hcaptcha) {
                const widgetId = hcaptchaEl.dataset.hCaptcha_widget_id;
                if (typeof widgetId !== 'undefined') {
                    params.append('h-captcha-response', hcaptcha.getResponse(widgetId));
                }
            }
            const turnstileEl = formEl.querySelector('.ff-el-turnstile.cf-turnstile');
            if (turnstileEl && window.turnstile) {
                const widgetId = turnstileEl.dataset.cfTurnstile_widget_id;
                if (typeof widgetId !== 'undefined') {
                    params.append('cf-turnstile-response', turnstile.getResponse(widgetId));
                }
            }
            return params.toString();
        };

        const serializeFormData = function (formEl) {
            const dataItems = [];
            const presentNames = new Set();
            const allInputs = Array.from(formEl.querySelectorAll('input, select, textarea'));
            const processedGroups = new Set();

            allInputs.forEach((input) => {
                if (!input.name || input.disabled || input.type === 'file') {
                    return;
                }
                const repeaterContainer = input.getAttribute('data-type') === 'repeater_container';
                if (repeaterContainer) {
                    const repeaterParent = input.closest('.ff-repeater-container');
                    if (repeaterParent && repeaterParent.classList.contains('ff_excluded')) {
                        return;
                    }
                    const conditionalParent = input.closest('.has-conditions');
                    if (conditionalParent && conditionalParent.classList.contains('ff_excluded')) {
                        input.value = '';
                    }
                } else {
                    const conditionalParent = input.closest('.has-conditions');
                    if (conditionalParent && conditionalParent.classList.contains('ff_excluded')) {
                        return;
                    }
                }

                if (input.type === 'checkbox' || input.type === 'radio') {
                    if (input.checked) {
                        dataItems.push([input.name, input.value || 'on']);
                        presentNames.add(input.name);
                    }
                    return;
                }

                if (input.tagName === 'SELECT' && input.multiple) {
                    Array.from(input.selectedOptions).forEach((opt) => {
                        dataItems.push([input.name, opt.value]);
                        presentNames.add(input.name);
                    });
                    return;
                }

                dataItems.push([input.name, input.value]);
                presentNames.add(input.name);
            });

            allInputs.forEach((input) => {
                if (!input.name || (input.type !== 'checkbox' && input.type !== 'radio')) {
                    return;
                }
                if (!presentNames.has(input.name) && !processedGroups.has(input.name)) {
                    const checked = formEl.querySelectorAll(`input[name="${CSS.escape(input.name)}"]:checked`);
                    if (!checked.length) {
                        dataItems.push([input.name, '']);
                    }
                    processedGroups.add(input.name);
                }
            });

            const params = new URLSearchParams();
            dataItems.forEach(([name, value]) => params.append(name, value));

            Array.from(formEl.querySelectorAll('input[type=file]')).forEach((fileInput) => {
                const fileInputName = fileInput.name + '[]';
                const previews = Array.from(fileInput.closest('div')?.querySelectorAll('.ff-uploaded-list .ff-upload-preview[data-src]') || []);
                previews.forEach((preview) => {
                    params.append(fileInputName, preview.dataset.src || '');
                });
            });

            return params.toString();
        };

        const showErrorMessage = function (formEl, message) {
            const stack = formEl.parentElement?.querySelector('.ff-errors-in-stack');
            if (stack) {
                stack.innerHTML = '';
                const errorHtml = document.createElement('div');
                errorHtml.className = 'error text-danger';
                errorHtml.textContent = message;
                stack.appendChild(errorHtml);
                stack.style.display = '';
            }
        };

        const addHiddenData = function (formEl, items) {
            Object.keys(items || {}).forEach((itemName) => {
                const itemValue = items[itemName];
                if (!itemValue) {
                    return;
                }
                const existing = formEl.querySelector(`input[name="${CSS.escape(itemName)}"]`);
                if (existing) {
                    existing.value = itemValue;
                } else {
                    const hidden = document.createElement('input');
                    hidden.type = 'hidden';
                    hidden.name = itemName;
                    hidden.value = itemValue;
                    formEl.appendChild(hidden);
                }
            });
        };

        const showFormSubmissionProgress = function (formEl) {
            formEl.classList.add('ff_submitting');
            const submitBtn = formEl.querySelector('.ff-btn-submit');
            if (submitBtn) {
                submitBtn.classList.add('disabled', 'ff-working');
                submitBtn.disabled = true;
            }
        };

        const hideFormSubmissionProgress = function (formEl) {
            formEl.classList.remove('ff_submitting');
            const submitBtn = formEl.querySelector('.ff-btn-submit');
            if (submitBtn) {
                submitBtn.classList.remove('disabled', 'ff-working');
                submitBtn.disabled = false;
            }
            formEl.parentElement?.querySelectorAll('.ff_msg_temp').forEach((el) => el.remove());
        };

        const resetCaptchas = function (formEl) {
            if (window.grecaptcha) {
                const el = formEl.querySelector('.ff-el-recaptcha.g-recaptcha');
                if (el && typeof el.dataset.gRecaptcha_widget_id !== 'undefined') {
                    grecaptcha.reset(el.dataset.gRecaptcha_widget_id);
                }
            }
            if (window.hcaptcha) {
                const el = formEl.querySelector('.ff-el-hcaptcha.h-captcha');
                if (el && typeof el.dataset.hCaptcha_widget_id !== 'undefined') {
                    hcaptcha.reset(el.dataset.hCaptcha_widget_id);
                }
            }
            if (window.turnstile) {
                const el = formEl.querySelector('.ff-el-turnstile.cf-turnstile');
                if (el && typeof el.dataset.cfTurnstile_widget_id !== 'undefined') {
                    turnstile.reset(el.dataset.cfTurnstile_widget_id);
                }
            }
        };

        const getFormInstanceClass = function (formEl) {
            return formEl.getAttribute('data-form_instance') || '';
        };

        const getFormConfig = function (formEl) {
            const formInstanceSelector = getFormInstanceClass(formEl).replace(/[^a-zA-Z0-9_-]/g, '');
            const formConfiguration = window['fluent_form_' + formInstanceSelector];
            return (formConfiguration && typeof formConfiguration === 'object') ? formConfiguration : null;
        };

        const getAjaxUrl = function (formConfig) {
            return window.fluentFormVars?.ajaxUrl || formConfig?.ajaxUrl || window.ajaxurl;
        };

        const emitInitEvents = function (app, formEl, formConfig) {
            jqueryEventBridge.emitEvent('fluentform_init', { form: formEl, config: formConfig }, document.body, [formEl, formConfig]);
            jqueryEventBridge.emitEvent('fluentform_init_' + formConfig.id, { form: formEl, config: formConfig }, document.body, [formEl, formConfig]);
            jqueryEventBridge.emitEvent('fluentform_init_single', { form: formEl, app: app, config: formConfig }, formEl, [app, formConfig]);
        };

        const createAppInstance = function (formEl, formConfig) {
            let isSending = false;
            const globalValidators = {};
            const createBridgePayload = function (response) {
                return {
                    form: formEl,
                    response: response,
                    config: formConfig
                };
            };
            const createJqueryFormResponse = function (response) {
                return {
                    form: formEl,
                    response: response
                };
            };
            const createJquerySuccessPayload = function (response) {
                return {
                    form: formEl,
                    config: formConfig,
                    response: response
                };
            };
            const createSubmissionRequestPayload = function () {
                return {
                    data: appendCaptchaData(formEl, serializeFormData(formEl)),
                    action: 'fluentform_submit',
                    form_id: formEl.getAttribute('data-form_id')
                };
            };
            const emitSubmissionFailure = function (responseOrError) {
                const submissionFailureEventPayload = createBridgePayload(responseOrError);
                const jqueryFailureEventPayload = createJqueryFormResponse(responseOrError);
                jqueryEventBridge.emitEvent('fluentform_submission_failed', submissionFailureEventPayload, formEl, [jqueryFailureEventPayload]);
            };
            const emitSubmissionNextAction = function (response) {
                const nextActionEventPayload = createBridgePayload(response);
                const jqueryNextActionPayload = createJqueryFormResponse(response);
                jqueryEventBridge.emitEvent('fluentform_next_action_' + response.data.nextAction, nextActionEventPayload, formEl, [jqueryNextActionPayload]);
            };
            const emitSubmissionSuccess = function (response) {
                const submissionSuccessEventPayload = createBridgePayload(response);
                const jquerySuccessEventPayload = createJquerySuccessPayload(response);

                jqueryEventBridge.emitEvent('fluentform_submission_success', submissionSuccessEventPayload, formEl, [jquerySuccessEventPayload], { bubbles: false });
                jqueryEventBridge.emitEvent('fluentform_submission_success', submissionSuccessEventPayload, document.body, [jquerySuccessEventPayload]);
            };
            const resetFormAfterSuccessfulSubmission = function (response) {
                if (response.data.result.action === 'hide_form') {
                    formEl.style.display = 'none';
                    formEl.classList.add('ff_force_hide');
                    formEl.reset();
                    return;
                }

                jqueryEventBridge.emitEvent('fluentform_reset', { form: formEl, config: formConfig }, document.body, [formEl, formConfig]);
                formEl.reset();
            };

            const addFieldValidationRule = function (elName, ruleName, rule) {
                if (!formConfig.rules || typeof formConfig.rules !== 'object') {
                    formConfig.rules = {};
                }
                if (!formConfig.rules[elName] || typeof formConfig.rules[elName] !== 'object') {
                    formConfig.rules[elName] = {};
                }
                formConfig.rules[elName][ruleName] = rule;
            };

            const removeFieldValidationRule = function (elName, ruleName) {
                if (!formConfig.rules || !formConfig.rules[elName]) {
                    return;
                }
                if (Object.prototype.hasOwnProperty.call(formConfig.rules[elName], ruleName)) {
                    delete formConfig.rules[elName][ruleName];
                }
            };

            const runBeforeSubmitCallbacks = async function (payload) {
                const callbacks = Object.assign({}, globalValidators);

                if (formEl.classList.contains('ff_has_v3_recptcha') && window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
                    callbacks.ff_v3_recptcha = function (targetFormEl, formData) {
                        const siteKey = targetFormEl.getAttribute('data-recptcha_key');
                        if (!siteKey) {
                            return Promise.resolve();
                        }
                        return window.grecaptcha.execute(siteKey, { action: 'submit' }).then(function (token) {
                            const extra = new URLSearchParams({ 'g-recaptcha-response': token }).toString();
                            formData.data = formData.data ? (formData.data + '&' + extra) : extra;
                        });
                    };
                }

                const runners = Object.keys(callbacks).map(function (key) {
                    return callbacks[key];
                });

                for (const runner of runners) {
                    if (typeof runner !== 'function') {
                        continue;
                    }
                    const result = runner(formEl, payload);
                    if (result && typeof result.then === 'function') {
                        await result;
                        continue;
                    }
                    if (result === false) {
                        throw new Error('Submission blocked by a pre-submit validator.');
                    }
                }
            };

            const app = {
                formElement: formEl,
                settings: formConfig,
                config: formConfig,
                formSelector: '.' + getFormInstanceClass(formEl),
                initFormHandlers: function () {
                    formEl.classList.remove('ff-form-loading');
                    formEl.classList.add('ff-form-loaded');
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
                validate: function () { },
                scrollToFirstError: function () {
                    const firstError = formEl.querySelector('.ff-el-is-error, .error');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                },
                showErrorMessages: function (errors) {
                    if (!errors) {
                        return;
                    }
                    let message = '';
                    if (typeof errors === 'string') {
                        message = errors;
                    } else if (Array.isArray(errors) && errors.length) {
                        message = errors[0];
                    } else if (typeof errors === 'object') {
                        const first = Object.values(errors)[0];
                        message = Array.isArray(first) ? first[0] : first;
                    }
                    showErrorMessage(formEl, message || 'Submission failed');
                },
                sendData: async function (targetFormEl, payload) {
                    const ajaxUrl = getAjaxUrl(formConfig);
                    const requestUrl = ajaxUrl + (ajaxUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
                    const encoded = new URLSearchParams(payload).toString();
                    const response = await fetch(requestUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                        },
                        credentials: 'same-origin',
                        body: encoded
                    });
                    const data = await response.json();
                    return data;
                },
                submissionAjaxHandler: async function () {
                    if (isSending) {
                        return;
                    }
                    if (formEl.querySelector('.ff_uploading')) {
                        showErrorMessage(formEl, window.fluentform_submission_messages_global?.file_upload_in_progress || 'File upload in progress. Please wait...');
                        return;
                    }

                    const payload = createSubmissionRequestPayload();

                    showFormSubmissionProgress(formEl);
                    isSending = true;

                    try {
                        await runBeforeSubmitCallbacks(payload);
                        const res = await app.sendData(formEl, payload);
                        if (!res || !res.data || !res.data.result) {
                            emitSubmissionFailure(res);
                            app.showErrorMessages(res);
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

                        const successId = formConfig.form_id_selector + '_success';
                        let successNode = document.getElementById(successId);
                        if (successNode) {
                            successNode.remove();
                        }
                        if (res.data.result.message) {
                            successNode = document.createElement('div');
                            successNode.id = successId;
                            successNode.className = 'ff-message-success';
                            successNode.setAttribute('role', 'status');
                            successNode.setAttribute('aria-live', 'polite');
                            successNode.innerHTML = res.data.result.message;
                            formEl.insertAdjacentElement('afterend', successNode);
                            successNode.focus();
                        }

                        if ('redirectUrl' in res.data.result) {
                            setTimeout(() => hideFormSubmissionProgress(formEl), 500);
                            window.location.href = res.data.result.redirectUrl;
                            return;
                        }

                        resetFormAfterSuccessfulSubmission(res);
                    } catch (error) {
                        emitSubmissionFailure(error);
                        app.showErrorMessages(error?.message || 'Request failed');
                    } finally {
                        isSending = false;
                        hideFormSubmissionProgress(formEl);
                        resetCaptchas(formEl);
                    }
                }
            };
            return app;
        };

        const getLiveFormInstance = function (instanceClass) {
            const cachedFormInstance = formInstanceStore[instanceClass];
            if (!cachedFormInstance) {
                return null;
            }

            if (!cachedFormInstance.formElement || !cachedFormInstance.formElement.isConnected) {
                delete formInstanceStore[instanceClass];
                return null;
            }

            return cachedFormInstance;
        };

        const reinitializeFormInstance = function (formEl) {
            const app = window.fluentFormApp(formEl);
            if (!app) {
                return false;
            }

            app.reinitExtras();
            app.initFormHandlers();
            app.initTriggers();
            formEl.setAttribute('data-ff_reinit', 'yes');
            jqueryEventBridge.emitEvent('ff_reinit', { formItem: formEl, form: formEl, config: getFormConfig(formEl) }, document, [formEl]);

            return true;
        };

        window.fluentFormApp = function (formInput) {
            const formEl = resolveElement(formInput) || document.querySelector(formInput);
            if (!formEl) {
                return false;
            }
            const instanceClass = getFormInstanceClass(formEl).replace(/[^a-zA-Z0-9_-]/g, '');
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

        Array.from(document.querySelectorAll('form.frm-fluent-form')).forEach((formEl) => {
            const app = window.fluentFormApp(formEl);
            if (app) {
                app.initFormHandlers();
                app.initTriggers();
            }
        });

        const handleFluentFormSubmit = function (submitEvent) {
            const formEl = submitEvent.target.closest('form.frm-fluent-form');
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
            const loadingFormElement = submitEvent.target.closest('.fluentform .ff-form-loading');
            if (!loadingFormElement) {
                return false;
            }
            submitEvent.preventDefault();
            loadingFormElement.parentElement?.querySelectorAll('.ff_msg_temp').forEach((el) => el.remove());
            const msg = document.createElement('div');
            msg.className = 'error text-danger ff_msg_temp';
            msg.innerHTML = window.fluentform_submission_messages_global?.javascript_handler_failed || 'Javascript handler could not be loaded. Form submission has been failed. Reload the page and try again';
            loadingFormElement.insertAdjacentElement('afterend', msg);
            return true;
        };

        document.addEventListener('submit', function (submitEvent) {
            if (handleFluentFormSubmit(submitEvent)) {
                return;
            }
            handleLoadingFormSubmit(submitEvent);
        });

        document.addEventListener('reset', function (e) {
            const formEl = e.target.closest('form.frm-fluent-form');
            if (!formEl) {
                return;
            }
            const formConfig = getFormConfig(formEl);
            jqueryEventBridge.emitEvent('fluentform_reset', { form: formEl, config: formConfig }, document.body, [formEl, formConfig]);
        });

        document.addEventListener('ff_reinit', function (e) {
            const detail = e.detail || {};
            const formItem = detail.formItem || detail.form || null;
            const formEl = resolveElement(formItem);
            if (!formEl) {
                return;
            }
            reinitializeFormInstance(formEl);
        });

    }

    const hasJquery = typeof window.jQuery === 'function';
    ensureFluentFormJqueryBridge();
    if (!hasJquery) {
        initVanillaSubmissionRuntime();
        return;
    }

jQuery(document).ready(function () {

    // ios hack to keep the recaptcha on viewport on success
    window.fluentFormrecaptchaSuccessCallback = function (response) {
        if (window.innerWidth < 768 && (/iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)) {
            var el = jQuery('.g-recaptcha').filter(function (i, el) {
                return grecaptcha.getResponse(i) == response;
            });
            if (el.length) {
                jQuery('html, body').animate({
                    scrollTop: el.first().offset().top - (jQuery(window).height() / 2)
                }, 0);
            }
        }
    };

    /**
     * Custom Error/Exception
     */
    window.ffValidationError = (function () {
        var ffValidationError = function () { };
        ffValidationError.prototype = Object.create(Error.prototype);
        ffValidationError.prototype.constructor = ffValidationError;
        return ffValidationError;
    })();

    window.ff_helper = {
        numericVal: function ($el) {
            if ($el.hasClass('ff_numeric')) {
                let formatConfig = JSON.parse($el.attr('data-formatter'));
                return currency($el.val(), formatConfig).value;
            }
            return $el.val() || 0;
        },
        formatCurrency($el, value) {
            if ($el.hasClass('ff_numeric')) {
                let formatConfig = JSON.parse($el.attr('data-formatter'));
                return currency(value, formatConfig).format();
            }
            return value;
        }
    };

    (function (fluentFormVars, $) {

        if (!fluentFormVars) {
            fluentFormVars = {};
        }

        fluentFormVars.stepAnimationDuration = parseInt(fluentFormVars.stepAnimationDuration);

        var fluentFormAppStore = {};

        window.fluentFormApp = function ($theForm) {
            var formInstanceSelector = $theForm.attr('data-form_instance');
            // Sanitize the selector - only allow alphanumeric, underscore and hyphen
            formInstanceSelector = formInstanceSelector ? formInstanceSelector.replace(/[^a-zA-Z0-9_-]/g, '') : '';
            var formConfiguration = window['fluent_form_' + formInstanceSelector];
            var form = (formConfiguration && typeof formConfiguration === 'object') ? formConfiguration : null;
            if (!form) {
                console.log('No Fluent form JS vars found!');
                return false;
            }

            if (fluentFormAppStore[formInstanceSelector]) {
                return fluentFormAppStore[formInstanceSelector];
            }

            if (!fluentFormVars.ajaxUrl) {
                fluentFormVars.ajaxUrl = form.ajaxUrl || window.ajaxurl;
            }

            var formId = form.form_id_selector;
            var formSelector = '.' + formInstanceSelector;

            // Helper function to get translated submission messages
            function getSubmissionMessage(key, fallback) {
                const messagesVar = 'fluentform_submission_messages_' + form.id;
                if (window[messagesVar] && window[messagesVar][key]) {
                    return window[messagesVar][key];
                }
                return fallback;
            }

            /**
             * Form Handler module
             * @param  validator Factory
             * @return void
             */
            return (function (validator) {

                var globalValidators = {};

                var isSending = false;
                /**
                 * Register all the event handlers
                 *
                 * @return void
                 */
                var initFormHandlers = function () {
                    registerFormSubmissionHandler();
                    maybeInlineForm();
                    initInlineErrorItems();
                    $theForm.removeClass('ff-form-loading').addClass('ff-form-loaded');

                    $theForm.on('show_element_error', function (e, data) {
                        showErrorBelowElement(data.element, data.message);
                    });
                };

                var getTheForm = function () {
                    return $('body').find('form' + formSelector);
                };

                var maybeInlineForm = function () {
                    if ($theForm.hasClass('ff-form-inline')) {
                        $theForm.find('button.ff-btn-submit').css('height', '50px');
                    }
                };

                var fireUpdateSlider = function (goBackToStep, animDuration, isScrollTop = true, actionType = 'next') {
                    const sliderPayload = {
                        goBackToStep: goBackToStep,
                        animDuration: animDuration,
                        isScrollTop: isScrollTop,
                        actionType: actionType
                    };
                    window.fluentFormBridge.emitEvent('update_slider', sliderPayload, $theForm[0], [sliderPayload]);
                };

                var fireGlobalBeforeSendCallbacks = function ($theForm, formData) {
                    const processItemsDeferred = [];
                    const processFunctions = globalValidators;

                    if ($theForm.hasClass('ff_has_v3_recptcha')) {
                        processFunctions.ff_v3_recptcha = function ($theForm, formData) {
                            var dfd = jQuery.Deferred();
                            let siteKey = $theForm.data('recptcha_key');
                            grecaptcha.execute(siteKey, { action: 'submit' }).then((token) => {
                                formData['data'] += '&' + jQuery.param({
                                    'g-recaptcha-response': token
                                });
                                dfd.resolve();
                            });
                            return dfd.promise();
                        }
                    }

                    jQuery.each(processFunctions, (itemKey, item) => {
                        processItemsDeferred.push(item($theForm, formData));
                    });

                    return jQuery.when.apply(jQuery, processItemsDeferred);
                }

                var emitLegacySubmissionFailure = function ($theForm, response) {
                    const failedPayload = {
                        form: $theForm,
                        response: response
                    };

                    window.fluentFormBridge.emitEvent('fluentform_submission_failed', {
                        form: $theForm[0],
                        response: response,
                        config: form
                    }, $theForm[0], [failedPayload]);
                };

                var emitLegacySubmissionNextAction = function ($theForm, response) {
                    $theForm.trigger('fluentform_next_action_' + response.data.nextAction, {
                        form: $theForm,
                        response: response
                    });
                };

                var emitLegacySubmissionSuccess = function ($theForm, response) {
                    $theForm.triggerHandler('fluentform_submission_success', {
                        form: $theForm,
                        config: form,
                        response: response
                    });

                    window.fluentFormBridge.emitEvent('fluentform_submission_success', {
                        form: $theForm[0],
                        config: form,
                        response: response
                    }, document.body, [{
                        form: $theForm,
                        config: form,
                        response: response
                    }]);
                };

                var resetLegacyFormAfterSuccessfulSubmission = function ($theForm, response) {
                    if (response.data.result.action == 'hide_form') {
                        $theForm.hide().addClass('ff_force_hide');
                        $theForm[0].reset();
                        return;
                    }

                    window.fluentFormBridge.emitEvent('fluentform_reset', {
                        form: $theForm[0],
                        config: form
                    }, document.body, [$theForm, form]);
                    $theForm[0].reset();
                };

                var submissionAjaxHandler = function ($theForm) {
                    try {
                        var $inputs = $theForm
                            .find(':input').filter(function (i, el) {
                                // Ignore repeater container
                                if ($(el).attr('data-type') === 'repeater_container') {
                                    if ($(el).closest('.ff-repeater-container').hasClass('ff_excluded')) {
                                        return false;
                                    }
                                    if ($(this).closest('.has-conditions').hasClass('ff_excluded')) {
                                        $(this).val('');
                                    }
                                    return true;
                                }
                                return !$(el).closest('.has-conditions').hasClass('ff_excluded');
                            });

                        validate($inputs);

                        // Serialize form data
                        var inputsData = $inputs.serializeArray();
                        // data names array
                        var inputsDataNames = inputsData.map(item => item.name);

                        // Ignore checkbox and radio which one inside table like checkable-grid, net-promoter-score etc
                        $inputs = $inputs.filter(function () {
                            return !$(this).closest('.ff-el-input--content').find('table').length;
                        });
                        // Keep track of checkbox and radio groups that have been processed
                        var processedGroups = {};
                        // Add empty value for unchecked checkboxes and radio buttons
                        $inputs.each(function () {
                            var name = $(this).attr('name');
                            if (!inputsDataNames.includes(name)) {
                                if ($(this).is(':checkbox') || $(this).is(':radio')) {
                                    if (!processedGroups[name] && !$theForm.find('input[name="' + name + '"]:checked').length) {
                                        inputsData.push({ name, value: '' });
                                        processedGroups[name] = true;
                                    }
                                }
                            }
                        });
                        // Convert inputsData array to serialized string
                        var serializedData = $.param($.map(inputsData, function (input) {
                            return { name: input.name, value: input.value };
                        }));
                        var formData = {
                            data: serializedData,
                            action: 'fluentform_submit',
                            form_id: $theForm.data('form_id')
                        };

                        let hasFiles = false;
                        $.each($theForm.find('[type=file]'), function (index, fileInput) {
                            var params = {}, fileInputName = fileInput.name + '[]';
                            params[fileInputName] = [];

                            $(fileInput)
                                .closest('div')
                                .find('.ff-uploaded-list')
                                .find('.ff-upload-preview[data-src]')
                                .each(function (i, div) {
                                    params[fileInputName][i] = $(this).data('src');
                                });

                            $.each(params, function (k, v) {
                                if (v.length) {
                                    var obj = {};
                                    obj[k] = v;
                                    formData['data'] += '&' + $.param(obj);
                                    hasFiles = true;
                                }
                            });
                        });

                        // check if file is uploading
                        if ($theForm.find('.ff_uploading').length) {
                            let errorHtml = $('<div/>', {
                                'class': 'error text-danger'
                            });

                            let cross = $('<span/>', {
                                class: 'error-clear',
                                html: '&times;',
                                click: (e) => $(formSelector + '_errors').html('')
                            });

                            let text = $('<span/>', {
                                class: 'error-text',
                                text: getSubmissionMessage('file_upload_in_progress', 'File upload in progress. Please wait...')
                            });
                            return $(formSelector + '_errors').html(errorHtml.append(text, cross)).show();
                        }

                        // Init reCaptcha if available.
                        if ($theForm.find('.ff-el-recaptcha.g-recaptcha').length) {
                            const grecaptchaWidgetId = $theForm.find('.ff-el-recaptcha.g-recaptcha').data('g-recaptcha_widget_id');
                            if (typeof grecaptchaWidgetId !== "undefined") {
                                formData['data'] += '&' + $.param({
                                    'g-recaptcha-response': grecaptcha.getResponse(grecaptchaWidgetId)
                                });
                            }
                        }

                        // Init hCaptcha if available.
                        if ($theForm.find('.ff-el-hcaptcha.h-captcha').length) {
                            const hcaptchaWidgetId = $theForm.find('.ff-el-hcaptcha.h-captcha').data('h-captcha_widget_id');
                            if (typeof hcaptchaWidgetId !== "undefined") {
                                formData['data'] += '&' + $.param({
                                    'h-captcha-response': hcaptcha.getResponse(hcaptchaWidgetId)
                                });
                            }
                        }

                        // Init turnstile if available.
                        if ($theForm.find('.ff-el-turnstile.cf-turnstile').length) {
                            const turnstileWidgetId = $theForm.find('.ff-el-turnstile.cf-turnstile').data('cf-turnstile_widget_id');
                            if (typeof turnstileWidgetId !== "undefined") {
                                formData['data'] += '&' + $.param({
                                    'cf-turnstile-response': turnstile.getResponse(turnstileWidgetId)
                                });
                            }
                        }

                        $(formSelector + '_success').remove();
                        $(formSelector + '_errors').html('');
                        $theForm.find('.error').html('');
                        $theForm.parent().find('.ff-errors-in-stack').hide();

                        fireGlobalBeforeSendCallbacks($theForm, formData).then(() => {
                            showFormSubmissionProgress($theForm);
                            sendData($theForm, formData);
                        });
                    } catch (e) {
                        if (!(e instanceof ffValidationError)) {
                            throw e;
                        }
                        $theForm.trigger('fluentform_validation_failed', {
                            form: $theForm,
                            response: e.messages
                        });
                        showErrorMessages(e.messages);
                        scrollToFirstError(350);
                    }
                };

                var sendData = function ($theForm, formData) {
                    function addParameterToURL(param) {
                        let _url = fluentFormVars.ajaxUrl;
                        _url += (_url.split('?')[1] ? '&' : '?') + param;
                        return _url;
                    }

                    const ajaxRequestUrl = addParameterToURL('t=' + Date.now());

                    if (isSending) {
                        return;
                    }

                    let responseData;

                    isSending = true;

                    $.post(ajaxRequestUrl, formData)
                        .then(function (res) {
                            if (!res || !res.data || !res.data.result) {
                                // This is an error
                                emitLegacySubmissionFailure($theForm, res);
                                showErrorMessages(res);
                                return;
                            }
                            responseData = res;
                            if (res.data.append_data) {
                                addHiddenData(res.data.append_data);
                            }

                            if (res.data.nextAction) {
                                emitLegacySubmissionNextAction($theForm, res);
                                return;
                            }

                            emitLegacySubmissionSuccess($theForm, res);

                            if ('redirectUrl' in res.data.result) {
                                if (res.data.result.message) {
                                    $('<div/>', {
                                        'id': formId + '_success',
                                        'class': 'ff-message-success',
                                        'role': 'status',
                                        'aria-live': 'polite'
                                    })
                                        .html(res.data.result.message)
                                        .insertAfter($theForm)
                                        .focus()
                                        ;
                                    $theForm.find('.ff-el-is-error').removeClass('ff-el-is-error');
                                }

                                // Hide progress after a short delay to handle file downloads
                                setTimeout(() => {
                                    hideFormSubmissionProgress($theForm);
                                }, 500);

                                location.href = res.data.result.redirectUrl;
                                return;
                            } else {
                                const successMsgId = formId + '_success';
                                const successMsgSelector = '#' + successMsgId;
                                if ($(successMsgSelector).length) {
                                    $(successMsgSelector).slideUp('fast');
                                }
                                $('<div/>', {
                                    'id': successMsgId,
                                    'class': 'ff-message-success',
                                    'role': 'status',
                                    'aria-live': 'polite'
                                })
                                    .html(res.data.result.message)
                                    .insertAfter($theForm)
                                    .focus()
                                    ;

                                $theForm.find('.ff-el-is-error').removeClass('ff-el-is-error');

                                resetLegacyFormAfterSuccessfulSubmission($theForm, res);

                                // Scroll to success msg if not in viewport
                                const successMsg = $(successMsgSelector);
                                if (successMsg.length && !isElementInViewport(successMsg[0])) {
                                    $('html, body').animate({
                                        scrollTop: successMsg.offset().top - (!!$('#wpadminbar') ? 32 : 0) - 20
                                    }, fluentFormVars.stepAnimationDuration);
                                }
                            }
                        })
                        .fail(function (res) {

                            emitLegacySubmissionFailure($theForm, res);


                            if (!res || !res.responseJSON || !(res.responseJSON.data || res.responseJSON.errors)) {

                                showErrorMessages(res.responseText);
                                return;
                            }
                            responseData = res;

                            if (res.responseJSON.append_data) {
                                addHiddenData(res.responseJSON.append_data);
                            }

                            showErrorMessages(res.responseJSON.errors || res.responseJSON.data);

                            scrollToFirstError(350);

                            if ($theForm.find('.fluentform-step').length) {
                                var step = $theForm
                                    .find('.error')
                                    .not(':empty:first')
                                    .closest('.fluentform-step');

                                if (step.length) {
                                    let goBackToStep = step.index();
                                    fireUpdateSlider(
                                        goBackToStep, fluentFormVars.stepAnimationDuration, false
                                    );
                                }
                            }

                            hideFormSubmissionProgress($theForm);
                        })
                        .always(function (res) {
                            isSending = false;

                            if (responseData?.data?.result?.hasOwnProperty('redirectUrl')) {
                                return;
                            }
                            hideFormSubmissionProgress($theForm);
                            // reset reCaptcha if available.
                            if (window.grecaptcha) {
                                const grecaptchaWidgetId = $theForm.find('.ff-el-recaptcha.g-recaptcha').data('g-recaptcha_widget_id');
                                if (typeof grecaptchaWidgetId !== "undefined") {
                                    grecaptcha.reset(grecaptchaWidgetId);
                                }
                            }
                            if (window.hcaptcha) {
                                let hcaptchaWidgetId = $theForm.find('.ff-el-hcaptcha.h-captcha').data('h-captcha_widget_id');
                                if (typeof hcaptchaWidgetId !== "undefined") {
                                    hcaptcha.reset(hcaptchaWidgetId);
                                }
                            }
                            if (window.turnstile) {
                                let turnstileWidgetId = $theForm.find('.ff-el-turnstile.cf-turnstile').data('cf-turnstile_widget_id');
                                if (typeof turnstileWidgetId !== "undefined") {
                                    turnstile.reset(turnstileWidgetId);
                                }
                            }
                        });
                }

                var showFormSubmissionProgress = function ($form) {
                    $form.addClass('ff_submitting');
                    $form
                        .find('.ff-btn-submit')
                        .addClass('disabled')
                        .addClass('ff-working')
                        .prop('disabled', true);
                };

                var hideFormSubmissionProgress = function ($form) {
                    $form.removeClass('ff_submitting');
                    $form
                        .find('.ff-btn-submit')
                        .removeClass('disabled')
                        .removeClass('ff-working')
                        .attr('disabled', false);
                    $theForm.parent().find('.ff_msg_temp').remove();
                }

                var formResetHandler = function ($this) {
                    if ($('.ff-step-body', $theForm).length) {
                        fireUpdateSlider(0, fluentFormVars.stepAnimationDuration, false);
                    }
                    $this.find('.ff-el-repeat .ff-t-cell').each(function () {
                        $(this).find('input').not(':first').remove();
                    });

                    $this
                        .find('.ff-el-repeat .ff-el-repeat-buttons-list')
                        .find('.ff-el-repeat-buttons')
                        .not(':first')
                        .remove();

                    // reset image type checkbox and radio field
                    let checkedTypeInputs = $this.find('input[type=checkbox],input[type=radio]');
                    if (checkedTypeInputs.length) {
                        checkedTypeInputs.each((index, el) => {
                            el = $(el);
                            if (!el.prop('defaultChecked')) {
                                el.closest('.ff-el-form-check.ff_item_selected').removeClass('ff_item_selected');
                            } else {
                                el.closest('.ff-el-form-check').addClass('ff_item_selected');
                            }
                        })
                    }

                    $this.find('input[type=file]').closest('div').find('.ff-uploaded-list').html('')
                        .end().closest('div')
                        .find('.ff-upload-progress')
                        .addClass('ff-hidden')
                        .find('.ff-el-progress-bar')
                        .css('width', '0%');

                    let rangeSliders = $this.find('input[type="range"]');
                    if (rangeSliders.length) {
                        rangeSliders.each((index, rangeSlider) => {
                            rangeSlider = $(rangeSlider);

                            rangeSlider.val(rangeSlider.data('calc_value')).change();
                        })
                    }

                    $.each(form.conditionals, function (fieldName, field) {
                        $.each(field.conditions, function (index, condition) {
                            reset(getElement(condition.field));
                        });
                    });
                };

                /**
                 * Register form submission event handler
                 *
                 * @return void
                 */
                var registerFormSubmissionHandler = function () {

                    if ($theForm.attr('data-ff_reinit') == 'yes') {
                        return;
                    }

                    $(document).on('submit', formSelector, function (e) {
                        e.preventDefault();
                        if (window.ff_sumitting_form) {
                            return;
                        }
                        window.ff_sumitting_form = true;

                        setTimeout(() => {
                            window.ff_sumitting_form = false;
                        }, 1500);

                        submissionAjaxHandler($(this));
                    });

                    $(document).on('reset', formSelector, function (e) {
                        formResetHandler($(this))
                    });

                    $(document).on('keydown', formSelector + ' input[type="radio"], ' + formSelector + ' input[type="checkbox"]', function (e) {
                        if (e.key === 'Enter') {
                            e.preventDefault();

                            // For radio buttons, just check it
                            if ($(this).attr('type') === 'radio') {
                                $(this).prop('checked', true);
                            }
                            // For checkboxes, toggle the checked state
                            else if ($(this).attr('type') === 'checkbox') {
                                $(this).prop('checked', !$(this).prop('checked'));
                            }

                            // Trigger change event for both types
                            $(this).trigger('change');
                            e.stopPropagation();
                            return false;
                        }
                    });
                };

                /**
                 * Reset the form to initial state
                 * @param  {jQuery} el
                 * @return {void}
                 */
                var reset = function (el) {
                    var type = el.prop('type');
                    if (type == undefined) return;

                    if (type == 'checkbox' || type == 'radio') {
                        el.each(function (i, el) {
                            var $this = $(this);
                            $this.prop('checked', $this.prop('defaultChecked'));
                        });
                    } else if (type.startsWith('select')) {
                        el.find('option').each(function (i, el) {
                            var $this = $(this);
                            $this.prop('selected', $this.prop('defaultSelected'));
                        });
                    } else {
                        el.val(el.prop("defaultValue"));
                    }
                    el.trigger('change');
                };

                /**
                 * Scroll viewport to the first error message position
                 * @param  {int} animDuration
                 * @return void
                 */
                var scrollToFirstError = function (animDuration) {
                    var errorSetting = form['settings']['layout']['errorMessagePlacement'];
                    if (errorSetting && errorSetting != 'stackToBottom') {
                        var firstError = $theForm.find('.ff-el-is-error').first();
                        if (firstError.length && !isElementInViewport(firstError[0])) {
                            $('html, body').delay(animDuration).animate({
                                scrollTop: firstError.offset().top - (!!$('#wpadminbar') ? 32 : 0) - 20
                            }, animDuration);
                        }
                    }
                };

                /**
                 * Show error if element is out of viewport
                 * @param  {HTMLElement} el
                 * @return {Boolean}
                 */
                var isElementInViewport = function (el) {
                    if (!el) {
                        return true;
                    }
                    var rect = el.getBoundingClientRect();
                    return (
                        rect.top >= 0 &&
                        rect.left >= 0 &&
                        rect.bottom <= $(window).height() &&
                        rect.right <= $(window).width()
                    );
                };

                /**
                 * Validate inputs
                 *
                 * @param  elements jQueryObject target
                 * @return void
                 * @throes error
                 */
                var validate = function (elements) {
                    if (!elements.length) {
                        elements = $('form.frm-fluent-form').find(':input').not(':button').filter(function (i, el) {
                            return !$(el).closest('.has-conditions').hasClass('ff_excluded');
                        });
                    }

                    elements.each((i, el) => {
                        $(el).closest('.ff-el-group').removeClass('ff-el-is-error').find('.error').remove();
                    });

                    validator().validate(elements, form.rules);

                };

                var addFieldValidationRule = function (elName, ruleName, rule) {
                    if (!form.rules[elName]) {
                        form.rules[elName] = {};
                    }
                    form.rules[elName][ruleName] = rule;
                }
                var removeFieldValidationRule = function (elName, ruleName) {
                    if (!(elName in form.rules)) {
                        return;
                    }
                    if (ruleName in form.rules[elName]) {
                        delete form.rules[elName][ruleName];
                    }
                }

                /**
                 * Show form validation errors
                 * @param  {object} errors
                 * @return void
                 */
                var showErrorMessages = function (errors) {
                    var errorStack = $theForm.parent().find('.ff-errors-in-stack');
                    errorStack.empty();

                    if (!errors) {
                        return;
                    }

                    if (typeof errors == 'string') {
                        showErrorInStack({ 'error': [errors] });
                        return;
                    }

                    var errorSetting = form['settings']['layout']['errorMessagePlacement'];
                    if (!errorSetting || errorSetting == 'stackToBottom') {
                        showErrorInStack(errors);
                        return false;
                    }

                    $theForm.find('.error').empty();
                    $theForm.find('.ff-el-group').removeClass('ff-el-is-error');
                    $.each(errors, function (element, messages) {
                        if (typeof messages == 'string') {
                            messages = [messages];
                        }
                        $.each(messages, function (rule, message) {
                            showErrorBelowElement(element, message);
                        });
                    });
                };

                /**
                 * Show validation errors all in a stack
                 * @param  {object} errors
                 * @return void
                 */
                var showErrorInStack = function (errors) {
                    var $theForm = getTheForm();
                    var errorStack = $theForm.parent().find('.ff-errors-in-stack');

                    if (!errors) {
                        return;
                    }

                    if ($.isEmptyObject(errors)) {
                        return;
                    }

                    $.each(errors, function (elementName, errorObject) {
                        if (typeof errorObject == 'string') {
                            errorObject = [errorObject];
                        }
                        $.each(errorObject, function (index, errorString) {
                            var errorHtml = $('<div/>', {
                                'class': 'error text-danger'
                            });
                            var cross = $('<span/>', {
                                class: 'error-clear',
                                html: '&times;'
                            });
                            var text = $('<span/>', {
                                class: 'error-text',
                                'data-name': getElement(elementName).attr('name'),
                                html: errorString
                            });
                            errorHtml.attr('role', 'alert');
                            errorHtml.append(text, cross);
                            $(document.body).trigger('fluentform_error_in_stack', { form: $theForm, element: getElement(elementName), message: text });
                            errorStack.append(errorHtml).show();
                        });

                        var element = getElement(elementName);
                        if (element) {
                            var name = element.attr('name');
                            element.attr('aria-invalid', 'true');
                            var el = $('[name=\'' + name + '\']').first();
                            if (el) {
                                el.closest('.ff-el-group').addClass('ff-el-is-error');
                            }
                        }
                    });

                    if (!isElementInViewport(errorStack[0])) {
                        $('html, body').animate({
                            scrollTop: errorStack.offset().top - 100
                        }, 350);
                    }

                    errorStack
                        .on('click', '.error-clear', function () {
                            $(this).closest('div').remove();
                            errorStack.hide();
                        })
                        .on('click', '.error-text', function () {
                            var el = $(`[name='${$(this).data('name')}']`).first();
                            $('html, body').animate({
                                scrollTop: el.offset() && el.offset().top - 100
                            }, 350, _ => el.focus());
                        });
                };

                /**
                 * Show validation error/message beside the element
                 * @param  {string} element
                 * @param  {string} message
                 * @return void
                 */
                var showErrorBelowElement = function (element, message) {
                    var el, div;
                    el = getElement(element);
                    if (!el.length) {
                        showErrorInStack([message]);
                        return;
                    }
                    el.attr('aria-invalid', 'true');
                    div = $('<div/>', { class: 'error text-danger' });
                    div.attr('role', 'alert');
                    el.closest('.ff-el-group').addClass('ff-el-is-error');
                    if (el.closest('.ff-el-input--content').length) {
                        el.closest('.ff-el-input--content').find('div.error').remove();
                        $(document.body).trigger('fluentform_error_below_element', { form: $theForm, element: el, message: message });
                        el.closest('.ff-el-input--content').append(div.html(message));
                    } else {
                        el.find('div.error').remove();
                        el.append(div.text(message));
                    }
                };

                var initInlineErrorItems = function () {
                    $theForm.find('.ff-el-group,.ff_repeater_table, .ff_repeater_container').on('change', 'input,select,textarea', function () {
                        if (window.ff_disable_error_clear) {
                            return;
                        }

                        $(this).attr('aria-invalid', 'false');

                        var errorSetting = form['settings']['layout']['errorMessagePlacement'];
                        if (errorSetting || errorSetting != 'stackToBottom') {
                            var $parent = $(this).closest('.ff-el-group');
                            if ($parent.hasClass('ff-el-is-error')) {
                                $parent.removeClass('ff-el-is-error').find('.error.text-danger').remove();
                            }
                        }
                    });
                };

                /**
                 * Resolve a dom element as jQuery object
                 *
                 * @param  string name
                 * @return jQuery instance
                 */
                var getElement = function (name) {
                    var $theForm = getTheForm();
                    var el = $("[data-name='" + name + "']", $theForm);
                    el = el.length ? el : $("[name='" + name + "']", $theForm);
                    return el.length ? el : $("[name='" + name + "[]']", $theForm);
                };

                var reinitExtras = function () {
                    // reCAPTCHA
                    if ($theForm.find('.ff-el-recaptcha.g-recaptcha').length && window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
                        window.grecaptcha.ready(function () {
                            $theForm.find('.ff-el-recaptcha.g-recaptcha').each(function () {
                                var $el = $(this);
                                if (!resetCaptcha('g-recaptcha', $el, grecaptcha.reset)) {
                                    renderCaptcha('g-recaptcha', $el, grecaptcha.render);
                                }
                            });
                        });
                    }

                    // Turnstile
                    if ($theForm.find('.ff-el-turnstile.cf-turnstile').length && window.turnstile && typeof window.turnstile.ready === 'function') {
                        window.turnstile.ready(function () {
                            $theForm.find('.ff-el-turnstile.cf-turnstile').each(function () {
                                var $el = $(this);
                                if (!resetCaptcha('cf-turnstile', $el, turnstile.reset)) {
                                    renderCaptcha('cf-turnstile', $el, turnstile.render);
                                }
                            });
                        });
                    }

                    // hCaptcha
                    if ($theForm.find('.ff-el-hcaptcha.h-captcha').length && window.hcaptcha) {
                        $theForm.find('.ff-el-hcaptcha.h-captcha').each(function () {
                            var $el = $(this);
                            if (!resetCaptcha('h-captcha', $el, hcaptcha.reset)) {
                                renderCaptcha('h-captcha', $el, hcaptcha.render);
                            }
                        });
                    }
                };

                var initTriggers = function () {
                    $theForm = getTheForm();
                    window.fluentFormBridge.emitEvent('fluentform_init', {
                        form: $theForm[0],
                        config: form
                    }, document.body, [$theForm, form]);
                    window.fluentFormBridge.emitEvent('fluentform_init_' + form.id, {
                        form: $theForm[0],
                        config: form
                    }, document.body, [$theForm, form]);
                    window.fluentFormBridge.emitEvent('fluentform_init_single', {
                        form: $theForm[0],
                        app: this,
                        config: form
                    }, $theForm[0], [this, form]);
                    $theForm.find('input.ff-el-form-control').on('keypress', function (e) {
                        return e.which !== 13;
                    });
                    $theForm.data('is_initialized', 'yes');

                    $theForm.find('input.ff-read-only').each(function () {
                        $(this).attr({
                            'tabindex': '-1',
                            'readonly': 'readonly'
                        });
                    });

                    $theForm.find('.ff-el-tooltip').on('mouseenter', function (event) {
                        let content = $(this).data('content');
                        let $popContent = $('.ff-el-pop-content');
                        if (!$popContent.length) {
                            $('<div/>', {
                                class: 'ff-el-pop-content'
                            }).appendTo(document.body);
                            $popContent = $('.ff-el-pop-content');
                        }
                        // Remove dangerous tags and event handlers
                        content = content.replace(/<script.*?>.*?<\/script>/gis, '')
                            .replace(/<iframe.*?>.*?<\/iframe>/gis, '')
                            .replace(/<.*?\bon\w+=["'][^"']*["']/gi, '')
                            .replace(/javascript:/gi, '');
                        $popContent.html(content);
                        const formWidth = $theForm.innerWidth() - 20;
                        $popContent.css('max-width', formWidth);

                        const iconLeft = $(this).offset().left;
                        const contentWidth = $popContent.outerWidth();
                        const contentHeight = $popContent.outerHeight();

                        let tipLeftPosition = iconLeft - (contentWidth / 2) + 10;


                        if (tipLeftPosition < 15) {
                            tipLeftPosition = 15;
                        }

                        $popContent.css('top', $(this).offset().top - contentHeight - 5);
                        $popContent.css('left', tipLeftPosition);
                    });
                    $theForm.find('.ff-el-tooltip').on('mouseleave', function () {
                        $('.ff-el-pop-content').remove();
                    });

                    $(document).on('lity:open', function () {
                        window.turnstile?.remove();
                        mayBeRenderCaptchas();
                    });

                    $theForm.one('focus', 'input, select, textarea, input[type="checkbox"], input[type="radio"]', () => {
                        $theForm.trigger('fluentform_first_interaction');
                    });

                    $theForm.on('fluentform_first_interaction', function () {
                        mayBeRenderCaptchas();
                    });

                    $theForm.on('ff_to_next_page ff_to_prev_page', function (e) {
                        mayBeRenderCaptchas();
                    });

                    mayBeRenderCaptchas();
                };

                let mayBeRenderCaptchas = function () {
                    // reCAPTCHA
                    if ($theForm.find('.ff-el-recaptcha.g-recaptcha').length && window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
                        window.grecaptcha.ready(function () {
                            $theForm.find('.ff-el-recaptcha.g-recaptcha').each(function () {
                                renderCaptcha('g-recaptcha', $(this), grecaptcha.render);
                            });
                        });
                    }

                    // Turnstile
                    if ($theForm.find('.ff-el-turnstile.cf-turnstile').length && window.turnstile && typeof window.turnstile.ready === 'function') {
                        window.turnstile.ready(function () {
                            $theForm.find('.ff-el-turnstile.cf-turnstile').each(function () {
                                renderCaptcha('cf-turnstile', $(this), turnstile.render);
                            });
                        });
                    }

                    // hCaptcha
                    if ($theForm.find('.ff-el-hcaptcha.h-captcha').length && window.hcaptcha) {
                        $theForm.find('.ff-el-hcaptcha.h-captcha').each(function () {
                            renderCaptcha('h-captcha', $(this), hcaptcha.render);
                        });
                    }
                }

                let renderCaptcha = function (type, $el, renderFunction) {
                    var siteKey = $el.data('sitekey');
                    var id = $el.attr('id');
                    var widgetIdAttr = `data-${type}_widget_id`;

                    try {
                        let widgetId = $el.attr(widgetIdAttr);

                        if (type === 'g-recaptcha' || type === 'h-captcha') {
                            if (widgetId && $el.find('iframe').length > 0) {
                                return; // Already rendered properly
                            }
                        }
                        else if (type === 'cf-turnstile') {
                            let $responseInput = $el.find('input[name="cf-turnstile-response"]');

                            if ($responseInput.length && $responseInput.val()) {
                                return;
                            }

                            let widgetId = $el.attr(widgetIdAttr);
                            if (widgetId && window.turnstile) {
                                turnstile.remove(widgetId);
                            }
                        }

                        // rendering captcha code
                        let container = id;
                        let options = {
                            'sitekey': siteKey
                        };

                        // Special case for Turnstile
                        if (type === 'cf-turnstile') {
                            container = '#' + id;
                        }

                        // Render the captcha
                        widgetId = renderFunction(container, options);
                        $el.attr(widgetIdAttr, widgetId);
                    } catch (error) {
                        console.error(`Error rendering ${type}:`, error);
                    }
                }

                let resetCaptcha = function (type, $el, resetFunction) {
                    var widgetIdAttr = `data-${type}_widget_id`;
                    var existingWidgetId = $el.attr(widgetIdAttr);
                    if (existingWidgetId) {
                        try {
                            resetFunction(existingWidgetId);
                            return true;
                        } catch (error) {
                            console.error(`Error resetting ${type}:`, error);
                            $el.removeAttr(widgetIdAttr).removeData(`${type}-rendered`);
                        }
                    }
                    return false;
                }

                var addGlobalValidator = function (key, callback) {
                    globalValidators[key] = callback;
                }

                var addHiddenData = function (items) {
                    jQuery.each(items, (itemName, itemValue) => {
                        if (itemValue) {
                            const $itemDom = $theForm.find('input[name=' + itemName + ']');
                            if ($itemDom.length) {
                                $itemDom.attr('value', itemValue);
                            } else {
                                $('<input>').attr({
                                    type: 'hidden',
                                    name: itemName,
                                    value: itemValue
                                }).appendTo($theForm);
                            }
                        }
                    });
                }

                var appInstance = {
                    initFormHandlers,
                    registerFormSubmissionHandler,
                    maybeInlineForm,
                    reinitExtras,
                    initTriggers,
                    validate,
                    showErrorMessages,
                    scrollToFirstError,
                    settings: form,
                    formSelector: formSelector,
                    sendData,
                    addGlobalValidator,
                    config: form,
                    showFormSubmissionProgress,
                    addFieldValidationRule,
                    removeFieldValidationRule,
                    hideFormSubmissionProgress
                }

                fluentFormAppStore[formInstanceSelector] = appInstance;

                return appInstance;
            })(validationFactory);
        };

        const fluentFormCommonActions = {

            init: function () {
                setTimeout(() => {
                    this.initMultiSelect();
                }, 100);
                this.initMask();
                this.initNumericFormat();
                this.initCheckableActive();
                this.maybeInitSpamTokenProtection();
                this.maybeHandleCleanTalkSubmitTime();
                this.initOtherOptionHandlers();
            },

            maybeInitSpamTokenProtection: function () {
                const formContainers = jQuery('form.frm-fluent-form');

                formContainers.each((index, formElement) => {
                    const formContainer = jQuery(formElement);
                    const spamProtectionField = formContainer.find('.fluent-form-token-field');

                    // Skip if no protection field or already processing/processed
                    if (spamProtectionField.length === 0 ||
                        formContainer.hasClass('ff_tokenizing') ||
                        formContainer.hasClass('ff_tokenized')) {
                        return;
                    }

                    // Helper function to generate token
                    const generateTokenIfNeeded = () => {
                        if (!formContainer.hasClass('ff_tokenized') && !formContainer.hasClass('ff_tokenizing')) {
                            formContainer.addClass('ff_tokenizing');
                            this.generateAndSetToken(formContainer, spamProtectionField);
                        }
                    };

                    // Maybe generate token on step form step change
                    formContainer.one('ff_to_next_page ff_to_prev_page', function (e) {
                        generateTokenIfNeeded();
                    });

                    // Generate token on first user interaction with form
                    formContainer.on('fluentform_first_interaction', function () {
                        generateTokenIfNeeded();
                    });
                });
            },

            generateAndSetToken: function (formContainer, spamProtectionField, retry = true) {
                const form_id = formContainer.data('form_id');
                const ajaxRequestUrl = fluentFormVars.ajaxUrl + '?t=' + Date.now();
                const _this = this;
                jQuery.post(ajaxRequestUrl, {
                    action: 'fluentform_generate_protection_token',
                    form_id: form_id,
                    nonce: fluentFormVars?.token_nonce
                })
                    .done(function (response) {
                        if (response.success && response.data.token) {
                            spamProtectionField.val(response.data.token);
                            formContainer.addClass('ff_tokenized');
                        } else {
                            spamProtectionField.val(null);
                            console.error('Token generation failed for form ID:', form_id);
                        }
                    })
                    .fail(function (xhr, status, error) {
                        console.error('Error generating token for form ID:', form_id, error);
                        // Retry
                        if (retry) {
                            setTimeout(() => {
                                _this.generateAndSetToken(formContainer, spamProtectionField, false);
                            }, 1000);
                        }
                    })
                    .always(function () {
                        formContainer.removeClass('ff_tokenizing');
                    });
            },

            maybeHandleCleanTalkSubmitTime: function () {
                if (!!window.fluentFormVars?.has_cleantalk) {
                    const formContainers = jQuery('form.frm-fluent-form');

                    formContainers.each((index, formElement) => {
                        const formContainer = jQuery(formElement);
                        const formLoadTimeField = formContainer.find('.ff_ct_form_load_time');
                        if (formLoadTimeField.length) {
                            formLoadTimeField.val(Math.floor(Date.now() / 1000)); // Set timestamp in seconds
                        }
                    });
                }
            },

            // Handle "Other" option for checkboxes and radio fields
            initOtherOptionHandlers: function () {
                // Handle checkbox "Other" option - show/hide text input
                jQuery(document).on("change", ".ff-other-option input[type=\"checkbox\"]", function () {
                    let $checkbox = jQuery(this);
                    let $wrapper = $checkbox.closest(".ff-el-input--content").find(".ff-other-input-wrapper");
                    if (!$wrapper.length) {
                        return;
                    }

                    if ($checkbox.is(":checked")) {
                        $wrapper.show();
                        // Only focus if input is empty to avoid blur conflicts
                        let $input = $wrapper.find(".ff-el-form-control");
                        if ($input.val().trim() === "") {
                            setTimeout(function () {
                                $input.focus();
                            }, 50);
                        }
                    } else {
                        $wrapper.hide();
                        $wrapper.find(".ff-el-form-control").val("");
                    }
                });

                // Handle radio "Other" option - show/hide text input
                jQuery(document).on("change", ".ff-other-option input[type=\"radio\"]", function () {
                    let $radio = jQuery(this);
                    let $fieldContainer = $radio.closest(".ff-el-input--content");
                    let $wrapper = $fieldContainer.find(".ff-other-input-wrapper");
                    if (!$wrapper.length) {
                        $wrapper = $radio.closest("label").next(".ff-other-input-wrapper");
                    }

                    if ($radio.is(":checked")) {
                        // Hide all other input wrappers in this field
                        $fieldContainer.find(".ff-other-input-wrapper").hide();
                        // Show this one
                        if ($wrapper.length) {
                            $wrapper.show();
                            $wrapper.find(".ff-el-form-control").focus();
                        }
                    }
                });
                // Hide "Other" text input when selecting non-Other radio option
                jQuery(document).on("change", ".ff-el-input--content input[type=\"radio\"]", function () {
                    let $radio = jQuery(this);
                    if ($radio.closest(".ff-other-option").length) {
                        return;
                    }
                    let $fieldContainer = $radio.closest(".ff-el-input--content");
                    $fieldContainer.find(".ff-other-input-wrapper").hide();
                    $fieldContainer.find(".ff-other-input-wrapper .ff-el-form-control").val("");
                });
            },

            /**
             * Init choice2
             *
             * @return void
             */
            initMultiSelect: function () {
                // Loads if function exists.
                if (!$.isFunction(window.Choices)) {
                    return;
                }

                if (!$('.ff_has_multi_select').length) {
                    return;
                }

                $('.ff_has_multi_select').each(function (idx, el) {

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
                        }
                    };


                    const args = { ...choiceArgs, ...window.fluentFormVars.choice_js_vars };

                    const maxSelection = $(el).attr('data-max_selected_options');
                    if (parseInt(maxSelection)) {
                        args.maxItemCount = parseInt(maxSelection);
                        args.maxItemText = function (maxItemCount) {
                            let message;
                            if (maxItemCount === 1) {
                                message = window.fluentFormVars.choice_js_vars.maxItemTextSingular;
                            } else {
                                message = window.fluentFormVars.choice_js_vars.maxItemTextPlural;
                            }
                            message = message.replace('%%maxItemCount%%', maxItemCount);
                            return message;
                        }
                    }

                    args.callbackOnCreateTemplates = function () {
                        var self = this,
                            $element = $(self.passedElement.element);
                        return {
                            // Change default template for option.
                            option: function (item) {
                                var opt = Choices.defaults.templates.option.call(this, item);
                                if (item.customProperties) {
                                    opt.dataset.calc_value = item.customProperties;
                                }
                                return opt;
                            },
                        };
                    };


                    // Save choicesjs instance for future access.
                    $(el).data('choicesjs', new Choices(el, args));
                });
            },

            /**
             * Init jQuery mask plugin
             *
             * @return void
             */
            initMask: function () {

                if (jQuery.fn.mask == undefined) {
                    return;
                }

                const globalOptions = {
                    clearIfNotMatch: window.fluentFormVars.input_mask_vars.clearIfNotMatch,
                    translation: {
                        '*': { pattern: /[0-9a-zA-Z]/ },
                        '0': { pattern: /\d/ },
                        '9': { pattern: /\d/, optional: true },
                        '#': { pattern: /\d/, recursive: true },
                        'A': { pattern: /[a-zA-Z0-9]/ },
                        'S': { pattern: /[a-zA-Z]/ }
                    },
                };

                jQuery('input[data-mask]').each(function (key, el) {
                    var el = jQuery(el), mask = el.attr('data-mask');

                    let options = globalOptions;
                    if (el.attr('data-mask-reverse')) {
                        options.reverse = true;
                    }
                    if (el.attr('data-clear-if-not-match')) {
                        options.clearIfNotMatch = true;
                    }

                    if (mask) {
                        el.mask(mask, options);
                    }
                })
            },

            initCheckableActive: function () {
                $(document).on('change', '.ff-el-form-check input[type=radio]', function () {
                    if ($(this).is(':checked')) {
                        $(this).closest('.ff-el-input--content').find('.ff-el-form-check').removeClass('ff_item_selected');
                        $(this).closest('.ff-el-form-check').addClass('ff_item_selected');
                    }
                });
                $(document).on('change', '.ff-el-form-check input[type=checkbox]', function () {
                    if ($(this).is(':checked')) {
                        $(this).closest('.ff-el-form-check').addClass('ff_item_selected');
                    } else {
                        $(this).closest('.ff-el-form-check').removeClass('ff_item_selected');
                    }
                });
            },

            initNumericFormat: function () {
                var numericFields = $('form.frm-fluent-form .ff_numeric');
                $.each(numericFields, (index, field) => {
                    let $field = $(field);
                    let formatConfig = JSON.parse($field.attr('data-formatter'));

                    if ($field.val()) {
                        $field.val(window.ff_helper.formatCurrency($field, $field.val()));
                    }

                    $field.on('blur change', function () {
                        let value = currency($(this).val(), formatConfig).format();
                        $(this).val(value);
                    });
                });
            }
        };

        /**
         * Validation factory
         * @return Validator Object
         */
        var validationFactory = function () {
            /**
             * Validator
             */
            return new function () {

                /**
                 * Store validation errors
                 * @type {Object}
                 */
                this.errors = {};

                /**
                 * Validate all given elements using given rules
                 * @param  {jQuery elements} elements
                 * @param  {object} rules
                 * @return void
                 * @throws Error
                 */
                this.validate = function (elements, rules) {
                    var self = this, isValid = true, el, elName;
                    elements.each(function (index, element) {
                        el = $(element);
                        elName = el.prop('name').replace('[]', '');

                        if (el.data('type') === 'repeater_item' || el.data('type') === 'repeater_container') {
                            elName = el.attr('data-name');
                            rules[elName] = rules[el.data('error_index')];
                        }

                        if (rules[elName]) {
                            $.each(rules[elName], function (ruleName, rule) {
                                if (ruleName in self) {
                                    if (!self[ruleName](el, rule)) {
                                        isValid = false;
                                        if (!(elName in self.errors)) {
                                            self.errors[elName] = {};
                                        }
                                        self.errors[elName][ruleName] = rule.message;
                                    }
                                } else {
                                    // throw new Error('Method [' + ruleName + '] doesn\'t exist in Validator.');
                                }
                            });
                        }
                    });


                    !isValid && this.throwValidationException();
                };

                /**
                 * Throw the validation exception
                 * @return void
                 * @throws ffValidationError
                 */
                this.throwValidationException = function () {
                    var error = new ffValidationError('Validation Error!');
                    error.messages = this.errors;
                    throw error;
                };

                /**
                 * Declare handlers for available validation rules
                 */

                /**
                 * Handle required rule
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.required = function (el, rule) {
                    if (!rule.value) return true;
                    var type = el.prop('type');
                    if (type == 'checkbox' || type == 'radio') {
                        if (el.parents('.ff-el-group').attr('data-name')) {
                            if (!rule.per_row) {
                                return el.parents('.ff-el-group').find('input:checked').length;
                            }
                        }
                        const checked = $('[name="' + el.prop('name') + '"]:checked');
                        const name = el.prop('name').replace('[]', '');
                        if (checked.length && checked.val() === `__ff_other_${name}__`) {
                            const otherInputField = $(`[name="${name}__ff_other_input__"]`);
                            return otherInputField.val()
                        }
                        return checked.length;
                    } else if (type.startsWith('select')) {
                        var selected = el.find(':selected');
                        return !!(selected.length && selected.val().length);
                    } else if (type == 'file') {
                        return el.closest('div')
                            .find('.ff-uploaded-list')
                            .find('.ff-upload-preview[data-src]')
                            .length;
                    } else {
                        //solution for range slider required
                        if (el.attr('is-changed') == 'false') {
                            return '';
                        }
                        return String($.trim(el.val())).length;
                    }
                };

                /**
                 * Handle url rule (check valid url)
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.url = function (el, rule) {
                    var val = el.val();

                    if (!rule.value || !val.length) return true;

                    var urlregex = /^(ftp|http|https):\/\/[^ "]+$/;

                    return urlregex.test(val);
                };

                /**
                 * Handle email rule (check valid email)
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.email = function validateEmail(el, rule) {
                    var val = el.val();

                    if (!rule.value || !val.length) return true;

                    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                    return re.test(val.toLowerCase());
                };

                /**
                 * Handle numeric rule (check valid number)
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.numeric = function (el, rule) {
                    var val = window.ff_helper.numericVal(el);
                    val = val.toString();

                    if (!rule.value || !val) {
                        return true;
                    }

                    return $.isNumeric(val);
                };

                /**
                 * Handle minimum value rule (check valid number in min range)
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.min = function (el, rule) {
                    if (!el.val()) {
                        return true;
                    }
                    var val = window.ff_helper.numericVal(el);
                    val = val.toString();
                    if (!rule.value || !val.length) {
                        return true;
                    }

                    if (this.numeric(el, rule)) {
                        return Number(val) >= Number(rule.value);
                    }
                };

                /**
                 * Handle maximum value rule (check valid number in max range)
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.max = function (el, rule) {
                    if (!el.val()) {
                        return true;
                    }
                    var val = window.ff_helper.numericVal(el);
                    val = val.toString();

                    if (!rule.value || !val.length) {
                        return true;
                    }

                    if (this.numeric(el, rule)) {
                        return Number(val) <= Number(rule.value);
                    }
                };

                /**
                 * Validates if number of digits matches
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.digits = function (el, rule) {
                    if (!el.val()) {
                        return true;
                    }
                    var val = window.ff_helper.numericVal(el);
                    val = val.toString();

                    if (!rule.value || !val.length) {
                        return true;
                    }

                    return this.numeric(el, rule) && val.length == rule.value;
                };

                this.max_file_size = function () {
                    return true;
                };

                this.max_file_count = function () {
                    return true;
                };

                this.allowed_file_types = function () {
                    return true;
                };

                this.allowed_image_types = function () {
                    return true;
                };

                /**
                 * Validates for force failed
                 *
                 * @return true
                 */
                this.force_failed = function () {
                    return false;
                };

                /**
                 * Handle valid_phone_number rule (check valid phone)
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.valid_phone_number = function (el, rule) {
                    var val = el.val();
                    if (!val) {
                        return true;
                    }

                    if (!el || !el[0]) {
                        return;
                    }

                    let iti;
                    if (typeof window.intlTelInputGlobals !== 'undefined') {
                        iti = window.intlTelInputGlobals.getInstance(el[0]);
                    } else {
                        iti = el.data('iti');
                    }

                    if (!iti) {
                        return true;
                    }

                    if (el.hasClass('ff_el_with_extended_validation')) {
                        let isValid;
                        if ('yes' === el.data('strict_validation') && typeof iti.isValidNumberPrecise === 'function') {
                            isValid = iti.isValidNumberPrecise();
                        } else {
                            isValid = iti.isValidNumber();
                        }
                        if (isValid) {
                            el.val(iti.getNumber());
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        let selectedCountry = iti.getSelectedCountryData();
                        let inputNumber = el.val();
                        if (!el.attr('data-original_val') && inputNumber) {
                            if (selectedCountry && selectedCountry.dialCode) {
                                el.val('+' + selectedCountry.dialCode + inputNumber);
                                el.attr('data-original_val', inputNumber);
                            }
                        }
                    }

                    return true;
                }
            }();
        };

        var $allForms = $('form.frm-fluent-form');

        function initSingleForm($theForm) {
            var formInstance = fluentFormApp($theForm);
            if (formInstance) {
                formInstance.initFormHandlers();
                formInstance.initTriggers();
            } else {
                // If form instance is not loaded yet. We are looping into it
                var counter = 0;
                var i = setInterval(function () {
                    formInstance = fluentFormApp($theForm);
                    if (formInstance) {
                        clearInterval(i);
                        formInstance.initFormHandlers();
                        formInstance.initTriggers();
                    }
                    counter++;
                    if (counter > 10) {
                        clearInterval(i);
                        console.log('Form could not be loaded');
                    }
                }, 1000);
            }
        }

        $.each($allForms, function (formIndex, formItem) {
            /**
             * Current form
             * @type jQuery object
             */
            initSingleForm($(formItem));
        });

        $(document).on('ff_reinit', function (e, formItem) {
            var $theForm = $(formItem);

            const formInstance = fluentFormApp($theForm);
            if (!formInstance) {
                return false;
            }
            formInstance.reinitExtras();

            initSingleForm($theForm);
            fluentFormCommonActions.init();
            $theForm.attr('data-ff_reinit', 'yes');
            window.fluentFormBridge.emitEvent('ff_reinit', {
                form: $theForm[0],
                config: formInstance.config || null
            }, document, [$theForm]);
        });

        fluentFormCommonActions.init();

        // Choices.js dropdown handling
        function initChoicesDropdownHandling() {
            // Only target elements that actually have Choices.js
            $('.ff_has_multi_select').each(function () {
                const choicesInstance = $(this).data('choicesjs');
                if (!choicesInstance || !choicesInstance.passedElement) return;

                // Use Choices.js built-in events instead of global listeners
                choicesInstance.passedElement.element.addEventListener('showDropdown', function () {
                    const choicesContainer = this.closest('.choices');
                    if (!choicesContainer) return;

                    const dropdown = choicesContainer.querySelector('.choices__list--dropdown');
                    if (!dropdown) return;

                    // Apply dropdown styles
                    dropdown.style.maxHeight = '300px';
                    dropdown.style.overflowY = 'auto';

                    // Find and style the scrollable list
                    const scrollableList =
                        dropdown.querySelector('.choices__list[role="listbox"]') ||
                        dropdown.querySelector('.choices__list:not(.choices__list--dropdown)');
                    if (scrollableList) {
                        scrollableList.style.maxHeight = '280px';
                        scrollableList.style.overflowY = 'auto';
                        scrollableList.style.webkitOverflowScrolling = 'touch';
                        scrollableList.style.touchAction = 'pan-y';
                    }
                }, { passive: true });

                const choicesContainer = choicesInstance.passedElement.element.closest('.choices');
                if (choicesContainer) {
                    choicesContainer.addEventListener('focus', function(e) {
                        if (!choicesContainer.classList.contains('is-open')) {
                            choicesInstance.showDropdown();
                        }
                    }, true);

                    choicesContainer.addEventListener('keydown', function(e) {
                        if (e.key === 'Tab' && choicesContainer.classList.contains('is-open')) {
                            choicesInstance.hideDropdown();
                        }
                    });
                }
            });
        }

        // Initialize with proper timing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(initChoicesDropdownHandling, 100);
            });
        } else {
            setTimeout(initChoicesDropdownHandling, 100);
        }
    })(window.fluentFormVars, jQuery);

jQuery('.fluentform').on('submit', '.ff-form-loading', function (e) {
        e.preventDefault();
        jQuery(this).parent().find('.ff_msg_temp').remove();
        jQuery('<div/>', {
            'class': 'error text-danger ff_msg_temp'
        })
            .html(window.fluentform_submission_messages_global?.javascript_handler_failed || 'Javascript handler could not be loaded. Form submission has been failed. Reload the page and try again')
            .insertAfter(jQuery(this));
    });
});
})();
