<template>
    <div style="margin-bottom: 20px">
        <el-checkbox false-label="no" true-label="yes" v-model="model">
            {{listItem.label}}
            <el-tooltip v-if="listItem.help_text" placement="bottom-start" effect="light">
                <p slot="content" v-html="listItem.help_text"></p>
                <i class="el-icon-info el-text-info"></i>
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