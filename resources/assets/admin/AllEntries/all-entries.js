import { createApp } from 'vue';
import en from 'element-plus/es/locale/lang/en';

import {
    ElRow,
    ElCol,
    ElButton,
    ElButtonGroup,
    ElRadioGroup,
    ElRadioButton,
    ElInput,
    ElCheckbox,
    ElSelect,
    ElOption,
    ElRadio,
    ElTable,
    ElTableColumn,
    ElSwitch,
    ElPagination,
    ElLoading,
    ElMessage,
    ElNotification,
    ElDatePicker,
    ElSkeleton,
    ElSkeletonItem,
    ElDialog,
    ElForm,
    ElFormItem,
    ElTooltip
} from 'element-plus';

const components = [
    ElRow,
    ElCol,
    ElButton,
    ElButtonGroup,
    ElRadioGroup,
    ElRadioButton,
    ElInput,
    ElCheckbox,
    ElSelect,
    ElOption,
    ElRadio,
    ElTable,
    ElTableColumn,
    ElSwitch,
    ElPagination,
    ElLoading,
    ElMessage,
    ElNotification,
    ElDatePicker,
    ElSkeleton,
    ElSkeletonItem,
    ElDialog,
    ElForm,
    ElFormItem,
    ElTooltip
];

import App from './App.vue';
import globalSearch from '../global_search';
import notifier from '../notifier';
import { _$t } from "@/admin/helpers";

const app = createApp({
    components: {
        globalSearch,
        'ff-all-entries': App
    }
});

components.forEach(component => {
    app.use(component);
});

app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$message = ElMessage;

app.config.globalProperties.$ELEMENT = {locale: en};

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
        ...notifier
    },
});

app.mount('#ff_all_entries');