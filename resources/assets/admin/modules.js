import Vue from 'vue';
import AddOnModules from './views/AddonModules';

import {
    Button,
    Select,
    Input,
    Switch,
    Message,
    RadioButton,
    Radio,
    RadioGroup
} from 'element-ui';

Vue.use(RadioButton);
Vue.use(Radio);
Vue.use(RadioGroup);
Vue.use(Button);
Vue.use(Select);
Vue.use(Input);
Vue.use(Switch);

Vue.prototype.$message = Message;


var app = new Vue({
    el: '#ff_add_ons_app',
    components: {
        'fluent-add-ons' : AddOnModules
    }
});