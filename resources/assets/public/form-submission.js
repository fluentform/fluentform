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
        var ffValidationError = function () {
        };
        ffValidationError.prototype = Object.create(Error.prototype);
        ffValidationError.prototype.constructor = ffValidationError;
        return ffValidationError;
    })();

    (function (fluentFormVars, $) {

        if (!fluentFormVars) {
            fluentFormVars = {};
        }
        fluentFormVars.stepAnimationDuration = parseInt(fluentFormVars.stepAnimationDuration);

        window.fluentFormApp = function ($theForm) {
            var formInstanceSelector = $theForm.attr('data-form_instance');
            var form = window['fluent_form_' + formInstanceSelector];

            if (!form) {
                console.log('No Fluent form JS vars found!');
                return;
            }

            var formId = form.form_id_selector;
            var formSelector = '.' + formInstanceSelector;

            /**
             * Form Handler module
             * @param  validator Factory
             * @return void
             */
            return (function (validator) {

                /**
                 * Register all the event handlers
                 *
                 * @return void
                 */
                var initFormHandlers = function () {
                    initMultiSelect();
                    initMask();
                    registerFormSubmissionHandler();
                    maybeInlineForm();
                    initCheckableActive();
                    initInlineErrorItems();
                    $theForm.removeClass('ff-form-loading').addClass('ff-form-loaded');

                    $theForm.on('show_element_error', function (e, data) {
                        showErrorBelowElement(data.element, data.message);
                    });
                };

                var getTheForm = function () {
                    return $('body').find('form'+formSelector);
                };

                var maybeInlineForm = function () {
                    if ($theForm.hasClass('ff-form-inline')) {
                        $theForm.find('button.ff-btn-submit').css('height', '50px');
                    }
                };

                /**
                 * Init Select2
                 *
                 * @return void
                 */
                var initMultiSelect = function () {
                    const multiSelects = $theForm.find('.ff_has_multi_select');
                    if (!multiSelects.length) {
                       return;
                    }

                    $.each(multiSelects, (index, selectItem) => {
                        $(selectItem).selectWoo({
                            placeholder: $(selectItem).attr('placeholder')
                        });
                    });

                    $theForm.on('reset', function () {
                        multiSelects.val(null).trigger('change');
                    });

                };

                var fireUpdateSlider = function (goBackToStep, animDuration, isScrollTop = true, actionType = 'next') {
                    $theForm.trigger('update_slider', {
                        goBackToStep: goBackToStep,
                        animDuration: animDuration,
                        isScrollTop: isScrollTop,
                        actionType: actionType
                    });
                };

                /**
                 * Init jQuery mask plugin
                 *
                 * @return void
                 */
                var initMask = function () {
                    var globalOptions = {
                        clearIfNotMatch: true,
                        translation: {
                            '*': {
                                pattern: /[0-9a-zA-Z]/
                            }
                        }
                    };

                    $('input[data-mask]').each(function (key, el) {
                        var el = $(el),
                            mask = el.data('mask'),
                            maskStr = mask.mask;

                        el.mask(maskStr, globalOptions);
                    });
                };

                var submissionAjaxHandler = function ($theForm) {
                    try {
                        var $inputs = $theForm
                            .find(':input').filter(function (i, el) {
                                return !$(el).closest('.has-conditions').hasClass('ff_excluded');
                            });

                        validate($inputs);

                        var formData = {
                            data: $inputs.serialize(),
                            action: 'fluentform_submit',
                            form_id: $theForm.data('form_id')
                        };

                        // Init reCaptcha if available.
                        if ($theForm.find('.ff-el-recaptcha.g-recaptcha').length) {
                            let recaptchaId = getRecaptchaClientId(formData.form_id);
                            if (recaptchaId) {
                                formData['data'] += '&' + $.param({
                                    'g-recaptcha-response': grecaptcha.getResponse(recaptchaId)
                                });
                            }
                        }

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
                                text: 'File upload in progress. Please wait...'
                            });
                            return $(formSelector + '_errors').html(errorHtml.append(text, cross)).show();
                        }

                        $(formSelector + '_success').remove();
                        $(formSelector + '_errors').html('');
                        $theForm.find('.error').html('');
                        $theForm.parent().find('.ff-errors-in-stack').hide();
                        showFormSubmissionProgress($theForm);

                        $.post(fluentFormVars.ajaxUrl + '?t=' + Date.now(), formData)
                            .then(function (res) {
                                if (!res || !res.data || !res.data.result) {
                                    // This is an error
                                    $theForm.trigger('fluentform_submission_failed', {
                                        form: $theForm,
                                        response: res
                                    });
                                    showErrorMessages(res);
                                    return;
                                }

                                if (res.data.nextAction) {
                                    $theForm.trigger('fluentform_next_action_' + res.data.nextAction, {
                                        form: $theForm,
                                        response: res
                                    });
                                    return;
                                }

                                $theForm.trigger('fluentform_submission_success', {
                                    form: $theForm,
                                    config: form,
                                    response: res
                                });

                                jQuery(document.body).trigger('fluentform_submission_success', {
                                    form: $theForm,
                                    config: form,
                                    response: res
                                });

                                if ('redirectUrl' in res.data.result) {
                                    if (res.data.result.message) {
                                        $('<div/>', {
                                            'id': formId + '_success',
                                            'class': 'ff-message-success'
                                        })
                                            .html(res.data.result.message)
                                            .insertAfter($theForm);
                                        $theForm.find('.ff-el-is-error').removeClass('ff-el-is-error');
                                    }

                                    location.href = res.data.result.redirectUrl;
                                    return;
                                } else {
                                    $('<div/>', {
                                        'id': formId + '_success',
                                        'class': 'ff-message-success'
                                    })
                                        .html(res.data.result.message)
                                        .insertAfter($theForm);

                                    $theForm.find('.ff-el-is-error').removeClass('ff-el-is-error');

                                    if (res.data.result.action == 'hide_form') {
                                        $theForm.hide().addClass('ff_force_hide');
                                    } else {
                                        $theForm[0].reset();
                                    }
                                }
                            })
                            .fail(function (res) {

                                $theForm.trigger('fluentform_submission_failed', {
                                    form: $theForm,
                                    response: res
                                });

                                if (!res || !res.responseJSON || !res.responseJSON || !res.responseJSON.errors) {
                                    showErrorMessages(res.responseText);
                                    return;
                                }

                                showErrorMessages(res.responseJSON.errors);

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
                            })
                            .always(function (res) {
                                $theForm
                                    .find('.ff-btn-submit')
                                    .removeClass('disabled')
                                    .removeClass('ff-working')
                                    .attr('disabled', false);

                                // reset reCaptcha if available.
                                if (window.grecaptcha) {
                                    let reCaptchaId = getRecaptchaClientId(formData.form_id);
                                    if (reCaptchaId) {
                                        grecaptcha.reset(reCaptchaId);
                                    }
                                }
                            });

                    } catch (e) {
                        if (!(e instanceof ffValidationError)) {
                            throw e;
                        }
                        showErrorMessages(e.messages);
                        scrollToFirstError(350);
                    }
                };

                var showFormSubmissionProgress = function ($form) {
                    $form
                        .find('.ff-btn-submit')
                        .addClass('disabled')
                        .addClass('ff-working')
                        .prop('disabled', true);
                };

                var formResetHandler = function ($this) {
                    if ($('.ff-step-body', $theForm).length) {
                        fireUpdateSlider(0, fluentFormVars.stepAnimationDuration);
                    }
                    $this.find('.ff-el-repeat .ff-t-cell').each(function () {
                        $(this).find('input').not(':first').remove();
                    });

                    $this
                        .find('.ff-el-repeat .ff-el-repeat-buttons-list')
                        .find('.ff-el-repeat-buttons')
                        .not(':first')
                        .remove();

                    $this.find('input[type=file]').closest('div').find('.ff-uploaded-list').html('')
                        .end().closest('div')
                        .find('.ff-upload-progress')
                        .addClass('ff-hidden')
                        .find('.ff-el-progress-bar')
                        .css('width', '0%');

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
                    $(document).on('submit', formSelector, function (e) {
                        e.preventDefault();
                        submissionAjaxHandler($(this));
                    });

                    $(document).on('reset', formSelector, function (e) {
                        formResetHandler($(this))
                    });
                };

                /**
                 * Retrieve the recaptcha client id for current form
                 * @param {int} formId
                 * @return {int}
                 */
                var getRecaptchaClientId = function (formId) {
                    var formIndex;
                    $('form').has('.g-recaptcha').each(function (index, form) {
                        if ($(this).attr('data-form_id') == formId) {
                            formIndex = index;
                        }
                    });

                    return formIndex;
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
                 * @param  jQueryObject target
                 * @return void
                 * @throes error
                 */
                var validate = function (elements) {
                    if (!elements.length) {
                        elements = $('.frm-fluent-form').find(':input').not(':button').filter(function (i, el) {
                            return !$(el).closest('.has-conditions').hasClass('ff_excluded');
                        });
                    }

                    elements.each((i, el) => {
                        $(el).closest('.ff-el-group').removeClass('ff-el-is-error').find('.error').remove();
                    });

                    validator().validate(elements, form.rules);
                };

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
                        showErrorInStack({'error': [errors]});
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
                            errorHtml.append(text, cross);
                            errorStack.append(errorHtml).show();
                        });

                        var element = getElement(elementName);
                        if (element) {
                            var name = element.attr('name');
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

                    div = $('<div/>', {class: 'error text-danger'});
                    el.closest('.ff-el-group').addClass('ff-el-is-error');
                    el.closest('.ff-el-input--content').find('div.error').remove();
                    el.closest('.ff-el-input--content').append(div.text(message));
                };

                var initInlineErrorItems = function () {
                    var errorSetting = form['settings']['layout']['errorMessagePlacement'];
                    if (!errorSetting || errorSetting == 'stackToBottom') {
                        return;  // It's on bottom so We don't need to do anything
                    }
                    $theForm.find('.ff-el-group,.ff_repeater_table').on('change', 'input,select', function () {
                        if (window.ff_disable_error_clear) {
                            return;
                        }
                        var $parent = $(this).closest('.ff-el-group');
                        if ($parent.hasClass('ff-el-is-error')) {
                            $parent.removeClass('ff-el-is-error').find('.error.text-danger').remove();
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

                var initCheckableActive = function () {
                    var $theForm = getTheForm();
                    $theForm.find('.ff-el-form-check input[type=radio]').on('change', function () {
                        if ($(this).is(':checked')) {
                            $(this).closest('.ff-el-input--content').find('.ff-el-form-check').removeClass('ff_item_selected');
                            $(this).closest('.ff-el-form-check').addClass('ff_item_selected');
                        }
                    });

                    $theForm.find('.ff-el-form-check input[type=checkbox]').on('change', function () {
                        if ($(this).is(':checked')) {
                            $(this).closest('.ff-el-form-check').addClass('ff_item_selected');
                        } else {
                            $(this).closest('.ff-el-form-check').removeClass('ff_item_selected');
                        }
                    });
                }

                var reinitExtras = function () {
                    initMultiSelect();
                    initMask();
                    initCheckableActive();
                    if ($theForm.find('.ff-el-recaptcha.g-recaptcha').length) {
                        var $el = $theForm.find('.ff-el-recaptcha.g-recaptcha');
                        var siteKey = $el.data('sitekey');
                        var id = $el.attr('id');
                        grecaptcha.render(document.getElementById(id), {
                            'sitekey': siteKey
                        });
                    }
                };

                var initTriggers = function () {
                    $theForm = getTheForm();
                    jQuery(document.body).trigger('fluentform_init', [$theForm, form]);
                    jQuery(document.body).trigger('fluentform_init_' + form.id, [$theForm, form]);
                    $theForm.find('input.ff-el-form-control').on('keypress', function (e) {
                        return e.which !== 13;
                    });
                    $theForm.data('is_initialized', 'yes');

                    $theForm.find('.ff-el-tooltip').on('mouseenter', function (event) {
                        const content = $(this).data('content');
                        let $popContent = $('.ff-el-pop-content');
                        if(!$popContent.length) {
                            $('<div/>', {
                                class : 'ff-el-pop-content'
                            }).appendTo(document.body);
                            $popContent = $('.ff-el-pop-content');
                        }
                        $popContent.html(content);
                        const formWidth = $theForm.innerWidth() - 20;
                        $popContent.css('max-width', formWidth);

                        const iconLeft = $(this).offset().left;
                        const formLeft = $theForm.offset().left;
                        const contentWidth = $popContent.outerWidth();
                        const contentHeight = $popContent.outerHeight();

                        let tipPosition = iconLeft - (contentWidth / 2) + 10;

                        if((tipPosition + contentWidth) > formWidth) {
                            tipPosition = (formLeft + formWidth) / 2;
                        } else if(tipPosition < formLeft) {
                            tipPosition = formLeft;
                        }

                        $popContent.css('top', $(this).offset().top - contentHeight - 5);
                        $popContent.css('left', tipPosition);
                    });
                    $theForm.find('.ff-el-tooltip').on('mouseleave', function() {
                        $('.ff-el-pop-content').remove();
                    });

                };

                return {
                    initFormHandlers,
                    initMultiSelect,
                    initMask,
                    registerFormSubmissionHandler,
                    maybeInlineForm,
                    initCheckableActive,
                    reinitExtras,
                    initTriggers,
                    validate,
                    showErrorMessages,
                    scrollToFirstError,
                    settings: form,
                    formSelector: formSelector
                }
            })(validationFactory);
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

                        if (el.data('type') === 'repeater_item') {
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
                                    throw new Error('Method [' + ruleName + '] doesn\'t exist in Validator.');
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
                        return $('[name="' + el.prop('name') + '"]:checked').length;
                    } else if (type.startsWith('select')) {
                        var selected = el.find(':selected');
                        return !!(selected.length && selected.val().length);
                    } else if (type == 'file') {
                        return el.closest('div')
                            .find('.ff-uploaded-list')
                            .find('.ff-upload-preview[data-src]')
                            .length;
                    } else {
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

                    var urlregex = new RegExp(
                        "^(http|https|ftp|ftps)\://([a-zA-Z0-9\.\-]+(\:[a-zA-Z0-9\.&amp;%\$\-]+)*@)*((25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9])\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[1-9]|0)\.(25[0-5]|2[0-4][0-9]|[0-1]{1}[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])|([a-zA-Z0-9\-]+\.)*[a-zA-Z0-9\-]+\.(com|[a-zA-Z]{2,10}))(\:[0-9]+)*(/($|[a-zA-Z0-9\.\,\?\'\\\+&amp;%\$#\=~_\-]+))*$"
                    );

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
                    var val = el.val();

                    if (!rule.value || !val.length) {
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
                    var val = el.val();

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
                    var val = el.val();

                    if (!rule.value || !val.length) {
                        return true;
                    }

                    if (this.numeric(el, rule)) {
                        return Number(val) <= Number(rule.value);
                    }
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
                 * Handle valid_phone_number rule (check valid phone)
                 * @param  jQuery Elelemnt el
                 * @return bool
                 */
                this.valid_phone_number = function (el, rule) {
                    var val = el.val();
                    if (!val) {
                        return true;
                    }

                    if (typeof window.intlTelInputGlobals == 'undefined') {
                        return true;
                    }

                    if (!el || !el[0]) {
                        return;
                    }


                    var iti = window.intlTelInputGlobals.getInstance(el[0]);
                    if (!iti) {
                        return true;
                    }

                    if (el.hasClass('ff_el_with_extended_validation')) {
                        var isValid = iti.isValidNumber();
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

        var $allForms = $('.frm-fluent-form');

        function initSingleForm(selector) {
            var $theForm = $(selector);
            var formInstance = fluentFormApp($theForm);
            if (formInstance) {
                formInstance.initFormHandlers();
                formInstance.initTriggers();
            }
        }

        $.each($allForms, function (formIndex, formItem) {
            /**
             * Current form
             * @type jQuery object
             */

            initSingleForm(formItem);

            $(document).on('reInitExtras', formItem,  function () {
                var $theForm = $(formItem);
                if( $theForm.data('is_initialized') == 'yes') {
                    var formInstance = fluentFormApp($theForm);
                    formInstance.reinitExtras();
                } else {
                    initSingleForm(formItem);
                }
            });
        });
    })(window.fluentFormVars, jQuery);

});

// Polyfill for startsWith and endsWith
(function (sp) {
    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
    if (!sp.startsWith) {
        sp.startsWith = function (search, pos) {
            pos = !pos || pos < 0 ? 0 : +pos;
            return this.substring(pos, pos + search.length) === search;
        };
    }

    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith#Polyfill
    if (!sp.endsWith) {
        sp.endsWith = function (search, this_len) {
            if (this_len === undefined || this_len > this.length) {
                this_len = this.length;
            }
            return this.substring(this_len - search.length, this_len) === search;
        };
    }

})(String.prototype);
