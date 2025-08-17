<template>
    <div class="editor-select">
        <el-select :multiple="field.raw.attributes.multiple" v-model="model" clearable allow-create filterable>
            <el-option
                v-for="(option, option_key) in field.raw.options"
                :key="option_key"
                :label="option"
                :value="option_key"
            >
            </el-option>
        </el-select>
    </div>
</template>

<script>
    export default {
        name: 'select-field',
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
            if(this.field.raw.attributes.multiple) {
                if(typeof this.value != 'object' || !this.value) {
                    this.model = [];
                }
            }
        }
    }
</script>