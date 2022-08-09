import formSlider from "./Pro/slider";

(function ($) {
    $(document.body).on('fluentform_init', function (e, $theForm, form) {

        const formSelector = '.' + form.form_instance;
        let hash = -1;
        let activeStep = 'no';
        let hasSaveProgress = $(formSelector).hasClass('ff-form-has-save-progress');
        if (!hasSaveProgress) {
            return;
        }

        let hasFormStep = $(formSelector).hasClass('ff-form-has-steps');

        if (hasFormStep) {
            $theForm.on('ff_to_next_page', function (e, currentStep) {
                activeStep = currentStep;
            });
            $theForm.on('ff_to_prev_page', function (e, currentStep) {
                activeStep = currentStep;
            });

        }


        $(formSelector).on('click', '.ff-btn-save-progress', function (e) {
            e.preventDefault();
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
                source_url: window.form_state_save_vars.source_url,
                action: 'fluentform_save_form_progress_with_link',
                data: inputData,
                form_id: $theForm.data('form_id'),
                hash: hash,
                active_step: activeStep
            };
            jQuery.post(fluentFormVars.ajaxUrl, formData).then(data => {
                if (data) {
                    hash = data.data.hash;
                    const $linkDom = $theForm.find('.ff-saved-state-link');
                    if ($linkDom.length) {
                        $linkDom.find('input').val(data.data.saved_url);
                        return;
                    }

                    let label = '<div class="ff-el-input--label"><label>Copy Link</label></div>';
                    let inputDiv = `<div class="ff-el-input--content"><input readonly value="${data.data.saved_url}" class="ff-el-form-control" ></div>`;
                    let inputGroup = $('<div/>', {class: 'ff-el-group ff-saved-state-link', html: label + inputDiv});

                    $(this).closest('.ff-el-group').after(
                        inputGroup
                    )
                }
            });

        });

        //load data
        let hashKey = false;
        if (typeof window.form_state_save_vars !== 'undefined') {
            hashKey = window.form_state_save_vars.key;
        }
        if (!hashKey) {
            return;
        }
        $theForm.append(`<input type="hidden" value="${hashKey}" class="__fluent_state_hash" name="__fluent_state_hash"/>`)

        jQuery.getJSON(fluentFormVars.ajaxUrl, {
            form_id: $theForm.data('form_id'),
            action: 'fluentform_get_form_state',
            hash: hashKey,
        }).then(data => {
            if (data) {
                const sliderInstance = formSlider($, $theForm, window.fluentFormVars, formSelector);
                sliderInstance.populateFormDataAndSetActiveStep(data);
            }
        });
    })

})(jQuery);

