import { createApp } from 'vue';
import PreviewApp from './preview/App.vue'
import globalSearch from './global_search';
import en from 'element-plus/es/locale/lang/en';
import {
    ElLoading,
    ElButton,
    ElSelect,
    ElOption,
    ElNotification, ElMessage
} from 'element-plus';

const app = createApp({
    components: {
        PreviewApp,
        globalSearch
    }
});

const components = [
    ElLoading,
    ElButton,
    ElSelect,
    ElOption,
    ElNotification
];

components.forEach(component => {
    app.use(component);
});

app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$ELEMENT = {locale: en};


app.mixin({
    methods: {
        $t(str) {
            let transString = window.fluent_preview_vars?.i18n[str];
            if (transString) {
                return transString;
            }
            return str;
        }
    }
});

app.mount('#ff_form_preview_app');
