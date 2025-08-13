<template>
    <el-form-item v-if="!editItem.hasOwnProperty('options') && typeof modelValue == 'string'">
        <template #label>
            <elLabel :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        </template>
        <inputPopover
            :fieldType="fieldType"
            v-model="model"
            :data="editorShortcodes"
            :attr-name="editItem.attributes.name"
        >
        </inputPopover>
    </el-form-item>
</template>

<script>
import { mapGetters } from 'vuex';

import elLabel from '../../includes/el-label.vue';
import inputPopover from '../../input-popover.vue';

export default {
    name: 'wpuf_inputValue',
    props: ['listItem', 'modelValue', 'editItem'],
    components: {
        'ff-label': elLabel,
        inputPopover,
    },
    data() {
        return {
            model: this.modelValue,
        };
    },
    computed: {
        ...mapGetters(['editorShortcodes']),
        fieldType() {
            if (this.listItem.type) {
                return this.listItem.type;
            }
            if (!this.editItem.attributes.type) {
                return 'textarea';
            }
            return 'text';
        },
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
    },
    mounted() {
        let shortcodes = Object.assign(
            { '{get.param_name}': 'Populate by GET Param' },
            this.editorShortcodes[0].shortcodes
        );

        shortcodes['{cookie.cookie_name}'] = 'Cookie Value';

        this.$store.commit('setEditorShortcode', shortcodes);
    },
};
</script>
