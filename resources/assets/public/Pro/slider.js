export default function ($, $theForm, fluentFormVars, formSelector) {
    /**
     * Active form step
     * @type {Number}
     */
    var activeStep = 0;

    var wrapperWidth = '';

    fluentFormVars.stepAnimationDuration = parseInt(fluentFormVars.stepAnimationDuration);

    const stepPersistency = $theForm.find(
        '.ff-step-container'
    ).attr('data-enable_step_data_persistency') == 'yes';

    let stepResume = false;

    if (stepPersistency) {
        stepResume = $theForm.find(
            '.ff-step-container'
        ).attr('data-enable_step_page_resume') == 'yes';
    }

    var isRtl = !!window.fluentFormVars.is_rtl;

    var isPopulatingStepData = false;

    /**
     * Remove prev button from first step
     * @return void
     */
    var removePrevFromFirstFirstStep = function () {
        $theForm
            .find('.fluentform-step:first')
            .find('.step-nav [data-action="prev"]')
            .remove();
    };

    var getFormInstance = function () {
        return window.fluentFormApp($theForm);
    };

    var initFormWithSavedState = function () {
        if (!stepPersistency) return;

        jQuery(document).ready(e => {
            jQuery.getJSON(fluentFormVars.ajaxUrl, {
                form_id: $theForm.data('form_id'),
                action: 'fluentform_step_form_get_data',
                nonce: fluentFormVars?.nonce,
                hash: fluentFormVars?.hash
            }).then(data => {
                if (data) {
                    populateFormDataAndSetActiveStep(data);
                }
            });
        });
    };
    var populateFormDataAndSetActiveStep = function ({response, step_completed}) {
        let choiceJsInputs = [] ;
        jQuery.each(response, (key, value) => {
            if (!value) return;
            let type = Object.prototype.toString.call(value);


            if (type === '[object Object]') {
                let $el = jQuery(`[data-name=${key}]`);

                if ($el.length && $el.attr('data-type') === 'tabular-element') {
                    // Tabular Grid
                    jQuery.each(value, (row, columns) => {
                        let $checkboxes = jQuery(`[name="${key}[${row}]\\[\\]"]`);
                        if (!$checkboxes.length) {
                            $checkboxes = jQuery(`[name="${key}[${row}]"]`);
                        }
                        jQuery.each($checkboxes, (i, cbox) => {
                            let $val = $(cbox).val();
                            if (jQuery.inArray($val, columns) !== -1 || $val === columns) {
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
                    jQuery.getJSON(fluentFormVars.ajaxUrl, data).then(response => {
                        jQuery.each(response, (key, options) => {
                            let $select = $el.find(`select[data-key='${key}']`);

                            if ($select.attr('data-index') != 0) {
                                jQuery.each(options, (k, val) => {
                                    $select.append(
                                        jQuery('<option />', {value: val, text: val})
                                    );
                                });
                            }

                            $select.attr('disabled', false).val(value[key]);
                        });
                    });
                } else {
                    // Names, Address e.t.c. fields
                    jQuery.each(value, (k, v) => {
                        jQuery(`[name="${key}[${k}]"]`).val(v).change();
                    });
                }
            } else if (type === '[object Array]') {
                let $el = jQuery(`[name=${key}]`);
                $el = $el.length ? $el : jQuery(`[data-name=${key}]`);
                $el = $el.length ? $el : jQuery(`[name=${key}\\[\\]]`);
                if ($el.attr('type') == 'file') {
                    addFilesToElement($el, value);
                } else if ($el.prop('multiple')) {
                    if ($.isFunction(window.Choices)) {
                        let choiceJs  = $el.data('choicesjs');

                        choiceJsInputs.push( {
                            handler : choiceJs,
                            values : value
                        });
                    }else{
                        $el.val(value).change();
                    }
                } else if ($el.attr('data-type') === 'repeater_field') {
                    // Repeater Field
                    let $tbody = $el.find('tbody');
                    let elName = $el.attr('data-name');

                    jQuery.each(value, (index, arr) => {
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
                        if (jQuery.inArray($($elem).val(), value) != -1) {
                            $($elem).prop('checked', true).change();
                        }
                    });
                }
            } else {
                // Others
                let $el = jQuery(`[name=${key}]`);

                //rich text
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
                    jQuery(`[name=${key}][value="${value}"]`).prop('checked', true).change();
                } else {
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
        if (choiceJsInputs.length > 0 ){
            for (let i = 0; i < choiceJsInputs.length ; i++) {
                choiceJsInputs[i].handler.setValue(choiceJsInputs[i].values).change();
            }
        }

        isPopulatingStepData = true;
        const animDuration = fluentFormVars.stepAnimationDuration;
        if (stepResume) {
            updateSlider(step_completed, animDuration, true)
                .then(() => {
                    handleFocus(animDuration);
                })
                .catch(error => {
                    console.error("An error occurred during the slider update:", error);
                });
        }

        isPopulatingStepData = false;
    };

    /**
     * Register event handlers for form
     * steps slider initialization
     *
     * @return void
     */
    var initStepSlider = function () {
        const stepsWrapper = $theForm.find('.ff-step-body');
        const formSteps = $theForm.find('.fluentform-step');
        const totalSteps = formSteps.length;
        const stepTitles = $theForm.find('.ff-step-titles li');

        wrapperWidth = (100 * totalSteps) + '%';

        stepsWrapper.css({width: wrapperWidth});
        formSteps.css({width: (100 / totalSteps) + '%'});

        $(formSteps[activeStep]).addClass('active');
        $(stepTitles[activeStep]).addClass('active');

        const firstStep = formSteps.first();
        if (firstStep.hasClass('active')) {
            firstStep.find('button[data-action="next"]').css('visibility', 'visible');
        }

        // submit button should only be printed on last step
        if (formSteps.length && !formSteps.last().hasClass('active')) {
            $theForm.find('button[type="submit"]').css('visibility', 'hidden');
        }

        stepProgressBarHandle({activeStep, totalSteps});

        registerStepNavigators(fluentFormVars.stepAnimationDuration);

        registerClickableStepNav(stepTitles,formSteps);
    };

    /**
     * Register clickable step navigation
     * @param  {object} stepTitlesNavs
     * @param {object} formSteps
     */
    var registerClickableStepNav = function (stepTitlesNavs, formSteps) {
        if (stepTitlesNavs.length === 0) {
            return;
        }
        $.each(stepTitlesNavs, function (i, elm) {
            $(elm).attr('data-step-number', i)
        });
        stepTitlesNavs.on('click', function (e) {
            let formInstance = getFormInstance();
            let $this = $(this);
            let currentStep = 0;
            const animDuration = fluentFormVars.stepAnimationDuration;

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

                updateSlider(targetStep, animDuration, true)
                    .then(() => {
                        handleFocus(animDuration);
                    })
                    .catch(error => {
                        console.error("An error occurred during the slider update:", error);
                    });
            } catch (e) {
                if (!(e instanceof window.ffValidationError)) {
                    throw e;
                }
                updateSlider(currentStep, animDuration, true)
                    .then(() => {
                        handleFocus(animDuration);
                    })
                    .catch(error => {
                        console.error("An error occurred during the slider update:", error);
                    });
                formInstance.showErrorMessages(e.messages);
                formInstance.scrollToFirstError(350);
            }
        })
    }

    /**
     * Action occurs on step change/form load
     * @param  {object} stepData
     * @return {void}
     */
    var stepProgressBarHandle = function (stepData) {
        if ($theForm.find('.ff-el-progress').length) {
            var {totalSteps, activeStep} = stepData;
            var completeness = (100 / totalSteps * (activeStep + 1));
            var stepTitles = $theForm.find('.ff-el-progress-title li');
            var progressBar = $theForm.find('.ff-step-header .ff-el-progress-bar');
            var span = progressBar.find('span');
            // progress bar completeness
            progressBar.css({
                width: completeness + '%'
            });
            if (completeness) {
                progressBar.append(span.text(parseInt(completeness) + '%'))
            } else {
                span.empty();
            }
            // $theForm.find('.ff-el-progress-status').text(`${activeStep} out of ${totalSteps} Completed`);
            let stepText = fluentFormVars.step_text;

            let stepTitle = $(stepTitles[activeStep]).text();
            stepText = stepText
                .replace('%activeStep%', activeStep + 1)
                .replace('%totalStep%', totalSteps)
                .replace('%stepTitle%', stepTitle);

            $theForm.find('.ff-el-progress-status').html(stepText);
            stepTitles.css('display', 'none');
            $(stepTitles[activeStep]).css('display', 'inline');
        }
    };

    /**
     * Register event handlers for form
     * steps to move forward or backward
     *
     * @return void
     */
    var registerStepNavigators = function (animDuration) {
        handleFocus(animDuration);

        $(formSelector).on('click', '.fluentform-step  .step-nav button, .fluentform-step  .step-nav img', function (e) {
            const btn = $(this).data('action');
            let actionType = 'next';
            let current = $(this).closest('.fluentform-step');
            let formInstance = getFormInstance();

            if (btn == 'next') {
                try {
                    var elements = current.find(':input').not(':button').filter(function (i, el) {
                        return !$(el).closest('.has-conditions').hasClass('ff_excluded');
                    });
                    elements.length && formInstance.validate(elements);
                    activeStep++;
                } catch (e) {
                    if (!(e instanceof window.ffValidationError)) {
                        throw e;
                    }
                    formInstance.showErrorMessages(e.messages);
                    formInstance.scrollToFirstError(350);
                    return;
                }
                $theForm.trigger('ff_to_next_page', activeStep);

                jQuery(document).trigger('ff_to_next_page', {
                    step: activeStep,
                    form: $theForm
                });

                var formSteps = $theForm.find('.fluentform-step');
                $theForm.trigger('ff_render_dynamic_smartcodes', $(formSteps[activeStep]));

            } else {
                activeStep--;
                actionType = 'prev';
                $theForm.trigger('ff_to_prev_page', activeStep);
                jQuery(document).trigger('ff_to_prev_page', {
                    step: activeStep,
                    form: $theForm
                });
            }

            let autoScroll = $theForm.find('.ff-step-container').attr('data-disable_auto_focus') != 'yes';

            updateSlider(activeStep, animDuration, autoScroll, actionType)
                .then(() => {
                    handleFocus(animDuration);
                })
                .catch(error => {
                    console.error("An error occurred during the slider update:", error);
                });
        });
    };

    /**
     * Update slider position in multistep form
     * @param  {int} goBackToStep
     * @param  {int} animDuration
     * @param  {boolean} isScrollTop
     * @return {Promise}
     */
    var updateSlider = function (goBackToStep, animDuration, isScrollTop = true, actionType = 'next') {
        return new Promise((resolve) => {
            $('div' + formSelector + '_errors').empty();
            activeStep = goBackToStep;

            var stepsWrapper = $theForm.find('.ff-step-body');
            var stepTitles = $theForm.find('.ff-step-titles li'),
                formSteps = $theForm.find('.fluentform-step'),
                totalSteps = formSteps.length;

            // Change active step
            formSteps.removeClass('active');
            $(formSteps[activeStep]).addClass('active');

            // Change step title
            stepTitles.removeClass('ff_active ff_completed');
            $.each([...Array(activeStep).keys()], (step) => {
                $($(stepTitles[step])).addClass('ff_completed');
            });
            $(stepTitles[activeStep]).addClass('ff_active');

            var scrollTop = function () {
                if (window.ff_disable_step_scroll) {
                    return;
                }

                const scrollElement = $theForm.find('.ff_step_start');
                let formTop;

                if (window.ff_scroll_top_offset) {
                    formTop = window.ff_scroll_top_offset;
                } else {
                    formTop = scrollElement.offset().top - 20;
                }

                var isInViewport = function ($el) {
                    var elementTop = $el.offset().top;
                    var elementBottom = elementTop + $el.outerHeight();

                    var viewportTop = $(window).scrollTop();
                    var viewportBottom = viewportTop + $(window).height();

                    return elementBottom > viewportTop && elementTop < viewportBottom;
                };

                const isVisible = isInViewport(scrollElement);

                if (!isVisible || window.ff_force_scroll) {
                    $('html, body').delay(animDuration).animate({
                        scrollTop: formTop
                    }, 0);
                }
            };

            // Animate step
            let inlineCssObj = isRtl ? { right: -(activeStep * 100) + '%' } : { left: -(activeStep * 100) + '%' };

            const animationType = $(formSteps[activeStep]).closest('.ff-step-container').data('animation_type');
            let animationPromise;

            switch (animationType) {
                case 'slide':
                    stepsWrapper.css('transition', `all ${animDuration}ms`);
                    stepsWrapper.css(inlineCssObj);
                    animationPromise = new Promise(resolve => setTimeout(resolve, animDuration));
                    break;
                case 'fade':
                    stepsWrapper.css('transition', `all ${animDuration}ms`);
                    stepsWrapper.css({opacity: 0, ...inlineCssObj});
                    setTimeout(() => {
                        stepsWrapper.css({opacity: 1});
                    }, 50);
                    animationPromise = new Promise(resolve => setTimeout(resolve, animDuration * 2));
                    break;
                case 'slide_down':
                    stepsWrapper.hide();
                    stepsWrapper.css(inlineCssObj);
                    animationPromise = stepsWrapper.slideDown(animDuration).promise();
                    break;
                case 'none':
                    stepsWrapper.css(inlineCssObj);
                    animationPromise = Promise.resolve();
                    break;
                default:
                    stepsWrapper.css(inlineCssObj);
                    animationPromise = Promise.resolve();
            }

            animationPromise.then(() => {
                stepsWrapper.css('pointer-events', ''); // Re-enable pointer events

                if (isScrollTop) {
                    scrollTop();
                }

                //skip saving the last step
                let isLastStep = activeStep === totalSteps - 1;

                // Fire ajax request to persist the step state/data
                if (stepPersistency && !isPopulatingStepData && !isLastStep) {
                    saveStepData($theForm, activeStep).then(response => {
                        console.log(response);
                    });
                }

                // Update progress bar and titles after animation completes
                stepProgressBarHandle({activeStep, totalSteps});

                // Show submit button on last step
                if (formSteps.last().hasClass('active')) {
                    $theForm.find('button[type="submit"]').css('visibility', 'visible');
                } else {
                    $theForm.find('button[type="submit"]').css('visibility', 'hidden');
                }

                // Step skipping logic
                if (!window.ff_disable_auto_step) {
                    let $activeStepDom = $theForm.find('.fluentform-step.active');
                    let childDomCounts = $theForm.find('.fluentform-step.active > div').length - 1;
                    let hiddenDomCounts = $theForm.find('.fluentform-step.active > .ff_excluded').length;

                    if ($theForm.find('.fluentform-step.active > .ff-t-container').length) {
                        childDomCounts -= $theForm.find('.fluentform-step.active > .ff-t-container').length;
                        childDomCounts += $theForm.find('.fluentform-step.active > .ff-t-container > .ff-t-cell > div').length;
                        hiddenDomCounts += $theForm.find('.fluentform-step.active > .ff-t-container > .ff-t-cell > .ff_excluded').length;

                        if ($theForm.find('.fluentform-step.active > .ff-t-container.ff_excluded').length) {
                            hiddenDomCounts -= $theForm.find('.fluentform-step.active > .ff-t-container.ff_excluded').length;
                            hiddenDomCounts -= $theForm.find('.fluentform-step.active > .ff-t-container.ff_excluded > .ff-t-cell > .ff_excluded').length;
                            hiddenDomCounts += $theForm.find('.fluentform-step.active > .ff-t-container.ff_excluded > .ff-t-cell > div').length;
                        }
                    }

                    if (childDomCounts === hiddenDomCounts) {
                        $activeStepDom.find('.step-nav button[data-action=' + actionType + '], .step-nav img[data-action=' + actionType + ']').click();
                        resolve(); // Ensure that we resolve the promise here if we are skipping steps
                        return;
                    }
                }

                $theForm.find('.fluentform-step.active').find('.step-nav button[data-action="next"]').css('visibility', 'visible');
                $theForm.find('.fluentform-step.active').find('.step-nav button[data-action="prev"]').css('visibility', 'visible');
                $theForm.find('.fluentform-step.active').find('.step-nav img[data-action="next"]').css('visibility', 'visible');
                $theForm.find('.fluentform-step.active').find('.step-nav img[data-action="prev"]').css('visibility', 'visible');

                resolve(); // Resolve the promise after animations, scrolling, and step skipping logic
            });
        });
    };

    let isInitialLoad = true;
    function handleFocus(animDuration) {
        let isAnimating = false;

        function getCurrentStepIndex() {
            return $theForm.find(".fluentform-step").index($theForm.find(".fluentform-step.active"));
        }

        function getTotalSteps() {
            return $theForm.find(".fluentform-step").length;
        }

        function focusOnStep(step, shouldFocus = false) {
            const autoFocusEnabled = $theForm.find(".ff-step-container").attr("data-disable_auto_focus") != "yes";

            if (!isInitialLoad) {
                if (!autoFocusEnabled) {
                    setTimeout(() => {
                        $(`${formSelector} .fluentform-step.active`).attr("tabindex", "-1").focus().removeAttr("tabindex");
                    }, animDuration);

                    isInitialLoad = false;
                } else {
                    const focusableElements = step.find("input, select, textarea, button, a").filter(":visible");

                    if (focusableElements.length && shouldFocus) {
                        setTimeout(() => {
                            focusableElements.first().focus();
                        }, animDuration + 50);
                    }

                    isInitialLoad = false;
                }
            }
        }

        function handleStepChange() {
            isAnimating = true;
            setTimeout(() => {
                isAnimating = false;
                focusOnStep($theForm.find(".fluentform-step.active"), true);
            }, animDuration + 50);
        }

        function handleStepNavigation(e, direction) {
            if (isAnimating) return;

            const currentStepIndex = getCurrentStepIndex();
            const isFirstStep = currentStepIndex === 0;
            const isLastStep = currentStepIndex === getTotalSteps() - 1;

            if ((direction === "prev" && isFirstStep) || (direction === "next" && isLastStep)) {
                return; // Allow focus to move out of the form
            }

            e.preventDefault();
            e.stopPropagation();
            const buttonSelector = direction === "prev" ? ".ff-btn-prev" : ".ff-btn-next";
            const button = $(`${formSelector} .fluentform-step.active`).find(`.step-nav ${buttonSelector}`);

            if (button.length) {
                button.click();
                handleStepChange();
            }
        }

        function setupKeyboardNavigation() {
            $theForm.off("keydown.stepNavigation").on("keydown.stepNavigation", function (e) {
                if (isAnimating) return;

                const isTabPressed = e.key === "Tab" || e.keyCode === 9;

                if (!isTabPressed) {
                    return;
                }

                const focusableElements = $(`${formSelector} .fluentform-step.active`).find("input, select, textarea, button, a").filter(":visible");
                const firstFocusableElement = focusableElements.first();
                const lastFocusableElement = focusableElements.last();
                const currentStepIndex = getCurrentStepIndex();
                const isFirstStep = currentStepIndex === 0;
                const isLastStep = currentStepIndex === getTotalSteps() - 1;

                if (e.shiftKey) {
                    // If Shift + Tab is pressed
                    if (document.activeElement === firstFocusableElement[0]) {
                        if (!isFirstStep) {
                            handleStepNavigation(e, "prev");
                        }
                    }
                } else {
                    // If Tab is pressed
                    if (document.activeElement === lastFocusableElement[0]) {
                        if (!isLastStep) {
                            handleStepNavigation(e, "next");
                        }
                    }
                }
            });
        }

        // Setup keyboard navigation
        setupKeyboardNavigation();

        // Handle focus after step changes, including conditional skips
        $theForm.on('ff_to_next_page ff_to_prev_page', function() {
            handleStepChange();
        });

        // Only focus if autoFocus is enabled, it's not the first step, and it's not the initial load
        const autoFocusEnabled = $theForm.find(".ff-step-container").attr("data-disable_auto_focus") != "yes";
        if (autoFocusEnabled && getCurrentStepIndex() !== 0 && !isInitialLoad) {
            focusOnStep($(`${formSelector} .fluentform-step.active`), true);
        }

        isInitialLoad = false;
    }


    var saveStepData = function ($theForm, activeStep) {
        var $inputs = $theForm.find(':input').filter(function (i, el) {
            return !$(el).closest('.has-conditions').hasClass('ff_excluded');
        });

        $inputs.filter((i, el) => {
            let $el = $(el);
            return $el.parents().hasClass('ff_repeater_table') &&
                $el.attr('type') == 'select' &&
                !$el.val();
        }).prepend('<option selected disabled />');

        let inputData = $inputs.serialize();

        var hasFiles = false;
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
                    inputData += '&' + $.param(obj);
                    hasFiles = true;
                }
            });
        });

        var formData = {
            active_step: activeStep,
            data: inputData,
            form_id: $theForm.data('form_id'),
            action: 'fluentform_step_form_save_data'
        };

        return jQuery.post(fluentFormVars.ajaxUrl, formData);
    };

    var maybeAutoSlider = function () {
        let autoSlider = $theForm.find('.ff-step-container').attr('data-enable_auto_slider') == 'yes';
        if (!autoSlider) {
            return;
        }

        function maybeAction($el) {
            let count = $el.closest('.fluentform-step.active').find('.ff-el-group:not(.ff_excluded):not(.ff-custom_html)').length;
            if (count == 1) {
                let condCounts = $el.closest('.fluentform-step.active').find('.ff_excluded').length;
                if (condCounts) {
                    let timeout = window.ffTransitionTimeOut || 400;
                    setTimeout(() => {
                        $el.closest('.fluentform-step.active').find('.ff-btn-next').trigger('click');
                    }, timeout);
                } else {
                    $el.closest('.fluentform-step.active').find('.ff-btn-next').trigger('click');
                }
            }
        }

        $theForm.find('.ff-el-form-check-radio,.ff-el-net-label, .ff-el-ratings label').on('click', function () {
            maybeAction($(this));
        });

        $theForm.find('select').on('change', function () {
            maybeAction($(this));
        });

    };

    var addFilesToElement = function ($el, fileUrls) {
        var $uploadedList = $el.closest('.ff-el-input--content').find('.ff-uploaded-list');

        $.each(fileUrls, function (index, file) {
            file = typeof file === 'object' ? file : {url: file, data_src : file};
            var previewContainer = $('<div/>', {
                class: 'ff-upload-preview',
                'data-src': file.data_src,
                style: 'border: 1px solid rgb(111, 117, 125)'
            });
            var previewThumb = $('<div/>', {
                class: 'ff-upload-thumb'
            });
            previewThumb.append($('<div/>', {
                class: 'ff-upload-preview-img',
                style: `background-image: url('${getThumbnail(file.url)}');`
            }));

            var previewDetails = $('<div/>', {
                class: 'ff-upload-details'
            });


            var fileProgress = $('<span/>', {
                html: fluentFormVars.upload_completed_txt,
                class: 'ff-upload-progress-inline-text ff-inline-block'
            });
            let name = file.url.substring(file.url.lastIndexOf('/') + 1);
            if (name.includes('-ff-')) {
                name = name.substring(name.lastIndexOf('-ff-') + 4);
            }
            var fileName = $('<div/>', {
                class: 'ff-upload-filename',
                html: name
            });

            var progressBarInline = $(`
                <div class="ff-upload-progress-inline ff-el-progress">
                    <div style="width: 100%;" class="ff-el-progress-bar"></div>
                </div>
            `);

            var removeBtn = $('<span/>', {
                'data-href': '#',
                'html': '&times;',
                'class': 'ff-upload-remove'
            });

            var fileSize = $('<div>', {
                class: 'ff-upload-filesize ff-inline-block',
                html: ''
            });

            var errorInline = $('<div>', {
                class: 'ff-upload-error',
                style: 'color:red;'
            });

            previewDetails.append(fileName, progressBarInline, fileProgress, fileSize, errorInline, removeBtn);
            previewContainer.append(previewThumb, previewDetails);

            $uploadedList.append(previewContainer);
        });

        $el.trigger('change_remaining', -fileUrls.length);
        $el.trigger('change');
    };

    var getThumbnail = function (file) {

        const extension = file.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();

        if (['jpg', 'jpeg', 'gif', 'png'].indexOf(extension) != -1) {
            return file;
        }

        var canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        canvas.style.zIndex = 8;
        canvas.style.position = "absolute";
        canvas.style.border = "1px solid";

        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, 60, 60);
        ctx.font = "13px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(extension, 30, 30, 60);
        return canvas.toDataURL();
    };

    var init = function () {
        initFormWithSavedState();
        removePrevFromFirstFirstStep();
        initStepSlider();
        maybeAutoSlider();
    };

    return {
        init,
        updateSlider,
        populateFormDataAndSetActiveStep

    };
}
