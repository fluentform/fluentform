import '../helpers';
import { createApp } from 'vue';

import {
    ElColorPicker as ColorPicker,
    ElForm as Form,
    ElInput as Input,
    ElRow as Row,
    ElCol as Col,
    ElFormItem as FormItem,
    ElSelect as Select,
    ElOptionGroup as OptionGroup,
    ElOption as Option,
    ElSlider as Slider,
    ElButton as Button,
    ElLoading as Loading,
    ElMessage as Message,
    ElSwitch as Switch,
    ElNotification as Notification,
} from 'element-plus';

// Element Plus components are auto-imported via Vite plugin
// No need for Vue.use() in Vue 3 with Element Plus auto-import

import lang from 'element-plus/es/locale/lang/en'
import { ElConfigProvider } from 'element-plus'
// configure language - Element Plus uses different approach
// locale.use(lang); // This will be handled by ElConfigProvider in the app

import DesignSkeleton from './Parts/Skeleton.vue';
import notifier from '@/admin/notifier'
import globalSearch from '../global_search';

// Vue 3 doesn't use mixins the same way, we'll add methods directly to the app

const app = createApp({
    data() {
        return {};
    },
    components: {
        DesignSkeleton: DesignSkeleton,
        globalSearch
    },
    beforeCreate() {
        // Vue 3 doesn't have $on/$emit on instances
        // Handle title change directly
        jQuery('title').text('Conversational Form Design - FluentForm');
    },
    mounted() {
        (new ClipboardJS('.copy')).on('success', (e) => {
            this.$copy();
        });
    },
    methods: {
        $t(str) {
            let transString = window.fluent_forms_global_var.admin_i18n[str];
            if(transString) {
                return transString;
            }
            return str;
        },
        $copy() {
            notifier.success('Copied to clipboard');
        },
        ...notifier
    }
});

// Add global properties for filters (Vue 3 doesn't have filters)
app.config.globalProperties.ucFirst = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

app.config.globalProperties._startCase = function(string) {
    return _ff.startCase(string);
};

app.mount('#ff_conversation_form_design_app');
