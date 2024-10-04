<template>
    <div class="field_general">
        <input-popover
            :fieldType="field_type"
            :placeholder="$t('Select a Field or Type Custom value')"
            v-model="model"
            icon="el-icon-arrow-down"
            :data="editorShortcodes"
        />
    </div>
</template>

<script type="text/babel">
import InputPopover from '../../input-popover.vue';

export default {
    name: 'fieldGeneral',
    emits: ['update:modelValue'],
    components: {
        InputPopover
    },
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        editorShortcodes: Array,
        field_type: {
            type: String,
            default: 'text'
        }
    },
    data() {
        return {
            model: this.modelValue
        }
    },
    watch: {
        model(newValue) {
            this.$emit('update:modelValue', newValue);
        },
    }
}
</script>