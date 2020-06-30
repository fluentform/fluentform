<template>
    <div class="entry-texts">
        <el-checkbox true-label="on" false-label="" v-model="model"><span v-html="field.raw.settings.tnc_html"></span></el-checkbox>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'mult-text-line',
        props: ['value', 'type', 'field'],
        data() {
            return {
                model: this.value
            }
        },
        watch: {
            model() {
                this.$emit('input', this.model);
            }
        }
    }
</script>