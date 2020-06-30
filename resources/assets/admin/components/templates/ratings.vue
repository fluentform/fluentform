<template>
    <withLabel :item="item">
        <el-rate 
            class="ff-el-rate"
            :value="defaultValue"
            :colors="[item.settings.color, item.settings.color, item.settings.color]"
            :max="maxScore" />
            <span v-if="item.settings.show_text">{{ ratingText }}</span>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

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
            return Object.keys(this.item.options).indexOf(this.item.attributes.value) + 1;
        },

        ratingText() {
            return this.item.options[this.item.attributes.value];
        }
    }
}
</script>

<style lang="scss">
    .ff-el-rate {
        display: inline-block;
    }
</style>
