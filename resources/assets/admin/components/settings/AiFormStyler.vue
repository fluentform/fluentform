<template>
    <div class="ai-form-styler">
        <div class="wpf_settings_section mb-6">
            <div class="sub_section_header">
                <h6 class="mb-2">{{ $t('AI Form Styler') }}</h6>
                <p>{{ $t('Generate custom CSS styles for your form using AI. Describe how you want your form to look and let AI create the styles for you.') }}</p>
            </div>
            <hr class="mt-3 mb-3"/>

            <div class="sub_section_body">
                <el-form :model="aiStyleForm" label-position="top">
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item :label="$t('Style Description')">
                                <el-input
                                    type="textarea"
                                    :rows="4"
                                    v-model="aiStyleForm.stylePrompt"
                                    :placeholder="$t('Describe how you want your form to look. E.g., Modern design with blue colors, rounded corners, and subtle shadows')"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item :label="$t('Color Scheme (Optional)')">
                                <el-input
                                    v-model="aiStyleForm.colorScheme"
                                    :placeholder="$t('E.g., Blue and white, Dark theme, Pastel colors')"
                                />
                            </el-form-item>
                            <el-form-item :label="$t('Style Type')">
                                <el-select v-model="aiStyleForm.styleType" style="width: 100%">
                                    <el-option label="Modern" value="modern"></el-option>
                                    <el-option label="Classic" value="classic"></el-option>
                                    <el-option label="Minimal" value="minimal"></el-option>
                                    <el-option label="Bold" value="bold"></el-option>
                                    <el-option label="Elegant" value="elegant"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-form-item>
                        <el-button
                            type="primary"
                            @click="generateStyles"
                            :loading="generating"
                            :disabled="!aiStyleForm.stylePrompt"
                        >
                            {{ generating ? $t('Generating...') : $t('Generate Styles') }}
                        </el-button>

                        <el-button
                            v-if="generatedCss"
                            type="success"
                            @click="applyStyles"
                            :loading="applying"
                        >
                            {{ applying ? $t('Applying...') : $t('Apply Styles') }}
                        </el-button>

                        <el-button
                            v-if="generatedCss"
                            type="info"
                            @click="previewStyles"
                        >
                            {{ $t('Preview') }}
                        </el-button>

                        <el-button
                            v-if="generatedCss"
                            @click="clearGenerated"
                        >
                            {{ $t('Clear') }}
                        </el-button>
                    </el-form-item>
                </el-form>

                <!-- Generated CSS Preview -->
                <div v-if="generatedCss" class="generated-css-preview mt-4">
                    <div class="sub_section_header">
                        <h6 class="mb-2">{{ $t('Generated CSS') }}</h6>
                        <p>{{ $t('Review the generated CSS before applying it to your form.') }}</p>
                    </div>
                    <div class="css-preview-container">
                        <pre class="css-preview"><code>{{ generatedCss }}</code></pre>
                    </div>
                </div>

                <!-- AI Style Examples -->
                <div class="ai-style-examples mt-6">
                    <div class="sub_section_header">
                        <h6 class="mb-2">{{ $t('Style Examples') }}</h6>
                        <p>{{ $t('Click on any example to use it as a starting point:') }}</p>
                    </div>
                    <div class="example-buttons">
                        <el-button
                            v-for="example in styleExamples"
                            :key="example.id"
                            size="small"
                            @click="useExample(example)"
                            class="example-btn"
                        >
                            {{ example.title }}
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AiFormStyler',
    props: ['form_id'],
    data() {
        return {
            generating: false,
            applying: false,
            generatedCss: '',
            generatedStyles: null,
            aiStyleForm: {
                stylePrompt: '',
                colorScheme: '',
                styleType: 'modern'
            },
            styleExamples: [
                {
                    id: 1,
                    title: 'Modern Blue',
                    prompt: 'Modern design with blue primary color, rounded corners, subtle shadows, and clean typography',
                    colorScheme: 'Blue and white',
                    styleType: 'modern'
                },
                {
                    id: 2,
                    title: 'Dark Theme',
                    prompt: 'Dark theme with high contrast, neon accents, and futuristic feel',
                    colorScheme: 'Dark with neon accents',
                    styleType: 'bold'
                },
                {
                    id: 3,
                    title: 'Minimal Clean',
                    prompt: 'Minimal design with lots of white space, thin borders, and subtle interactions',
                    colorScheme: 'Monochrome',
                    styleType: 'minimal'
                },
                {
                    id: 4,
                    title: 'Corporate',
                    prompt: 'Professional corporate style with navy blue, structured layout, and formal typography',
                    colorScheme: 'Navy blue and gray',
                    styleType: 'classic'
                },
                {
                    id: 5,
                    title: 'Colorful Fun',
                    prompt: 'Vibrant and playful design with bright colors, rounded elements, and friendly appearance',
                    colorScheme: 'Bright and colorful',
                    styleType: 'bold'
                },
                {
                    id: 6,
                    title: 'Gradient Backdrop',
                    prompt: 'Modern form with beautiful gradient background, subtle shadows, and elegant styling',
                    colorScheme: 'Blue to purple gradient',
                    styleType: 'modern'
                },
                {
                    id: 7,
                    title: 'Pattern Background',
                    prompt: 'Professional form with geometric pattern background, clean lines, and structured layout',
                    colorScheme: 'Gray and white pattern',
                    styleType: 'classic'
                }
            ]
        }
    },
    methods: {
        generateStyles() {
            if (!this.aiStyleForm.stylePrompt.trim()) {
                this.$fail(this.$t('Please enter a style description'));
                return;
            }

            this.generating = true;

            const data = {
                action: 'fluentform_ai_generate_styles',
                form_id: this.form_id,
                style_prompt: this.aiStyleForm.stylePrompt,
                color_scheme: this.aiStyleForm.colorScheme,
                style_type: this.aiStyleForm.styleType,
                fluent_forms_admin_nonce: window.fluent_forms_global_var.fluent_forms_admin_nonce
            };

            jQuery.post(window.fluent_forms_global_var.ajaxurl, data)
                .done((response) => {
                    if (response.success) {
                        console.log('Full Response:', response.data);
                        console.log('Styles:', response.data.styles);
                        console.log('Preview CSS:', response.data.preview_css);
                        console.log('Preview CSS Length:', response.data.preview_css ? response.data.preview_css.length : 0);

                        this.generatedStyles = response.data.styles;
                        this.generatedCss = response.data.preview_css;
                        this.$success(response.data.message);
                    } else {
                        this.$fail(response.data.message || this.$t('Failed to generate styles'));
                    }
                })
                .fail((error) => {
                    const errorMessage = error?.responseJSON?.data?.message || this.$t('An error occurred while generating styles');
                    this.$fail(errorMessage);
                })
                .always(() => {
                    this.generating = false;
                });
        },

        applyStyles() {
            if (!this.generatedStyles) {
                this.$fail(this.$t('No styles to apply'));
                return;
            }

            this.applying = true;

            const data = {
                action: 'fluentform_ai_apply_styles',
                form_id: this.form_id,
                styles: this.generatedStyles,
                fluent_forms_admin_nonce: window.fluent_forms_global_var.fluent_forms_admin_nonce
            };

            jQuery.post(window.fluent_forms_global_var.ajaxurl, data)
                .done((response) => {
                    if (response.success) {
                        this.$success(response.data.message);
                        this.$emit('styles-applied', response.data.css);
                        this.clearGenerated();
                    } else {
                        this.$fail(response.data.message || this.$t('Failed to apply styles'));
                    }
                })
                .fail((error) => {
                    const errorMessage = error?.responseJSON?.data?.message || this.$t('An error occurred while applying styles');
                    this.$fail(errorMessage);
                })
                .always(() => {
                    this.applying = false;
                });
        },

        previewStyles() {
            if (!this.generatedCss) {
                this.$fail(this.$t('No styles to preview'));
                return;
            }

            // Create a temporary style element for preview
            const existingPreview = document.getElementById('ai-style-preview');
            if (existingPreview) {
                existingPreview.remove();
            }

            const styleElement = document.createElement('style');
            styleElement.id = 'ai-style-preview';
            styleElement.textContent = this.generatedCss;
            document.head.appendChild(styleElement);

            this.$success(this.$t('Preview applied! Check your form to see the changes.'));

            // Remove preview after 10 seconds
            setTimeout(() => {
                const previewElement = document.getElementById('ai-style-preview');
                if (previewElement) {
                    previewElement.remove();
                }
            }, 10000);
        },

        clearGenerated() {
            this.generatedCss = '';
            this.generatedStyles = null;

            // Remove any preview styles
            const existingPreview = document.getElementById('ai-style-preview');
            if (existingPreview) {
                existingPreview.remove();
            }
        },

        useExample(example) {
            this.aiStyleForm.stylePrompt = example.prompt;
            this.aiStyleForm.colorScheme = example.colorScheme;
            this.aiStyleForm.styleType = example.styleType;
        }
    }
}
</script>

<style scoped>
.ai-form-styler {
    margin-bottom: 2rem;
}

.generated-css-preview {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    background-color: #f9f9f9;
}

.css-preview-container {
    max-height: 300px;
    overflow-y: auto;
    background-color: #2d3748;
    border-radius: 4px;
    padding: 1rem;
}

.css-preview {
    color: #e2e8f0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.example-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.example-btn {
    margin: 0 !important;
}

.ai-style-examples {
    border-top: 1px solid #eee;
    padding-top: 1rem;
}
</style>
