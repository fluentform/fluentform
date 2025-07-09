<template>
<div :class="{'ff_backdrop': visibility}">
    <el-dialog
        class="el-dialog-no-header"
        :visible.sync="visibility"
        :before-close="close"
        width="28%"
        :show-close="false"
    >

       <div class="text-center">
            <div class="ff_icon_btn warning-soft mx-auto">
                <i class="el-icon-warning-outline"></i>
            </div>
            <h1 class="mt-4 mb-3">{{$t('Are you sure?')}}</h1>
            <p class="text-base mb-5">{{$t('You want to delete this field?')}}</p>
            <p class="text-base text-center mb-3" v-if="dataLostMsg">
                <strong>Note:</strong>
                {{ dataLostMsg }}
            </p>
            <p class="ff-tip-text text-xs text-muted mb-3" >
                You can also press <kbd>Del</kbd> or <kbd>⌫</kbd> to delete a selected field. Undo with <kbd>Ctrl+Z</kbd> or <kbd>⌘Z</kbd>.
            </p>
        </div>

        <div slot="footer" class="dialog-footer">
            <btn-group class="ff_btn_group_half">
                <btn-group-item>
                    <el-button @click="close" type="info" class="el-button--soft">{{ $t('Cancel') }}</el-button>
                </btn-group-item>
                <btn-group-item>
                    <el-button type="danger" @click="$emit('on-confirm')">{{ $t('Yes, Confirm!') }}</el-button>
                </btn-group-item>
            </btn-group>
        </div>
    </el-dialog>
</div>
</template>

<script>
import BtnGroup from '../BtnGroup/BtnGroup.vue';
import BtnGroupItem from '../BtnGroup/BtnGroupItem.vue';

export default {
  components: { BtnGroup, BtnGroupItem },
    name: 'deleteFormElConfirm',
    props: {
        visibility: Boolean,
        editItem: Object
    },
    watch: {
        visibility(val) {
            if (val) {
                this.$nextTick(() => {
                    // Focus the first button in the dialog
                    const btn = this.$el.querySelector('.el-button');
                    if (btn) btn.focus();
                });
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
