import { createApp } from 'vue';
import AddOnModules from './views/AddonModules.vue';
import notifier from './notifier';
import globalSearch from './global_search.js';
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
} from 'element-plus';

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

const app= createApp({
    components: {
        globalSearch,
        'fluent-add-ons': AddOnModules
    }
});

components.forEach(component => {
   app.use(component);
});

app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$ELEMENT = {locale: en};

app.mixin({
    methods: {
        $t(str) {
            let transString = window.fluent_addon_modules.addOnModule_str[str];
            if (transString) {
                return transString;
            }
            return str;
        },
        ...notifier
    }
});

app.mount('#ff_add_ons_app');
