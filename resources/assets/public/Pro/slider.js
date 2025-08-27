export default function ($, $theForm, fluentFormVars, formSelector) {
    return new FluentFormSlider($, $theForm, fluentFormVars, formSelector).getPublicAPI();
}

class FluentFormSlider {
    /**
     * Constructor initializes all properties and sets up the stepper
     * @param {object} $ - jQuery instance
     * @param {object} $theForm - jQuery form element
     * @param {object} fluentFormVars - Global variables for the form
     * @param {string} formSelector - CSS selector for the form
     */
    constructor($, $theForm, fluentFormVars, formSelector) {
        // Instance properties
        this.$ = $;
        this.$theForm = $theForm;
        this.fluentFormVars = fluentFormVars;
        this.formSelector = formSelector;
        this.activeStep = 0;
        this.isRtl = !!window.fluentFormVars.is_rtl;
        this.isPopulatingStepData = false;
        this.isInitialLoad = true;

        // Set up animation duration
        this.fluentFormVars.stepAnimationDuration = parseInt(this.fluentFormVars.stepAnimationDuration);

        // Set up step persistence
        this.stepPersistency = this.$theForm.find('.ff-step-container').attr('data-enable_step_data_persistency') === 'yes';
        this.stepResume = false;

        if (this.stepPersistency) {
            this.stepResume = this.$theForm.find('.ff-step-container').attr('data-enable_step_page_resume') === 'yes';
        }
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
        this.$theForm
            .find('.fluentform-step:first')
            .find('.step-nav [data-action="prev"]')
            .remove();
    }

    /**
     * Get the form instance
     * @return {object} Form instance
     */
    getFormInstance() {
        return window.fluentFormApp(this.$theForm);
    }

    /**
     * Initialize form with saved state if step persistence is enabled
     */
    initFormWithSavedState() {
        if (!this.stepPersistency) return;

        const $ = this.$;
        const self = this;

        $(document).ready(e => {
            $.getJSON(this.fluentFormVars.ajaxUrl, {
                form_id: this.$theForm.data('form_id'),
                action: 'fluentform_step_form_get_data',
                nonce: this.fluentFormVars?.nonce,
                hash: this.fluentFormVars?.hash
            }).then(data => {
                if (data) {
                    self.populateFormDataAndSetActiveStep(data);
                }
            });
        });
    }

