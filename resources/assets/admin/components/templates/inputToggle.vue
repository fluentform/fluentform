<template>
    <withLabel :item="item">
        <div
            style="display: flex; align-items: center; justify-content: flex-start; gap: 16px;"
        >
            <button
                type="button"
                :style="choiceStyle('left')"
                @click.prevent="selectOption(0)"
            >
                <span v-if="showImages && options[0].image" :style="mediaStyle">
                    <img :src="options[0].image" alt="" :style="imageStyle">
                </span>
                {{ options[0].label }}
            </button>

            <button
                type="button"
                :style="switchStyle"
                @click.prevent="toggleSelection"
            >
                <span :style="thumbStyle"></span>
            </button>

            <button
                type="button"
                :style="choiceStyle('right')"
                @click.prevent="selectOption(1)"
            >
                <span v-if="showImages && options[1].image" :style="mediaStyle">
                    <img :src="options[1].image" alt="" :style="imageStyle">
                </span>
                {{ options[1].label }}
            </button>
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputToggle',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        options() {
            return this.getNormalizedOptions();
        },
        selectedIndex() {
            return this.options[1].value === this.item.attributes.value ? 1 : 0;
        },
        switchStyle() {
            return {
                position: 'relative',
                display: 'inline-block',
                width: '48px',
                height: '28px',
                padding: '0',
                border: '0',
                borderRadius: '999px',
                background:
                    this.selectedIndex === 1
                        ? this.activeSwitchColor
                        : '#dcdfe6',
                cursor: 'pointer',
                flex: '0 0 auto',
            };
        },
        thumbStyle() {
            return {
                position: 'absolute',
                top: '3px',
                left: '3px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 2px 6px rgba(17, 24, 39, 0.18)',
                transform: this.selectedIndex === 1 ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.2s ease',
            };
        },
        selectedOptionColor() {
            return this.item.settings.selected_option_color || '#409eff';
        },
        activeSwitchColor() {
            return this.item.settings.active_switch_color || '#409eff';
        },
        showImages() {
            return !!this.item.settings.enable_image_input;
        },
        mediaStyle() {
            return {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '72px',
                height: '72px',
                marginRight: '10px',
                overflow: 'hidden',
                borderRadius: '8px',
                background: '#f3f4f6',
                flex: '0 0 auto',
            };
        },
        imageStyle() {
            return {
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
            };
        },
    },
    methods: {
        getNormalizedOptions() {
            const defaults = [
                { label: this.$t('Left Option'), value: 'left' },
                { label: this.$t('Right Option'), value: 'right' },
            ];

            const options = Array.isArray(this.item.settings.advanced_options)
                ? this.item.settings.advanced_options.slice(0, 2)
                : [];

            while (options.length < 2) {
                options.push({ ...defaults[options.length] });
            }

            return options.map((option, index) => ({
                ...defaults[index],
                ...option,
            }));
        },
        selectOption(index) {
            const options = this.options;
            this.$set(this.item.attributes, 'value', options[index].value);
        },
        toggleSelection() {
            this.selectOption(this.selectedIndex === 1 ? 0 : 1);
        },
        choiceStyle(position) {
            const isSelected =
                (position === 'left' && this.selectedIndex === 0) ||
                (position === 'right' && this.selectedIndex === 1);

            return {
                appearance: 'none',
                background: 'transparent',
                border: '0',
                color: isSelected ? this.selectedOptionColor : '#303133',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                lineHeight: '1.4',
                padding: '0',
                textAlign: 'center',
                flex: '0 1 auto',
                display: 'inline-flex',
                alignItems: 'center',
                flexDirection: this.showImages ? 'column' : 'row',
            };
        },
    },
}
</script>
