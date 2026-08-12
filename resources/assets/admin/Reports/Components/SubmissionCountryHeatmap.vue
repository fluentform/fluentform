<template>
    <card class="ff-pro-component">
        <div class="submission-country-heatmap">
            <card-head class="card-header">
                <h3>{{ $t('Submissions By Country') }}</h3>
            </card-head>

            <card-body class="chart-container">
                <chart-loader v-if="loading" :rows="7" />

                <no-data
                    v-else-if="!countryData || countryData.length === 0"
                    :message="infoMessage"
                />

                <div v-else class="chart-wrapper">
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

                <notice class="ff_alert_between update-info-notice" type="info-soft" v-if="!hasPro">
                    <div>
                        <h2 class="text">{{ $t('Please upgrade to pro to unlock this feature.') }}</h2>
                    </div>
                    <a target="_blank"
                       :href="upgradeUrl('feature_lock_country_heatmap')"
                       class="el-button el-button--info el-button--small mt-2">
                        {{ $t('Upgrade to Pro') }}
                    </a>
                </notice>
            </card-body>
        </div>
    </card>
</template>

<script>
import upgradeUrl from '@/common/upgradeUrl';
import * as echarts from 'echarts';
import Card from "@/admin/components/Card/Card.vue";
import CardHead from "@/admin/components/Card/CardHead.vue";
import CardBody from "@/admin/components/Card/CardBody.vue";
import worldMapJson from "../world.geo.json";
import Notice from "@/admin/components/Notice/Notice.vue";
import { COLORS, ChartLoader, NoData, escapeHtml } from './shared/simple-utils.js';
import {
    buildRegionIndex,
    buildRegionNameSet,
    resolveRegionForItem,
    resolveMarkerCoords,
    isValueInVisualMapRange,
} from '../country-iso';

// Marker size for countries with no polygon, in pixels.
const MARKER_MIN_SIZE = 6;
const MARKER_MAX_SIZE = 18;

// Fill for a country the legend's High/Low band excludes. Shared by both
// series so the filter looks the same whether a country is drawn as a polygon
// or as a point.
const OUT_OF_RANGE_COLOR = '#eeeeee';

