import Request from "./Request.js";
import Rest from "./Rest.js";

(function ($) {
    class FluentFormsGlobal {
        constructor() {
            this.fluent_forms_global_var = window.fluent_forms_global_var;
            this.url = fluent_forms_global_var.ajaxurl;

            $.ajaxSetup({
                data:{
                    fluent_forms_admin_nonce: this.fluent_forms_global_var.fluent_forms_admin_nonce
                }
            });
        }

        $get(data, url = '') {
            url = url || this.url;

            return $.get(url, data);
        }

        $post(data, url = '') {
            url = url || this.url;

            return $.post(url, data);
        }

        request = Request;

        $rest = Rest;
    }
    window.FluentFormsGlobal = new FluentFormsGlobal();

    // jQuery('.update-nag, .notice:not(.ff_form_wrap .notice):not(.ff_notice_review_query), #wpbody-content > .updated, #wpbody-content > .error:not(.error_notice_ff_fluentform_pro_license)').remove();

})(jQuery)
