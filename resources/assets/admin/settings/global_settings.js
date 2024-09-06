import { createApp } from 'vue';
import { useLocale } from 'element-plus';
import en from 'element-plus/es/locale/lang/en';

// Import your components
import GlobalSettings from './GlobalSettings.vue';
import reCaptcha from './reCaptcha.vue';
import hCaptcha from './hCaptcha.vue';
import turnstile from './turnstile.vue';
import pdf_settings from './Pdf.vue';
import GeneralIntegrationSettings from './GeneralIntegrationSettings.vue';
import DoubleOptinSettings from './DoubleOptinSettings.vue';
import ManagersSettings from './ManagersSettings.vue';
import InventoryManager from './InventoryManager.vue';
import License from './License.vue';
import globalSearch from '../global_search';

// Import Element Plus components
import {
    ElButton,
    ElRadio,
    ElRadioGroup,
    ElForm,
    ElFormItem,
    ElInput,
    ElTooltip,
    ElRow,
    ElCol,
    ElSelect,
    ElOption,
    ElOptionGroup,
    ElSwitch,
    ElDialog,
    ElLoading,
    ElNotification,
    ElCheckbox,
    ElCheckboxGroup,
    ElColorPicker,
    ElInputNumber,
    ElTable,
    ElTableColumn,
    ElTag,
    ElPopover,
    ElPagination,
    ElSkeleton,
    ElSkeletonItem,
} from 'element-plus';

import { handleSidebarActiveLink } from '@/admin/helpers';
import CustomComponent from '@/admin/components/CustomComponent';
import Errors from '@/common/Errors';
import notifier from '@/admin/notifier';

// Locale configuration
const locale = useLocale();
locale.locale(en);

// Create Vue app
const app = createApp({
    components: {
        globalSearch,
        GlobalSettings,
        reCaptcha,
        hCaptcha,
        turnstile,
        pdf_settings,
        GeneralIntegrationSettings,
        DoubleOptinSettings,
        ManagersSettings,
        InventoryManager,
        License,
        CustomComponent
    },
    data() {
        return {
            component: 'settings',
            App: window.FluentFormApp,
            component_name: '',
            settings_key: ''
        };
    },
    methods: {
        setRoute($el, $originalEl = false) {
            let hash = $el.data('hash');
            let component = hash;
            if ($el.data('component')) {
                component = $el.data('component');
            }
            if (this.$options.components[component]) {
                this.settings_key = jQuery($el).attr('data-settings_key');
                this.component_name = $el.data('component_name') || '';
                this.component = component;
                location.hash = hash;
            } else if ($originalEl &&
                $originalEl.hasClass('ff-payment-settings-root')
            ) {
                location.href = $el.attr('href');
                return 'redirected';
            }
            return '';
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
        let $el = jQuery('.ff_settings_list li').find('a[data-hash=' + hash + ']').first();
        if ($el.length) {
            $el = this.maybeGetFirstSubLink($el);
            this.setRoute($el);
            handleSidebarActiveLink($el.parent(), true, true);
        }
        const that = this;
        jQuery('.ff_settings_list li a').on('click', function (e) {
            $el = jQuery(this);
            if ($el.attr('href') === '#') e.preventDefault();
            if (that.setRoute(that.maybeGetFirstSubLink($el), $el) === 'redirected') {
                return;
            }
            handleSidebarActiveLink($el.parent());
        });
    }
});

// Register global properties and Element Plus components
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.Errors = Errors;
app.mixin({
    methods: {
        $t(str) {
            let transString = window.FluentFormApp.form_settings_str[str];
            if (transString) {
                return transString;
            }
            return str;
        },
        ...notifier
    }
});

// Use Element Plus components
app.use(ElButton);
app.use(ElForm);
app.use(ElRow);
app.use(ElCol);
app.use(ElInput);
app.use(ElCheckbox);
app.use(ElCheckboxGroup);
app.use(ElSelect);
app.use(ElOption);
app.use(ElOptionGroup);
app.use(ElSwitch);
app.use(ElTooltip);
app.use(ElFormItem);
app.use(ElLoading.directive);
app.use(ElInputNumber);
app.use(ElColorPicker);
app.use(ElRadioGroup);
app.use(ElRadio);
app.use(ElDialog);
app.use(ElTable);
app.use(ElTableColumn);
app.use(ElTag);
app.use(ElPopover);
app.use(ElPagination);
app.use(ElSkeleton);
app.use(ElSkeletonItem);

// Mount the app
app.mount('#ff_global_settings_option_app');