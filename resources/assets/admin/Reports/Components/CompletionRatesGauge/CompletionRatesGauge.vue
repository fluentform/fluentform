<template>
    <card>
        <card-head>
            <h4>{{$t(' Completion Rates')}}</h4>
        </card-head>

        <card-body>
            <div class="form-selector">
                <el-select
                    popper-class="report-form-select-popper"
                    v-model="selectedFormId"
                    placeholder="Select Form"
                    size="mini"
                    clearable
                    filterable
                    style="width: 100%;"
                    @change="handleFormChange"
                >
                    <el-option
                        label="All Forms"
                        :value="null"
                    ></el-option>
                    <el-option
                        v-for="form in forms_list"
                        :key="form.id"
                        :label="`#${form.id} - ${form.title}`"
                        :value="form.id"
                    ></el-option>
                </el-select>
            </div>

            <div class="gauge-container">
                <div class="gauge-wrapper">
                    <div ref="gaugeChart" class="gauge-chart" style="width: 300px; height: 300px;"></div>
                    <div class="gauge-center">
                        <div class="gauge-label">PERCENTAGE (%)</div>
                        <div class="gauge-percentage">{{ completionRate }}</div>
                    </div>
                </div>
            </div>
            <div class="stats-bar-horizintal"></div>
            <div class="completion-stats">
                <div class="stat-row">
                    <div class="stat-item">
                        <div class="stat-icon incomplete">
                            <i class="el-icon-document"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-label">Incomplete Submissions</div>
                            <div class="stat-value">{{ incompleteSubmissions }}</div>
                        </div>
                    </div>
                    <div class="stats-bar-vertical"></div>
                    <div class="stat-item">
                        <div class="stat-icon complete">
                            <i class="el-icon-document-checked"></i>
                        </div>
                        <div class="stat-details">
                            <div class="stat-label">Complete Submissions</div>
                            <div class="stat-value">{{ totalSubmissions }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </card-body>
    </card>
</template>

<script>
import * as echarts from 'echarts';
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'CompletionRatesGauge',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: {
        completionRate: {
            type: Number,
        },
        forms_list: {
            type: Array,
            default: () => []
        },
        incompleteSubmissions: {
            type: Number,
        },
        totalSubmissions: {
            type: Number,
        },
    },
    emits: ['completion-rate-form-change'],
    data() {
        return {
            selectedFormId: null,
            gaugeChart: null
        };
    },
    watch: {
        completionRate: {
            handler() {
                this.$nextTick(() => {
                    this.updateChart();
                });
            },
            immediate: true
        }
    },
    mounted() {
        this.initChart();
    },
    beforeDestroy() {
        if (this.gaugeChart) {
            this.gaugeChart.dispose();
        }
    },
    methods: {
        initChart() {
            if (this.$refs.gaugeChart) {
                this.gaugeChart = echarts.init(this.$refs.gaugeChart);
                this.updateChart();

                // Handle window resize
                window.addEventListener('resize', this.handleResize);
            }
        },

        updateChart() {
            if (!this.gaugeChart) return;

            // Ensure we have a valid completion rate
            const completionRate = Number(this.completionRate) || 0;
            const incompleteRate = 100 - completionRate;

            const option = {
                series: [
                    {
                        type: 'pie',
                        startAngle: 180,
                        endAngle: 0,
                        center: ['50%', '70%'],
                        radius: ['60%', '80%'],
                        avoidLabelOverlap: false,
                        label: {
                            show: false
                        },
                        emphasis: {
                            label: {
                                show: false
                            }
                        },
                        labelLine: {
                            show: false
                        },
                        data: [
                            {
                                value: completionRate,
                                name: 'Complete',
                                itemStyle: {
                                    color: '#10b981'
                                }
                            },
                            {
                                value: incompleteRate,
                                name: 'Incomplete',
                                itemStyle: {
                                    color: '#8b5cf6'
                                }
                            }
                        ]
                    }
                ]
            };

            this.gaugeChart.setOption(option, true);
        },

        handleResize() {
            if (this.gaugeChart) {
                this.gaugeChart.resize();
            }
        },

        handleFormChange() {
            this.$emit('completion-rate-form-change', this.selectedFormId);
        }
    }
};
</script>


