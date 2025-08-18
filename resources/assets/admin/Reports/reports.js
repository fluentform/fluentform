console.log('🚀 FluentForm Reports Script Loading...');

import {createApp} from 'vue';
import en from 'element-plus/es/locale/lang/en';
import ECharts from 'vue-echarts';
import { use } from 'echarts/core';
import {
    CanvasRenderer
} from 'echarts/renderers';

import {
    BarChart,
    LineChart,
    PieChart,
    MapChart,
    TreemapChart
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
    ElRow,
    ElCol,
    ElButton,
    ElButtonGroup,
    ElRadioGroup,
    ElRadioButton,
    ElInput,
    ElCheckbox,
    ElSelect,
    ElOption,
    ElRadio,
    ElTable,
    ElTableColumn,
    ElSwitch,
    ElPagination,
    ElLoading,
    ElMessage,
    ElNotification,
    ElDatePicker,
    ElSkeleton,
    ElSkeletonItem,
    ElDialog,
    ElForm,
    ElFormItem,
    ElTooltip,
    ElCard,
    ElTag,
    ElTabs,
    ElTabPane
} from "element-plus";

import App from './App.vue';
import globalSearch from '../global_search';
import notifier from '../notifier';
import {humanDiffTime, tooltipDateTime} from '../helpers';
import {_$t} from "@/admin/helpers";

// Register ECharts components
use([
    CanvasRenderer,
    BarChart,
    LineChart,
    PieChart,
    MapChart,
    TreemapChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    GeoComponent,
    VisualMapComponent
]);

const components = [
    ElRow,
    ElCol,
    ElButton,
    ElButtonGroup,
    ElRadioGroup,
    ElRadioButton,
    ElInput,
    ElCheckbox,
    ElSelect,
    ElOption,
    ElRadio,
    ElTable,
    ElTableColumn,
    ElSwitch,
    ElPagination,
    ElLoading,
    ElMessage,
    ElNotification,
    ElDatePicker,
    ElSkeleton,
    ElSkeletonItem,
    ElDialog,
    ElForm,
    ElFormItem,
    ElTooltip,
    ElCard,
    ElTag,
    ElTabs,
    ElTabPane
];

const app = createApp({
    components: {
        globalSearch,
        'ff-reports': App
    }
});

// Register Element Plus components
components.forEach(component => {
    app.use(component);
});

app.component('v-chart', ECharts);

app.mixin({
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

app.config.globalProperties.$message = ElMessage;
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$ELEMENT = { locale: en };

console.log('🔍 Looking for mount element #ff_reports...');
const mountElement = document.getElementById('ff_reports');
if (mountElement) {
    console.log('✅ Mount element found, mounting Vue app...');
    app.mount("#ff_reports");
    console.log('🎉 Vue app mounted successfully!');
} else {
    console.warn('❌ FluentForm Reports: Mount element #ff_reports not found. This script may be loading on the wrong page.');
}
