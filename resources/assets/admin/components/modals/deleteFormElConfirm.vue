<template>
<div :class="{'ff_backdrop': visibility}">
    <el-dialog
        title="Confirmation"
        :visible.sync="visibility"
        :before-close="close"
        class="text-center"
        width="30%">
        <span><strong>Are you sure you want to delete this field? {{ hasEntryMessage() }}</strong></span>

        <div slot="footer" class="text-center dialog-footer">
            <el-button @click="close">Cancel</el-button>
            <el-button type="primary" @click="$emit('on-confirm')">Confirm</el-button>
        </div>
    </el-dialog>
</div>
</template>

<script>
export default {
    name: 'deleteFormElConfirm',
    props: {
        visibility: Boolean,
        editItem: Object
    },
    watch: {
        visibility() {
            if (this.visibility) {
                setTimeout( _ => {
                    const zIndex = Number(jQuery('.v-modal').css('z-index'));
                    jQuery('.ff_form_wrap').css('z-index', zIndex + 1);
                }, 0);
            }
        }
    },
    methods: {
        close() {
            this.$emit('update:visibility', false);
        },
        hasEntryMessage() {
            const usedName = window.FluentFormApp.used_name_attributes;
            const editItemName = this.editItem?.attributes?.name;
            for (name in usedName) {
                if (usedName[name].field_name == editItemName) {
                    return ' This Field has Entry. Removing this field will remove the entry under this field.';
                }
            }
        }
    }
}
</script>