<template>
    <div class="editor-select">
        <el-checkbox-group v-model="model">
            <el-checkbox
                v-for="(option, option_key) in field.raw.options"
                :key="option_key"
                :value="option_key"
            >
                {{option}}
            </el-checkbox>
        </el-checkbox-group>
    </div>
</template>

<script>
    export default {
        name: 'checkbox-field',
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
        },
        mounted() {
            if(typeof this.value != 'object' || !this.value) {
                this.model = [];
            }
        }
    }
</script>