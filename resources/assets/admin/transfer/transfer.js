import { createApp } from 'vue';
import notifier from '@/admin/notifier.js';
import ExportForms from './ExportForms.vue';
import ImportForms from './ImportForms.vue';
import ActivityLogs from './ActivityLogs.vue';
import ApiLogs from './ApiLogs.vue';
import Migrator from './Migrator.vue';
import globalSearch from '../global_search.js';
import ImportEntries from './ImportEntries.vue';
import en from 'element-plus/es/locale/lang/en';

import {
    ElButton,
    ElForm,
    ElFormItem,
    ElTooltip,
    ElRow,
    ElCol,
    ElSelect,
    ElOption,
    ElCheckbox,
    ElRadio,
    ElRadioGroup,
    ElDialog,
    ElTable,
    ElTableColumn,
    ElPagination,
    ElPopover,
    ElNotification,
    ElTabs,
    ElTabPane,
    ElLoading,
    ElTag,
    ElSkeleton,
    ElSkeletonItem,
    ElDatePicker,
    ElMessage,
    ElPopconfirm
} from "element-plus";

const components = [
    ElButton,
    ElForm,
    ElFormItem,
    ElTooltip,
    ElRow,
    ElCol,
    ElSelect,
    ElOption,
    ElCheckbox,
    ElRadio,
    ElRadioGroup,
    ElDialog,
    ElTable,
    ElTableColumn,
    ElPagination,
    ElPopover,
    ElNotification,
    ElTabs,
    ElTabPane,
    ElLoading,
    ElTag,
    ElSkeleton,
    ElSkeletonItem,
    ElDatePicker,
    ElPopconfirm
];

const app = createApp({
    components: {
        globalSearch,
        exportforms: ExportForms,
        importforms: ImportForms,
        importentries: ImportEntries,
        activitylogs: ActivityLogs,
        apilogs: ApiLogs,
        migrator: Migrator
    },
    data() {
        return {
            component: "exportforms",
            App: window.FluentFormApp
        };
    },
    methods: {
        setRoute(component) {
            if (this.$options.components[component]) {
                let $listItems = jQuery(".ff_admin_menu_list li").removeClass("active");

                $listItems.find("a[data-hash=" + component + "]").parent().addClass("active");

                this.component = component;
            }
        }
    },
    created() {
        let currentRoute = location.hash.substring(1);

        if (currentRoute) {
            this.setRoute(currentRoute);
        }

        jQuery(document).ready(() => {
            const that = this;
            jQuery(".ff_admin_menu_list li a").on("click", function() {
                let component = jQuery(this).attr("data-hash");

                that.setRoute(component);
            });
        });
    }
});

components.forEach(component => {
    app.use(component);
});

app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$message = ElMessage;
app.config.globalProperties.$ELEMENT = { locale: en };

app.mixin({
    methods: {
        $t(string) {
            let transString = window.FluentFormApp.transfer_str[string] || string;
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ""), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },
        ...notifier,
        humanDiffTime,
        tooltipDateTime
    }
});

app.mount("#ff_transfer_app");