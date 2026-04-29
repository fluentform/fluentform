function resolveSliderArguments(jqueryOrFormReference, formReferenceOrVars, fluentFormVars, formSelector) {
    const hasLegacySignature = typeof jqueryOrFormReference === 'function';

    if (hasLegacySignature) {
        return {
            jquery: jqueryOrFormReference,
            formReference: formReferenceOrVars,
            fluentFormVars,
            formSelector
        };
    }

    return {
        jquery: typeof window.jQuery === 'function' ? window.jQuery : null,
        formReference: jqueryOrFormReference,
        fluentFormVars: formReferenceOrVars,
        formSelector: fluentFormVars
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

export default function (jqueryOrFormReference, formReferenceOrVars, fluentFormVars, formSelector) {
    const resolvedArguments = resolveSliderArguments(
        jqueryOrFormReference,
        formReferenceOrVars,
        fluentFormVars,
        formSelector
    );

    return new FluentFormSlider(
        resolvedArguments.jquery,
        resolvedArguments.formReference,
        resolvedArguments.fluentFormVars,
        resolvedArguments.formSelector
    ).getPublicAPI();
}

class FluentFormSlider {
    /**
     * Constructor initializes all properties and sets up the stepper
     * @param {object} $ - jQuery instance
     * @param {object} $theForm - jQuery form element
     * @param {object} fluentFormVars - Global variables for the form
     * @param {string} formSelector - CSS selector for the form
     */
    constructor($, formReference, fluentFormVars, formSelector) {
        // Instance properties
        this.$ = $;
        this.formElement = resolveFormElement(formReference);
        this.$theForm = this.$ && this.formElement ? this.$(this.formElement) : null;
        this.fluentFormVars = fluentFormVars;
        this.formSelector = formSelector;
        this.activeStep = 0;
        this.isRtl = !!window.fluentFormVars.is_rtl;
        this.isPopulatingStepData = false;
        this.isInitialLoad = true;

        // Set up animation duration
        this.fluentFormVars.stepAnimationDuration = parseInt(this.fluentFormVars.stepAnimationDuration);

        // Set up step persistence
        this.stepPersistency = this.getStepContainer()?.getAttribute('data-enable_step_data_persistency') === 'yes';
        this.stepResume = false;

        if (this.stepPersistency) {
            this.stepResume = this.getStepContainer()?.getAttribute('data-enable_step_page_resume') === 'yes';
        }
    }

    getFormElement() {
        return this.formElement;
    }

    getJqueryForm() {
        if (this.$theForm) {
            return this.$theForm;
        }

        if (this.$ && this.formElement) {
            this.$theForm = this.$(this.formElement);
            return this.$theForm;
        }

        if (typeof window.jQuery === 'function' && this.formElement) {
            this.$ = window.jQuery;
            this.$theForm = window.jQuery(this.formElement);
            return this.$theForm;
        }

        return null;
    }

    query(selector) {
        return this.formElement ? this.formElement.querySelector(selector) : null;
    }

    queryAll(selector) {
        return this.formElement ? Array.from(this.formElement.querySelectorAll(selector)) : [];
    }

    getStepContainer() {
        return this.query('.ff-step-container');
    }

    getStepElements() {
        return this.queryAll('.fluentform-step');
    }

    getStepTitleElements() {
        return this.queryAll('.ff-step-titles li');
    }

    getProgressTitleElements() {
        return this.queryAll('.ff-el-progress-title li');
    }

    getActiveStepElement() {
        return this.query('.fluentform-step.active');
    }

    getBridge() {
        return window.fluentFormBridge;
    }

    emitBridgeEvent(eventName, detail, targetElement, jqueryArguments) {
        if (this.getBridge() && typeof this.getBridge().emitEvent === 'function') {
            this.getBridge().emitEvent(eventName, detail, targetElement, jqueryArguments);
        }
    }

    getLegacyFormReference() {
        return this.getJqueryForm() || this.formElement;
    }

    isConditionallyExcluded(element) {
        return !!(element && element.closest('.has-conditions.ff_excluded'));
    }

    getStepFields(stepElement) {
        if (!stepElement) {
            return [];
        }

        return Array.from(stepElement.querySelectorAll('input, select, textarea')).filter((element) => {
            if (element.disabled) {
                return false;
            }

            if (element.type === 'button' || element.type === 'submit' || element.type === 'reset') {
                return false;
            }

            return !this.isConditionallyExcluded(element);
        });
    }

    /**
     * Get the public API for this class
     */
    getPublicAPI() {
        return {
            init: this.init.bind(this),
            updateSlider: this.updateSlider.bind(this),
            populateFormDataAndSetActiveStep: this.populateFormDataAndSetActiveStep.bind(this)
        };
    }

    /**
     * Initialize the form stepper
     */
    init() {
        this.initFormWithSavedState();
        this.removePrevFromFirstStep();
        this.initStepSlider();
        this.maybeAutoSlider();
    }

    /**
     * Remove prev button from first step
     */
    removePrevFromFirstStep() {
        const firstStep = this.getStepElements()[0];
        if (!firstStep) {
            return;
        }

        const prevNavigator = firstStep.querySelector('.step-nav [data-action="prev"]');
        if (prevNavigator) {
            prevNavigator.remove();
        }
    }

    /**
     * Get the form instance
     * @return {object} Form instance
     */
    getFormInstance() {
        return window.fluentFormApp(this.formElement);
    }

    /**
     * Initialize form with saved state if step persistence is enabled
     */
    initFormWithSavedState() {
        if (!this.stepPersistency) return;

        const requestUrl = new URL(this.fluentFormVars.ajaxUrl, window.location.origin);
        requestUrl.search = new URLSearchParams({
            form_id: this.formElement?.dataset.form_id || '',
            action: 'fluentform_step_form_get_data',
            nonce: this.fluentFormVars?.nonce || '',
            hash: this.fluentFormVars?.hash || ''
        }).toString();

        fetch(requestUrl.toString(), {
            credentials: 'same-origin'
        })
            .then((response) => response.json())
            .then((data) => {
                if (data) {
                    this.populateFormDataAndSetActiveStep(data);
                }
            })
            .catch(() => {});
    }

    /**
     * Populate form data and set active step
     * @param {object} data - Form data and step information
     */
    populateFormDataAndSetActiveStep({response, step_completed}) {
        const $ = this.$;
        let choiceJsInputs = [];
        const self = this;

        this.$theForm.data('ff_restoring_draft_state', true);
        this.$theForm.data('ff_restored_draft_state', true);

        $.each(response, (key, value) => {
            if (!value) return;
            let type = Object.prototype.toString.call(value);

            if (type === '[object Object]') {
                let $el = this.$theForm.find(`[data-name=${key}]`);

                if ($el.length && $el.attr('data-type') === 'tabular-element') {
                    // Tabular Grid
                    jQuery.each(value, (row, columns) => {
                        // Limit to current form
                        let $checkboxes = this.$theForm.find(`[name="${key}[${row}]\\[\\]"]`);
                        if (!$checkboxes.length) {
                            $checkboxes = this.$theForm.find(`[name="${key}[${row}]"]`);
                        }
                        $.each($checkboxes, (i, cbox) => {
                            let $val = $(cbox).val();
                            if ($.inArray($val, columns) !== -1 || $val === columns) {
                                $(cbox).prop('checked', true).change();
                            }
                        });
                    });
                } else if ($el.attr('data-type') === 'chained-select') {
                    // Chained Select
                    let data = {
                        meta_key: $el.find('select:first').attr('data-meta_key'),
                        form_id: $el.closest('form').attr('data-form_id'),
                        action: 'fluentform_get_chained_select_options',
                        'filter_options': 'all',
                        'keys': value
                    };
                    $.getJSON(this.fluentFormVars.ajaxUrl, data).then(response => {
                        $.each(response, (key, options) => {
                            let $select = $el.find(`select[data-key='${key}']`);

                            if ($select.attr('data-index') != 0) {
                                $.each(options, (k, val) => {
                                    $select.append(
                                        $('<option />', {value: val, text: val})
                                    );
                                });
                            }

                            $select.attr('disabled', false).val(value[key]);
                        });
                    });
                } else {
                    $.each(value, (k, v) => {
                        this.$theForm.find(`[name="${key}[${k}]"]`).val(v).change();
                    });
                }
            } else if (type === '[object Array]') {
                // Limit to current form
                let $el = this.$theForm.find(`[name=${key}]`);
                $el = $el.length ? $el : this.$theForm.find(`[data-name=${key}]`);
                $el = $el.length ? $el : this.$theForm.find(`[name=${key}\\[\\]]`);

                if ($el.attr('type') === 'file') {
                    this.addFilesToElement($el, value);
                } else if ($el.prop('multiple')) {
                    if ($.isFunction(window.Choices)) {
                        let choiceJs = $el.data('choicesjs');

                        if (choiceJs) {
                            choiceJsInputs.push({
                                handler: choiceJs,
                                values: value
                            });
                        }
                    } else {
                        $el.val(value).change();
                    }
                } else if ($el.attr('data-type') === 'repeater_field') {
                    // Repeater Field
                    let $tbody = $el.find('tbody');
                    let elName = $el.attr('data-name');

                    $.each(value, (index, arr) => {
                        if (index == 0) {
                            $tbody.find('tr:first .ff-el-form-control').each((i, el) => {
                                $(el).val(arr[i]).change();
                            });
                            return;
                        }

                        let $tr = $tbody.find('tr:last').clone().appendTo($tbody);
                        $tr.find('.ff-el-form-control').each((i, el) => {
                            let id = 'ffrpt-' + (new Date()).getTime() + i;
                            $(el).val(arr[i]);
                            $(el).attr({
                                id: id,
                                name: `${elName}[${index}][]`,
                                value: arr[i]
                            }).change();
                        });
                    });
                } else if ($el.attr('data-type') === 'repeater_container') {
                    // Repeater container Field
                    $.each(value, (index, arr) => {
                        if (index === 0) {
                            // Update first row
                            $el.find('.ff_repeater_cont_row:first .ff-el-form-control').each((i, el) => {
                                $(el).val(arr[i]).change();
                            });
                            return;
                        }

                        // Clone the first row for additional rows
                        let $firstRow = $el.find('.ff_repeater_cont_row:first');
                        let $freshCopy = $firstRow.clone();

                        $freshCopy.find('.ff_repeater_cell').each(function (i, cell) {
                            let el = $(this).find('.ff-el-form-control:last-child');
                            let newId = 'ffrpt-' + (new Date()).getTime() + '_' + index + '_' + i;
                            let itemProp = {
                                value: arr[i] || '',
                                id: newId
                            };
                            el.prop(itemProp);

                            // Update the 'for' attribute of the label
                            $(this).find('label').attr('for', newId);
                        });

                        $freshCopy.insertAfter($el.find('.ff_repeater_cont_row:last'));
                    });

                    // Fix the names for all rows
                    this.$theForm.trigger('repeater-container-names-update', [$el]);
                    $el.trigger('repeat_change');
                } else {
                    // Checkbox Groups
                    $el.each((i, $elem) => {
                        if ($.inArray($($elem).val(), value) !== -1) {
                            $($elem).prop('checked', true).change();
                        }
                    });
                }
            } else {

                let $el = this.$theForm.find(`[name=${key}]`);

                if ($el.hasClass('fluentform-post-content')) {
                    if (window.wp && window.wp.editor) {
                        let editorId = $el.attr('id');
                        window.tinymce.get(editorId).setContent(value);
                    }
                }

                // if date field with flatpickr has advanced config altInput set to true
                if (typeof flatpickr !== 'undefined') {
                    if ($el.prop('_flatpickr')) {
                        const fpInstance = $el.prop('_flatpickr');
                        if (fpInstance) {
                            if (fpInstance.config.altInput) {
                                fpInstance.setDate(value, true);
                            } else {
                                $el.val(value).trigger('change');
                            }
                        }
                    }
                }

                if ($el.prop('type') === 'radio' || $el.prop('type') === 'checkbox') {

                    $(`[name=${key}][value="${value}"]`).prop('checked', true).change();
                    this.$theForm.find(`[name=${key}][value="${value}"]`).prop('checked', true).change();

                    if ($el.closest('.ff-el-group').find('.ff-el-ratings').length) {
                        this.$theForm.find(`[name=${key}][value="${value}"]`).closest('label').trigger('mouseenter');
                    }

                } else {
                    if ($el.hasClass('ff_has_multi_select') && $el.data('choicesjs')) {
                        $el.data('choicesjs').removeActiveItems(value);
                        $el.data('choicesjs').setChoiceByValue(value);
                    }

                    let $canvas = $el.closest('.ff-el-group').find('.fluentform-signature-pad');
                    if ($canvas.length) {
                        let canvas = $canvas[0];
                        let ctx = canvas.getContext('2d');
                        let img = new Image();
                        img.src = value;
                        img.onload = function () {
                            ctx.drawImage(img, 0, 0);
                        }
                    }
                    $el.val(value).change();
                }
            }
        });

        // populate ChoiceJs Values separately as it breaks the loop
        if (choiceJsInputs.length > 0) {
            for (let i = 0; i < choiceJsInputs.length; i++) {
                const handler = choiceJsInputs[i].handler;
                const values = choiceJsInputs[i].values;
                // First set the value
                handler.setValue(values);
                // Then trigger change on the original element
                const element = handler.passedElement?.element;
                if (element) {
                    $(element).trigger('change');
                }
            }
        }

        this.$theForm.data('ff_restoring_draft_state', false);

        this.isPopulatingStepData = true;
        const animDuration = this.fluentFormVars.stepAnimationDuration;
        if (this.stepResume) {
            this.updateSlider(step_completed, animDuration, true)
                .then(() => {
                    this.handleFocus(animDuration);
                })
                .catch(error => {
                    console.error("An error occurred during the slider update:", error);
                });
        }

        this.isPopulatingStepData = false;
    }

    /**
     * Register event handlers for form steps slider initialization
     */
    initStepSlider() {
        const formSteps = this.getStepElements();
        const totalSteps = formSteps.length;
        const stepTitles = this.getStepTitleElements();

        // Pre-skip steps that are fully hidden by conditions on initial load to avoid flicker
        if (!window.ff_disable_auto_step) {
            let candidateStepIndex = this.activeStep;
            let stepSkipSafetyCounter = 0;
            while (candidateStepIndex < totalSteps && this.isStepAllFieldsHidden(formSteps[candidateStepIndex]) && stepSkipSafetyCounter < totalSteps) {
                candidateStepIndex++;
                stepSkipSafetyCounter++;
            }
            if (candidateStepIndex !== this.activeStep && candidateStepIndex < totalSteps) {
                this.activeStep = candidateStepIndex;
            }
        }

        // Use display:none/block and hide all steps initially
        formSteps.forEach((stepElement) => {
            stepElement.style.display = 'none';
            stepElement.setAttribute('role', 'group');
            stepElement.setAttribute('aria-hidden', 'true');
            stepElement.classList.remove('active');
        });

        // Show the computed first step
        const activeStepElement = formSteps[this.activeStep];
        if (activeStepElement) {
            activeStepElement.style.display = 'block';
            activeStepElement.setAttribute('aria-hidden', 'false');
            activeStepElement.classList.add('active');
        }

        stepTitles.forEach((stepTitle, index) => {
            stepTitle.classList.toggle('active', index === this.activeStep);
        });

        const firstStep = formSteps[0];
        if (firstStep && firstStep.classList.contains('active')) {
            firstStep.querySelectorAll('button[data-action="next"]').forEach((buttonElement) => {
                buttonElement.style.visibility = 'visible';
            });
        }

        // submit button should only be printed on last step
        const submitButtons = this.queryAll('button[type="submit"]');
        if (formSteps.length && !(formSteps[formSteps.length - 1] && formSteps[formSteps.length - 1].classList.contains('active'))) {
            submitButtons.forEach((buttonElement) => {
                buttonElement.style.visibility = 'hidden';
            });
        }

        this.stepProgressBarHandle({activeStep: this.activeStep, totalSteps});

        this.registerStepNavigators(this.fluentFormVars.stepAnimationDuration);

        this.registerClickableStepNav(stepTitles, formSteps);
    }

    /**
     * Register clickable step navigation
     * @param {object} stepTitlesNavs - Step title elements
     * @param {object} formSteps - Form step elements
     */
    registerClickableStepNav(stepTitlesNavs, formSteps) {
        if (stepTitlesNavs.length === 0) {
            return;
        }

        // Add this line to assign step numbers to each title
        stepTitlesNavs.forEach((stepTitle, index) => {
            stepTitle.setAttribute('data-step-number', index);
            stepTitle.setAttribute('role', 'button');
            stepTitle.setAttribute('tabindex', '0');
            stepTitle.setAttribute('aria-label', 'Go to step ' + (index + 1));
            stepTitle.style.cursor = 'pointer';
        });

        if (this.clickableStepNavigationHandler) {
            this.formElement.removeEventListener('click', this.clickableStepNavigationHandler);
            this.formElement.removeEventListener('keydown', this.clickableStepNavigationHandler);
        }

        this.clickableStepNavigationHandler = (event) => {
            const stepTitle = event.target.closest('.ff-step-titles li');
            if (!stepTitle || !this.formElement.contains(stepTitle)) {
                return;
            }

            if (event.type === 'keydown' && !(event.key === 'Enter' || event.key === ' ' || event.keyCode === 13 || event.keyCode === 32)) {
                return;
            }

            if (event.type === 'keydown') {
                event.preventDefault();
            }

            const formInstance = this.getFormInstance();
            let currentStep = 0;
            const animDuration = this.fluentFormVars.stepAnimationDuration;

            try {
                const targetStep = Number(stepTitle.getAttribute('data-step-number'));
                if (Number.isNaN(targetStep)) {
                    return;
                }

                formSteps.forEach((stepElement, index) => {
                    currentStep = index;
                    if (index < targetStep) {
                        const elements = this.getStepFields(stepElement);
                        if (elements.length) {
                            formInstance.validate(elements);
                        }
                    }
                });

                this.updateSlider(targetStep, animDuration, true)
                    .then(() => {
                        this.handleFocus(animDuration);
                    })
                    .catch((error) => {
                        console.error('An error occurred during the slider update:', error);
                    });
            } catch (error) {
                if (!(error instanceof window.ffValidationError)) {
                    throw error;
                }

                this.updateSlider(currentStep, animDuration, true)
                    .then(() => {
                        this.handleFocus(animDuration);
                    })
                    .catch((updateError) => {
                        console.error('An error occurred during the slider update:', updateError);
                    });

                formInstance.showErrorMessages(error.messages);
                formInstance.scrollToFirstError(350);
            }
        };

        this.formElement.addEventListener('click', this.clickableStepNavigationHandler);
        this.formElement.addEventListener('keydown', this.clickableStepNavigationHandler);
    }

    /**
     * Action occurs on step change/form load
     * @param {object} stepData - Step data with activeStep and totalSteps
     */
    stepProgressBarHandle(stepData) {
        if (!this.query('.ff-el-progress')) {
            return;
        }

        const {totalSteps, activeStep} = stepData;
        const completeness = (100 / totalSteps * (activeStep + 1));
        const stepTitles = this.getProgressTitleElements();
        const progressBar = this.query('.ff-step-header .ff-el-progress-bar');
        const progressSpan = progressBar ? progressBar.querySelector('span') : null;

        if (progressBar) {
            progressBar.style.transition = 'width 0.3s ease-in-out';
            progressBar.style.width = completeness + '%';
        }

        if (progressSpan) {
            progressSpan.textContent = completeness ? parseInt(completeness) + '%' : '';
        }

        let stepText = this.fluentFormVars.step_text;
        const currentStepTitle = stepTitles[activeStep] ? stepTitles[activeStep].textContent : '';
        stepText = stepText
            .replace('%activeStep%', activeStep + 1)
            .replace('%totalStep%', totalSteps)
            .replace('%stepTitle%', currentStepTitle);

        const progressStatus = this.query('.ff-el-progress-status');
        if (progressStatus) {
            progressStatus.innerHTML = stepText;
            progressStatus.setAttribute('aria-live', 'polite');
        }

        stepTitles.forEach((stepTitle, index) => {
            stepTitle.style.display = index === activeStep ? 'inline' : 'none';
        });
    }

        /**
         * Determine if a step has all fields conditionally hidden
         * Also Handles nested containers (e.g., ff-t-container, ff-column-container) that may carry ff_excluded
         * Eligible inputs are those inside a field group and not hidden by ff_excluded on self or any ancestor
         * @param {object} $step - jQuery step element
         * @return {boolean}
         *
         */
        //@Todo Check thi
        isStepAllFieldsHidden(stepElement) {
            if (!stepElement) {
                return false;
            }

            const groups = Array.from(stepElement.querySelectorAll('.ff-el-group')).filter((groupElement) => {
                return !groupElement.classList.contains('ff-custom_html');
            });

            if (groups.length === 0) {
                return false;
            }

            // If the step has field groups, don't skip it - let conditional logic handle visibility
            return false;
        }

        /**
         * Animate the progress bar to the target step and resolve when transition completes
         * The progress bar's width transition is timed to match the content animation for visual sync.
         * @param {number} activeStep - zero based index (current destination step)
         * @param {number} totalSteps - total count of steps used for completeness calculation
         * @param {number} durationMs - transition duration to sync with content animation
         * @return {Promise}
         */
        animateProgressToStep(activeStep, totalSteps, durationMs) {
            const progressBar = this.query('.ff-step-header .ff-el-progress-bar');
            if (!progressBar || !totalSteps) {
                return Promise.resolve();
            }

            const completeness = (100 / totalSteps * (activeStep + 1));

            if (durationMs && durationMs > 0) {
                progressBar.style.transition = `width ${durationMs}ms ease-in-out`;
            } else {
                progressBar.style.transition = 'none';
            }

            progressBar.offsetHeight;

            progressBar.style.width = completeness + '%';

            return new Promise(resolve => {
                let resolved = false;
                const safety = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                }, (durationMs || 0) + 120);

                const onEnd = () => {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(safety);
                        resolve();
                    }
                };

                progressBar.addEventListener('transitionend', onEnd, { once: true });
            });
        }


    /**
     * Register event handlers for form steps to move forward or backward
     * @param {number} animDuration - Animation duration in milliseconds
     */
    registerStepNavigators(animDuration) {
        this.handleFocus(animDuration);
        if (this.stepNavigationHandler) {
            this.formElement.removeEventListener('click', this.stepNavigationHandler);
        }

        this.stepNavigationHandler = (event) => {
            const navigationControl = event.target.closest('.fluentform-step .step-nav button, .fluentform-step .step-nav img');
            if (!navigationControl || !this.formElement.contains(navigationControl)) {
                return;
            }

            const buttonAction = navigationControl.getAttribute('data-action');
            const currentStep = navigationControl.closest('.fluentform-step');
            const formInstance = this.getFormInstance();
            let actionType = 'next';

            if (buttonAction === 'next') {
                try {
                    const stepFields = this.getStepFields(currentStep);
                    if (stepFields.length) {
                        formInstance.validate(stepFields);
                    }
                    this.activeStep++;
                } catch (error) {
                    if (!(error instanceof window.ffValidationError)) {
                        throw error;
                    }

                    formInstance.showErrorMessages(error.messages);
                    formInstance.scrollToFirstError(350);
                    return;
                }

                this.emitBridgeEvent(
                    'ff_to_next_page',
                    { form: this.formElement, step: this.activeStep },
                    this.formElement,
                    [this.activeStep]
                );
                this.emitBridgeEvent(
                    'ff_to_next_page',
                    { form: this.formElement, step: this.activeStep },
                    document,
                    [{ step: this.activeStep, form: this.getLegacyFormReference() }]
                );

                const formSteps = this.getStepElements();
                const activeStepElement = formSteps[this.activeStep];
                this.emitBridgeEvent(
                    'ff_render_dynamic_smartcodes',
                    activeStepElement,
                    this.formElement,
                    [this.$ ? this.$(activeStepElement) : activeStepElement]
                );
            } else {
                this.activeStep--;
                actionType = 'prev';

                this.emitBridgeEvent(
                    'ff_to_prev_page',
                    { form: this.formElement, step: this.activeStep },
                    this.formElement,
                    [this.activeStep]
                );
                this.emitBridgeEvent(
                    'ff_to_prev_page',
                    { form: this.formElement, step: this.activeStep },
                    document,
                    [{ step: this.activeStep, form: this.getLegacyFormReference() }]
                );
            }

            const autoScroll = this.getStepContainer()?.getAttribute('data-disable_auto_focus') !== 'yes';

            this.updateSlider(this.activeStep, animDuration, autoScroll, actionType)
                .then(() => {
                    this.handleFocus(animDuration);
                })
                .catch((error) => {
                    console.error('An error occurred during the slider update:', error);
                });
        };

        this.formElement.addEventListener('click', this.stepNavigationHandler);
    }

    /**
     * Update slider position in multistep form
     * @param {number} goBackToStep - Step to go to
     * @param {number} animDuration - Animation duration in milliseconds
     * @param {boolean} isScrollTop - Whether to scroll to top after animation
     * @param {string} actionType - Action type ('next' or 'prev')
     * @return {Promise} Promise that resolves when animation is complete
     */
    updateSlider(goBackToStep, animDuration, isScrollTop = true, actionType = 'next') {
        return new Promise((resolve) => {
            const errorContainer = document.querySelector('div' + this.formSelector + '_errors');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }

            this.activeStep = goBackToStep;

            const stepTitles = this.getStepTitleElements();
            const formSteps = this.getStepElements();
            const totalSteps = formSteps.length;

            // Pre-skip steps that are fully hidden due to conditions before making any visible change
            if (!window.ff_disable_auto_step && totalSteps) {
                // Determine direction by comparing desired step with current DOM active index
                const currentDomActiveIndex = formSteps.findIndex((stepElement) => stepElement.classList.contains('active'));
                const isNavigatingBackward = actionType === 'prev' || (currentDomActiveIndex > -1 && this.activeStep < currentDomActiveIndex);

                if (isNavigatingBackward) {
                    // Walk backwards until a non-empty step is found
                    while (this.activeStep > 0 && this.isStepAllFieldsHidden(formSteps[this.activeStep])) {
                        this.activeStep--;
                    }
                } else {
                    // Walk forward until a non-empty step is found
                    while (this.activeStep < totalSteps - 1 && this.isStepAllFieldsHidden(formSteps[this.activeStep])) {
                        this.activeStep++;
                    }
                }
            }

            formSteps.forEach((stepElement) => {
                stepElement.style.display = 'none';
                stepElement.classList.remove('active');
                stepElement.setAttribute('aria-hidden', 'true');
            });

            const activeStepElement = formSteps[this.activeStep];
            if (activeStepElement) {
                activeStepElement.style.display = 'block';
                activeStepElement.classList.add('active');
                activeStepElement.setAttribute('aria-hidden', 'false');
            }

            // Change step title
            stepTitles.forEach((stepTitle) => {
                stepTitle.classList.remove('ff_active', 'ff_completed');
            });
            [...Array(this.activeStep).keys()].forEach((stepIndex) => {
                if (stepTitles[stepIndex]) {
                    stepTitles[stepIndex].classList.add('ff_completed');
                }
            });
            if (stepTitles[this.activeStep]) {
                stepTitles[this.activeStep].classList.add('ff_active');
            }

            const scrollTop = function () {
                if (window.ff_disable_step_scroll) {
                    return;
                }

                const scrollElement = this.query('.ff_step_start');
                if (!scrollElement) {
                    return;
                }
                let formTop;

                if (window.ff_scroll_top_offset) {
                    formTop = window.ff_scroll_top_offset;
                } else {
                    formTop = scrollElement.getBoundingClientRect().top + window.scrollY - 100;
                }

                const isInViewport = function (element) {
                    const rect = element.getBoundingClientRect();
                    const elementTop = rect.top;
                    const elementBottom = rect.bottom;

                    const viewportTop = 0;
                    const viewportBottom = window.innerHeight;

                    return elementBottom > viewportTop && elementTop < viewportBottom;
                };

                const isVisible = isInViewport(scrollElement);

                if (!isVisible || window.ff_force_scroll) {
                    window.scrollTo({
                        top: formTop,
                        behavior: 'smooth'
                    });
                }
            }.bind(this);

            const animationType = this.getStepContainer()?.dataset.animation_type || 'none';

            // Get the current and next step elements
            if (activeStepElement) {
                activeStepElement.querySelectorAll('.step-nav button, .step-nav img').forEach((element) => {
                    element.style.visibility = 'hidden';
                });
            }

            // Prepare synchronized progress animation
            // Alias totalSteps just for separation of concern when computing completeness for the progress bar
            const completenessTotalSteps = totalSteps;

            // For 'none' animation type, use animDuration but ensure minimum 50ms for fast skipping
            let progressDuration;
            if (animationType === 'none') {
                if (animDuration === 0) {
                    progressDuration = 0;
                } else if (animDuration < 50) {
                    progressDuration = 50;
                } else if (animDuration < 200) {
                    progressDuration = animDuration;
                } else {
                    progressDuration = window.ffTransitionTimeOut || 500;
                }
            } else {
                progressDuration = animDuration;
            }

            const progressPromise = this.animateProgressToStep(this.activeStep, completenessTotalSteps, progressDuration);

            const completeStepChange = function () {
                let isFormReset = goBackToStep === 0 && !isScrollTop;
                let isFormSubmitting = this.formElement.classList.contains('ff_submitting');

                // Fire ajax request to persist the step state/data
                if (this.stepPersistency && !this.isPopulatingStepData && !isFormReset && !isFormSubmitting) {
                    this.saveStepData(this.formElement, this.activeStep).then(response => {
                        // console.log(response);
                    });
                }

                // Update progress bar and titles after animation completes
                this.stepProgressBarHandle({activeStep: this.activeStep, totalSteps});

                // Show submit button on last step
                this.queryAll('button[type="submit"]').forEach((buttonElement) => {
                    buttonElement.style.visibility = formSteps[formSteps.length - 1]?.classList.contains('active') ? 'visible' : 'hidden';
                });

                // Step skipping logic
                if (!window.ff_disable_auto_step) {
                    const activeStepDom = this.getActiveStepElement();
                    let childDomCounts = activeStepDom ? activeStepDom.querySelectorAll(':scope > div').length - 1 : 0;
                    let hiddenDomCounts = activeStepDom ? activeStepDom.querySelectorAll(':scope > .ff_excluded').length : 0;

                    if (activeStepDom && activeStepDom.querySelectorAll(':scope > .ff-t-container').length) {
                        childDomCounts -= activeStepDom.querySelectorAll(':scope > .ff-t-container').length;
                        childDomCounts += activeStepDom.querySelectorAll(':scope > .ff-t-container > .ff-t-cell > div').length;
                        hiddenDomCounts += activeStepDom.querySelectorAll(':scope > .ff-t-container > .ff-t-cell > .ff_excluded').length;

                        if (activeStepDom.querySelectorAll(':scope > .ff-t-container.ff_excluded').length) {
                            hiddenDomCounts -= activeStepDom.querySelectorAll(':scope > .ff-t-container.ff_excluded').length;
                            hiddenDomCounts -= activeStepDom.querySelectorAll(':scope > .ff-t-container.ff_excluded > .ff-t-cell > .ff_excluded').length;
                            hiddenDomCounts += activeStepDom.querySelectorAll(':scope > .ff-t-container.ff_excluded > .ff-t-cell > div').length;
                        }
                    }

                    if (childDomCounts === hiddenDomCounts) {
                        // Step is empty, skip to next step with faster animation
                        // This recursively calls updateSlider until a non-empty step is found
                        const nextStep = actionType === 'prev' ? this.activeStep - 1 : this.activeStep + 1;
                        if (nextStep >= 0 && nextStep < totalSteps) {
                            const nextStepAnimationType = this.getStepContainer()?.dataset.animation_type || 'none';
                            const fastAnimDuration = (nextStepAnimationType === 'none') ? 50 : 100;
                            this.updateSlider(nextStep, fastAnimDuration, isScrollTop, actionType)
                                .then(() => {
                                    resolve();
                                })
                                .catch(error => {
                                    console.error("An error occurred during step skip:", error);
                                    resolve();
                                });
                            return;
                        }
                    }
                }

                const visibleActiveStep = this.getActiveStepElement();
                if (visibleActiveStep) {
                    visibleActiveStep.querySelectorAll('.step-nav button[data-action="next"], .step-nav button[data-action="prev"], .step-nav img[data-action="next"], .step-nav img[data-action="prev"]').forEach((element) => {
                        element.style.visibility = 'visible';
                    });
                }

                resolve(); // Resolve the promise after animations, scrolling, and step skipping logic
            }.bind(this);

            let contentPromise;
            switch (animationType) {
                case 'slide':
                    // Prepare for slide animation with enhanced smoothness
                    if (activeStepElement) {
                        activeStepElement.style.display = 'block';
                        activeStepElement.style.position = 'relative';
                        activeStepElement.style.left = this.isRtl ? '-100%' : '100%';
                        activeStepElement.style.opacity = '0';
                        activeStepElement.style.transition = `all ${animDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`;
                        activeStepElement.offsetHeight;
                        activeStepElement.style.left = '0%';
                        activeStepElement.style.opacity = '1';
                    }

                    contentPromise = new Promise((res) => setTimeout(() => {
                        if (activeStepElement) {
                            activeStepElement.style.position = '';
                            activeStepElement.style.left = '';
                            activeStepElement.style.transition = '';
                        }
                        res();
                    }, animDuration + 50));
                    break;

                case 'fade':
                    // Enhanced fade animation with CSS transitions
                    if (activeStepElement) {
                        activeStepElement.style.display = 'block';
                        activeStepElement.style.opacity = '0';
                        activeStepElement.style.transition = `opacity ${animDuration}ms ease-in-out`;
                        activeStepElement.offsetHeight;
                        activeStepElement.style.opacity = '1';
                    }

                    contentPromise = new Promise((res) => setTimeout(() => {
                        if (activeStepElement) {
                            activeStepElement.style.transition = '';
                        }
                        res();
                    }, animDuration + 50));
                    break;

                case 'slide_down':
                    // Enhanced slide down with height transition
                    if (activeStepElement) {
                        activeStepElement.style.display = 'block';
                        activeStepElement.style.opacity = '0';
                        activeStepElement.style.maxHeight = '0';
                        activeStepElement.style.overflow = 'hidden';
                        activeStepElement.style.transition = `all ${animDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`;
                        activeStepElement.offsetHeight;
                        const targetHeight = activeStepElement.scrollHeight;
                        activeStepElement.style.maxHeight = targetHeight + 'px';
                        activeStepElement.style.opacity = '1';
                    }

                    contentPromise = new Promise((res) => setTimeout(() => {
                        if (activeStepElement) {
                            activeStepElement.style.maxHeight = '';
                            activeStepElement.style.overflow = '';
                            activeStepElement.style.transition = '';
                        }
                        res();
                    }, animDuration + 50));
                    break;

                case 'none':
                default:
                    const defaultDelay = window.ffTransitionTimeOut || 500;
                    let conditionalDelay;
                    if (animDuration < 50 && animDuration > 0) {
                        conditionalDelay = 50;
                    } else if (animDuration < defaultDelay) {
                        conditionalDelay = animDuration;
                    } else {
                        conditionalDelay = defaultDelay;
                    }
                    contentPromise = new Promise((res) => setTimeout(res, conditionalDelay));
                    break;
            }

            Promise.all([contentPromise, progressPromise]).then(() => {
                if (isScrollTop) {
                    scrollTop();
                }
                completeStepChange();
            });
        });
    }

    /**
     * Handle focus on elements within the active step
     * @param {number} animDuration - Animation duration in milliseconds
     */
    handleFocus(animDuration) {
        const self = this;
        let isAnimating = false;

        const getCurrentStepIndex = function () {
            return self.getStepElements().findIndex((stepElement) => stepElement.classList.contains('active'));
        }

        const focusOnStep = function (step, shouldFocus = false) {
            const autoFocusEnabled = self.getStepContainer()?.getAttribute("data-disable_auto_focus") !== "yes";

            if (!self.isInitialLoad) {
                if (!autoFocusEnabled) {
                    const focusOnStepChange = !!window.fluentFormVars?.step_change_focus;
                    if (focusOnStepChange && !window.ff_disable_step_scroll) {
                        setTimeout(() => {
                            const activeStep = self.getActiveStepElement();
                            if (activeStep) {
                                activeStep.setAttribute('tabindex', '-1');
                                activeStep.focus();
                                activeStep.removeAttribute('tabindex');
                            }
                        }, animDuration);
                    }
                } else if (!window.ff_disable_step_scroll) {
                    const focusableElements = Array.from(step.querySelectorAll('input, .ff-custom_html, select, textarea, button, a')).filter((element) => {
                        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
                    });

                    if (focusableElements.length && shouldFocus) {
                        setTimeout(() => {
                            focusableElements[0].focus();
                        }, animDuration + 50);
                    }
                }

                self.isInitialLoad = false;
            }
        }

        const handleStepChange = function () {
            isAnimating = true;
            setTimeout(() => {
                isAnimating = false;
                const activeStep = self.getActiveStepElement();
                if (activeStep) {
                    focusOnStep(activeStep, true);
                }
            }, animDuration + 50);
        }

        const setupKeyboardNavigation = function () {
            if (self.stepKeyboardHandler) {
                self.formElement.removeEventListener('keydown', self.stepKeyboardHandler);
            }

            self.stepKeyboardHandler = function (e) {
                if (isAnimating) return;

                // Only handle space key, let tab work naturally
                const isSpacePressed = e.key === " " || e.keyCode === 32;

                if (!isSpacePressed) {
                    return; // Let tab navigation work naturally
                }

                const nextButton = self.query('.fluentform-step.active .ff-btn-next');
                const prevButton = self.query('.fluentform-step.active .ff-btn-prev');

                if (document.activeElement === nextButton) {
                    e.preventDefault();
                    nextButton.click();
                    return;
                }

                if (document.activeElement === prevButton) {
                    e.preventDefault();
                    prevButton.click();
                    return;
                }
            };

            self.formElement.addEventListener('keydown', self.stepKeyboardHandler);
        }

        // Setup keyboard navigation
        setupKeyboardNavigation();

        // Handle focus after step changes, including conditional skips
        if (this.stepFocusRemover) {
            this.stepFocusRemover();
        }

        if (this.getBridge() && typeof this.getBridge().onEvent === 'function') {
            this.stepFocusRemover = this.getBridge().onEvent(this.formElement, ['ff_to_next_page', 'ff_to_prev_page'], function () {
                handleStepChange();
            });
        }

        // Only focus if autoFocus is enabled, it's not the first step, and it's not the initial load
        const autoFocusEnabled = this.getStepContainer()?.getAttribute("data-disable_auto_focus") !== "yes";
        if (autoFocusEnabled && getCurrentStepIndex() !== 0 && !this.isInitialLoad) {
            const activeStep = this.getActiveStepElement();
            if (activeStep) {
                focusOnStep(activeStep, true);
            }
        }

        this.isInitialLoad = false;
    }

    /**
     * Save step data to server via AJAX
     * @param {object} $theForm - jQuery form element
     * @param {number} activeStep - Current active step
     * @return {Promise} Ajax promise
     */
    saveStepData($theForm, activeStep) {
        const formElement = resolveFormElement($theForm) || this.formElement;
        const inputs = Array.from(formElement.querySelectorAll('input, select, textarea')).filter((element) => {
            return !this.isConditionallyExcluded(element);
        });

        const params = new URLSearchParams();

        inputs.forEach((inputElement) => {
            if (!inputElement.name || inputElement.disabled || inputElement.type === 'file') {
                return;
            }

            if (inputElement.closest('.ff_repeater_table') && inputElement.tagName === 'SELECT' && !inputElement.value) {
                return;
            }

            if ((inputElement.type === 'checkbox' || inputElement.type === 'radio') && !inputElement.checked) {
                return;
            }

            if (inputElement.tagName === 'SELECT' && inputElement.multiple) {
                Array.from(inputElement.selectedOptions).forEach((selectedOption) => {
                    params.append(inputElement.name, selectedOption.value);
                });
                return;
            }

            params.append(inputElement.name, inputElement.value);
        });

        Array.from(formElement.querySelectorAll('[type=file]')).forEach((fileInput) => {
            const fileInputName = fileInput.name + '[]';
            const uploadedItems = Array.from(
                fileInput.closest('div')?.querySelectorAll('.ff-uploaded-list .ff-upload-preview[data-src]') || []
            );

            uploadedItems.forEach((previewElement) => {
                params.append(fileInputName, previewElement.getAttribute('data-src'));
            });
        });

        const formData = {
            active_step: activeStep,
            data: params.toString(),
            form_id: formElement.dataset.form_id,
            action: 'fluentform_step_form_save_data',
            nonce: this.fluentFormVars?.nonce
        };

        return fetch(this.fluentFormVars.ajaxUrl, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: new URLSearchParams(formData).toString()
        }).then((response) => response.json());
    }

    /**
     * Auto slider for single field steps
     */
    maybeAutoSlider() {
        let autoSlider = this.getStepContainer()?.getAttribute('data-enable_auto_slider') === 'yes';
        if (!autoSlider) {
            return;
        }

        const maybeAction = (element) => {
            const activeStep = element.closest('.fluentform-step.active');
            if (!activeStep) {
                return;
            }

            let count = activeStep.querySelectorAll('.ff-el-group:not(.ff_excluded):not(.ff-custom_html)').length;
            if (count === 1) {
                let condCounts = activeStep.querySelectorAll('.ff_excluded').length;
                if (condCounts) {
                    let timeout = window.ffTransitionTimeOut || 500;
                    setTimeout(() => {
                        activeStep.querySelector('.ff-btn-next')?.click();
                    }, timeout);
                } else {
                    activeStep.querySelector('.ff-btn-next')?.click();
                }
            }
        };

        if (this.autoSliderClickHandler) {
            this.formElement.removeEventListener('click', this.autoSliderClickHandler);
        }
        if (this.autoSliderChangeHandler) {
            this.formElement.removeEventListener('change', this.autoSliderChangeHandler);
        }

        this.autoSliderClickHandler = (event) => {
            const triggerElement = event.target.closest('.ff-el-form-check-radio, .ff-el-net-label, .ff-el-ratings label');
            if (triggerElement) {
                maybeAction(triggerElement);
            }
        };

        this.autoSliderChangeHandler = (event) => {
            if (event.target.matches('select')) {
                maybeAction(event.target);
            }
        };

        this.formElement.addEventListener('click', this.autoSliderClickHandler);
        this.formElement.addEventListener('change', this.autoSliderChangeHandler);
    }

    /**
     * Add files to file upload element
     * @param {object} $el - jQuery element
     * @param {Array} fileUrls - Array of file URLs
     */
    addFilesToElement($el, fileUrls) {
        const $ = this.$;
        const self = this;

        const $uploadedList = $el.closest('.ff-el-input--content').find('.ff-uploaded-list');

        $.each(fileUrls, function (index, file) {
            file = typeof file === 'object' ? file : {url: file, data_src: file};
            const previewContainer = $('<div/>', {
                class: 'ff-upload-preview',
                'data-src': file.data_src,
                style: 'border: 1px solid rgb(111, 117, 125)'
            });
            const previewThumb = $('<div/>', {
                class: 'ff-upload-thumb'
            });
            previewThumb.append($('<div/>', {
                class: 'ff-upload-preview-img',
                style: `background-image: url('${self.getThumbnail(file.url)}');`
            }));

            const previewDetails = $('<div/>', {
                class: 'ff-upload-details'
            });


            const fileProgress = $('<span/>', {
                html: self.fluentFormVars.upload_completed_txt,
                class: 'ff-upload-progress-inline-text ff-inline-block'
            });
            let name = file.url.substring(file.url.lastIndexOf('/') + 1);
            if (name.includes('-ff-')) {
                name = name.substring(name.lastIndexOf('-ff-') + 4);
            }
            const fileName = $('<div/>', {
                class: 'ff-upload-filename',
                html: name
            });

            const progressBarInline = $(`
            <div class="ff-upload-progress-inline ff-el-progress">
                <div style="width: 100%;" class="ff-el-progress-bar"></div>
            </div>
        `);

            const removeBtn = $('<span/>', {
                'data-href': '#',
                'html': '&times;',
                'class': 'ff-upload-remove'
            });

            const fileSize = $('<div>', {
                class: 'ff-upload-filesize ff-inline-block',
                html: ''
            });

            const errorInline = $('<div>', {
                class: 'ff-upload-error',
                style: 'color:red;'
            });

            previewDetails.append(fileName, progressBarInline, fileProgress, fileSize, errorInline, removeBtn);
            previewContainer.append(previewThumb, previewDetails);

            $uploadedList.append(previewContainer);
        });

        $el.trigger('change_remaining', -fileUrls.length);
        $el.trigger('change');
    }

    /**
     * Get thumbnail for file
     * @param {string} file - File URL
     * @return {string} Thumbnail URL or data URL
     */
    getThumbnail(file) {
        if (!file) {
            return '';
        }

        const extension = file.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();

        if (['jpg', 'jpeg', 'gif', 'png'].indexOf(extension) != -1) {
            return file;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        canvas.style.zIndex = 8;
        canvas.style.position = "absolute";
        canvas.style.border = "1px solid";

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, 60, 60);
        ctx.font = "13px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(extension, 30, 30, 60);
        return canvas.toDataURL();
    }
}
