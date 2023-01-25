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
    Alert
    
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
Vue.use(RadioButton);
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
Vue.use(Alert);

Vue.use(Loading.directive)
Vue.prototype.$loading = Loading.service
Vue.prototype.$notify = Notification
Vue.prototype.$message = Message

import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'

// configure language
locale.use(lang);

import Acl from '@/common/Acl';

import AddNewForms from './views/AddNewForms.vue';
import notifier from './notifier';

Vue.mixin({
    methods: {
        $t(str) {
            let transString = window.fluent_forms_global_var.admin_i18n[str];
            if(transString) {
                return transString;
            }
            return str;
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
    el: '#ff_add_new_forms_app',
    components: {
        'ff_add_new_forms': AddNewForms
    },
    data: {},
    beforeCreate() {
        this.$on('change-title', (module) => {
            jQuery('title').text(`${module} - FluentForm`);
        });
        this.$emit('change-title', 'Add new forms');
    }
});
