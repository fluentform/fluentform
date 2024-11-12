import Vue from 'vue';
import AddOnModules from './views/AddonModules';
import notifier from './notifier';
import globalSearch from './global_search';

import {
    Button,
    Select,
    Input,
    Switch,
    Notification,
    RadioButton,
    Radio,
    RadioGroup,
    Row,
    Col,
    Loading
} from 'element-ui';
import {_$t} from "@/admin/helpers";

Vue.use(RadioButton);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);
Vue.use(Switch);
Vue.use(Row);
Vue.use(Col);
Vue.use(Loading);

Vue.prototype.$notify = Notification;

Vue.mixin({
    methods: {
        $t(string) {
            let transString = window.fluent_addon_modules.addOnModule_str[string] || string
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ''), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },
        ...notifier
    }
});

var app = new Vue({
    el: '#ff_add_ons_app',
    components: {
        globalSearch,
        'fluent-add-ons': AddOnModules
    }
});