export default {
    name: 'SubmissionCountryHeatmap',
    components: {Notice, CardBody, CardHead, Card, ChartLoader, NoData},
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
        hasPro() {
            return !!window.FluentFormApp.has_pro;
        },
        countryData() {
            return this.countryHeatmap?.country_data || [];
        },
        regionIndex() {
            return buildRegionIndex(worldMapJson).index;
        },
        mapRegionNames() {
            return buildRegionNameSet(worldMapJson);
        },
        resolvedData() {
            return (this.countryData || []).map((item) => ({
                item,
                region: this.resolveRegion(item),
            }));
        },
        // City-states and small islands have no polygon in the bundled map, so
        // they are plotted as points. Without this they would be invisible.
        markerData() {
            return this.resolvedData
                .filter((entry) => !entry.region)
                .map((entry) => ({
                    entry,
                    coords: resolveMarkerCoords(entry.item, this.regionIndex, this.mapRegionNames),
                }))
                .filter(({coords}) => coords)
                .map(({entry, coords}) => {
                    const value = entry.item.value || 0;

                    return {
                        name: entry.item.name,
                        displayName: entry.item.name,
                        value: [...coords, value],
                        // visualMap only drives the region series — its colour
                        // ramp reads dimension 0, which here is longitude. The
                        // marker has to apply the legend's band itself, or the
                        // filter greys out polygon countries while leaving
                        // excluded city-states lit.
                        itemStyle: {
                            color: this.inVisualMapRange(value)
                                ? COLORS.views
                                : OUT_OF_RANGE_COLOR,
                        },
                    };
                });
        },
        // One resolver governs the regions, the markers and the legend.
        // Deriving the scale separately is what painted every country grey.
        renderedMax() {
            const drawn = [
                ...this.resolvedData.filter((entry) => entry.region).map((entry) => entry.item.value),
                ...this.markerData.map((marker) => marker.value[2]),
            ]
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value));

            return drawn.length ? Math.max(...drawn) : 0;
        },
        coloredData() {
            return this.resolvedData
                .filter((entry) => entry.region)
                .map(({item, region}) => {
                    const value = item.value || 0;
                    const isInRange = this.inVisualMapRange(value);

                    return {
                        ...item,
                        name: region,
                        displayName: item.name,
                        value: value,
                        itemStyle: {
                            color: isInRange ? this.getColor(value) : OUT_OF_RANGE_COLOR
                        },
                        emphasis: {
                            itemStyle: {shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)"},
                        },
                    };
                });
        },
        infoMessage() {
            return this.countryHeatmap?.disable ? this.$t('Country detection is disabled. Please enable it to see the submissions by country.') : this.$t('No submission data available for the selected date range');
        }
    },
    methods: {
        upgradeUrl,
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
                return `rgba(24, 144, 255, 0)`;
            }
            const intensity = Math.log(value + 1) / Math.log(this.maxValue + 1);
            return `rgba(24, 144, 255, ${intensity})`;
        },

        getMapOption() {
            return {
                backgroundColor: '#f8f9fa',
                tooltip: {
                    trigger: "item",
                    formatter: (params) => {
                        // Regions carry a plain count; markers carry
                        // [longitude, latitude, count].
                        const raw = params.value;
                        const value = (Array.isArray(raw) ? raw[2] : raw) || 0;
                        const label = (params.data && params.data.displayName) || params.name;
                        return `<strong>${escapeHtml(label)}</strong><br/>${this.$t('Submissions:')} ${value}`;
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
                    // Regions only. The marker series carries [lng, lat, count]
                    // and colours itself, so letting visualMap at it would map
                    // the wrong dimension.
                    seriesIndex: 0,
                    min: 0,
                    max: this.maxValue,
                    left: "left",
                    top: "2%",
                    text: ["High", "Low"],
                    orient: "horizontal",
                    calculable: true,
                    range: this.currentVisualMapRange,
                    inRange: {
                        color: ["#e6f3ff", COLORS.views],
                    },
                    textStyle: {
                        color: "#666",
                    },
                },
                // The map is declared as a geo component rather than on the
                // series, so the marker scatter below can share its coordinate
                // system and pan/zoom with it.
                geo: {
                    map: "world",
                    roam: true,
                    zoom: this.zoomLevel,
                    label: {
                        show: false,
                    },
                    emphasis: {
                        label: {
                            show: true,
                            color: "#333",
                            fontWeight: "bold",
                        },
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
                },
                series: [
                    {
                        name: this.$t('Submissions'),
                        type: "map",
                        geoIndex: 0,
                        data: this.coloredData,
                    },
                    {
                        // Countries the map has no polygon for — Singapore,
                        // Hong Kong, Monaco and the like. Drawn as points so
                        // their submissions appear on the map instead of being
                        // dropped for having no shape to fill.
                        name: this.$t('Submissions'),
                        type: "scatter",
                        coordinateSystem: "geo",
                        geoIndex: 0,
                        symbolSize: (value) => this.markerSize(value[2]),
                        // Colour is set per datum in markerData so the legend
                        // band can grey a marker out. Leaving a series-level
                        // colour here would override it.
                        itemStyle: {
                            borderColor: "#ffffff",
                            borderWidth: 1,
                        },
                        emphasis: {
                            itemStyle: {shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)"},
                        },
                        data: this.markerData,
                    },
                ],
            };
        },

        // Area-proportional so a marker reads like a filled region does.
        markerSize(value) {
            const count = Number(value) || 0;
            if (count <= 0) {
                return 0;
            }

            const ratio = Math.sqrt(count) / Math.sqrt(Math.max(this.maxValue, 1));

            return MARKER_MIN_SIZE + (MARKER_MAX_SIZE - MARKER_MIN_SIZE) * Math.min(ratio, 1);
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

            this.maxValue = Math.max(this.renderedMax, 1);
            this.currentVisualMapRange = [0, this.maxValue];
            this.chartInstance.setOption(this.getMapOption());

            // Listen for visual map range changes
            this.chartInstance.on("datarangeselected", (params) => {
                this.currentVisualMapRange = params.selected;
                this.updateChart();
            });

            this.chartInstance.on("georoam", () => {
                const option = this.chartInstance.getOption();
                // Zoom lives on the geo component now that the map is declared
                // there rather than on the series.
                if (option.geo && option.geo[0] && option.geo[0].zoom) {
                    const newZoom = option.geo[0].zoom;
                    if (newZoom !== this.zoomLevel) {
                        if (newZoom < this.minZoom || newZoom > this.maxZoom) {
                            const clamped = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
                            this.chartInstance.setOption({
                                geo: [{zoom: clamped}],
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
            this.$nextTick(() => {
                if (this.countryData && this.countryData.length > 0) {
                    const option = this.getMapOption();
                    this.chartInstance.clear();
                    this.chartInstance.setOption(option, {notMerge: true});
                }
            });
        },

        zoomIn() {
            this.zoomLevel = Math.min(this.zoomLevel + this.zoomInterval, this.maxZoom);
            if (this.chartInstance) {
                this.chartInstance.setOption({geo: [{zoom: this.zoomLevel}]});
            }
        },

        zoomOut() {
            this.zoomLevel = Math.max(this.zoomLevel - this.zoomInterval, this.minZoom);
            if (this.chartInstance) {
                this.chartInstance.setOption({geo: [{zoom: this.zoomLevel}]});
            }
        },

        resetChart() {
            this.zoomLevel = this.minZoom;
            if (this.chartInstance) {
                this.chartInstance.clear();
                this.chartInstance.setOption(this.getMapOption());
            }
        },
        
        /**
         * Resolve a payload row to the map region it should colour.
         *
         * Joins on the ISO code so the match survives country renames and
         * non-English admin locales, then falls forward to a name match. The
         * name path is not just a version-skew fallback: the free tier's own
         * demo payload (Reports/App.vue) ships name-only rows, so it runs on
         * every install without Pro.
         */
        resolveRegion(item) {
            return resolveRegionForItem(item, this.regionIndex, this.mapRegionNames);
        },

        // One membership test for both series, so the legend band means the
        // same thing for a polygon country and a marker country.
        inVisualMapRange(value) {
            return isValueInVisualMapRange(value, this.currentVisualMapRange);
        },
        refreshChart() {
            if (this.chartInstance) {
                this.chartInstance.dispose();
                this.chartInstance = null;
            }
        },
    },
    watch: {
        countryHeatmap: {
            handler(newVal, oldVal) {
                this.refreshChart();
                if (newVal && newVal.country_data && newVal.country_data.length > 0) {
                    this.$nextTick(() => {
                        this.initChart();
                    });
                }
            },
            deep: true,
            immediate: true
        }
    },

    beforeDestroy() {
        this.refreshChart();
    },
};
</script>
