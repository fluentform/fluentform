import './helpers';

import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import en from 'element-plus/es/locale/lang/en';
import Acl from '@/common/Acl';
import Entries from './views/Entries.vue';
import Entry from './views/Entry.vue';
import VisualReports from './views/Reports/VisualReports.vue';
import notifier from './notifier';
import globalSearch from './global_search';
import { humanDiffTime, tooltipDateTime } from './helpers';
import { _$t } from './helpers';
import draggable from 'vuedraggable';

import {
    ElCard,
    ElButton,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElButtonGroup,
    ElRow,
    ElCol,
    ElSelect,
    ElOption,
    ElInput,
    ElTable,
    ElTableColumn,
    ElPagination,
    ElPopover,
    ElLoading,
    ElMessage,
    ElNotification,
    ElCheckbox,
    ElRadioGroup,
    ElRadioButton,
    ElSwitch,
    ElDatePicker,
    ElDialog,
    ElForm,
    ElFormItem,
    ElRadio,
    ElCheckboxGroup,
    ElOptionGroup,
    ElAlert,
    ElSkeleton,
    ElSkeletonItem,
    ElTooltip,
    ElCascader,
    ElTimePicker,
    ElCascaderPanel,
    ElPopconfirm
} from 'element-plus';

const routes = [
    {
        path: '/',
        name: 'form-entries',
        component: Entries,
        props: true
    },
    {
        path: '/entries/:entry_id',
        name: 'form-entry',
        component: Entry,
        props: true
    },
    {
        path: '/visual_reports',
        name: 'form-reports',
        component: VisualReports,
        props: true
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    linkActiveClass: 'active',
    routes
})

window.ffEntriesEvents = createApp({});

const app = createApp({
    components: {
        globalSearch,
        draggable
    }
});

function formatMoneyFunc(n, decimals, decimal_sep, thousands_sep) {
    const c = isNaN(decimals) ? 2 : Math.abs(decimals),
        d = decimal_sep || '.',
        t = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        sign = (n < 0) ? '-' : '',
        //extracting the absolute value of the integer part of the number and converting to string
        i = parseInt(n = Math.abs(n).toFixed(c)) + '',
        j = ((j = i.length) > 3) ? j % 3 : 0;
    return sign + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
}

const components = [
    ElCard,
    ElButton,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElButtonGroup,
    ElRow,
    ElCol,
    ElSelect,
    ElOption,
    ElInput,
    ElTable,
    ElTableColumn,
    ElPagination,
    ElPopover,
    ElLoading,
    ElMessage,
    ElNotification,
    ElCheckbox,
    ElRadioGroup,
    ElRadioButton,
    ElSwitch,
    ElDatePicker,
    ElDialog,
    ElForm,
    ElFormItem,
    ElRadio,
    ElCheckboxGroup,
    ElOptionGroup,
    ElAlert,
    ElSkeleton,
    ElSkeletonItem,
    ElTooltip,
    ElCascader,
    ElTimePicker,
    ElCascaderPanel,
    ElPopconfirm
];

components.forEach(component => {
   app.use(component); 
});

app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$message = ElMessage;
app.config.globalProperties.$ELEMENT = {locale: en};

app.mixin({
    methods: {
        $t(string) {
            let transString = window.fluent_form_entries_vars.form_entries_str[string] || string
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ''), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },
        $storeData(key, value) {
            var prevData = localStorage.getItem('ff_entry_data');

            if (!prevData) {
                prevData = {};
            } else {
                prevData = JSON.parse(prevData);
            }
            prevData[key] = value;
            localStorage.setItem('ff_entry_data', JSON.stringify(prevData));
        },
        $getFromStore(key, defaultValue) {
            let prevData = localStorage.getItem('ff_entry_data');
            if (!prevData) {
                return defaultValue;
            } else {
                prevData = JSON.parse(prevData);
            }
            return prevData[key] || defaultValue;
        },
        formatMoney(cents, currency) {
            if (!cents) {
                return '0';
            }

            if (!cents) {
                cents = 0;
            }

            if (currency) {
                currency = currency.toUpperCase();
            }

            const config = window.fluent_form_entries_vars.currency_config;
            const currencyConfigs = window.fluent_form_entries_vars.currency_symbols;
            let $symbol = config.currency_sign;

            if (currency) {
                $symbol = currencyConfigs[currency];
            } else {
                currency = config.currency;
            }

            let $position = config.currency_sign_position;
            let $decimalSeparator = '.';
            let $thousandSeparator = ',';
            if (config.currency_separator !== 'dot_comma') {
                $decimalSeparator = ',';
                $thousandSeparator = '.';
            }
            let $decimalPoints = 2;
            if (cents % 100 === 0 && config.decimal_points === 0) {
                $decimalPoints = 0;
            }

            let amount = cents / 100;

            return $symbol + formatMoneyFunc(amount, $decimalPoints, $decimalSeparator, $thousandSeparator);
        },
        getPaymentStatusIcon(status) {
            if (status === 'pending') {
                return 'el-icon-time';
            } else if (status === 'active' || status === 'paid') {
                return 'el-icon-check';
            } else if (status === 'failed') {
                return 'el-icon-error';
            } else if (status === 'refunded') {
                return 'el-icon-warning';
            }

            return '';
        },

        hasPermission(permission) {
            return (new Acl).verify(permission);
        },

        printEntry(data) {
            const url = FluentFormsGlobal.$rest.route('printSubmissions');
            FluentFormsGlobal.$rest.get(url, data)
                .then(res => {
                    if (res?.success && res?.content) {
                        jQuery('#fluentformEntriesPrintFrame').remove(); // Remove existing iframe if it exists
                        const frame = jQuery('<iframe>', {
                            id: 'fluentformEntriesPrintFrame',
                            style: 'display:none;',
                            width: '100%',
                            height: '100%'
                        }).appendTo('body');
                        let contentWindow = frame[0].contentWindow || frame[0].contentDocument;
                        if (!contentWindow) {
                            contentWindow = window.frames['fluentformEntriesPrintFrame']?.contentWindow || window.frames['fluentformEntriesPrintFrame']?.contentDocument;
                        }
                        let contentDoc = frame[0].contentDocument || frame[0].contentWindow.document;
                        if (!contentDoc) {
                            contentDoc = window.frames['fluentformEntriesPrintFrame']?.contentDocument || contentWindow?.document;
                        }
                        contentDoc.open();
                        contentDoc.write(res.content);
                        contentDoc.close();
                        contentWindow.focus();
                        contentWindow.print();
                    } else {
                        this.$fail(res.message || this.$t('Failed to print.'));
                    }
                })
                .catch(error => {
                    this.$fail(error.message);
                })
                .finally(() => {
                })
        },
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },

        ...notifier,
        humanDiffTime,
        tooltipDateTime
    },
    filters: {
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        _startCase(string) {
            return _ff.startCase(string);
        },
        dateFormat(date, format) {
            if (!format) {
                format = 'MMM DD, YYYY';
            }

            const dateString = (date === undefined) ? null : date;
            const dateObj = moment(dateString);

            return dateObj.isValid() ? dateObj.format(format) : null;
        },
    }
});

// Global error handling...
import Errors from '../common/Errors'
import moment from "moment";

window.Errors = Errors;

app.use(router);

import mitt from 'mitt';
const eventBus = mitt();
app.provide('eventBus', eventBus);
window.ffEntriesEvents = {
    eventBus: eventBus
};

app.mount('#ff_form_entries_app');

window.ffEntriesEvents.eventBus.emit('change-title', 'Fluentform');