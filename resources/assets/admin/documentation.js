import Vue from 'vue';
import globalSearch from './global_search';
import {
    Loading
} from 'element-ui';
import {_$t} from "@/admin/helpers";

Vue.use(Loading);

Vue.mixin({
    methods: {
        $t(string) {
            let transString = window.fluent_forms_global_var.admin_i18n[string] || string
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ''), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        }
    }
});

var app = new Vue({
    el: '#ff_documentation_app',
    components: {
        globalSearch
    }
});
