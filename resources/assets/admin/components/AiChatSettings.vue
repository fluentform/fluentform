<template>
    <div>
        <el-skeleton :loading="loading" animated :rows="10" :class="loading ? 'ff_card' : ''">
            <template v-if="!loading">
                <card id="ai-chat-settings" :border="true">
                    <card-head>
                        <card-head-group class="justify-between">
                            <h5 class="title">{{ $t('AI Chat Settings') }}</h5>
                            <btn-group>
                                <btn-group-item>
                                    <el-button
                                        :loading="saving"
                                        type="primary"
                                        icon="el-icon-success"
                                        @click="saveSettings"
                                        size="medium"
                                    >
                                        {{ saving ? $t('Saving...') : $t('Save Settings') }}
                                    </el-button>
                                </btn-group-item>
                            </btn-group>
                        </card-head-group>
                    </card-head>
                    <card-body>
                        <el-form label-position="top">
                            <!-- Enable AI Chat -->
                            <el-form-item class="ff-form-item-flex ff-form-item ff-form-setting-label-width">
                                <template slot="label">
                                    <span>
                                        {{ $t('Enable AI Chat assistant') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p>
                                                    {{ $t('Use AI to guide users through this form in a chat-like interface.') }}
                                                </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </span>
                                </template>
                                <el-switch
                                    class="el-switch-lg"
                                    v-model="config.enabled"
                                    @change="handleEnabledChange"
                                />
                            </el-form-item>

                            <template v-if="config.enabled">
                                <!-- OpenAI API Key -->
                                <el-form-item class="ff-form-item-flex ff-form-item ff-form-setting-label-width">
                                    <template slot="label">
                                        <span>
                                            {{ $t('OpenAI API Key') }}
                                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Enter your OpenAI API key. You can create one from the OpenAI Platform.') }}
                                                    </p>
                                                </div>
                                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                            </el-tooltip>
                                        </span>
                                    </template>
                                    <div class="ff-form-item__content">
                                        <el-input
                                            v-model="config.api_key"
                                            type="password"
                                            :placeholder="$t('sk-...')"
                                            show-password
                                        />
                                        <el-button
                                            v-if="config.api_key"
                                            @click="testApiKey"
                                            :loading="testing"
                                            size="small"
                                            class="mt-2"
                                        >
                                            {{ $t('Test API Key') }}
                                        </el-button>
                                        <div
                                            v-if="testResult"
                                            :class="['ff-test-result', testResult.success ? 'success' : 'error']"
                                        >
                                            {{ testResult.message }}
                                        </div>
                                    </div>
                                </el-form-item>

                                <!-- Model Selection -->
                                <el-form-item class="ff-form-item-flex ff-form-item ff-form-setting-label-width">
                                    <template slot="label">
                                        <span>
                                            {{ $t('AI Model') }}
                                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Choose which OpenAI model to use for this assistant.') }}
                                                    </p>
                                                </div>
                                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                            </el-tooltip>
                                        </span>
                                    </template>
                                    <el-select
                                        v-model="config.model"
                                        :placeholder="$t('Select model')"
                                        class="ff_input_width"
                                    >
                                        <el-option label="GPT-4 Turbo (Recommended)" value="gpt-4-turbo-preview" />
                                        <el-option label="GPT-4" value="gpt-4" />
                                        <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo" />
                                    </el-select>
                                </el-form-item>

                                <!-- Question Generation Mode -->
                                <el-form-item class="ff-form-item-flex ff-form-item ff-form-setting-label-width">
                                    <template slot="label">
                                        <span>
                                            {{ $t('Question Generation') }}
                                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Choose how the AI generates questions.') }}<br>
                                                        <strong>{{ $t('Dynamic:') }}</strong> {{ $t('AI generates questions on the fly based on context.') }}<br>
                                                        <strong>{{ $t('Static:') }}</strong> {{ $t('AI uses pre-defined questions you set below.') }}
                                                    </p>
                                                </div>
                                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                            </el-tooltip>
                                        </span>
                                    </template>
                                    <el-radio-group v-model="config.question_generation_mode">
                                        <el-radio label="dynamic">{{ $t('Dynamic (AI Generated)') }}</el-radio>
                                        <el-radio label="static">{{ $t('Static (Pre-defined)') }}</el-radio>
                                    </el-radio-group>
                                </el-form-item>

                                <!-- Static Questions Editor -->
                                <div v-if="config.question_generation_mode === 'static'" class="ff_card mb-4 p-4 bg-gray-50">
                                    <div class="flex justify-between items-center mb-4">
                                        <h4 class="m-0">{{ $t('Static Questions') }}</h4>
                                        <el-button
                                            type="primary"
                                            size="small"
                                            plain
                                            @click="generateStaticQuestions"
                                            :loading="generatingQuestions"
                                        >
                                            {{ $t('Generate with AI') }}
                                        </el-button>
                                    </div>
                                    <p class="text-muted mb-4 text-small">
                                        {{ $t('Define exactly what the AI should ask for each field. The AI will strictly follow these phrasings.') }}
                                    </p>
                                    
                                    <div v-if="formFields.length === 0" class="text-center py-4 text-muted">
                                        {{ $t('No fields found in this form.') }}
                                    </div>

                                    <div v-for="field in formFields" :key="field.name" class="mb-4">
                                        <label class="ff-label d-block mb-1">
                                            {{ field.title }} <span class="text-muted text-small">({{ field.name }})</span>
                                            <span v-if="field.required" class="text-danger">*</span>
                                        </label>
                                        <el-input
                                            type="textarea"
                                            :rows="2"
                                            v-model="config.static_questions[field.name]"
                                            :placeholder="$t('Enter the question to ask for this field...')"
                                        />
                                    </div>
                                </div>

                                <!-- Conversation Style (Only for Dynamic) -->
                                <el-form-item v-if="config.question_generation_mode === 'dynamic'" class="ff-form-item-flex ff-form-item ff-form-setting-label-width">
                                    <template slot="label">
                                        <span>
                                            {{ $t('Tone of the conversation') }}
                                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Select how the assistant should sound when talking to users.') }}
                                                    </p>
                                                </div>
                                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                            </el-tooltip>
                                        </span>
                                    </template>
                                    <el-select
                                        v-model="config.conversation_style"
                                        :placeholder="$t('Select style')"
                                        class="ff_input_width"
                                    >
                                        <el-option label="Friendly & casual" value="friendly" />
                                        <el-option label="Professional" value="professional" />
                                        <el-option label="Concise & direct" value="concise" />
                                        <el-option label="Formal" value="formal" />
                                    </el-select>
                                </el-form-item>

                                <!-- Custom System Prompt -->
                                <el-form-item class="ff-form-item-flex ff-form-item ff-form-setting-label-width">
                                    <template slot="label">
                                        <span>
                                            {{ $t('Custom Instructions') }}
                                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Add extra instructions to control tone, context, or behavior of the AI assistant.') }}
                                                    </p>
                                                </div>
                                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                            </el-tooltip>
                                        </span>
                                    </template>
                                    <el-input
                                        v-model="config.custom_prompt"
                                        type="textarea"
                                        :rows="4"
                                        :placeholder="$t('You are a friendly assistant helping users complete this form...')"
                                    />
                                </el-form-item>

                                <!-- Embed & Preview -->
                                <el-form-item class="ff-form-item-flex ff-form-item ff-form-setting-label-width">
                                    <template slot="label">
                                        <span>
                                            {{ $t('Embed & Preview') }}
                                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Use the URL or shortcode below to add this AI chat assistant to your site.') }}
                                                    </p>
                                                </div>
                                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                            </el-tooltip>
                                        </span>
                                    </template>
                                    <div class="ff-form-item__content">
                                        <div class="mb-3">
                                            <label class="ff-label d-block mb-1">{{ $t('Standalone URL') }}</label>
                                            <div class="ff_input_group">
                                                <el-input
                                                    v-model="aiChatUrl"
                                                    size="small"
                                                    readonly
                                                />
                                                <el-button
                                                    size="small"
                                                    @click="copyToClipboard(aiChatUrl)"
                                                >
                                                    {{ $t('Copy') }}
                                                </el-button>
                                                <el-button
                                                    size="small"
                                                    type="primary"
                                                    @click="openPreview"
                                                >
                                                    {{ $t('Preview') }}
                                                </el-button>
                                            </div>
                                        </div>
                                        <div>
                                            <label class="ff-label d-block mb-1">{{ $t('Shortcode') }}</label>
                                            <div class="ff_input_group">
                                                <el-input
                                                    v-model="aiChatShortcode"
                                                    size="small"
                                                    readonly
                                                />
                                                <el-button
                                                    size="small"
                                                    @click="copyToClipboard(aiChatShortcode)"
                                                >
                                                    {{ $t('Copy') }}
                                                </el-button>
                                            </div>
                                        </div>
                                    </div>
                                </el-form-item>

                                <!-- Cleanup Statistics -->
                                <el-form-item class="ff-form-item-flex ff-form-item ff-form-setting-label-width">
                                    <template slot="label">
                                        <span>
                                            {{ $t('Data Cleanup') }}
                                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Overview of how many AI chat sessions are incomplete vs. completed.') }}
                                                    </p>
                                                </div>
                                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                            </el-tooltip>
                                        </span>
                                    </template>
                                    <div class="ff-form-item__content">
                                        <div class="ff_card p-3">
                                            <div v-if="cleanupStats" class="ff-stats-grid">
                                                <div class="ff-stat-item">
                                                    <div class="ff-stat-value">{{ cleanupStats.incomplete_submissions }}</div>
                                                    <div class="ff-stat-label">{{ $t('Incomplete') }}</div>
                                                </div>
                                                <div class="ff-stat-item">
                                                    <div class="ff-stat-value">{{ cleanupStats.completed_submissions }}</div>
                                                    <div class="ff-stat-label">{{ $t('Completed') }}</div>
                                                </div>
                                                <div class="ff-stat-item">
                                                    <div class="ff-stat-value">{{ cleanupStats.total_messages }}</div>
                                                    <div class="ff-stat-label">{{ $t('Messages') }}</div>
                                                </div>
                                            </div>
                                            <p class="ff-cleanup-info mb-0 mt-3">
                                                <span class="dashicons dashicons-info"></span>
                                                {{ $t('Incomplete sessions older than 24 hours are automatically cleaned up daily.') }}
                                            </p>
                                        </div>
                                    </div>
                                </el-form-item>
                            </template>
                        </el-form>
                    </card-body>
                </card>
            </template>
        </el-skeleton>
    </div>
</template>

<script>
import Card from './Card/Card.vue';
import CardHead from './Card/CardHead.vue';
import CardHeadGroup from './Card/CardHeadGroup.vue';
import CardBody from './Card/CardBody.vue';
import BtnGroup from './BtnGroup/BtnGroup.vue';
import BtnGroupItem from './BtnGroup/BtnGroupItem.vue';

export default {
    name: 'AiChatSettings',
    components: {
        Card,
        CardHead,
        CardHeadGroup,
        CardBody,
        BtnGroup,
        BtnGroupItem
    },
    props: {
        form_id: {
            type: [Number, String],
            default: null
        }
    },
    data() {
        return {
            loading: false,
            config: {
                enabled: false,
                api_key: '',
                model: 'gpt-4-turbo-preview',
                custom_prompt: '',
                conversation_style: 'friendly',
                question_generation_mode: 'dynamic',
                static_questions: {}
            },
            saving: false,
            testing: false,
            generatingQuestions: false,
            testResult: null,
            formId: null,
            cleanupStats: null,
            aiChatUrl: '',
            aiChatShortcode: '',
            formFields: []
        };
    },
    mounted() {
        // Get form_id from prop (settings app) or window variable (standalone page)
        if (this.form_id) {
            this.formId = parseInt(this.form_id);
        } else if (window.ff_ai_chat_vars && window.ff_ai_chat_vars.form_id) {
            this.formId = window.ff_ai_chat_vars.form_id;
        } else if (window.FluentFormApp && window.FluentFormApp.form_id) {
            this.formId = window.FluentFormApp.form_id;
        }

        if (!this.formId) {
            console.error('AiChatSettings: form_id is not available');
            this.$message.error(this.$t('Form ID is not available'));
            return;
        }

        this.aiChatUrl = (window.location.origin || '') + '/?fluent-form-ai=' + this.formId;
        this.aiChatShortcode = '[fluentform_ai_chat id="' + this.formId + '"]';

        this.loadSettings();
        this.loadCleanupStats();
        this.loadFormFields();
    },
    methods: {
        loadSettings() {
            this.loading = true;

            // Try to get saved config from window variable (standalone page) or use defaults
            const savedConfig = window.ff_ai_chat_vars && window.ff_ai_chat_vars.ai_config;

            if (savedConfig && Object.keys(savedConfig).length > 0) {
                // Ensure static_questions is an object
                if (!savedConfig.static_questions || Array.isArray(savedConfig.static_questions)) {
                    savedConfig.static_questions = {};
                }
                Object.assign(this.config, savedConfig);
            }

            this.loading = false;
        },
        async loadFormFields() {
            try {
                const formData = new FormData();
                formData.append('action', 'fluentform_ai_preview_conversation');
                formData.append('nonce', window.ff_ai_chat_vars.nonce);
                formData.append('form_id', this.formId);

                const response = await fetch(window.ff_ai_chat_vars.ajax_url, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.formFields = data.data.questions || [];
                    
                    // Initialize static questions if empty
                    this.formFields.forEach(field => {
                        if (!this.config.static_questions[field.name]) {
                            this.$set(this.config.static_questions, field.name, '');
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading form fields:', error);
            }
        },
        handleEnabledChange(value) {
            if (!value) {
                this.testResult = null;
            }
        },
        copyToClipboard(text) {
            if (!text) {
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this.$message.success(this.$t('Copied to clipboard'));
                }).catch(() => {
                    this.$message.error(this.$t('Failed to copy'));
                });
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    this.$message.success(this.$t('Copied to clipboard'));
                } catch (e) {
                    this.$message.error(this.$t('Failed to copy'));
                }
                document.body.removeChild(textarea);
            }
        },
        openPreview() {
            if (this.aiChatUrl) {
                window.open(this.aiChatUrl, '_blank');
            }
        },
        async testApiKey() {
            if (!this.config.api_key) {
                this.$message.error(this.$t('Please enter an API key'));
                return;
            }

            this.testing = true;
            this.testResult = null;

            try {
                const formData = new FormData();
                formData.append('action', 'fluentform_ai_test_api_key');
                formData.append('nonce', window.ff_ai_chat_vars.nonce);
                formData.append('api_key', this.config.api_key);

                const response = await fetch(window.ff_ai_chat_vars.ajax_url, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.testResult = {
                        success: true,
                        message: this.$t('API key is valid! ✓')
                    };
                } else {
                    this.testResult = {
                        success: false,
                        message: data.data.message || this.$t('API key test failed')
                    };
                }
            } catch (error) {
                this.testResult = {
                    success: false,
                    message: this.$t('Error testing API key: ') + error.message
                };
            } finally {
                this.testing = false;
            }
        },
        async generateStaticQuestions() {
            if (!this.config.api_key) {
                this.$message.error(this.$t('Please enter an API key first'));
                return;
            }

            this.generatingQuestions = true;

            try {
                const formData = new FormData();
                formData.append('action', 'fluentform_ai_generate_questions');
                formData.append('nonce', window.ff_ai_chat_vars.nonce);
                formData.append('form_id', this.formId);
                formData.append('api_key', this.config.api_key); // Send current key in case it's not saved

                const response = await fetch(window.ff_ai_chat_vars.ajax_url, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success && data.data.questions) {
                    // Update static questions
                    Object.keys(data.data.questions).forEach(fieldName => {
                        this.$set(this.config.static_questions, fieldName, data.data.questions[fieldName]);
                    });
                    this.$message.success(this.$t('Questions generated successfully!'));
                } else {
                    this.$message.error(data.data.message || this.$t('Failed to generate questions'));
                }
            } catch (error) {
                this.$message.error(this.$t('Error generating questions: ') + error.message);
            } finally {
                this.generatingQuestions = false;
            }
        },
        async saveSettings() {
            this.saving = true;

            try {
                const formData = new FormData();
                formData.append('action', 'fluentform_ai_save_config');
                formData.append('nonce', window.ff_ai_chat_vars.nonce);
                formData.append('form_id', this.formId);
                formData.append('config', JSON.stringify(this.config));

                const response = await fetch(window.ff_ai_chat_vars.ajax_url, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.$message.success(this.$t('Settings saved successfully!'));
                } else {
                    this.$message.error(data.data.message || this.$t('Failed to save settings'));
                }
            } catch (error) {
                this.$message.error(this.$t('Error saving settings: ') + error.message);
            } finally {
                this.saving = false;
            }
        },
        async loadCleanupStats() {
            try {
                const formData = new FormData();
                formData.append('action', 'fluentform_ai_get_cleanup_stats');
                formData.append('nonce', window.ff_ai_chat_vars.nonce);

                const response = await fetch(window.ff_ai_chat_vars.ajax_url, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    this.cleanupStats = data.data;
                }
            } catch (error) {
                console.error('Error loading cleanup stats:', error);
            }
        }
    }
};
</script>

<style scoped lang="scss">
.ff-test-result {
    margin-top: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
}

.ff-test-result.success {
    background: #f0f9ff;
    color: #0c7cd5;
    border: 1px solid #b3e0ff;
}

.ff-test-result.error {
    background: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fbc4c4;
}

.ff-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 16px;
}

.ff-stat-item {
    background: #fff;
    padding: 12px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    text-align: center;
}

.ff-stat-value {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
}

.ff-stat-label {
    font-size: 12px;
    color: #6b7280;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.ff-cleanup-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;
}

.ff-cleanup-info .dashicons {
    color: #3b82f6;
}

.bg-gray-50 {
    background-color: #f9fafb;
}

.text-small {
    font-size: 13px;
}
</style>
