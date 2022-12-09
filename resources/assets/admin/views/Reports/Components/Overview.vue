<template>
    <div class="overview" v-if="data">
        <div class="overview-header">
            <h3>{{ $t('Overview') }}</h3>
            <span>{{ $t('Showing report from') }} {{ startDate }} - {{ endDate }}</span>
        </div>

        <el-row class="overview-details" :gutter="16">
            <el-col :span="12" :md="6" class="overview-info">
                <h4>{{ $t('Last Submission') }}</h4>
                <span>{{ lastSubmissionDate }}</span>
            </el-col>
            <el-col :span="12" :md="6" class="overview-info">
                <h4>{{ $t('Views') }}</h4>
                <span>{{ data.views }}</span>
            </el-col>
            <el-col :span="12" :md="6" class="overview-info">
                <h4>{{ $t('Unique Views') }}</h4>
                <span>{{ data.ip_views }}</span>
            </el-col>
            <el-col :span="12" :md="6" class="overview-info">
                <h4>{{ $t('Submission') }}</h4>
                <span>{{ data.submissions }}</span>
            </el-col>
            <el-col :span="12" :md="6" class="overview-info">
                <h4>{{ $t('Conversion Rate') }}</h4>
                <span>{{ data.conversion }}%</span>
            </el-col>
            <el-col :span="12" :md="6" class="overview-info">
                <h4>{{ $t('Unique Conversion Rate') }}</h4>
                <span>{{ data.ip_conversion }}%</span>
            </el-col>
            <el-col :span="12" :md="6" class="overview-info">
                <h4>{{ $t('Integrations') }}</h4>
                <span>{{ data.integrations }}</span>
            </el-col>
            <el-col :span="12" :md="6" class="overview-info">
                <h4>{{ $t('Payments') }}</h4>
                <span>{{ data.payments.join(', ') }}</span>
            </el-col>
        </el-row>
        <subscriber-chart :chart-data="chartData" :maxCumulativeValue="maxCumulativeValue"></subscriber-chart>
    </div>
</template>

<script>
import each from 'lodash/each';
import SubscriberChart from '../../../AllEntries/Components/_chart'
import moment from 'moment';

export default {
    name: 'Overview',
    props: ['data'],
    components: {
        SubscriberChart
    },
    data() {
        return {
            chartData: {},
            maxCumulativeValue: 0,
        }
    },
    watch: {
        'data.chart_data': function () {
            this.setupChartItems();
        }
    },
    methods: {
        setupChartItems() {
            const labels = [];
            const ItemValues = {
                label: 'Submission Count',
                yAxisID: 'byDate',
                backgroundColor: 'rgb(63 158 255)',
                borderColor: 'rgb(63 158 255/70%)',
                data: [],
                fill: false,
                gridLines: {
                    display: false
                }
            };

            let currentTotal = 0;
            each(this.submission_chart_data, (count, label) => {
                ItemValues.data.push(count);
                labels.push(label);
                currentTotal += parseInt(count);
            });
            this.maxCumulativeValue = currentTotal + 10;
            this.chartData = {
                labels: labels,
                datasets: [ItemValues]
            }
        }
    },
    computed: {
        submission_chart_data() {
            return this.data?.chart_data;
        },
        startDate() {
            return this.data?.date_range ? moment(this.data.date_range[0], '').format('MMMM DD, YYYY') : '';
        },
        endDate() {
            return this.data?.date_range ? moment(this.data.date_range[1]).format('MMMM DD, YYYY') : '';
        },
        lastSubmissionDate() {
            return moment(this.data?.last_submission).format('MMM DD, YY @ H:mm A');
        }
    }
}
</script>

<style scoped>

</style>
