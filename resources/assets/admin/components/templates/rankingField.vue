<template>
    <withLabel :item="item">
        <div
            class="ff-ranking-preview"
            :class="{
                'ff-ranking-preview--grid': isGrid
            }"
            :style="previewStyle"
        >
            <div
                v-for="(option, index) in previewOptions"
                :key="`${option.value || option.label}-${index}`"
                class="ff-ranking-preview__item"
                :class="{
                    'ff-ranking-preview__item--has-image': !!(item.settings.enable_image_input && option.image),
                    'ff-ranking-preview__item--no-image': !(item.settings.enable_image_input && option.image)
                }"
            >
                <div class="ff-ranking-preview__item-main">
                    <span class="ff-ranking-preview__handle" aria-hidden="true">&#8942;</span>
                    <span class="ff-ranking-preview__index">{{ index + 1 }}</span>
                    <span
                        v-if="item.settings.enable_image_input && option.image"
                        class="ff-ranking-preview__image"
                    >
                        <img :src="option.image" :alt="option.label || option.value">
                    </span>
                    <span class="ff-ranking-preview__label">
                        {{ option.label || option.value }}
                    </span>
                </div>
                <div class="ff-ranking-preview__actions">
                    <span v-if="index > 0" class="ff-ranking-preview__move" aria-hidden="true">↑</span>
                    <span v-if="index < previewOptions.length - 1" class="ff-ranking-preview__move" aria-hidden="true">↓</span>
                </div>
            </div>
        </div>
    </withLabel>
</template>

<script type="text/babel">
import withLabel from './withLabel.vue';

export default {
    name: 'rankingField',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        isGrid() {
            return this.item.settings.ranking_display_type === 'grid';
        },
        previewStyle() {
            return {
                '--ff-ranking-preview-columns': this.item.settings.ranking_grid_columns || 3
            };
        },
        previewOptions() {
            return (this.item.settings.advanced_options || []).slice(0, 5);
        }
    }
}
</script>
