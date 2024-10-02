import initNetPromoter from "./Pro/dom-net-promoter";
import {initRepeatButtons, initRepeater} from './Pro/dom-repeat';
import ratingDom from './Pro/dom-rating';
import formConditional from "./Pro/form-conditionals";
import fileUploader from './Pro/file-uploader';
import formSlider from './Pro/slider';
import calculation from './Pro/calculations';

(function ($) {
    $(document.body).on('fluentform_init', function (e, $theForm, form) {
        const formInstanceSelector = $theForm.attr('data-form_instance');

        if (!form) {
            console.log('No Fluent form JS vars found!');
            return;
        }

        const formId = form.form_id_selector;
        const formSelector = '.' + form.form_instance;

       function maybeUpdateDynamicLabels(workStep) {
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

                    // maybe it's a multi-select item
                    if (!refElement.length) {
                        refElement = $theForm.find('*[name="' + ref + '[]"]').find('option:selected');
                        separator = ', ';
                    }
                }

                var refValues = [];
                if (!refElement.length) {
                    // This may repeater field
                    let $rows = $theForm.find('.ff-el-repeater[data-name="' + ref + '"] tbody tr');
                    $rows.each(function(index) {
                        let $inputsInRow = $(this).find('input, select');
                        let inputGroup = [];
                        $inputsInRow.each(function(colIndex) {
                            let value = $(this).val();
                            if (value) {
                                let label = $(this).closest('td').data('label') || 'Column-' + (colIndex + 1);
                                inputGroup.push(label + ': ' + value);
                            }
                        });
                        if (inputGroup.length) {
                            refValues.push('#' + (index + 1) + '- ' + inputGroup.join(' | '));
                        }
                    });
                    if ($rows.length) {
                        separator = '<br/>';
                    }
                }

                $.each(refElement, function () {
                    let inputValue = $(this).val();
                    let conditionallyHidden = $(this).closest('.ff-el-group.has-conditions').hasClass('ff_excluded');
                    // if(inputValue) {
                    //     let tagName = $(this).prop("tagName");
                    //     if (tagName == 'OPTION') {
                    //         inputValue = $(this).text();
                    //     } else if (tagName == 'SELECT') {
                    //         inputValue = $(this).find('option:selected').text();
                    //     } else if (tagName == 'INPUT' && $(this).attr('type') == 'checkbox') {
                    //         inputValue = $(this).parent().find('span').html();
                    //     }
                    // }
                    if (inputValue && !conditionallyHidden) {
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
        }

        /*
        * Normals
         */
        fileUploader($, $theForm, form, window.fluentFormVars, formSelector);
        initRepeater($theForm);
        initRepeatButtons($, $theForm);
        formConditional($, $theForm, form, window.fluentFormVars);
        calculation($, $theForm);
        ratingDom($, $theForm);
        initNetPromoter($, $theForm);

        if($theForm.hasClass('ff-form-has-steps')) {
            const sliderInstance = formSlider($, $theForm, window.fluentFormVars, formSelector);
            sliderInstance.init();
            $theForm.on('update_slider', function (e, data) {
                sliderInstance.updateSlider(
                    data.goBackToStep,
                    data.animDuration,
                    data.isScrollTop,
                    data.actionType
                );
            });
        }

        if($theForm.hasClass('ff_has_dynamic_smartcode')) {
            $theForm.on('ff_render_dynamic_smartcodes', function (e, selector) {
                maybeUpdateDynamicLabels($(selector));
            });

            $theForm.on('keyup change', ':input', function () {
                maybeUpdateDynamicLabels($theForm);
            });

            maybeUpdateDynamicLabels($theForm);
        }
        
    });
})(jQuery);

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

    // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes
    if (!sp.includes) {
        sp.includes = function (search, start) {
            if (search instanceof RegExp) {
                throw TypeError('first argument must not be a RegExp');
            }
            if (start === undefined) {
                start = 0;
            }
            return this.indexOf(search, start) !== -1;
        };
    }

})(String.prototype);
