import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';
import Acl from '../common/Acl';

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
    TableColumn,
    Tooltip
} from 'element-ui';
import App from './PaymentEntries/App.vue';
import globalSearch from './global_search';
let tooltipDateTime = function(dateTime) {
    return dateTime;
};
let humanDiffTime = function(dateTime) {
    return dateTime;
};
try {
    const helpers = require('./helpers');
    tooltipDateTime = helpers.tooltipDateTime || tooltipDateTime;
    humanDiffTime = helpers.humanDiffTime || humanDiffTime;
} catch (error) {
}

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
Vue.use(Tooltip);

locale.use(lang);
Vue.mixin({
    methods: {
        $t(str) {
            return str;
        },

        hasPermission(permission) {
            return (new Acl).verify(permission);
        },
        tooltipDateTime,
        humanDiffTime

    }
});
new Vue({
    el: "#ff_payment_entries",
    components: {
        globalSearch,
        'ff-payment-entries': App
    }
});
