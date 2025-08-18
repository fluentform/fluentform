import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import Errors from "@/common/Errors.js";
import en from "element-plus/es/locale/lang/en";
import notifier from "@/admin/notifier.js";
import mitt from "mitt";
import { _$t } from "@/admin/helpers";

import {
    ElButton,
    ElRow,
    ElCol,
    ElRadio,
    ElCheckbox,
    ElCheckboxGroup,
    ElRadioGroup,
    ElSelect,
    ElOption,
    ElOptionGroup,
    ElInput,
    ElForm,
    ElFormItem,
    ElTooltip,
    ElSwitch,
    ElInputNumber,
    ElDatePicker,
    ElTable,
    ElTableColumn,
    ElPopover,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElCollapse,
    ElCollapseItem,
    ElSlider,
    ElTag,
    ElLoading,
    ElMessage,
    ElNotification,
    ElDialog,
    ElMessageBox,
    ElButtonGroup,
    ElColorPicker,
    ElTabs,
    ElTabPane,
    ElSkeleton,
    ElSkeletonItem,
    ElPopconfirm
} from "element-plus";

window.Errors = Errors;
const emitter = mitt();
const eventBus = mitt();
window.ffSettingsEvents = emitter;

import Slack from "./components/settings/Slack.vue";
import Zapier from "./components/settings/Zapier.vue";
import LandingPages from "./components/settings/LandingPage/index.vue";
import PostFeeds from "./components/settings/PostFeeds.vue";
import BasicSettings from "./components/settings/FormSettings.vue";
import Confirmations from "./components/settings/Confirmations.vue";
import EmailNotifications from "./components/settings/Notifications.vue";
import WebHook from "./components/settings/WebHook/WebHook.vue";
import CustomCssJs from "./components/settings/FormCustomCssJs.vue";
import GeneralIntegration from "./components/settings/GeneralIntegration/Integration.vue";
import EditGeneralIntegration from "./components/settings/GeneralIntegration/IntegrationEditor.vue";
import PdfFeeds from "./components/settings/PdfFeeds.vue";
import PaymentSettings from "./components/settings/PaymentSettings.vue";
import QuizSettings from "./components/settings/QuizSettings.vue";
import FFWpmlSettings from "./components/settings/FFWpmlSettings.vue";
import CustomComponent from "./components/CustomComponent.vue";

const components = [
    ElButton,
    ElRow,
    ElCol,
    ElRadio,
    ElCheckbox,
    ElCheckboxGroup,
    ElRadioGroup,
    ElSelect,
    ElOption,
    ElOptionGroup,
    ElInput,
    ElForm,
    ElFormItem,
    ElTooltip,
    ElSwitch,
    ElInputNumber,
    ElDatePicker,
    ElTable,
    ElTableColumn,
    ElPopover,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElCollapse,
    ElCollapseItem,
    ElSlider,
    ElTag,
    ElLoading,
    ElMessage,
    ElNotification,
    ElDialog,
    ElMessageBox,
    ElButtonGroup,
    ElColorPicker,
    ElTabs,
    ElTabPane,
    ElSkeleton,
    ElSkeletonItem,
    ElPopconfirm
];

const routes = [
    {
        path: "/:pathMatch(.*)*",
        name: "formSettingsHome",
        component: BasicSettings
    },
    {
        path: "/payment-settings",
        name: "payment_settings",
        component: PaymentSettings
    },
    {
        path: "/post-feeds",
        name: "post_feeds",
        component: PostFeeds
    },
    {
        path: "/slack",
        name: "slack",
        component: Slack
    },
    {
        path: "/email-settings",
        name: "formEmailSettings",
        component: EmailNotifications
    },
    {
        path: "/pdf-feeds",
        name: "PdfFeeds",
        component: PdfFeeds
    },
    {
        path: "/conditional-confirmations",
        name: "formOtherConfirmations",
        component: Confirmations
    },
    {
        path: "/all-integrations",
        name: "allIntegrations",
        component: GeneralIntegration
    },
    {
        path: "/all-integrations/:integration_id/:integration_name",
        name: "edit_integration",
        component: EditGeneralIntegration
    },
    {
        path: "/custom-css-js",
        name: "custom-css-js",
        component: CustomCssJs
    },
    {
        path: "/webhook",
        name: "webhook",
        component: WebHook
    },
    {
        path: "/zapier",
        name: "zapier",
        component: Zapier
    },
    {
        path: "/landing_pages",
        name: "landing_pages",
        component: LandingPages
    },
    {
        path: "/quiz_settings",
        name: "quiz_settings",
        component: QuizSettings
    },
    {
        path: "/ff-wpml",
        name: "ff_wpml",
        component: FFWpmlSettings
    },
    {
        path: "/custom-settings-component/:component_name",
        name: "custom_settings",
        component: CustomComponent
    }
];

const router = createRouter({
    history: createWebHashHistory("/wp-admin/admin.php?page=fluent_forms&form_id=" + window.FluentFormApp.form_id + "&route=settings&sub_route=form_settings"),
    routes
});

import App from "./components/settings/SettingsApp.vue";

const app = createApp(App);

components.forEach((component) => {
    app.use(component);
});

app.mixin({
    methods: {
        $t(string) {
            let transString = window.FluentFormApp.form_settings_str[string] || string;
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ""), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },
        // Vue 3 doesn't have filters, convert to methods
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        _startCase(string) {
            return _ff.startCase(string);
        },

        ...notifier
    }
});

app.provide('eventBus', eventBus);

app.config.globalProperties.$message = ElMessage;
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$confirm = ElMessageBox.confirm;
app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.Errors = Errors;
app.config.globalProperties.emitter = emitter;
app.config.globalProperties.$ELEMENT = {locale: en};

app.use(router);

// Check if mount element exists before mounting
const mountElement = document.getElementById('ff_form_settings_app');
if (mountElement) {
    app.mount('#ff_form_settings_app');
} else {
    console.warn('FluentForm Settings: Mount element #ff_form_settings_app not found. This script may be loading on the wrong page.');
}