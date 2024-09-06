import './helpers.js';
import { createApp, onBeforeMount } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import en from 'element-plus/es/locale/lang/en';

import Acl from '@/common/Acl';
import AllForms from './views/AllForms.vue';
import globalSearch from './global_search';
import notifier from './notifier';

const app = createApp({
    components: {
        globalSearch,
        'ff_all_forms_table': AllForms
    },
    setup() {
        const changeTitle = (module) => {
            document.title = `${module} - FluentForm`;
        };

        onBeforeMount(() => {
            changeTitle('Forms');
        });

        return {
            changeTitle
        };
    }
});

app.mixin({
    methods: {
        $t(str) {
            let transString = window.fluent_forms_global_var.admin_i18n[str];
            return transString || str;
        },

        hasPermission(permission) {
            return (new Acl).verify(permission);
        },

        ...notifier.methods
    },
    filters: {
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        _startCase(string) {
            return _ff.startCase(string);
        }
    }
});

app.use(ElementPlus, { locale: en });
app.config.globalProperties.$loading = ElementPlus.ElLoading;
app.config.globalProperties.$notify = ElementPlus.ElNotification;
app.config.globalProperties.$message = ElementPlus.ElMessage;

app.mount('#ff_all_forms_app');
