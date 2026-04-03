<template>
    <el-form-item class="ff-form-item">
        <template slot="label">
            {{ $t('Social Sharing') }}
        </template>
        <field-mapper
            :field="{ 
                component: 'checkbox-single', 
                label: $t('Enable Social Sharing'), 
                checkbox_label: $t('Allow users to share their quiz results on social media') 
            }"
            :editorShortcodes="editorShortcodes"
            :errors="errors"
            v-model="localSettings.social_sharing_enabled"
            @input="updateSettings"
        >
        </field-mapper>
        <div v-if="localSettings.social_sharing_enabled" class="mt-3">
            <field-mapper
                :field="{ 
                    component: 'text', 
                    label: $t('Share Message'), 
                    help_text: $t('Use {score} placeholder for the quiz score percentage') 
                }"
                :editorShortcodes="editorShortcodes"
                :errors="errors"
                v-model="localSettings.share_message"
                @input="updateSettings"
            >
            </field-mapper>
            <el-form-item :label="$t('Social Platforms')">
                <el-checkbox-group
                    v-model="localSettings.social_platforms"
                    @change="updateSettings"
                >
                    <el-checkbox label="facebook">Facebook</el-checkbox>
                    <el-checkbox label="twitter">Twitter</el-checkbox>
                    <el-checkbox label="linkedin">LinkedIn</el-checkbox>
                    <el-checkbox label="whatsapp">WhatsApp</el-checkbox>
                    <el-checkbox label="copylink">Copy Link</el-checkbox>
                </el-checkbox-group>
            </el-form-item>
        </div>
    </el-form-item>
</template>

<script>
import FieldMapper from "./GeneralIntegration/FieldMapper";

export default {
    name: 'QuizSocialSharingSettings',
    components: {
        FieldMapper
    },
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
            default: () => ({})
        }
    },
    data() {
        return {
            localSettings: {
                social_sharing_enabled: false,
                share_message: '',
                social_platforms: []
            }
        };
    },
    watch: {
        settings: {
            handler(newVal) {
                this.localSettings.social_sharing_enabled = newVal.social_sharing_enabled || false;
                this.localSettings.share_message = newVal.share_message || 'I scored {score}% on this quiz!';
                this.localSettings.social_platforms = newVal.social_platforms || ['facebook', 'twitter', 'linkedin', 'whatsapp', 'copylink'];
            },
            immediate: true,
            deep: true
        }
    },
    methods: {
        updateSettings() {
            this.$emit('update:settings', {
                ...this.settings,
                social_sharing_enabled: this.localSettings.social_sharing_enabled,
                share_message: this.localSettings.share_message,
                social_platforms: this.localSettings.social_platforms
            });
        }
    }
};
</script>

