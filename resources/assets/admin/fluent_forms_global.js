(function ($) {
    class FluentFormsGlobal {
        constructor() {
            const fluent_forms_global_var = window.fluent_forms_global_var;

            $.ajaxSetup({
                data:{
                    fluent_forms_admin_nonce: fluent_forms_global_var['fluent_forms_admin_nonce']
                }
            });
        }

        $get(data, url = window.ajaxurl) {
            return $.get(url, data);
        }

        $post(data, url = window.ajaxurl) {
            return $.post(url, data);
        }
    }

    window.FluentFormsGlobal = new FluentFormsGlobal();
})(jQuery)
