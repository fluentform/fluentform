<template>
<div :class="{'ff_backdrop': visibility}">
    <el-dialog
        :title="$t('Confirmation')"
        :visible.sync="visibility"
        :before-close="close"
        class="text-center"
        width="30%">
        <span><strong>{{ $t('Are you sure you want to delete this field?') }}</strong></span>

        <p class="data-lost-msg">{{ dataLostMsg }}</p>

        <p class="data-lost-msg">{{ dataLostMsg }}</p>

        <div slot="footer" class="text-center dialog-footer">
            <el-button @click="close">{{ $t('Cancel') }}</el-button>
            <el-button type="primary" @click="$emit('on-confirm')">{{ $t('Confirm') }}</el-button>
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

    computed: {
        dataLostMsg() {
            let matched = [];
            
            if (this.editItem?.attributes && window.FluentFormApp.used_name_attributes) {
                matched = window.FluentFormApp.used_name_attributes.filter(
                    name => name.field_name === this.editItem?.attributes.name
                )
            }

            return matched.length ? 'All data involving this field will be lost!' : ''
        }
    },

    methods: {
        close() {
            this.$emit('update:visibility', false);
        }
    }
}
</script>