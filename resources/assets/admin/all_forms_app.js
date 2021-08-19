import './helpers';

import Vue from 'vue';

import {
    Row,
    Col,
    Button,
    ButtonGroup,
    Input,
    Dialog,
    Form,
    FormItem,
    Select,
    Option,
    RadioGroup,
    Radio,
    Popover,
    Tooltip,
    Loading,
    Message,
    Notification,
    Table,
    TableColumn,
    Tag,
    Pagination,
    Dropdown,
    DropdownMenu,
    DropdownItem
} from 'element-ui';

Vue.use(ButtonGroup);
Vue.use(Row);
Vue.use(Col);
Vue.use(Table);
Vue.use(Tag);
Vue.use(Pagination);
Vue.use(Dropdown);
Vue.use(DropdownMenu);
Vue.use(DropdownItem);
Vue.use(TableColumn);
Vue.use(Tooltip);
Vue.use(Popover);
Vue.use(RadioGroup);
Vue.use(Radio);
Vue.use(Select);
Vue.use(Option);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Dialog);
Vue.use(Input);
Vue.use(Button);

Vue.use(Loading.directive)
Vue.prototype.$loading = Loading.service
Vue.prototype.$notify = Notification
Vue.prototype.$message = Message

import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'
// configure language
locale.use(lang);

import AllForms from './views/AllForms.vue';

Vue.mixin({
    methods: {
        $t(str) {
            let transString = window.fluent_forms_global_var.admin_i18n[str];
            if(transString) {
                return transString;
            }
            return str;
        }
    },
    filters: {
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        _startCase(string) {
            return _ff.startCase(string);
        }
    }
});

new Vue({
    el: '#ff_all_forms_app',
    components: {
        'ff_all_forms_table': AllForms
    },
    data: {},
    beforeCreate() {
        this.$on('change-title', (module) => {
            jQuery('title').text(`${module} - FluentForm`);
        });
        this.$emit('change-title', 'All Forms');
    }
});
