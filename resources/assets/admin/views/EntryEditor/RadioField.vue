<template>
    <div class="editor-select">
        <el-radio-group v-model="model">
            <el-radio
                v-for="(option, option_key) in field.raw.options"
                :key="option_key"
                :value="option_key"
            >
                {{ option }}
            </el-radio>
        </el-radio-group>
    </div>
</template>

<script>
export default {
    name: "radio-field",
    props: ["modalValue", "type", "field"],
    data() {
        return {
            model: this.modelValue
        };
    },
    watch: {
        model() {
            this.$emit("update:modelValue", this.model);
        }
    }
};
</script>