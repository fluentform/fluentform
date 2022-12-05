import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';

import {
    Button,
    Select,
    Table,
    TableColumn,
    Loading,
    Message,
    Notification,
    DatePicker,
    Row,
    Col,
    Radio,
    RadioGroup,
    RadioButton,
    Dialog,
    Checkbox,
    CheckboxGroup

} from 'element-ui';

Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;

Vue.use(Button);
Vue.use(Select);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(DatePicker);
Vue.use(Row)
Vue.use(Col)
locale.use(lang);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(RadioButton);
Vue.use(Dialog);
Vue.use(Checkbox);
Vue.use(CheckboxGroup);

Vue.mixin({
    methods: {
        $t(str) {
            return str;
        },
    },
    filters: {
        title(string){
            let name = string.replaceAll('_',' ')
            return name.toLowerCase().replace(/\b[a-z]/g, function(letter) {
                return letter.toUpperCase();
            });
        }
    },
});

import App from './App.vue';
new Vue({
    el: "#ff_admin_dashboard",
    components: {
        'ff-admin-dashboard': App
    }
});
