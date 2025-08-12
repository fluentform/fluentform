<template>
    <card>
        <card-head>
            <h4>{{ $t('Form submission by Country') }}</h4>
        </card-head>

        <card-body v-loading="loading">
            <div v-if="!loading && (!countryData || countryData.length === 0)" class="no-data">
                <div class="no-data-icon">
                    <i class="el-icon-location-outline"></i>
                </div>
                <p>{{ $t('No submission data available') }}</p>
            </div>

            <div v-else-if="!loading" class="chart-wrapper">
                <!-- World Map Controls -->
                <div class="map-controls">
                    <el-button-group size="mini">
                        <el-button size="mini" @click="zoomIn" icon="el-icon-plus"></el-button>
                        <el-button size="mini" @click="zoomOut" icon="el-icon-minus"></el-button>
                        <el-button size="mini" @click="resetChart" icon="el-icon-refresh-left"></el-button>
                    </el-button-group>
                </div>

                <div ref="chartRef" class="chart-element"></div>
            </div>
        </div>
    </card-body>
</card>
</template>

<script>
import * as echarts from 'echarts';
import worldMapJson from "../../Reports/world.geo.json";
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'CountryMap',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: {
        countryHeatmap: {
            type: Object,
            default: () => ({})
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            chartInstance: null,
            zoomLevel: 1.2,
            minZoom: 1.2,
            maxZoom: 20,
            zoomInterval: 0.5,
            maxValue: 50,
            currentVisualMapRange: [0, 50]
        };
    },
    computed: {
        countryData() {
            return this.countryHeatmap?.country_data || [];
        },
        coloredData() {
            const result = (this.countryData || []).map((item) => {
                const normalizedName = this.normalizeCountryName(item.name);
                const value = item.value || 0;

                // Filter based on current visual map range
                const [minRange, maxRange] = this.currentVisualMapRange;
                const isInRange = value >= Math.round(minRange) && value <= Math.round(maxRange);

                return {
                    ...item,
                    name: normalizedName,
                    value: value,
                    itemStyle: {
                        color: isInRange ? this.getColor(value) : '#eeeeee'
                    },
                    emphasis: {
                        itemStyle: {shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)"},
                    },
                };
            });
            return result;
        }
    },
    methods: {
        loadWorldMap() {
            try {
                echarts.registerMap("world", worldMapJson);
                return true;
            } catch (error) {
                console.error('Could not load world map data:', error);
                return false;
            }
        },

        getColor(value) {
            if (!value || isNaN(value)) {
                return `rgba(24, 144, 255, 0.1)`;
            }
            const intensity = Math.log(value + 1) / Math.log(this.maxValue + 1);
            return `rgba(24, 144, 255, ${Math.max(0.1, intensity)})`;
        },

        getMapOption() {
            return {
                backgroundColor: '#f8f9fa',
                tooltip: {
                    trigger: "item",
                    formatter: (params) => {
                        const value = params.value || 0;
                        return `<strong>${params.name}</strong><br/>${this.$t('Submissions:')} ${value}`;
                    },
                    borderRadius: 8,
                    backgroundColor: "#ffffff",
                    borderColor: "#c0c4ca",
                    borderWidth: 1,
                    textStyle: {
                        color: "#565865",
                    },
                },
                visualMap: {
                    min: 0,
                    max: this.maxValue,
                    left: "left",
                    top: "2%",
                    text: ["High", "Low"],
                    orient: "horizontal",
                    calculable: true,
                    range: this.currentVisualMapRange,
                    inRange: {
                        color: ["#e6f3ff", "#1890ff"],
                    },
                    textStyle: {
                        color: "#666",
                    },
                },
                series: [
                    {
                        name: this.$t('Submissions'),
                        type: "map",
                        map: "world",
                        roam: true,
                        zoom: this.zoomLevel,
                        label: {
                            show: false,
                            emphasis: {
                                show: true,
                                color: "#333",
                                fontWeight: "bold",
                            },
                        },
                        emphasis: {
                            itemStyle: {
                                areaColor: "#40a9ff",
                                shadowBlur: 10,
                                shadowColor: "#ccc",
                            },
                        },
                        itemStyle: {
                            borderColor: "#ddd",
                            borderWidth: 0.5,
                        },
                        data: this.coloredData,
                    },
                ],
            };
        },

        async initChart() {
            if (!this.$refs.chartRef) {
                return;
            }

            const element = this.$refs.chartRef;

            // Ensure element has dimensions
            if (element.offsetWidth === 0 || element.offsetHeight === 0) {
                setTimeout(() => this.initChart(), 200);
                return;
            }

            const mapLoaded = this.loadWorldMap();

            if (!mapLoaded) {
                console.error('Failed to load world map data');
                return;
            }

            this.chartInstance = echarts.init(element);

            if (this.countryData && this.countryData.length > 0) {
                this.maxValue = Math.max(...this.countryData.map((item) => item.value || 0));
                this.currentVisualMapRange = [0, this.maxValue];
                const option = this.getMapOption();
                this.chartInstance.setOption(option);
            }

            // Listen for visual map range changes
            this.chartInstance.on("datarangeselected", (params) => {
                this.currentVisualMapRange = params.selected;
                this.updateChart();
            });

            this.chartInstance.on("georoam", () => {
                const option = this.chartInstance.getOption();
                if (option.series && option.series[0] && option.series[0].zoom) {
                    const newZoom = option.series[0].zoom;
                    if (newZoom !== this.zoomLevel) {
                        if (newZoom < this.minZoom || newZoom > this.maxZoom) {
                            const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
                            this.chartInstance.setOption({
                                series: [{zoom: clamped}],
                            }, false);
                            this.zoomLevel = clamped;
                        } else {
                            this.zoomLevel = newZoom;
                        }
                    }
                }
            });
        },

        updateChart() {
            if (!this.chartInstance) {
                return;
            }
            if (this.countryData && this.countryData.length > 0) {
                const option = this.getMapOption();
                this.chartInstance.clear();
                this.chartInstance.setOption(option, {notMerge: true});
            }
        },

        zoomIn() {
            this.zoomLevel = Math.min(this.zoomLevel + this.zoomInterval, this.maxZoom);
            if (this.chartInstance) {
                this.chartInstance.setOption({series: [{zoom: this.zoomLevel}]});
            }
        },

        zoomOut() {
            this.zoomLevel = Math.max(this.zoomLevel - this.zoomInterval, this.minZoom);
            if (this.chartInstance) {
                this.chartInstance.setOption({series: [{zoom: this.zoomLevel}]});
            }
        },

        resetChart() {
            this.zoomLevel = this.minZoom;
            if (this.chartInstance) {
                this.chartInstance.clear();
                this.chartInstance.setOption(this.getMapOption());
            }
        },

        normalizeCountryName(countryName) {
            const countryMapping = {
                'United States (US)': 'United States of America',
                'United Kingdom (UK)': 'United Kingdom',
                'United Kingdom (GB)': 'United Kingdom',
            };

            if (countryMapping[countryName]) {
                return countryMapping[countryName];
            }

            const cleanName = countryName.replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim();
            return countryMapping[cleanName] || cleanName;
        },

        formatNumber(num) {
            return new Intl.NumberFormat().format(num);
        }
    },
    watch: {
        countryHeatmap: {
            handler(newVal, oldVal) {
                if (newVal.country_data && newVal.country_data.length > 0) {
                    this.maxValue = Math.max(...newVal.country_data.map((item) => item.value || 0));
                    this.currentVisualMapRange = [0, this.maxValue];
                    if (!this.chartInstance) {
                        this.$nextTick(() => {
                            setTimeout(() => {
                                this.initChart();
                            }, 100);
                        });
                    } else {
                        this.chartInstance.clear();
                        this.updateChart();
                    }
                } else {
                   if (this.chartInstance) {
                        this.chartInstance = null;
                   }
                }
            },
            deep: true,
            immediate: true
        }
    },
    beforeDestroy() {
        if (this.chartInstance) {
            this.chartInstance.dispose();
            this.chartInstance = null;
        }
    }
};
</script>

<style lang="scss" scoped>
.no-data {
    text-align: center;
    padding: 60px 20px;
    color: #9ca3af;

    .no-data-icon {
        font-size: 48px;
        margin-bottom: 16px;
        color: #d1d5db;

        i {
            font-size: 48px;
        }
    }

    p {
        font-size: 16px;
        margin: 0;
    }
}

.chart-wrapper {
    .map-controls {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;

        .el-button-group {
            .el-button {
                padding: 8px 12px;

                &:hover {
                    background-color: #f0f9ff;
                    border-color: #3b82f6;
                    color: #3b82f6;
                }
            }
        }
    }

    .chart-element {
        width: 100%;
        height: 400px;
        border-radius: 8px;
        overflow: hidden;
    }
}

@media (max-width: 768px) {
    .chart-wrapper {
        .chart-element {
            height: 300px;
        }
    }
}
</style>
