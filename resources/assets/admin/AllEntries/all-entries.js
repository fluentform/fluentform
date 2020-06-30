import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';

import {
    Button,
    ButtonGroup,
    Input,
    Checkbox,
    Select,
    Option,
    Radio,
    Table,
    TableColumn,
    Switch,
    Pagination,
    Loading,
    Message,
    Notification
} from 'element-ui';

Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;


Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Input);
Vue.use(Switch);
Vue.use(Checkbox);
Vue.use(Pagination);
Vue.use(Select);
Vue.use(Option);
Vue.use(Radio);
Vue.use(Table);
Vue.use(TableColumn);

import App from './App.vue';
locale.use(lang);

new Vue({
    el: "#ff_all_entries",
    components: {
        'ff-all-entries': App
    }
});