import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';

import GlobalSettings from './GlobalSettings.vue';
import reCaptcha from './reCaptcha.vue';
import hCaptcha from './hCaptcha.vue';
import turnstile from './turnstile.vue';
import pdf_settings from './Pdf.vue';
import GeneralIntegrationSettings from './GeneralIntegrationSettings.vue';
import DoubleOptinSettings from './DoubleOptinSettings.vue';
import ManagersSettings from './ManagersSettings.vue';
import License from './License.vue';

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
    Pagination
} from 'element-ui';
import e from 'jquery-datetimepicker';

locale.use(lang);
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
Vue.prototype.$notify = Notification;
Vue.prototype.$loading = Loading.service;

Vue.mixin({
    methods: {
        $t(str) {
            let transString = window.FluentFormApp.form_settings_str[str];
            if(transString) {
                return transString;
            }
            return str;
        },

        ...notifier
    }
})

new Vue({
    el: '#ff_global_settings_option_app',
    components: {
        settings: GlobalSettings,
        re_captcha: reCaptcha,
        h_captcha: hCaptcha,
        turnstile: turnstile,
        pdf_settings: pdf_settings,
        'general-integration-settings': GeneralIntegrationSettings,
        'double_optin_settings': DoubleOptinSettings,
        managers: ManagersSettings,
        license: License

    },
    data: {
        component: 'settings',
        App: window.FluentFormApp,
        settings_key: ''
    },
    methods: {
        setRoute(hash) {
            // get component by hash
            let $el = jQuery('.ff_settings_list li').find('a[data-hash=' + hash + ']');
            let component = hash;
            if ($el.data('component')) {
                component = $el.data('component');
            }
            
            if (this.$options.components[component]) {
                jQuery('.ff_settings_list li').removeClass('active');
                $el.closest('.ff_list_button_item.has_sub_menu').addClass('active is-submenu');
                $el.closest('.ff_list_button_item.has_sub_menu .ff_list_submenu').slideDown();
                $el.parent().addClass('active');
                this.settings_key = jQuery($el).attr('data-settings_key');
                this.component = component;
            }
        }
    },
    created() {
        let hash = location.hash.substr(1) || 'settings';
        this.setRoute(hash);

        const that = this;
        jQuery('.ff_settings_list li a').on('click', function (e) {

            if(jQuery(this).attr('href') === '#'){
                e.preventDefault();
            }

            let hash = jQuery(this).attr('data-hash');
            let subMenu = jQuery(this).parent().find('.ff_list_submenu');

            if (hash) {
                that.setRoute(hash);
            }
            jQuery(this).parent().addClass('active').siblings().removeClass('active is-submenu');
            jQuery(this).parent().siblings().find('.ff_list_submenu').slideUp();

            subMenu.parent().toggleClass('is-submenu').siblings().removeClass('is-submenu');
            subMenu.slideToggle().parent().siblings().find('.ff_list_submenu').slideUp();
        });
    }
});

