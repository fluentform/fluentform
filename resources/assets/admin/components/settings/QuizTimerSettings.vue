<template>
    <div class="quiz-timer-settings">
        <field-mapper
            :field="{ component: 'checkbox-single', label: $t('Enable Timer'), checkbox_label: $t('Enable quiz timer') }"
            :editorShortcodes="editorShortcodes"
            :errors="errors"
            v-model="settings.timer_enabled"
        >
        </field-mapper>
        <div v-if="settings.timer_enabled" class="mt-3">
            <field-mapper
                :field="{
                    component: 'dropdown',
                    label: $t('Timer Type'),
                    tips: $t('Select timer type for the quiz'),
                    options: {
                        'overall': $t('Overall Timer'),
                        'per_question': $t('Per Question Timer'),
                        'both': $t('Both')
                    }
                }"
                :editorShortcodes="editorShortcodes"
                :errors="errors"
                v-model="settings.timer_type"
            >
            </field-mapper>
            <div v-if="settings.timer_type === 'overall' || settings.timer_type === 'both'" class="mt-3">
                <field-mapper
                    :field="{
                        component: 'number',
                        label: $t('Overall Timer Duration (seconds)'),
                        tips: $t('Total time allowed for the entire quiz')
                    }"
                    :editorShortcodes="editorShortcodes"
                    :errors="errors"
                    v-model="settings.timer_duration"
                >
                </field-mapper>
            </div>
            <div v-if="settings.timer_type === 'per_question' || settings.timer_type === 'both'" class="mt-3">
                <field-mapper
                    :field="{
                        component: 'dropdown',
                        label: $t('Timer Start Trigger'),
                        tips: $t('When should the per-question timer start'),
                        options: quizTriggerOptions
                    }"
                    :editorShortcodes="editorShortcodes"
                    :errors="errors"
                    v-model="settings.timer_start_trigger"
                >
                </field-mapper>
            </div>
        </div>
    </div>
</template>

<script>
import FieldMapper from "./GeneralIntegration/FieldMapper";

export default {
    name: 'QuizTimerSettings',
    props: {
        settings: {
            type: Object,
            required: true
        },
        editorShortcodes: {
            type: Array,
            default: () => []
        },
        errors: {
            type: Object,
            default: () => new Errors()
        }
    },
    computed: {
        quizTriggerOptions() {
            const options = {
                'page_load': this.$t('Page Load'),
                'question_focus': this.$t('Question Focus'),
            }
            
            if (this.settings?.is_step_form) {
                options.step_change = this.$t('Step Change');
            }
            
            return options;
        }
    },
    components: {
        FieldMapper
    }
}
</script>
