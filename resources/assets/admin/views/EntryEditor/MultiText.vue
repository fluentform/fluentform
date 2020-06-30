<template>
    <div class="entry-multi-texts">
        <div v-for="(valueItem, valueKey) in model" :key="valueKey" class="mult-text-each">
            <el-input size="mini" :placeholder="valueKey" v-model="model[valueKey]"></el-input>
        </div>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'mult-text-line',
        props: ['value'],
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