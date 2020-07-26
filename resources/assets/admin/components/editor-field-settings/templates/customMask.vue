<template>
    <withLabel :fieldOpt="listItem">
        <el-input v-model="model" :type="listItem.type"></el-input>
        <a href="#" @click.prevent="dialogVisible = true">Help</a>

        <div :class="{'ff_backdrop': dialogVisible}">
            <el-dialog
                title="Custom Mask Help"
                :visible.sync="dialogVisible"
                width="50%"
                :before-close="close">
                <h4 style="margin-bottom: 5px;">Usage</h4>
                <ul>
                    <li>Use a '0' to indicate a numerical character.</li>
                    <li>Use a '0' to indicate a numerical character.</li>
                    <li>Use a upper case 'A' to indicate an alphabetical character.</li>
                    <li>Use an asterisk '*' to indicate any alphanumeric character.</li>
                    <li>All other characters are literal values and will be displayed automatically.</li>
                </ul>

                <h4 style="margin-bottom: 5px;">Examples</h4>
                <p v-for="input, i in exampleInputs" :key="i">
                    <strong>{{ input.title }} </strong> Mask: <mark>{{ input.mask }}</mark>. Valid Input: <mark>{{ input.validInput }}</mark>
                </p>
                <p>View More information about <a target="_blank" rel="noopener" href="https://igorescobar.github.io/jQuery-Mask-Plugin/docs.html">Mask Library</a></p>
                <span slot="footer" class="dialog-footer">
                    <el-button @click="close">Cancel</el-button>
                </span>
            </el-dialog>
        </div>

    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'customMask',
    props: ['listItem', 'value'],
    components: {
        withLabel
    },
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    data() {
        return {
            model: this.value,
            dialogVisible: false,
            exampleInputs: [
                {
                    title: 'Date',
                    mask: '00/00/0000',
                    validInput: '10/21/2011'
                },
                {
                    title: 'Social Security Number',
                    mask: '000-00-0000',
                    validInput: '987-65-4329'
                },
                {
                    title: 'Course Code',
                    mask: 'AAA 999',
                    validInput: 'BIO 101'
                },
                {
                    title: 'License Key',
                    mask: '***-***-***',
                    validInput: 'a9a-f0c-28Q'
                }
            ]
        }
    },
    methods: {
        close() {
            this.dialogVisible = false;
        }
    }
}
</script>

<style>
    mark {
        background-color:#929292 !important;
        color: #fff !important;
        font-size: 11px;
        padding: 5px;
        display: inline-block;
        line-height: 1;
        
    }
</style>
