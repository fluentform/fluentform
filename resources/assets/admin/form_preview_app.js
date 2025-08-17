import { createApp } from "vue";
import PreviewApp from "./preview/App.vue";
import globalSearch from "./global_search";
import en from "element-plus/es/locale/lang/en";
import {
    ElLoading,
    ElButton,
    ElSelect,
    ElOption,
    ElNotification, ElMessage
} from "element-plus";

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
app.config.globalProperties.$ELEMENT = { locale: en };


app.mixin({
    methods: {
        $t(string) {
            let transString = window.fluent_preview_vars?.i18n[string] || string;
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ""), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        }
    }
});

app.mount("#ff_form_preview_app");
