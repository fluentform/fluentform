<template>
    <div class="entry-texts">
        <el-checkbox true-value="on" false-value="" v-model="model"><span v-html="field.raw.settings.tnc_html"></span></el-checkbox>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'mult-text-line',
        props: ['modelValue', 'type', 'field'],
        data() {
            return {
                model: this.modelValue
            }
        },
        watch: {
            model() {
                this.$emit('update:modelValue', this.model);
            }
        }
    }
</script>