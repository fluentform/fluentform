<template>
    <div class="editor-select">
        <el-checkbox-group v-model="model">
            <el-checkbox
                v-for="(option, option_key) in field.raw.options"
                :key="option_key"
                :label="option_key"
            >
                {{option}}
            </el-checkbox>
        </el-checkbox-group>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'checkbox-field',
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
        },
        mounted() {
            if(typeof this.value != 'object' || !this.value) {
                this.model = [];
            }
        }
    }
</script>