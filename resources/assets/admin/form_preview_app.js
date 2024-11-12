import Vue from 'vue';
import PreviewApp from './preview/App.vue'
import globalSearch from './global_search';
import {
    Loading,
    Button,
    Select,
    Option,
    Notification
} from 'element-ui';
import {_$t} from "@/admin/helpers";

Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;
Vue.prototype.$notify = Notification;

Vue.use(Button);
Vue.use(Select);
Vue.use(Option);

Vue.mixin({
    methods: {
        $t(string) {
            let transString = window.fluent_preview_vars?.i18n[string] || string
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ''), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },
    }
});

new Vue({
    el: '#ff_form_preview_app',
    components: {
        PreviewApp,
        globalSearch
    }
});
