<template>
    <div class="ff_ranking_report_card">
        <div class="ff_ranking_report_card__header">
            <span class="ff_ranking_report_card__title">{{ report.label }}</span>
            <div class="ff_ranking_report_card__header-right">
                <span class="ff_ranking_report_card__total">
                    {{ totalSubmissions }}
                    {{ totalSubmissions === 1 ? $t('response') : $t('responses') }}
                </span>
                <div
                    class="ff_ranking_report_card__view-toggle"
                    role="group"
                    :aria-label="$t('Report view')"
                >
                    <button
                        type="button"
                        :class="['ff_ranking_report_card__view-btn', { 'is-active': viewMode === 'aggregated' }]"
                        :aria-pressed="viewMode === 'aggregated'"
                        @click="viewMode = 'aggregated'"
                    >
                        {{ $t('Summary') }}
                    </button>
                    <button
                        type="button"
                        :class="['ff_ranking_report_card__view-btn', { 'is-active': viewMode === 'detailed' }]"
                        :aria-pressed="viewMode === 'detailed'"
                        @click="viewMode = 'detailed'"
                    >
                        {{ $t('Detailed') }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="!options.length" class="ff_ranking_report_card__empty">
            {{ $t('No ranking responses yet.') }}
        </div>

        <!-- AGGREGATED VIEW: leaderboard, one row per option -->
        <ul v-else-if="viewMode === 'aggregated'" class="ff_ranking_report_card__leaderboard">
            <li
                v-for="(option, optionIndex) in options"
                :key="option.value || optionIndex"
                class="ff_ranking_report_card__leaderboard-row"
            >
                <span class="ff_ranking_report_card__rank-index">#{{ optionIndex + 1 }}</span>
                <span class="ff_ranking_report_card__name-pill">{{ option.label }}</span>
                <div class="ff_ranking_report_card__leaderboard-bar-track" :title="distributionTooltip(option)">
                    <div
                        v-for="segment in option.distribution"
                        :key="segment.position"
                        class="ff_ranking_report_card__leaderboard-bar-segment"
                        :style="segmentStyle(segment)"
                    ></div>
                </div>
                <span class="ff_ranking_report_card__leaderboard-top">
                    <strong>{{ topPositionPct(option) }}%</strong> {{ $t('chose #1') }}
                </span>
                <span
                    v-if="option.average_rank !== null"
                    class="ff_ranking_report_card__average"
                >
                    <strong>#{{ formatAverage(option.average_rank) }}</strong>
                    <span class="ff_ranking_report_card__average-label">
                        {{ $t('average') }}
                    </span>
                    <el-tooltip
                        class="item"
                        placement="top"
                        popper-class="ff_tooltip_wrap"
                    >
                        <div slot="content">
                            <h6>{{ $t('Average rank') }}</h6>
                            <p>{{ averageTooltip }}</p>
                        </div>
                        <i class="ff-icon ff-icon-gray ff-icon-info-filled ff_ranking_report_card__info-icon"></i>
                    </el-tooltip>
                </span>
            </li>
        </ul>

        <!-- DETAILED VIEW: per-option, with full per-position distribution -->
        <div v-else class="ff_ranking_report_card__body">
            <section
                v-for="(option, optionIndex) in options"
                :key="option.value || optionIndex"
                class="ff_ranking_report_card__option"
            >
                <header class="ff_ranking_report_card__option-head">
                    <span class="ff_ranking_report_card__rank-index">#{{ optionIndex + 1 }}</span>
                    <span class="ff_ranking_report_card__name-pill">{{ option.label }}</span>
                    <span
                        v-if="option.average_rank !== null"
                        class="ff_ranking_report_card__average"
                    >
                        <strong>#{{ formatAverage(option.average_rank) }}</strong>
                        <span class="ff_ranking_report_card__average-label">
                            {{ $t('average') }}
                        </span>
                        <el-tooltip
                            class="item"
                            placement="top"
                            popper-class="ff_tooltip_wrap"
                        >
                            <div slot="content">
                                <h6>{{ $t('Average rank') }}</h6>
                                <p>{{ averageTooltip }}</p>
                            </div>
                            <i class="ff-icon ff-icon-gray ff-icon-info-filled ff_ranking_report_card__info-icon"></i>
                        </el-tooltip>
                    </span>
                </header>

                <ul class="ff_ranking_report_card__bars">
                    <li
                        v-for="bar in option.distribution"
                        :key="bar.position"
                        class="ff_ranking_report_card__bar"
                    >
                        <span class="ff_ranking_report_card__bar-pct">{{ bar.pct }}%</span>
                        <div class="ff_ranking_report_card__bar-track">
                            <div
                                class="ff_ranking_report_card__bar-fill"
                                :style="barFillStyle(bar)"
                            >
                                <span class="ff_ranking_report_card__bar-pos">#{{ bar.position }}</span>
                            </div>
                        </div>
                        <span class="ff_ranking_report_card__bar-count">
                            <strong>{{ bar.count }}</strong>
                            {{ bar.count === 1 ? $t('response') : $t('responses') }}
                        </span>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'RankingReportCard',
    props: {
        report: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            viewMode: 'aggregated',
        };
    },
    computed: {
        options() {
            return Array.isArray(this.report.options) ? this.report.options : [];
        },
        positionCount() {
            const first = this.options[0];
            return first && Array.isArray(first.distribution) ? first.distribution.length : 0;
        },
        totalSubmissions() {
            return parseInt(this.report.total_submissions || this.report.total_entry || 0, 10) || 0;
        },
        averageTooltip() {
            return this.$t(
                'Mean rank position across all responses for this option. Lower is better — #1.00 means every respondent placed it first.'
            );
        },
    },
    methods: {
        formatAverage(value) {
            if (value === null || value === undefined) {
                return '—';
            }
            const num = Number(value);
            if (Number.isNaN(num)) {
                return '—';
            }
            return num.toFixed(2);
        },
        barFillStyle(bar) {
            // Detailed view: bar = the percentage. Solid primary fill —
            // position label sits inside the bar and needs readable
            // contrast.
            const width = Math.max(0, Math.min(100, Number(bar.pct) || 0));
            return {
                width: width + '%',
            };
        },
        segmentStyle(segment) {
            // Stacked distribution bar segment. Segment width = the
            // percentage of responses at this rank position. Color
            // is primary blue with opacity fading by rank so #1 reads
            // strongest and trailing positions recede gracefully.
            const total = this.positionCount || 1;
            const step = total > 1 ? (1 - 0.35) / (total - 1) : 0;
            const opacity = Math.max(0.35, 1 - step * (segment.position - 1));
            const width = Math.max(0, Math.min(100, Number(segment.pct) || 0));
            return {
                width: width + '%',
                opacity: opacity.toFixed(2),
            };
        },
        topPositionPct(option) {
            if (!Array.isArray(option.distribution) || !option.distribution.length) {
                return 0;
            }
            const top = option.distribution.find(d => d.position === 1);
            return top ? top.pct : 0;
        },
        distributionTooltip(option) {
            if (!Array.isArray(option.distribution)) {
                return '';
            }
            return option.distribution
                .map(d => `#${d.position}: ${d.pct}% (${d.count})`)
                .join('  ·  ');
        },
    },
};
</script>
