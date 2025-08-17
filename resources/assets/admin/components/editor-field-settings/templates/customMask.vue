<template>
    <withLabel :fieldOpt="listItem">
        <el-input v-model="model" :type="listItem.type"></el-input>
        <a href="#" @click.prevent="dialogVisible = true">Help</a>

        <div :class="{ ff_backdrop: dialogVisible }">
            <el-dialog :title="$t('Custom Mask Help')" v-model="dialogVisible" width="50%" :before-close="close">
                <h4 style="margin-bottom: 5px">{{ $t('Usage') }}</h4>
                <ul>
                    <li>{{ $t("Use a '0' to indicate a numerical character.") }}</li>
                    <li>{{ $t("Use a upper case 'A' to indicate an alphabetical and numeric characters.") }}</li>
                    <li>{{ $t("Use a upper case 'S' to indicate an alphabetical characters.") }}</li>
                    <li>{{ $t("Use an asterisk '*' to indicate any alphanumeric character.") }}</li>
                    <li>{{ $t('All other characters are literal values and will be displayed automatically.') }}</li>
                </ul>

                <h4 style="margin-bottom: 5px;">{{ $t('Examples') }}</h4>
                <p v-for="(input, i) in exampleInputs" :key="i">
                    <span v-html="
                        $t(
                            '%s Mask: %s. Valid Input: %s',
                            `<strong>${input.title}</strong>`,
                            `<mark>${input.mask }</mark>`,
                            `<mark>${input.validInput}</mark>`
                        )
                    ">
                    </span>
                </p>
                <p v-html="
                    $t(
                        'View More information about %sMask Library%s',
                        `<a target='_blank' rel='noopener' href='https://igorescobar.github.io/jQuery-Mask-Plugin/docs.html'>`,
                        '</a>'
                    )
                ">
                </p>
                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="close">{{ $t('Cancel') }}</el-button>
                    </span>
                </template>
            </el-dialog>
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'customMask',
    props: ['listItem', 'modelValue'],
    components: {
        withLabel,
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
    },
    data() {
        return {
            model: this.modelValue,
            dialogVisible: false,
            exampleInputs: [
                {
                    title: 'Date',
                    mask: '00/00/0000',
                    validInput: '10/21/2011',
                },
                {
                    title: 'Social Security Number',
                    mask: '000-00-0000',
                    validInput: '987-65-4329',
                },
                {
                    title: 'Course Code',
                    mask: 'SSS 999',
                    validInput: 'BIO 101',
                },
                {
                    title: 'License Key',
                    mask: '***-***-***',
                    validInput: 'a9a-f0c-28Q',
                },
            ],
        };
    },
    methods: {
        close() {
            this.dialogVisible = false;
        },
    },
};
</script>
