<template>
    <div class="ff-input-yes-no-checkbox-wrap">
        <el-checkbox false-label="no" true-label="yes" v-model="model">
            <span class="checkbox-label">{{listItem.label}}</span>
            <el-tooltip v-if="listItem.help_text" placement="bottom-start" popper-class="ff_tooltip_wrap">
                <p slot="content" v-html="listItem.help_text"></p>
                <i class="ff-icon ff-icon-info-filled"></i>
            </el-tooltip>
        </el-checkbox>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'inputYesNoCheckBox',
        props: ['listItem', 'value'],
        watch: {
            model() {
                this.$emit('input', this.model);
            }
        },
        data() {
            return {
                model: this.value
            }
        }
    }
</script>