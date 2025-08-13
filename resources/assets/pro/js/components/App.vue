<template>
    <div>
        <div style="height: 300px; width: 500px;">
            <button @click="fetchAnalytics('day')">{{ $t('Daily') }}</button>
            <button @click="fetchAnalytics('week')">{{ $t('Weekly') }}</button>
            <button @click="fetchAnalytics('month')">{{ $t('Monthly') }}</button>
            <button @click="fetchAnalytics('year')">{{ $t('Yearly') }}</button>
            <chartBar :data="dataChart"></chartBar>
        </div>
    </div>
</template>
<script>
import chartBar from './chart-bar';
export default {
    name: 'App',
    props: ['formId'],
    components: {
        chartBar
    },
    data() {
        return {
            dataChart: {
                labels: [],
                datasets: []
            }
        }
    },
    methods: {
        setDataChart(labels, totalViews, uniqueViews) {
            this.dataChart.labels = labels;
            this.dataChart.datasets = [
                {
                    label: 'Total Visitors',
                    backgroundColor: '#f87979',
                    data: totalViews
                },
                {
                    label: 'Unique Visitors',
                    backgroundColor: '#f87979',
                    data: uniqueViews
                }
            ];
        },
        fetchAnalytics(data_span) {
            const data = {
                action: 'fluentfrompro_analytics_fetch',
                form_id: this.formId,
                data_span
            };

            FluentFormsGlobal.$get(data)
            .then(response => {
                const { analytics: { labels, totalViews, uniqueViews } } = response.data;
                this.setDataChart(labels, totalViews, uniqueViews);
            });
        }
    },
    mounted() {
        this.$nextTick(_ => this.fetchAnalytics('week'));
    }
};
</script>
