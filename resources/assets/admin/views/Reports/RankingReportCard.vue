<template>
    <div class="ff_ranking_report_card">
        <div class="ff_ranking_report_card__header">
            <span class="ff_ranking_report_card__title">{{ report.label }}</span>
            <span class="ff_ranking_report_card__total">
                {{ totalSubmissions }} {{ totalSubmissions === 1 ? $t('response') : $t('responses') }}
            </span>
        </div>

        <div v-if="!options.length" class="ff_ranking_report_card__empty">
            {{ $t('No ranking responses yet.') }}
        </div>

        <div v-else class="ff_ranking_report_card__body">
            <div
                v-for="(option, optionIndex) in options"
                :key="option.value || optionIndex"
                class="ff_ranking_report_card__option"
            >
                <div class="ff_ranking_report_card__option-head">
                    <span class="ff_ranking_report_card__rank">#{{ optionIndex + 1 }}</span>
                    <span class="ff_ranking_report_card__label">{{ option.label }}</span>
                    <span
                        v-if="option.average_rank !== null"
                        class="ff_ranking_report_card__average"
                    >
                        #{{ formatAverage(option.average_rank) }} {{ $t('avg') }}
                    </span>
                </div>

                <ul class="ff_ranking_report_card__bars">
                    <li
                        v-for="bar in option.distribution"
                        :key="bar.position"
                        class="ff_ranking_report_card__bar"
                    >
                        <span class="ff_ranking_report_card__bar-pos">#{{ bar.position }}</span>
                        <div class="ff_ranking_report_card__bar-track">
                            <div
                                class="ff_ranking_report_card__bar-fill"
                                :style="barFillStyle(bar)"
                            ></div>
                        </div>
                        <span class="ff_ranking_report_card__bar-pct">{{ bar.pct }}%</span>
                        <span class="ff_ranking_report_card__bar-count">
                            {{ bar.count }} {{ bar.count === 1 ? $t('response') : $t('responses') }}
                        </span>
                    </li>
                </ul>
            </div>
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
            // Fade the primary fill by position so #1 reads strongest
            // and trailing positions recede. Caps at 0.40 so the lowest
            // rank is still legible against the #f5f7fa track.
            const totalPositions = this.positionCount || 1;
            const step = totalPositions > 1 ? (1 - 0.4) / (totalPositions - 1) : 0;
            const opacity = Math.max(0.4, 1 - step * (bar.position - 1));
            const width = Math.max(0, Math.min(100, Number(bar.pct) || 0));
            return {
                width: width + '%',
                opacity: opacity.toFixed(2),
            };
        },
    },
};
</script>
