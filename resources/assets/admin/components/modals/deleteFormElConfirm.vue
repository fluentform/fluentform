<template>
    <el-dialog
        class="el-dialog-no-header"
        :visible.sync="visibility"
        :before-close="close"
        width="30%"
        :show-close="false"
    >
        <div class="text-center">
            <div class="ff_icon_btn lg warning-soft mx-auto">
                <i class="el-icon-warning-outline"></i>
            </div>
            <h1 class="mt-4 mb-3">{{$t('Are you sure?')}}</h1>
            <p class="text-base mb-5">{{$t('You want to delete this field?')}}</p>
            <p class="text-base text-center mb-3" v-if="dataLostMsg">
                <strong>Note:</strong>
                {{ dataLostMsg }}
            </p>
        </div>
        <div class="dialog-footer mt-2 text-center">
            <el-button @click="close" type="text" class="el-button--text-light">{{ $t('Cancel') }}</el-button>
            <el-button type="primary" @click="$emit('on-confirm')">{{ $t('Yes, Confirm!') }}</el-button>
        </div>
    </el-dialog>
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