    /**
     * Populate form data and set active step
     * @param {object} data - Form data and step information
     */
    populateFormDataAndSetActiveStep({response, step_completed}) {
        const $ = this.$;
        let choiceJsInputs = [];
        const self = this;

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
        const $ = this.$;
        const formSteps = this.$theForm.find('.fluentform-step');
        const totalSteps = formSteps.length;
        const stepTitles = this.$theForm.find('.ff-step-titles li');

        // Pre-skip steps that are fully hidden by conditions on initial load to avoid flicker
        if (!window.ff_disable_auto_step) {
            let candidateStepIndex = this.activeStep;
            let stepSkipSafetyCounter = 0;
            while (candidateStepIndex < totalSteps && this.isStepAllFieldsHidden($(formSteps[candidateStepIndex])) && stepSkipSafetyCounter < totalSteps) {
                candidateStepIndex++;
                stepSkipSafetyCounter++;
            }
            if (candidateStepIndex !== this.activeStep && candidateStepIndex < totalSteps) {
                this.activeStep = candidateStepIndex;
            }
        }

        // Use display:none/block and hide all steps initially
        formSteps.css('display', 'none');

        // Show the computed first step
        $(formSteps[this.activeStep]).css('display', 'block');

        // Add accessibility attributes
        formSteps.attr('role', 'group');
        formSteps.attr('aria-hidden', 'true');
        $(formSteps[this.activeStep]).attr('aria-hidden', 'false');

        $(formSteps[this.activeStep]).addClass('active');
        $(stepTitles[this.activeStep]).addClass('active');

        const firstStep = formSteps.first();
        if (firstStep.hasClass('active')) {
            firstStep.find('button[data-action="next"]').css('visibility', 'visible');
        }

        // submit button should only be printed on last step
        if (formSteps.length && !formSteps.last().hasClass('active')) {
            this.$theForm.find('button[type="submit"]').css('visibility', 'hidden');
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
        const $ = this.$;
        const self = this;

        if (stepTitlesNavs.length === 0) {
            return;
        }

        // Add this line to assign step numbers to each title
        $.each(stepTitlesNavs, function (i, elm) {
            $(elm).attr('data-step-number', i);

            // Also add these for accessibility and visual indication
            $(elm).attr({
                'role': 'button',
                'tabindex': '0',
                'aria-label': 'Go to step ' + (i + 1),
                'style': 'cursor: pointer;'
            });
        });

        stepTitlesNavs.on('click keydown', function (e) {
            // Handle keyboard events
            if (e.type === 'keydown' && !(e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32)) {
                return;
            }

            if (e.type === 'keydown') {
                e.preventDefault();
            }

            let formInstance = self.getFormInstance();
            let $this = $(this);
            let currentStep = 0;
            const animDuration = self.fluentFormVars.stepAnimationDuration;

            try {
                let targetStep = $this.data('step-number');
                if (isNaN(targetStep)) {
                    return;
                }
                //validate other steps before target step before next step
                $.each(formSteps, (index, steps) => {
                    currentStep = index
                    if (index < targetStep) {
                        const elements = $(steps).find(':input').not(':button').filter(function (i, el) {
                            return !$(el).closest('.has-conditions').hasClass('ff_excluded');
                        });
                        elements.length && formInstance.validate(elements)
                    }
                });

                self.updateSlider(targetStep, animDuration, true)
                    .then(() => {
                        self.handleFocus(animDuration);
                    })
                    .catch(error => {
                        console.error("An error occurred during the slider update:", error);
                    });
            } catch (e) {
                if (!(e instanceof window.ffValidationError)) {
                    throw e;
                }
                self.updateSlider(currentStep, animDuration, true)
                    .then(() => {
                        self.handleFocus(animDuration);
                    })
                    .catch(error => {
                        console.error("An error occurred during the slider update:", error);
                    });
                formInstance.showErrorMessages(e.messages);
                formInstance.scrollToFirstError(350);
            }
        });
    }

    /**
     * Action occurs on step change/form load
     * @param {object} stepData - Step data with activeStep and totalSteps
     */
    stepProgressBarHandle(stepData) {
        const $ = this.$;

        if (this.$theForm.find('.ff-el-progress').length) {
            const {totalSteps, activeStep} = stepData;
            const completeness = (100 / totalSteps * (activeStep + 1));
            const stepTitles = this.$theForm.find('.ff-el-progress-title li');
            const progressBar = this.$theForm.find('.ff-step-header .ff-el-progress-bar');
            const span = progressBar.find('span');

            // Add smooth animation to progress bar
            progressBar.css({
                transition: 'width 0.3s ease-in-out',
                width: completeness + '%'
            });

            if (completeness) {
                progressBar.append(span.text(parseInt(completeness) + '%'))
            } else {
                span.empty();
            }

            let stepText = this.fluentFormVars.step_text;

            let stepTitle = $(stepTitles[activeStep]).text();
            stepText = stepText
                .replace('%activeStep%', activeStep + 1)
                .replace('%totalStep%', totalSteps)
                .replace('%stepTitle%', stepTitle);

            // Add ARIA live region for step announcements
            this.$theForm.find('.ff-el-progress-status')
                .html(stepText)
                .attr('aria-live', 'polite');

            stepTitles.css('display', 'none');
            $(stepTitles[activeStep]).css('display', 'inline');
        }
    }

        /**
         * Determine if a step has all fields conditionally hidden
         * Also Handles nested containers (e.g., ff-t-container, ff-column-container) that may carry ff_excluded
         * Eligible inputs are those inside a field group and not hidden by ff_excluded on self or any ancestor
         * @param {object} $step - jQuery step element
         * @return {boolean}
         */
        isStepAllFieldsHidden($step) {
            const $ = this.$;
            const $groups = $step.find('.ff-el-group').not('.ff-custom_html');
            if ($groups.length === 0) {
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
            const $ = this.$;
            const progressBar = this.$theForm.find('.ff-step-header .ff-el-progress-bar');
            if (!progressBar.length || !totalSteps) {
                return Promise.resolve();
            }

            const completeness = (100 / totalSteps * (activeStep + 1));

            if (durationMs && durationMs > 0) {
                progressBar.css({ transition: `width ${durationMs}ms ease-in-out` });
            } else {
                progressBar.css({ transition: 'none' });
            }

            if (progressBar[0]) {
                // Force reflow to ensure transition is applied
                progressBar[0].offsetHeight;
            }

            progressBar.css('width', completeness + '%');

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

                progressBar.one('transitionend webkitTransitionEnd oTransitionEnd', onEnd);
            });
        }


