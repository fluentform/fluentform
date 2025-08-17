<template>
    <div class="entry-multi-texts">
        <div v-for="(valueItem, valueKey) in model" :key="valueKey" class="mult-text-each">
            <el-input size="small" :placeholder="valueKey" v-model="model[valueKey]"></el-input>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'mult-text-line',
        props: ['modelValue'],
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