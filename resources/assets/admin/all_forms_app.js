import "./helpers";

import { createApp } from "vue";
import {
    ElRow,
    ElCol,
    ElButton,
    ElButtonGroup,
    ElInput,
    ElDialog,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElRadioGroup,
    ElRadio,
    ElPopover,
    ElTooltip,
    ElLoading,
    ElMessage,
    ElNotification,
    ElTable,
    ElTableColumn,
    ElTag,
    ElPagination,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElSwitch,
    ElDatePicker,
    ElRadioButton,
    ElSkeleton,
    ElSkeletonItem,
    ElPopconfirm,
    ElIcon
} from "element-plus";

import en from "element-plus/es/locale/lang/en";

import Acl from "@/common/Acl";
import AllForms from "./views/AllForms.vue";
import globalSearch from "./global_search";
import notifier from "./notifier";
import { _$t } from "@/admin/helpers";

const app = createApp({
    components: {
        globalSearch,
        ff_all_forms_table: AllForms,
    },
    data() {
        return {};
    },
    mounted() {
        document.title = "Forms - FluentForm";
    },
});

// Mixin
app.mixin({
    methods: {
        $t(string) {
            let transString = window.fluent_forms_global_var.admin_i18n[string] || string
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ''), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return str;
        },
        hasPermission(permission) {
            return new Acl().verify(permission);
        },
        ...notifier,
    },
});

// Register Element Plus components
const components = [
    ElRow,
    ElCol,
    ElButton,
    ElButtonGroup,
    ElInput,
    ElDialog,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElRadioGroup,
    ElRadio,
    ElPopover,
    ElTooltip,
    ElTable,
    ElTableColumn,
    ElTag,
    ElPagination,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElSwitch,
    ElDatePicker,
    ElRadioButton,
    ElSkeleton,
    ElSkeletonItem,
    ElPopconfirm,
];

components.forEach(component => {
    app.use(component);
});

// Register Element Plus plugins
app.use(ElLoading);
app.use(ElIcon);
app.config.globalProperties.$message = ElMessage;
app.config.globalProperties.$notify = ElNotification;

// Set language
app.config.globalProperties.$ELEMENT = { locale: en };

// Mount the app
app.mount("#ff_all_forms_app");