    /**
     * Register event handlers for form steps to move forward or backward
     * @param {number} animDuration - Animation duration in milliseconds
     */
    registerStepNavigators(animDuration) {
        const $ = this.$;
        const self = this;

        this.handleFocus(animDuration);

        $(this.formSelector).on('click', '.fluentform-step .step-nav button, .fluentform-step .step-nav img', function (e) {
            const btn = $(this).data('action');
            let actionType = 'next';
            let current = $(this).closest('.fluentform-step');
            let formInstance = self.getFormInstance();

            if (btn === 'next') {
                try {
                    const elements = current.find(':input').not(':button').filter(function (i, el) {
                        return !$(el).closest('.has-conditions').hasClass('ff_excluded');
                    });
                    elements.length && formInstance.validate(elements);
                    self.activeStep++;
                } catch (e) {
                    if (!(e instanceof window.ffValidationError)) {
                        throw e;
                    }
                    formInstance.showErrorMessages(e.messages);
                    formInstance.scrollToFirstError(350);
                    return;
                }
                self.$theForm.trigger('ff_to_next_page', self.activeStep);

                $(document).trigger('ff_to_next_page', {
                    step: self.activeStep,
                    form: self.$theForm
                });

                const formSteps = self.$theForm.find('.fluentform-step');
                self.$theForm.trigger('ff_render_dynamic_smartcodes', $(formSteps[self.activeStep]));
            } else {
                self.activeStep--;
                actionType = 'prev';
                self.$theForm.trigger('ff_to_prev_page', self.activeStep);
                $(document).trigger('ff_to_prev_page', {
                    step: self.activeStep,
                    form: self.$theForm
                });
            }

            const autoScroll = self.$theForm.find('.ff-step-container').attr('data-disable_auto_focus') != 'yes';

            self.updateSlider(self.activeStep, animDuration, autoScroll, actionType)
                .then(() => {
                    self.handleFocus(animDuration);
                })
                .catch(error => {
                    console.error("An error occurred during the slider update:", error);
                });
        });
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
        const $ = this.$;
        const self = this;

        return new Promise((resolve) => {
            $('div' + this.formSelector + '_errors').empty();
            this.activeStep = goBackToStep;

            const stepTitles = this.$theForm.find('.ff-step-titles li'),
                formSteps = this.$theForm.find('.fluentform-step'),
                totalSteps = formSteps.length;

            // Pre-skip steps that are fully hidden due to conditions before making any visible change
            if (!window.ff_disable_auto_step && totalSteps) {
                // Determine direction by comparing desired step with current DOM active index
                const currentDomActiveIndex = self.$theForm.find('.fluentform-step')
                    .index(self.$theForm.find('.fluentform-step.active'));
                const isNavigatingBackward = actionType === 'prev' || (currentDomActiveIndex > -1 && this.activeStep < currentDomActiveIndex);

                if (isNavigatingBackward) {
                    // Walk backwards until a non-empty step is found
                    while (this.activeStep > 0 && this.isStepAllFieldsHidden($(formSteps[this.activeStep]))) {
                        this.activeStep--;
                    }
                } else {
                    // Walk forward until a non-empty step is found
                    while (this.activeStep < totalSteps - 1 && this.isStepAllFieldsHidden($(formSteps[this.activeStep]))) {
                        this.activeStep++;
                    }
                }
            }

            formSteps.css('display', 'none').removeClass('active').attr('aria-hidden', 'true');
            $(formSteps[this.activeStep]).css('display', 'block').addClass('active').attr('aria-hidden', 'false');

            // Change step title
            stepTitles.removeClass('ff_active ff_completed');
            $.each([...Array(this.activeStep).keys()], (step) => {
                $($(stepTitles[step])).addClass('ff_completed');
            });
            $(stepTitles[this.activeStep]).addClass('ff_active');

            const scrollTop = function () {
                if (window.ff_disable_step_scroll) {
                    return;
                }

                const scrollElement = self.$theForm.find('.ff_step_start');
                let formTop;

                if (window.ff_scroll_top_offset) {
                    formTop = window.ff_scroll_top_offset;
                } else {
                    formTop = scrollElement.offset().top - 100;
                }

                const isInViewport = function ($el) {
                    const elementTop = $el.offset().top;
                    const elementBottom = elementTop + $el.outerHeight();

                    const viewportTop = $(window).scrollTop();
                    const viewportBottom = viewportTop + $(window).height();

                    return elementBottom > viewportTop && elementTop < viewportBottom;
                };

                const isVisible = isInViewport(scrollElement);

                if (!isVisible || window.ff_force_scroll) {
                    // Smoother scrolling
                    $('html, body').animate({
                        scrollTop: formTop
                    }, 500, 'swing');
                }
            };

            const animationType = $(formSteps[this.activeStep]).closest('.ff-step-container').data('animation_type');

            // Get the current and next step elements
            const $currentStep = $(formSteps[this.activeStep]);
            $currentStep.find('.step-nav button, .step-nav img').css('visibility', 'hidden');

            // Prepare synchronized progress animation
            // Alias totalSteps just for separation of concern when computing completeness for the progress bar
            const completenessTotalSteps = totalSteps;
            const progressPromise = (animationType === 'none')
                ? this.animateProgressToStep(this.activeStep, completenessTotalSteps, window.ffTransitionTimeOut || 500)
                : this.animateProgressToStep(this.activeStep, completenessTotalSteps, animDuration);

            const completeStepChange = function () {
                let isFormReset = goBackToStep === 0 && !isScrollTop;
                let isFormSubmitting = self.$theForm.hasClass('ff_submitting');

                // Fire ajax request to persist the step state/data
                if (self.stepPersistency && !self.isPopulatingStepData && !isFormReset && !isFormSubmitting) {
                    self.saveStepData(self.$theForm, self.activeStep).then(response => {
                        // console.log(response);
                    });
                }

                // Update progress bar and titles after animation completes
                self.stepProgressBarHandle({activeStep: self.activeStep, totalSteps});

                // Show submit button on last step
                if (formSteps.last().hasClass('active')) {
                    self.$theForm.find('button[type="submit"]').css('visibility', 'visible');
                } else {
                    self.$theForm.find('button[type="submit"]').css('visibility', 'hidden');
                }

                // Step skipping logic
                if (!window.ff_disable_auto_step) {
                    let $activeStepDom = self.$theForm.find('.fluentform-step.active');
                    let childDomCounts = self.$theForm.find('.fluentform-step.active > div').length - 1;
                    let hiddenDomCounts = self.$theForm.find('.fluentform-step.active > .ff_excluded').length;

                    if (self.$theForm.find('.fluentform-step.active > .ff-t-container').length) {
                        childDomCounts -= self.$theForm.find('.fluentform-step.active > .ff-t-container').length;
                        childDomCounts += self.$theForm.find('.fluentform-step.active > .ff-t-container > .ff-t-cell > div').length;
                        hiddenDomCounts += self.$theForm.find('.fluentform-step.active > .ff-t-container > .ff-t-cell > .ff_excluded').length;

                        if (self.$theForm.find('.fluentform-step.active > .ff-t-container.ff_excluded').length) {
                            hiddenDomCounts -= self.$theForm.find('.fluentform-step.active > .ff-t-container.ff_excluded').length;
                            hiddenDomCounts -= self.$theForm.find('.fluentform-step.active > .ff-t-container.ff_excluded > .ff-t-cell > .ff_excluded').length;
                            hiddenDomCounts += self.$theForm.find('.fluentform-step.active > .ff-t-container.ff_excluded > .ff-t-cell > div').length;
                        }
                    }

                    if (childDomCounts === hiddenDomCounts) {
                        $activeStepDom.find(`.step-nav button[data-action=${actionType}], .step-nav img[data-action=${actionType}]`).click();
                        resolve(); // Ensure that we resolve the promise here if we are skipping steps
                        return;
                    }
                }

                self.$theForm.find('.fluentform-step.active').find('.step-nav button[data-action="next"]').css('visibility', 'visible');
                self.$theForm.find('.fluentform-step.active').find('.step-nav button[data-action="prev"]').css('visibility', 'visible');
                self.$theForm.find('.fluentform-step.active').find('.step-nav img[data-action="next"]').css('visibility', 'visible');
                self.$theForm.find('.fluentform-step.active').find('.step-nav img[data-action="prev"]').css('visibility', 'visible');

                resolve(); // Resolve the promise after animations, scrolling, and step skipping logic
            };

            let contentPromise;
            switch (animationType) {
                case 'slide':
                    // Prepare for slide animation with enhanced smoothness
                    $currentStep.css({
                        display: 'block',
                        position: 'relative',
                        left: this.isRtl ? '-100%' : '100%',  // Start position outside viewport
                        opacity: 0,
                        transition: `all ${animDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)` // Smooth easing curve
                    });

                    // Force browser reflow to ensure transition works
                    $currentStep[0].offsetHeight;

                    $currentStep.css({
                        left: '0%',
                        opacity: 1
                    });

                    contentPromise = new Promise((res) => setTimeout(() => {
                        $currentStep.css({ position: '', left: '', transition: '' });
                        res();
                    }, animDuration + 50));
                    break;

                case 'fade':
                    // Enhanced fade animation with CSS transitions
                    $currentStep.css({
                        display: 'block',
                        opacity: 0,
                        transition: `opacity ${animDuration}ms ease-in-out`
                    });

                    // Force browser reflow
                    $currentStep[0].offsetHeight;

                    // Trigger fade in
                    $currentStep.css('opacity', 1);

                    contentPromise = new Promise((res) => setTimeout(() => {
                        $currentStep.css('transition', '');
                        res();
                    }, animDuration + 50));
                    break;

                case 'slide_down':
                    // Enhanced slide down with height transition
                    $currentStep.css({
                        display: 'block',
                        opacity: 0,
                        maxHeight: '0',
                        overflow: 'hidden',
                        transition: `all ${animDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
                    });

                    // Force reflow
                    $currentStep[0].offsetHeight;

                    // Get target height then apply it
                    const targetHeight = $currentStep[0].scrollHeight;
                    $currentStep.css({
                        maxHeight: targetHeight + 'px',
                        opacity: 1
                    });

                    contentPromise = new Promise((res) => setTimeout(() => {
                        $currentStep.css({ maxHeight: '', overflow: '', transition: '' });
                        res();
                    }, animDuration + 50));
                    break;

                case 'none':
                default:
                    const conditionalDelay = window.ffTransitionTimeOut || 500;
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
        const $ = this.$;
        const self = this;
        let isAnimating = false;

        const getCurrentStepIndex = function () {
            return self.$theForm.find(".fluentform-step").index(self.$theForm.find(".fluentform-step.active"));
        }

        const focusOnStep = function (step, shouldFocus = false) {
            const autoFocusEnabled = self.$theForm.find(".ff-step-container").attr("data-disable_auto_focus") != "yes";

            if (!self.isInitialLoad) {
                if (!autoFocusEnabled) {
                    const focusOnStepChange = !!window.fluentFormVars?.step_change_focus;
                    if (focusOnStepChange) {
                        setTimeout(() => {
                            $(`${self.formSelector} .fluentform-step.active`).attr("tabindex", "-1").focus().removeAttr("tabindex");
                        }, animDuration);
                    }

                    self.isInitialLoad = false;
                } else {
                    const focusableElements = step.find("input, .ff-custom_html, select, textarea, button, a").filter(":visible");

                    if (focusableElements.length && shouldFocus) {
                        setTimeout(() => {
                            focusableElements.first().focus();
                        }, animDuration + 50);
                    }

                    self.isInitialLoad = false;
                }
            }
        }

        const handleStepChange = function () {
            isAnimating = true;
            setTimeout(() => {
                isAnimating = false;
                focusOnStep(self.$theForm.find(".fluentform-step.active"), true);
            }, animDuration + 50);
        }

        const setupKeyboardNavigation = function () {
            self.$theForm.off("keydown.stepNavigation").on("keydown.stepNavigation", function (e) {
                if (isAnimating) return;

                // Only handle space key, let tab work naturally
                const isSpacePressed = e.key === " " || e.keyCode === 32;

                if (!isSpacePressed) {
                    return; // Let tab navigation work naturally
                }

                const $nextButton = $(`${self.formSelector} .fluentform-step.active .ff-btn-next`);
                const $prevButton = $(`${self.formSelector} .fluentform-step.active .ff-btn-prev`);

                if (document.activeElement === $nextButton[0]) {
                    e.preventDefault();
                    $nextButton.click();
                    return;
                }

                if (document.activeElement === $prevButton[0]) {
                    e.preventDefault();
                    $prevButton.click();
                    return;
                }
            });
        }

        // Setup keyboard navigation
        setupKeyboardNavigation();

        // Handle focus after step changes, including conditional skips
        this.$theForm.on('ff_to_next_page ff_to_prev_page', function () {
            handleStepChange();
        });

        // Only focus if autoFocus is enabled, it's not the first step, and it's not the initial load
        const autoFocusEnabled = this.$theForm.find(".ff-step-container").attr("data-disable_auto_focus") !== "yes";
        if (autoFocusEnabled && getCurrentStepIndex() !== 0 && !this.isInitialLoad) {
            focusOnStep($(`${this.formSelector} .fluentform-step.active`), true);
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
        const $ = this.$;

        const $inputs = $theForm.find(':input').filter(function (i, el) {
            return !$(el).closest('.has-conditions').hasClass('ff_excluded');
        });

        $inputs.filter((i, el) => {
            let $el = $(el);
            return $el.parents().hasClass('ff_repeater_table') &&
                $el.attr('type') == 'select' &&
                !$el.val();
        }).prepend('<option selected disabled />');

        let inputData = $inputs.serialize();

        let hasFiles = false;
        $.each($theForm.find('[type=file]'), function (index, fileInput) {
            const params = {}, fileInputName = fileInput.name + '[]';
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
                    const obj = {};
                    obj[k] = v;
                    inputData += '&' + $.param(obj);
                    hasFiles = true;
                }
            });
        });

        const formData = {
            active_step: activeStep,
            data: inputData,
            form_id: $theForm.data('form_id'),
            action: 'fluentform_step_form_save_data'
        };

        return $.post(this.fluentFormVars.ajaxUrl, formData);
    }

    /**
     * Auto slider for single field steps
     */
    maybeAutoSlider() {
        const $ = this.$;
        const self = this;

        let autoSlider = this.$theForm.find('.ff-step-container').attr('data-enable_auto_slider') == 'yes';
        if (!autoSlider) {
            return;
        }

        const maybeAction = function ($el) {
            let count = $el.closest('.fluentform-step.active').find('.ff-el-group:not(.ff_excluded):not(.ff-custom_html)').length;
            if (count == 1) {
                let condCounts = $el.closest('.fluentform-step.active').find('.ff_excluded').length;
                if (condCounts) {
                    let timeout = window.ffTransitionTimeOut || 500;
                    setTimeout(() => {
                        $el.closest('.fluentform-step.active').find('.ff-btn-next').trigger('click');
                    }, timeout);
                } else {
                    $el.closest('.fluentform-step.active').find('.ff-btn-next').trigger('click');
                }
            }
        }

        this.$theForm.find('.ff-el-form-check-radio,.ff-el-net-label, .ff-el-ratings label').on('click', function () {
            maybeAction($(this));
        });

        this.$theForm.find('select').on('change', function () {
            maybeAction($(this));
        });
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
