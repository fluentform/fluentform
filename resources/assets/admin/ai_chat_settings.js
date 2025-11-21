import Vue from 'vue';
import AiChatSettings from './components/AiChatSettings.vue';
import {
    Button,
    Input,
    Switch,
    Radio,
    RadioGroup,
    Select,
    Option,
    Message,
    Loading,
    Skeleton,
    Form,
    FormItem,
    Tooltip,
    Row,
    Col,
    Checkbox
} from 'element-ui';

// Use Element UI components
Vue.use(Button);
Vue.use(Input);
Vue.use(Switch);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(Select);
Vue.use(Option);
Vue.use(Loading.directive);
Vue.use(Skeleton);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Tooltip);
Vue.use(Row);
Vue.use(Col);
Vue.use(Checkbox);

Vue.prototype.$message = Message;
Vue.prototype.$loading = Loading.service;

// Add translation helper
Vue.prototype.$t = (key) => {
    return key;
};

// Create and mount Vue app
new Vue({
    el: '#ff_ai_chat_settings_app',
    render: h => h(AiChatSettings)
});

