import initNetPromoter from "./Pro/dom-net-promoter";
import {initRepeatButtons, initRepeater} from './Pro/dom-repeat';
import ratingDom from './Pro/dom-rating';
import formConditional from "./Pro/form-conditionals";
import fileUploader from './Pro/file-uploader';
import formSlider from './Pro/slider';
import calculation from './Pro/calculations'

jQuery(document).ready(function () {
    (function ($) {
        /*
        * Common Functions for All The Forms
         */
        initNetPromoter($);
        initRepeatButtons($);
        ratingDom($);

        /*
        * Form Specific Actions
         */
        var $allForms = $('.frm-fluent-form');
        $.each($allForms, function (formInDex, formItem) {
            let $theForm = $(formItem);
            const formInstanceSelector = $theForm.attr('data-form_instance');
            const form = window['fluent_form_' + formInstanceSelector];
            if (!form) {
                console.log('No Fluent form JS vars found!');
                return;
            }
            const formId = form.form_id_selector;
            const formSelector = '.' + form.form_instance;

            const sliderInstance = formSlider($, $theForm, window.fluentFormVars, formSelector);

            /*
            * Normals
             */
            fileUploader($, $theForm, form, window.fluentFormVars, formSelector);
            initRepeater($theForm);
            formConditional($, $theForm, form, window.fluentFormVars);
            sliderInstance.init();
            calculation($, $theForm);

            $theForm.on('update_slider', function (e, data) {
                sliderInstance.updateSlider(
                    data.goBackToStep,
                    data.animDuration,
                    data.isScrollTop,
                    data.actionType
                );
            });

            /*
            * Extras
             */
            jQuery(document).on('reInitExtras', formSelector, function () {
                $theForm = jQuery('form'+formSelector);
                let formSliderInstance = formSlider(jQuery, $theForm, window.fluentFormVars, formSelector);
                formSliderInstance.init();
                initRepeater($theForm);
                formConditional($, $theForm, form);
                calculation($, $theForm);
            });

        });
    })(jQuery);
});

// Polyfill for startsWith and endsWith
(function (sp) {
    if (!sp.startsWith)
        sp.startsWith = function (str) {
            return !!(str && this) && !this.lastIndexOf(str, 0)
        }
    if (!sp.endsWith)
        sp.endsWith = function (str) {
            var offset = str && this ? this.length - str.length : -1
            return offset >= 0 && this.lastIndexOf(str, offset) === offset
        }
})(String.prototype);
