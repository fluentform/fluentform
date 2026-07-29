<template>
    <div class="entry-texts">
        <el-input :type="type" size="mini" v-model="model"></el-input>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'mult-text-line',
        props: ['value', 'type'],
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