import { createApp } from "vue";
import AddOnModules from "./views/AddonModules.vue";
import notifier from "./notifier";
import globalSearch from "./global_search.js";
import en from "element-plus/es/locale/lang/en";

import {
    ElButton,
    ElSelect,
    ElInput,
    ElSwitch,
    ElNotification,
    ElRadioButton,
    ElRadio,
    ElRadioGroup,
    ElRow,
    ElCol,
    ElLoading
} from "element-plus";

const components = [
    ElButton,
    ElSelect,
    ElInput,
    ElSwitch,
    ElNotification,
    ElRadioButton,
    ElRadio,
    ElRadioGroup,
    ElRow,
    ElCol,
    ElLoading
];

const app = createApp({
    components: {
        globalSearch,
        "fluent-add-ons": AddOnModules
    }
});

components.forEach(component => {
    app.use(component);
});

app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$ELEMENT = { locale: en };

app.mixin({
    methods: {
        $t(string) {
            let transString = window.fluent_addon_modules.addOnModule_str[string] || string;
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ""), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },
        ...notifier
    }
});

const mountElement = document.getElementById('ff_add_ons_app');
if (mountElement) {
    app.mount("#ff_add_ons_app");
} else {
    console.warn('FluentForm Add-ons: Mount element #ff_add_ons_app not found. This script may be loading on the wrong page.');
}
