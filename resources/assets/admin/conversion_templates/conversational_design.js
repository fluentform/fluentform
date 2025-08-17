import '../helpers';
import { createApp } from 'vue';
import en from 'element-plus/es/locale/lang/en';

import {
    ElColorPicker,
    ElForm,
    ElInput,
    ElRow,
    ElCol,
    ElFormItem,
    ElSelect,
    ElOptionGroup,
    ElOption,
    ElSlider,
    ElButton,
    ElLoading,
    ElMessage,
    ElSwitch,
    ElNotification,
} from 'element-plus';

const components = [
    ElForm,
    ElInput,
    ElRow,
    ElCol,
    ElFormItem,
    ElColorPicker,
    ElSelect,
    ElOption,
    ElOptionGroup,
    ElSlider,
    ElSwitch,
    ElButton
];

import DesignSkeleton from './Parts/Skeleton.vue';
import notifier from '@/admin/notifier'
import globalSearch from '../global_search';
import {_$t} from "@/admin/helpers";

const app = createApp({
    components: {
        DesignSkeleton: DesignSkeleton,
        globalSearch
    },
    data() {
        return {};
    },
    beforeCreate() {
        // Note: $on and $emit are removed in Vue 3, using mitt or custom event handling if needed
        // this.$on('change-title', (module) => {
        //     jQuery('title').text(`${module} - FluentForm`);
        // });
        // this.$emit('change-title', 'Conversational Form Design');
        jQuery('title').text('Conversational Form Design - FluentForm');
    },
    mounted() {
        (new ClipboardJS('.copy')).on('success', (e) => {
            this.$copy();
        });
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
            return this.$t(singular, count);
        },

        ...notifier,

        // Vue 3 doesn't have filters, convert to methods
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        _startCase(string) {
            return _ff.startCase(string);
        }
    }
});

app.mount('#ff_conversation_form_design_app');
