<template>
    <div class="entry-texts">
        <el-input :type="type" size="small" v-model="model"></el-input>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'mult-text-line',
        props: ['modelValue', 'type'],
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