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
    GaugeChart
} from 'echarts/charts';
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent
} from 'echarts/components';

import {
    Row,
    Col,
    Button,
    ButtonGroup,
    RadioGroup,
    RadioButton,
    Input,
    Select,
    Option,
    Table,
    TableColumn,
    Pagination,
    Loading,
    Message,
    Notification,
    DatePicker,
    Skeleton,
    SkeletonItem,
    Card,
    Tag,
    Tooltip,
    Badge
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
Vue.use(Select);
Vue.use(Option);
Vue.use(RadioGroup);
Vue.use(RadioButton);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Pagination);
Vue.use(DatePicker);
Vue.use(Skeleton);
Vue.use(SkeletonItem);
Vue.use(Card);
Vue.use(Tag);
Vue.use(Tooltip);
Vue.use(Badge);

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
    GaugeChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent
]);

Vue.component('v-chart', ECharts);

Vue.mixin({
    methods: {
        $t(string) {
            let transString = window.FluentFormApp?.dashboard_i18n[string] || string
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
    el: "#ff_dashboard",
    components: {
        globalSearch,
        'ff-dashboard': App
    }
});
