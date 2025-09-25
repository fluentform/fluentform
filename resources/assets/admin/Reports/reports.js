import Vue from 'vue';
import locale from 'element-ui/lib/locale';
import lang from 'element-ui/lib/locale/lang/en';
import ECharts from 'vue-echarts';
import { use } from 'echarts/core';
import {
    CanvasRenderer
} from 'echarts/renderers';
import {
    BarChart,
    LineChart,
    PieChart,
    MapChart
} from 'echarts/charts';
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    GeoComponent,
    VisualMapComponent
} from 'echarts/components';

import {
    Row,
    Col,
    Button,
    ButtonGroup,
    RadioGroup,
    RadioButton,
    Input,
    Checkbox,
    Select,
    Option,
    Radio,
    Table,
    TableColumn,
    Switch,
    Pagination,
    Loading,
    Message,
    Notification,
    DatePicker,
    Skeleton,
    SkeletonItem,
    Dialog,
    Form,
    FormItem,
    Tooltip,
    Card,
    Tag,
    Tabs,
    TabPane
} from 'element-ui';

Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.prototype.$notify = Notification;

Vue.use(Row);
Vue.use(Col);
Vue.use(Button);
Vue.use(ButtonGroup);
Vue.use(Input);
Vue.use(Switch);
Vue.use(Checkbox);
Vue.use(Pagination);
Vue.use(Select);
Vue.use(Option);
Vue.use(RadioGroup);
Vue.use(RadioButton);
Vue.use(Radio);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(DatePicker);
Vue.use(Skeleton);
Vue.use(SkeletonItem);
Vue.use(Dialog);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Tooltip);
Vue.use(Card);
Vue.use(Tag);
Vue.use(Tabs);
Vue.use(TabPane);

import App from './App.vue';
import globalSearch from '../global_search';
import notifier from '../notifier';
import {humanDiffTime, tooltipDateTime} from '../helpers';
import {_$t} from "@/admin/helpers";

locale.use(lang);

// Register ECharts components
use([
    CanvasRenderer,
    BarChart,
    LineChart,
    PieChart,
    MapChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    GeoComponent,
    VisualMapComponent
]);

Vue.component('v-chart', ECharts);

Vue.mixin({
    methods: {
        $t(string) {
            let transString = window.FluentFormApp?.reports_i18n[string] || string
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ''), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },

        humanDiffTime,
        tooltipDateTime,
        ...notifier
    },
});
new Vue({
    el: "#ff_reports",
    components: {
        globalSearch,
        'ff-reports': App
    }
});
