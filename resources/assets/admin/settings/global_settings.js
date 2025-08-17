import { createApp } from "vue";
import en from "element-plus/es/locale/lang/en";
import "element-plus/dist/index.css";

// Import your components
import GlobalSettings from "./GlobalSettings.vue";
import reCaptcha from "./reCaptcha.vue";
import hCaptcha from "./hCaptcha.vue";
import turnstile from "./turnstile.vue";
import cleantalk from "./cleantalk.vue";
import pdf_settings from "./Pdf.vue";
import GeneralIntegrationSettings from "./GeneralIntegrationSettings.vue";
import DoubleOptinSettings from "./DoubleOptinSettings.vue";
import ManagersSettings from "./ManagersSettings.vue";
import InventoryManager from "./InventoryManager.vue";
import PaymentSettings from "./Payments/App.vue";
import License from "./License.vue";
import globalSearch from "../global_search";

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
    ElTabs,
    ElTabPane,
    ElDatePicker,
    ElRadioButton,
    ElPopconfirm
} from "element-plus";

import { _$t, handleSidebarActiveLink } from "@/admin/helpers.js";
import CustomComponent from "@/admin/components/CustomComponent.vue";
import Errors from "@/common/Errors.js";
import notifier from "@/admin/notifier.js";

global.Errors = Errors;

// Create Vue app
const app = createApp({
    data() {
        return {
            component: "settings",
            App: window.FluentFormApp,
            component_name: "",
            settings_key: ""
        };
    },
    methods: {
        setRoute($el, $originalEl = false) {
            // get component by hash
            let hash = $el.data("hash");
            const is_payment_compatible = window.FluentFormApp.is_payment_compatible;

            if (is_payment_compatible && hash.startsWith("payments/")) {
                this.component = "payment_component";
                this.component_name = hash;
                return "";
            }

            let component = hash;
            if ($el.data("component")) {
                component = $el.data("component");
            }
            
            if (this.$options.components[component]) {
                this.settings_key = jQuery($el).attr("data-settings_key");
                this.component_name = $el.data("component_name") || "";
                this.component = component;
                location.hash = hash;
            } else if ($originalEl && $originalEl.hasClass("ff-payment-settings-root")) {
                location.href = $el.attr("href");
                return "redirected";
            }
            return "";
        },
        maybeGetFirstSubLink($el) {
            if (
                $el.attr("href") === "#" &&
                $el.parent().hasClass("has_sub_menu") &&
                $el.parent().find("ul.ff_list_submenu li:first a").length
            ) {
                $el = $el.parent().find("ul.ff_list_submenu li:first a");
            }
            return $el;
        }
    },
    created() {
        const is_payment_compatible = window.FluentFormApp.is_payment_compatible;
        let hash = location.hash.substr(1) || "settings";
        let $el;

        if (is_payment_compatible && hash.startsWith("payments/")) {
            $el = jQuery(".ff_settings_list li").find("a[data-hash=\"" + hash + "\"]").first();
        } else {
            $el = jQuery(".ff_settings_list li").find("a[data-hash=" + hash + "]").first();
        }

        if ($el.length) {
            $el = this.maybeGetFirstSubLink($el);
            this.setRoute($el);
            handleSidebarActiveLink($el.parent(), true, true);
        }

        const that = this;
        jQuery(".ff_settings_list li a").on("click", function(e) {
            $el = jQuery(this);
            if ($el.attr("href") === "#") e.preventDefault();
            if (that.setRoute(that.maybeGetFirstSubLink($el), $el) === "redirected") {
                return;
            }
            handleSidebarActiveLink($el.parent());
        });
    }
});

// Register all components
const components = {
    globalSearch,
    settings: GlobalSettings,
    re_captcha: reCaptcha,
    h_captcha: hCaptcha,
    turnstile: turnstile,
    cleantalk: cleantalk,
    pdf_settings: pdf_settings,
    "general-integration-settings": GeneralIntegrationSettings,
    "double_optin_settings": DoubleOptinSettings,
    managers: ManagersSettings,
    inventory_manager: InventoryManager,
    custom_component: CustomComponent,
    license: License
};

// Conditionally add payment component
const is_payment_compatible = window.FluentFormApp.is_payment_compatible;
if (is_payment_compatible) {
    components.payment_component = PaymentSettings;
}

// Register components
Object.entries(components).forEach(([name, component]) => {
    app.component(name, component);
});

// Register Element Plus components
const elementComponents = [
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
    ElTabs,
    ElTabPane,
    ElDatePicker,
    ElRadioButton,
    ElPopconfirm
];

elementComponents.forEach(component => {
    app.use(component);
});

// Add global methods via mixin
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
        ...notifier,
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    }
});

// Set global properties
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.Errors = Errors;
app.config.globalProperties.$ELEMENT = {locale: en};

// Set payment vars if compatible
if (is_payment_compatible) {
    app.config.globalProperties.payment_vars = window.ff_payment_settings || {};
}

// Mount the app
app.mount("#ff_global_settings_option_app");