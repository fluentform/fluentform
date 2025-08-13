import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';
import Acl from '@fluentform/common/Acl';

import {
    Button,
    ButtonGroup,
    Checkbox,
    Input,
    Loading,
    Message,
    Notification,
    Option,
    Pagination,
    Radio,
    Select,
    Skeleton,
    SkeletonItem,
    Switch,
    Table,
    TableColumn
} from 'element-ui';
import App from './App.vue';
import globalSearch from '@fluentform/admin/global_search'

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
Vue.use(Skeleton);
Vue.use(SkeletonItem);

locale.use(lang);
Vue.mixin({
    methods: {
        $t(str) {
            return str;
        },

        hasPermission(permission) {
            return (new Acl).verify(permission);
        }
    }
});
new Vue({
    el: "#ff_payment_entries",
    components: {
        globalSearch,
        'ff-payment-entries': App
    }
});
