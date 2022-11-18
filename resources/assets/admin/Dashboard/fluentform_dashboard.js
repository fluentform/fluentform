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
    Carousel,
    CarouselItem

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
Vue.use(Carousel)
Vue.use(CarouselItem)
locale.use(lang);

Vue.mixin({

    methods: {
        $t(str) {
            return str;
        },
    },
});


import App from './App.vue';

new Vue({
    el: "#ff_admin_dashboard",
    components: {
        'ff-admin-dashboard': App
    }
});
