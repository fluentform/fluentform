import { createApp } from 'vue';
import globalSearch from './global_search';
import en from 'element-plus/es/locale/lang/en';

import {
    ElLoading
} from 'element-plus';

const app = createApp({
    components: {
        globalSearch
    }
});
app.use(ElLoading);

app.config.globalProperties.$ELEMENT = {locale: en};
app.config.globalProperties.$loading = ElLoading.service;

app.mount('#ff_documentation_app');


