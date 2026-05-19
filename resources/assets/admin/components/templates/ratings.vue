<template>
    <withLabel :item="item">
        <div class="ff-el-rating-preview" :style="previewStyles">
            <div
                v-for="(label, value, index) in item.options"
                :key="value"
                :class="['ff-el-rating-preview__item', { 'is-active': selectedIndex >= index }]"
            >
                <span class="ff-el-rating-preview__icon" v-html="iconMarkup"></span>
                <span class="ff-el-rating-preview__value">{{ value }}</span>
            </div>
        </div>
        <span v-if="showTextEnabled">{{ ratingText }}</span>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';
import {
    DEFAULT_RATING_ACTIVE_COLOR,
    DEFAULT_RATING_INACTIVE_COLOR,
    resolveRatingIconMarkup,
    sanitizeRatingColor
} from '../../helpers/ratingIcons';

export default {
    name: 'ratings',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        maxScore() {
            return Object.keys(this.item.options).length;
        },

        defaultValue() {
            const selectedValue = String(this.item.attributes.value || '');

            return Object.keys(this.item.options).indexOf(selectedValue) + 1;
        },

        selectedIndex() {
            return Math.max(this.defaultValue - 1, -1);
        },

        ratingText() {
            return this.item.options[this.item.attributes.value];
        },

        showTextEnabled() {
            return this.item.settings.show_text === true || this.item.settings.show_text === 'yes';
        },

        previewStyles() {
            return {
                '--ff-rating-inactive-color': sanitizeRatingColor(
                    this.item.settings.inactive_color,
                    DEFAULT_RATING_INACTIVE_COLOR
                ),
                '--ff-rating-active-color': sanitizeRatingColor(
                    this.item.settings.active_color,
                    DEFAULT_RATING_ACTIVE_COLOR
                )
            };
        },

        iconMarkup() {
            return resolveRatingIconMarkup(this.item.settings);
        }
    }
}
</script>
