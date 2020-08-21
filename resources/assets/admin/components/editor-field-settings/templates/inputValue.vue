<template>
    <el-form-item v-if="!editItem.hasOwnProperty('options') && typeof value == 'string'">
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        <inputPopover :fieldType="fieldType" v-model="model" :data="editorShortcodes" 
                      :attr-name="editItem.attributes.name">
        </inputPopover>
    </el-form-item>
</template>

<script>
import { mapGetters } from 'vuex';

import elLabel from '../../includes/el-label.vue'
import inputPopover from '../../input-popover.vue'

export default {
    name: 'wpuf_inputValue',
    props: ['listItem', 'value', 'editItem'],
    components: {
        elLabel,
        inputPopover
    },
    data() {
        return {
            model: this.value
        }
    },
    computed: {
        ...mapGetters(['editorShortcodes']),
        fieldType() {
            if(this.listItem.type) {
                return this.listItem.type;
            }
            if (!this.editItem.attributes.type) {
                return 'textarea';
            }
            return 'text';
        }
    },
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    mounted() {
        let shortcodes = Object.assign(
            { "{get.param_name}": this.$t("Populate by GET Param") }, 
            this.editorShortcodes[0].shortcodes
        );

        shortcodes['{cookie.cookie_name}'] = this.$t("Cookie Value");
        
        this.editorShortcodes[0].shortcodes = shortcodes;
    }
}
</script>