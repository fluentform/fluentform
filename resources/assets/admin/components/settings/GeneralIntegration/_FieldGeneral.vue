<template>
    <div class="field_general">
        <input-popover :fieldType="field_type"
                       :placeholder="$t('Select a Field or Type Custom value')"
                       v-model="fieldValue"
                       icon="el-icon-arrow-down"
                       :data="editorShortcodes"
        ></input-popover>
    </div>
</template>

<script type="text/babel">
    import inputPopover from '../../input-popover.vue';

    export default {
        name: 'fieldGeneral',
        components: {
            inputPopover
        },
        props: {
            value: [String, Number, Boolean],
            editorShortcodes: Array,
            field_type: {
                type: String,
                default: 'text'
            }
        },
        data() {
            return {
                fieldValue: this.value
            }
        },
        watch: {
            fieldValue() {
                this.$emit('input', this.fieldValue);
            }
        }
    }
</script>