export default function ($, $theForm, fluentFormVars, formSelector) {
    /**
     * Active form step
     * @type {Number}
     */
    var activeStep = 0;

    var wrapperWidth = '';

    fluentFormVars.stepAnimationDuration = parseInt(fluentFormVars.stepAnimationDuration);

    fluentFormVars.enable_step_data_persistency = $theForm.find(
        '.ff-step-container'
    ).attr('data-enable_step_data_persistency');

    if (fluentFormVars.enable_step_data_persistency == 'yes') {
        fluentFormVars.enable_step_page_resume = $theForm.find(
            '.ff-step-container'
        ).attr('data-enable_step_page_resume');
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
        if (fluentFormVars.enable_step_data_persistency == 'no') return;

        jQuery(document).ready(e => {
            jQuery.getJSON(fluentFormVars.ajaxUrl, {
                form_id: $theForm.data('form_id'),
                action: 'fluentform_step_form_get_data'
            }).then(data => {
                if (data) {
                    populateFormDataAndSetActiveStep(data);
                }
            });
        });
    };

    var populateFormDataAndSetActiveStep = function ({response, step_completed}) {
        jQuery.each(response, (key, value) => {
            if (!value) return;

            let type = Object.prototype.toString.call(value);

            if (type === '[object Object]') {
                let $el = jQuery(`[data-name=${key}]`);

                if ($el.length && $el.attr('data-type') === 'tabular-element') {
                    // Tabular Grid
                    jQuery.each(value, (row, columns) => {
                        let $checkboxes = jQuery(`[name="${key}[${row}]\\[\\]"]`);
                        jQuery.each($checkboxes, (i, cbox) => {
                            if (jQuery.inArray($(cbox).val(), columns) != -1) {
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
                            let $select = $el.find(`select[data-key=${key}]`);

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
                if ($el.prop('multiple')) {
                    $el.val(value).change();
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
                if ($el.prop('type') === 'radio' || $el.prop('type') === 'checkbox') {
                    jQuery(`[name=${key}][value=${value}]`).prop('checked', true).change();
                } else {
                    $el.val(value).change();
                }
            }
        });

        isPopulatingStepData = true;
        if (fluentFormVars.enable_step_page_resume == 'yes') {
            updateSlider(step_completed, fluentFormVars.stepAnimationDuration, true);
        }
        ;
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

        // submit button should only be printed on last step
        if (formSteps.length && !formSteps.last().hasClass('active')) {
            $theForm.find('button[type="submit"]').css('display', 'none');
        }

        stepProgressBarHandle({activeStep, totalSteps});

        registerStepNavigators(fluentFormVars.stepAnimationDuration);
    };

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

        $(document).on('keydown', formSelector + ' .fluentform-step > .step-nav button', function (e) {
            if (e.which == 9) {
                if ($(this).data('action') == 'next') {
                    e.preventDefault();
                }
            }
        });

        $(formSelector).on('click', '.fluentform-step  .step-nav button', function (e) {
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

                maybeUpdateDynamicLabels(activeStep);

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

            updateSlider(activeStep, animDuration, autoScroll, actionType);
        });
    };

    /**
     * Update slider position in multisteps form
     * @param  {int} goBackToStep
     * @param  {int} animDuration
     * @param  {bool} isScrollTop
     * @return {void}
     */
    var updateSlider = function (goBackToStep, animDuration, isScrollTop = true, actionType = 'next') {
        $('div' + formSelector + '_errors').empty();
        activeStep = goBackToStep;

        var stepsWrapper = $theForm.find('.ff-step-body');
        var stepTitles = $theForm.find('.ff-step-titles li'),
            formSteps = $theForm.find('.fluentform-step'),
            totalSteps = formSteps.length,
            formTop = $theForm.offset().top - (!!$('#wpadminbar') ? 32 : 0) - 20;

        // change active step
        formSteps.removeClass('active');
        $(formSteps[activeStep]).addClass('active');

        // change step title
        stepTitles.removeClass('ff_active ff_completed');

        $.each([...Array(activeStep).keys()], (setp) => {
            $($(stepTitles[setp])).addClass('ff_completed');
        });

        $(stepTitles[activeStep]).addClass('ff_active');

        // animate step on click next/prev
        var scrollTop = function () {
            if (window.ff_disable_step_scroll) {
                return;
            }

            const scrollElement = $theForm.find('.ff_step_start');

            if (window.ff_scroll_top_offset) {
                var formTop = window.ff_scroll_top_offset;
            } else {
                var formTop = scrollElement.offset().top - 20
            }
            
            var isInViewport = function ($el) {
                var elementTop = $el.offset().top;
                var elementBottom = elementTop + $el.outerHeight();

                var viewportTop = $(window).scrollTop();
                var viewportBottom = viewportTop + $(window).height();

                return elementBottom > viewportTop && elementTop < viewportBottom;
            };

            const isVisible = isInViewport(scrollElement);

            if (!isVisible) {
                $('html, body').delay(animDuration).animate({
                    scrollTop: formTop
                }, 0);
            }
        };

        let inlineCssObj = {
            left: -(activeStep * 100) + '%'
        };

        if (isRtl) {
            inlineCssObj = {
                right: -(activeStep * 100) + '%'
            };
        }

        stepsWrapper.animate(inlineCssObj, animDuration, () => {
            isScrollTop && scrollTop();
            stepsWrapper.css({width: wrapperWidth});
        });


        // Fire ajax request to persist the step state/data
        if (fluentFormVars.enable_step_data_persistency == 'yes' && !isPopulatingStepData) {
            saveStepData($theForm, activeStep).then(response => {
                console.log(response);
            });
        }

        // update progressbar
        stepProgressBarHandle({activeStep, totalSteps});

        // now we have to check if there has any visible elements or not

        // submit button should only be printed on last step
        if (formSteps.last().hasClass('active')) {
            $theForm.find('button[type="submit"]').css('display', 'inline-block');
            return;
        } else {
            $theForm.find('button[type="submit"]').css('display', 'none');
        }

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

            if (childDomCounts == hiddenDomCounts) {
                $activeStepDom.find('.step-nav button[data-action=' + actionType + ']').click();
            }
        }
    };

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

        var formData = {
            active_step: activeStep,
            data: $inputs.serialize(),
            form_id: $theForm.data('form_id'),
            action: 'fluentform_step_form_save_data'
        };

        return jQuery.post(fluentFormVars.ajaxUrl, formData);
    };

    var maybeUpdateDynamicLabels = function (activeStep) {
        var formSteps = $theForm.find('.fluentform-step');
        var workStep = $(formSteps[activeStep]);

        jQuery.each(workStep.find('.ff_dynamic_value'), function (index, item) {
            var ref = $(item).data('ref');

            if (ref == 'payment_summary') {
                $theForm.trigger('calculate_payment_summary', {
                    element: $(item)
                });
                return;
            }

            var refElement = $theForm.find('.ff-el-form-control[name="' + ref + '"]');

            var separator = ' ';

            if (!refElement.length) {
                refElement = $theForm.find('.ff-field_container[data-name="' + ref + '"]').find('input');
            }

            if (!refElement.length) {
                // This may radio element / Checkbox element
                refElement = $theForm.find('*[name="' + ref + '"]:checked');
                if (!refElement.length) {
                    refElement = $theForm.find('*[name="' + ref + '[]"]:checked');
                    separator = ', ';
                }
            }

            var refValues = [];
            $.each(refElement, function () {
                let inputValue = $(this).val();
                if (inputValue) {
                    refValues.push(inputValue);
                }
            });

            let replaceValue = '';
            if (refValues.length) {
                replaceValue = refValues.join(separator);
            } else {
                replaceValue = $(item).data('fallback');
            }

            $(this).html(replaceValue);
        });
    };

    var maybeAutoSlider = function () {
        let autoSlider = $theForm.find('.ff-step-container').attr('data-enable_auto_slider') == 'yes';
        if (!autoSlider) {
            return;
        }

        function maybeAction($el) {
            let count = $el.closest('.fluentform-step.active').find('.ff-el-group:not(.ff_excluded)').length;
            let timeout = window.ffTransitionTimeOut || 400;
            if (count == 1) {
                setTimeout(() => {
                    $el.closest('.fluentform-step.active').find('.ff-btn-next').trigger('click');
                }, timeout);
            }
        };

        $theForm.find('.ff-el-form-check-radio,.ff-el-net-label, .ff-el-ratings label').on('click', function () {
            maybeAction($(this));
        });

        $theForm.find('select').on('change', function () {
            maybeAction($(this));
        });

    };

    var init = function () {
        initFormWithSavedState();
        removePrevFromFirstFirstStep();
        initStepSlider();
        maybeAutoSlider();
    };

    return {
        init,
        updateSlider
    };
}