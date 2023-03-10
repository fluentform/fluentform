<template>
    <el-form-item v-if="editItem.settings.progress_indicator != ''">
        <b><elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel></b>
        <hr />

        <div v-for="(number, index) in formStepsCount" class="el-form-item" :key="index">
            <label class="el-form-item__label">{{ $t('Step') }} {{ number }}</label>
            <div class="el-form-item__content">
                <el-input size="small" v-model="editItem.settings.step_titles[index]"></el-input>
            </div>
        </div>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'customStepTitles',
    components: {
        elLabel
    },
    props: ['listItem', 'editItem', 'form_items'],
    computed: {
        formStepsCount() {
            let count = 1;
            _ff.map(this.form_items, (field) => {
                if (field.editor_options.template == "formStep") {
                    count++;
                }
            });
            return count;
        },
    }
}
</script>