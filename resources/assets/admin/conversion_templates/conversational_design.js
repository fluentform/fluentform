import '../helpers';
import Vue from 'vue';

import {
    ColorPicker,
    Form,
    Input,
    Row,
    Col,
    FormItem,
    Slider,
    Button,
    Loading,
    Message,
    Switch,
    Notification,
} from 'element-ui';

Vue.use(Form);
Vue.use(Input);
Vue.use(Row);
Vue.use(Col);
Vue.use(FormItem);
Vue.use(ColorPicker);
Vue.use(Slider);
Vue.use(Switch);
Vue.use(Button);

Vue.use(Loading.directive)
Vue.prototype.$loading = Loading.service
Vue.prototype.$notify = Notification
Vue.prototype.$message = Message;

import lang from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'
// configure language
locale.use(lang);

import DesignSkeleton from './Parts/Skeleton.vue';

Vue.mixin({
    methods: {
        $t(str) {
            return str;
        }
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

new Vue({
    el: '#ff_conversation_form_design_app',
    data: {},
    components: {
        DesignSkeleton: DesignSkeleton
    },
    beforeCreate() {
        this.$on('change-title', (module) => {
            jQuery('title').text(`${module} - FluentForm`);
        });
        this.$emit('change-title', 'Conversational Form Design');
    }
});
