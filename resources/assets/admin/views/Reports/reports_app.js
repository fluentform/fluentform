import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';

import { Button, Col, DatePicker, Input, Loading, Option, Radio, Row, Select, } from 'element-ui';
import App from './App.vue';

Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;


Vue.use(Button);
Vue.use(Input);
Vue.use(Select);
Vue.use(Option);
Vue.use(Radio);
Vue.use(DatePicker);
Vue.use(Row);
Vue.use(Col);

locale.use(lang);

Vue.mixin({
    methods: {
        $t(str) {
            let transString = window.fluent_forms_global_var.reports_i18n[str];
            if (transString) {
                return transString;
            }
            return str;
        }
    },
});
new Vue({
    el: '#ff_reports',
    components: {
        'ff-reports': App
    }
});
