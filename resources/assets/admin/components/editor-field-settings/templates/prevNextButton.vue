<template>
    <div>
        <el-form-item v-if="!isConversationalForm">
            <template #label>
                <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
            </template>

            <el-radio-group v-model="editItem.settings[prop].type">
                <el-radio value="default">{{ $t('Default') }}</el-radio>
                <el-radio value="img">{{ $t('Image') }}</el-radio>
            </el-radio-group>
        </el-form-item>

        <el-form-item v-if="editItem.settings[prop].type === 'default'">
            <template #label>
                <el-label :label="listItem.label" helpText=""></el-label>
            </template>

            <el-input size="small" v-model="sanitizedText"></el-input>
        </el-form-item>

        <el-form-item v-if="editItem.settings[prop].type === 'img'">
            <template #label>
                <el-label
                    :label="$t('%s Image URL', listItem.label)"
                    helpText=""
                >
                </el-label>
            </template>

            <el-input v-model="editItem.settings[prop].img_url"></el-input>
        </el-form-item>

        <el-form-item v-if="editItem.settings[prop].type === 'img'">
            <template #label>
                <el-label
                    :label="$t('%s Image ALT Text', listItem.label)"
                    :helpText="$t('Alt attribute of the image')"
                >
                </el-label>
            </template>

            <el-input v-model="editItem.settings[prop].img_alt"></el-input>
        </el-form-item>
    </div>
</template>

<script>
import elLabel from '../../includes/el-label.vue';
import DOMPurify from 'dompurify';

export default {
    name: 'prevNextButton',
    props: ['listItem', 'editItem', 'prop'],
    components: {
        elLabel,
    },
    computed: {
        isConversationalForm() {
            return !!window.FluentFormApp.is_conversion_form;
        },
        sanitizedText: {
            get() {
                return this.editItem.settings[this.prop].text
            },
            set(value) {
                this.editItem.settings[this.prop].text = DOMPurify.sanitize(value);
            }
        },
    },
};
</script>
