import initNetPromoter from "./Pro/dom-net-promoter";
import {initRepeatButtons, initRepeater} from './Pro/dom-repeat';
import ratingDom from './Pro/dom-rating';
import formConditional from "./Pro/form-conditionals";
import fileUploader from './Pro/file-uploader';
import formSlider from './Pro/slider';
import calculation from './Pro/calculations'
(function ($) {
    $(document).on('fluentform_init', function (e, $theForm, form) {
        const formInstanceSelector = $theForm.attr('data-form_instance');

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
        initRepeatButtons($, $theForm);
        formConditional($, $theForm, form, window.fluentFormVars);
        sliderInstance.init();
        calculation($, $theForm);
        ratingDom($, $theForm);
        initNetPromoter($, $theForm);

        $theForm.on('update_slider', function (e, data) {
            sliderInstance.updateSlider(
                data.goBackToStep,
                data.animDuration,
                data.isScrollTop,
                data.actionType
            );
        });
    });
})(jQuery);