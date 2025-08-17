<template>
    <div class="editor-select">
        <el-radio-group v-model="model">
            <el-radio
                v-for="(option, option_key) in field.raw.options"
                :key="option_key"
                :label="option_key"
            >
                {{option}}
            </el-radio>
        </el-radio-group>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'radio-field',
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