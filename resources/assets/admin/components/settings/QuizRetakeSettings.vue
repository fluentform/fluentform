<template>
    <div class="quiz-retake-settings">
        <field-mapper
            :field="{ component: 'checkbox-single', label: $t('Enable Retake'), checkbox_label: $t('Allow users to retake the quiz') }"
            :editorShortcodes="editorShortcodes"
            :errors="errors"
            v-model="settings.retake_enabled"
        >
        </field-mapper>
        <div v-if="settings.retake_enabled" class="mt-3">
            <field-mapper
                :field="{
                    component: 'number',
                    label: $t('Maximum Attempts'),
                    tips: $t('Maximum number of times a user can take this quiz (0 for unlimited)')
                }"
                :editorShortcodes="editorShortcodes"
                :errors="errors"
                v-model="settings.max_attempts"
            >
            </field-mapper>
            <div class="mt-3">
                <field-mapper
                    :field="{
                        component: 'text',
                        label: $t('Retake Button Text'),
                        tips: $t('Text to display on the retake button'),
                        placeholder: $t('Retake Quiz')
                    }"
                    :editorShortcodes="editorShortcodes"
                    :errors="errors"
                    v-model="settings.retake_button_text"
                >
                </field-mapper>
            </div>
        </div>
    </div>
</template>

<script>
import FieldMapper from "./GeneralIntegration/FieldMapper";

export default {
    name: 'QuizRetakeSettings',
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
    components: {
        FieldMapper
    }
}
</script>
