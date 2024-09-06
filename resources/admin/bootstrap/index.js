import { createApp } from 'vue';
import router from '@/router';
import mixins from '@/mixins';
import controllers from './controllers';
import Application from "@/components/Application";

const app = createApp(Application).use(router);

mixins.forEach(mixinObject => app.mixin(mixinObject));

app.config.globalProperties.$controllers = controllers;

app.config.globalProperties.appVars = fluentFrameworkAdmin;

export default app;
