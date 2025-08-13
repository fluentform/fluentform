import Vue from 'vue';
import VueRouter from 'vue-router';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';
import notifier from '@fluentform/admin/notifier'
import Errors from '@fluentform/common/Errors';
import { handleSidebarActiveLink } from '@fluentform/admin/helpers'
global.Errors = Errors;

import {
    Tabs,
    TabPane,
    ColorPicker,
    Button,
    ButtonGroup,
    Input,
    Checkbox,
    Select,
    Option,
    Collapse,
    CollapseItem,
    Popover,
    Slider,
    Form,
    Row,
    Col,
    Table,
    TableColumn,
    FormItem,
    Radio,
    RadioGroup,
    Switch,
    Tooltip,
    Dialog,
    DatePicker,
    Pagination,
    CheckboxGroup,
    Menu,
    MenuItem,
    Loading,
    Message,
    Notification,
    Popconfirm,
    RadioButton,
    Skeleton,
    SkeletonItem
} from 'element-ui';

import GeneralSettings from './Components/GeneralSettings.vue';
import Coupons from "./Components/Coupons.vue";
import PaymentMethods from "./Components/payment_methods.vue";


Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;

Vue.prototype.app_vars = window.ff_payment_settings;


Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Input);
Vue.use(Popconfirm);
Vue.use(Form);
Vue.use(Tooltip);
Vue.use(FormItem);
Vue.use(Radio);
Vue.use(Row);
Vue.use(Col);
Vue.use(RadioGroup);
Vue.use(Checkbox);
Vue.use(Menu);
Vue.use(MenuItem);
Vue.use(Tabs);
Vue.use(Switch);
Vue.use(TabPane);
Vue.use(CheckboxGroup);
Vue.use(Checkbox);
Vue.use(ColorPicker);
Vue.use(Select);
Vue.use(Option);
Vue.use(Collapse);
Vue.use(CollapseItem);
Vue.use(Popover);
Vue.use(Slider);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Dialog);
Vue.use(DatePicker);
Vue.use(Pagination);
Vue.use(RadioButton);
Vue.use(Skeleton);
Vue.use(SkeletonItem);

Vue.use(VueRouter)


import App from './App.vue';
locale.use(lang);


const routes = [
    {
        path: '*',
        name: 'home',
        component: GeneralSettings,
        props: true
    },
    {
        name: 'coupons',
        path: '/coupons',
        component: Coupons
    },
    {
        name: 'payment_methods',
        path: '/payment_methods',
        component: PaymentMethods,
        props: true
    }
]

const router = new VueRouter({
    routes: routes
});

Vue.mixin({
    methods: {
        $t(str) {
            let transString = window.fluent_forms_global_var.admin_i18n[str];
            if (transString) {
                return transString;
            }
            return str;
        },
        
        ...notifier,
        getElement(hash) {
            if (hash.length && '/' === hash[0]) hash = ('#' + hash);
            return jQuery('.ff_settings_list li').find('a[data-hash="' + hash + '"]');
        }
    },
});

new Vue({
    el: "#ff-payment-settings",
    render: h => h(App),
    router: router,
    created() {
        if (this.$route.path === '/stripe') {
            this.$router.push({ name: 'payment_methods' });
        }

        let hash = location.hash.substr(1) || '/';
        const $el = this.getElement(hash);
        handleSidebarActiveLink($el.parent(), true)

        const that = this;
        jQuery('.ff_settings_list a').on('click', function (e) {
            let $el = jQuery(this);
            if ($el.attr('href') === '#') {
                e.preventDefault();

                // redirect if not a payment link
                if (
                    $el.parent().hasClass('has_sub_menu') &&
                    !($el.hasClass('ff-payment-settings-root')) &&
                    $el.parent().find('ul.ff_list_submenu li:first a').length
                ) {
                    $el = $el.parent().find('ul.ff_list_submenu li:first a');
                    location.href = $el.attr('href');
                    return;
                }
            }
            $el = that.getElement($el.attr('data-hash'))
            handleSidebarActiveLink($el.parent())
        });
    }
});