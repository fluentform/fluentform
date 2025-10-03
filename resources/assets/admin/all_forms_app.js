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
    DropdownItem,
    Switch,
    DatePicker,
    RadioButton,
    Skeleton,
    SkeletonItem,
    MessageBox
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
Vue.use(Switch);
Vue.use(DatePicker);
Vue.use(RadioButton);
Vue.use(Skeleton);
Vue.use(SkeletonItem);

Vue.use(Loading.directive)
Vue.prototype.$loading = Loading.service
Vue.prototype.$notify = Notification
Vue.prototype.$message = Message
Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$prompt = MessageBox.prompt;

import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'
// configure language
locale.use(lang);

import Acl from '@/common/Acl';

import AllForms from './views/AllForms.vue';
import globalSearch from './global_search'
import notifier from './notifier';
import { _$t } from './helpers';

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
        },

        hasPermission(permission) {
            return (new Acl).verify(permission);
        },

        ...notifier
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
        globalSearch,
        'ff_all_forms_table': AllForms
    },
    data: {},
    beforeCreate() {
        this.$on('change-title', (module) => {
            jQuery('title').text(`${module} - Fluent Forms`);
        });
        this.$emit('change-title', 'Forms');
    }
});
