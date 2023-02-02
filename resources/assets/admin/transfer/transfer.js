import Vue from 'vue';

import {
    Button,
    Form,
    FormItem,
    Tooltip,
    Row,
    Col,
    Select,
    Option,
    Table,
    TableColumn,
    Pagination,
    Popover,
    Notification,
    Tabs,
    TabPane,
    Loading,
    Tag
} from 'element-ui';

Vue.use(Button);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Tooltip);
Vue.use(Row);
Vue.use(Col);
Vue.use(Select);
Vue.use(Option);
Vue.use(Pagination);
Vue.use(Popover);
Vue.use(Tabs);
Vue.use(TabPane);
Vue.use(Tag);


Vue.prototype.$notify = Notification;
Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;

import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'
// configure language
locale.use(lang);
import notifier from '@/admin/notifier';
import ExportForms from './ExportForms';
import ImportForms from './ImportForms';
import ActivityLogs from './ActivityLogs';
import ApiLogs from './ApiLogs';
import Migrator from './Migrator';

Vue.mixin({
    methods:{
        $t(str) {
            let transString = window.FluentFormApp.transfer_str[str];
            if(transString) {
                return transString;
            }
            return str;
        },
        ...notifier
    }
})
new Vue({
    el: '#ff_transfer_app',
    components: {
        exportforms: ExportForms,
        importforms: ImportForms,
        activitylogs: ActivityLogs,
        apilogs: ApiLogs,
        migrator: Migrator
    },
    data: {
        component: 'exportforms',
        App: window.FluentFormApp
    },
    methods: {
        setRoute(component) {

            if (this.$options.components[component]) {
                let $listItems = jQuery('.ff_admin_menu_list li').removeClass('active');

                $listItems.find('a[data-hash=' + component + ']').parent().addClass('active');

                this.component = component;
            }
        }
    },
    created() {
        let currentRoute = location.hash.substr(1);

        if (currentRoute) {
            this.setRoute(currentRoute);
        }

        jQuery(document).ready(() => {
            const that = this;
            jQuery('.ff_admin_menu_list li a').on('click', function () {
                let component = jQuery(this).attr('data-hash');

                that.setRoute(component);
            });
        });
    },
    mounted(){
        jQuery('body').addClass('ff_footer_none');
    }
});
