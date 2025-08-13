import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';

import {
    DropdownMenu,
    Dropdown,
    DropdownItem,
    Tabs,
    TabPane,
    ColorPicker,
    Button,
    ButtonGroup,
    Input,
    Checkbox,
    Select,
    OptionGroup,
    Option,
    Collapse,
    CollapseItem,
    Popover,
    Slider,
    Loading,
    Message,
    Notification,
    RadioGroup,
    Radio,
    Switch
} from 'element-ui';

Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;


Vue.use(DropdownItem);
Vue.use(DropdownMenu);
Vue.use(Dropdown);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Input);
Vue.use(Tabs);
Vue.use(TabPane);
Vue.use(Checkbox);
Vue.use(ColorPicker);
Vue.use(Select);
Vue.use(Option);
Vue.use(OptionGroup);
Vue.use(Collapse);
Vue.use(CollapseItem);
Vue.use(Popover);
Vue.use(Slider);
Vue.use(Radio)
Vue.use(RadioGroup)
Vue.use(Switch)

import App from './App.vue';
import globalSearch from '@fluentform/admin/global_search'

locale.use(lang);

Vue.mixin({
    methods: {
        $t(str) {
            let transString = window.fluent_styler_vars.styler_str[str];
            if (transString) {
                return transString;
            }
            return str;
        }
    }
});

new Vue({
    el: "#ff_form_styler",
    components: {
        'ff-styler-app': App,
        globalSearch
    },
    data: {
        form_vars: window.fluent_styler_vars
    }
});
