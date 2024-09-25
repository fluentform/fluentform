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
                <el-label :label="listItem.label + ' Text'" helpText=""></el-label>
            </template>

            <el-input size="small" v-model="editItem.settings[prop].text"></el-input>
        </el-form-item>

        <el-form-item v-if="editItem.settings[prop].type === 'img'">
            <template #label>
                <el-label :label="listItem.label + ' Image URL'" helpText=""></el-label>
            </template>

            <el-input v-model="editItem.settings[prop].img_url"></el-input>
        </el-form-item>

        <el-form-item v-if="editItem.settings[prop].type === 'img'">
            <template #label>
                <el-label :label="listItem.label + ' Image ALT Text'" :helpText="$t('Alt attribute of the image')">
                </el-label>
            </template>

            <el-input v-model="editItem.settings[prop].img_alt"></el-input>
        </el-form-item>
    </div>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'prevNextButton',
    props: ['listItem', 'editItem', 'prop'],
    components: {
        elLabel,
    },
    computed: {
        isConversationalForm() {
            return !!window.FluentFormApp.is_conversion_form;
        }
    }
};
</script>
