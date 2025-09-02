import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';

import GlobalSettings from './GlobalSettings.vue';
import reCaptcha from './reCaptcha.vue';
import hCaptcha from './hCaptcha.vue';
import turnstile from './turnstile.vue';
import cleantalk from './cleantalk.vue';
import pdf_settings from './Pdf.vue';
import GeneralIntegrationSettings from './GeneralIntegrationSettings.vue';
import DoubleOptinSettings from './DoubleOptinSettings.vue';
import ManagersSettings from './ManagersSettings.vue';
import InventoryManager from './InventoryManager.vue';
import PaymentSettings from './Payments/App.vue';


import License from './License.vue';
import globalSearch from '../global_search'

import Errors from '@/common/Errors';
global.Errors = Errors;

import notifier from '@/admin/notifier';

import {
    Button,
    Radio,
    RadioGroup,
    Form,
    FormItem,
    Input,
    Tooltip,
    Row,
    Col,
    Select,
    Option,
    OptionGroup,
    Switch,
    Dialog,
    Loading,
    Notification,
    Checkbox,
    CheckboxGroup,
    ColorPicker,
    InputNumber,
    Table,
    TableColumn,
    Tag,
    Popover,
    Pagination,
    Skeleton,
    SkeletonItem,
    Tabs,
    TabPane,
    DatePicker,
    RadioButton,
    Popconfirm
} from 'element-ui';
import e from 'jquery-datetimepicker';
import {_$t, handleSidebarActiveLink} from '@/admin/helpers';
import CustomComponent from '@/admin/components/CustomComponent';

locale.use(lang);

// Use all components
Vue.use(Button);
Vue.use(Form);
Vue.use(Row);
Vue.use(Col);
Vue.use(Input);
Vue.use(Checkbox);
Vue.use(CheckboxGroup);
Vue.use(Select);
Vue.use(Option);
Vue.use(OptionGroup);
Vue.use(Switch);
Vue.use(Tooltip);
Vue.use(FormItem);
Vue.use(Loading.directive);
Vue.use(InputNumber);
Vue.use(ColorPicker);
Vue.use(RadioGroup);
Vue.use(Radio);
Vue.use(Dialog);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Tag);
Vue.use(Popover);
Vue.use(Pagination);
Vue.use(Skeleton);
Vue.use(SkeletonItem);
Vue.use(Tabs);
Vue.use(TabPane);
Vue.use(DatePicker);
Vue.use(RadioButton);
Vue.use(Popconfirm);

Vue.prototype.$notify = Notification;
Vue.prototype.$loading = Loading.service;

const is_payment_compatible = window.FluentFormApp.is_payment_compatible;

if (is_payment_compatible) {
    Vue.prototype.payment_vars = window.ff_payment_settings || {};
}

Vue.mixin({
    methods: {
        $t(string) {
            let transString = window.FluentFormApp.form_settings_str[string] || window.fluent_forms_global_var.payments_str[string] || string
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ''), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },
        ...notifier,
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
    }
})

const components = {
    globalSearch,
    settings: GlobalSettings,
    re_captcha: reCaptcha,
    h_captcha: hCaptcha,
    turnstile: turnstile,
    cleantalk: cleantalk,
    pdf_settings: pdf_settings,
    'general-integration-settings': GeneralIntegrationSettings,
    'double_optin_settings': DoubleOptinSettings,
    managers: ManagersSettings,
    inventory_manager: InventoryManager,
    custom_component: CustomComponent,
    license: License
};

if (is_payment_compatible) {
    components.payment_component = PaymentSettings;
}

new Vue({
    el: '#ff_global_settings_option_app',
    components: components,
    data: {
        component: 'settings',
        App: window.FluentFormApp,
        component_name: '',
        settings_key: ''
    },
    methods: {
        setRoute($el, $originalEl = false) {
            // get component by hash
            let hash = $el.data('hash');
            if (is_payment_compatible && hash.startsWith('payments/')) {
                this.component = 'payment_component';
                this.component_name = hash;
                return;
            }

            let component = hash;
            if ($el.data('component')) {
                component = $el.data('component');
            }
            if (this.$options.components[component]) {
                this.settings_key = jQuery($el).attr('data-settings_key');
                this.component_name = $el.data('component_name') || '';
                this.component = component;
                location.hash = hash;
            } else if ($originalEl && $originalEl.hasClass('ff-payment-settings-root')) {
                location.href = $el.attr('href');
                return 'redirected';
            }
        },
        maybeGetFirstSubLink($el) {
            if (
                $el.attr('href') === '#' &&
                $el.parent().hasClass('has_sub_menu') &&
                $el.parent().find('ul.ff_list_submenu li:first a').length
            ) {
                $el = $el.parent().find('ul.ff_list_submenu li:first a');
            }
            return $el;
        }
    },
    created() {
        let hash = location.hash.substr(1) || 'settings';
        let $el;
        if (is_payment_compatible && hash.startsWith('payments/')) {
            $el = jQuery('.ff_settings_list li').find('a[data-hash="' + hash + '"]').first();
        } else {
            $el = jQuery('.ff_settings_list li').find('a[data-hash=' + hash + ']').first();
        }
        if ($el.length) {
            $el = this.maybeGetFirstSubLink($el);
            this.setRoute($el);
            handleSidebarActiveLink($el.parent(), true , true);
        }
        const that = this;
        jQuery('.ff_settings_list li a').on('click', function (e) {
            $el = jQuery(this);
            if($el.attr('href') === '#') e.preventDefault();
            if (that.setRoute(that.maybeGetFirstSubLink($el), $el) === 'redirected') {
                return;
            }
            handleSidebarActiveLink($el.parent())
        });
    }
});