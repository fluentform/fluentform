import { createApp } from "vue";
import globalSearch from "./global_search";
import en from "element-plus/es/locale/lang/en";

import {
    ElLoading
} from "element-plus";

const app = createApp({
    components: {
        globalSearch
    },
    methods: {
        $t(string) {
            let transString = window.fluent_forms_global_var.admin_i18n[string] || string;
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
app.use(ElLoading);

app.config.globalProperties.$ELEMENT = { locale: en };
app.config.globalProperties.$loading = ElLoading.service;

const mountElement = document.getElementById('ff_documentation_app');
if (mountElement) {
    app.mount("#ff_documentation_app");
} else {
    console.warn('FluentForm Documentation: Mount element #ff_documentation_app not found. This script may be loading on the wrong page.');
}