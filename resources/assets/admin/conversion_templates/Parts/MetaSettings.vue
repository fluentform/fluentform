<template>
    <div class="ffc_meta_settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Meta Settings & Form Messages') }}</h5>
            </card-head>
            <card-body>
                <el-form :data="meta_settings" label-position="top" class="ffc_meta_settings_form">
                    <el-form-item class="ff-form-item" :label="$t('Meta Title')">
                        <el-input v-model="sanitizedTitle" type="text" :max-length="60"
                                  :placeholder="$t('Meta Title')"/>
                    </el-form-item>
                    <el-form-item class="ff-form-item" :label="$t('Meta Description')">
                        <el-input v-model="sanitizedDescription" type="textarea" :max-length="160"
                                  :placeholder="$t('Meta Description')"/>
                    </el-form-item>
                    <el-form-item class="ff-form-item" :label="$t('Featured Image')">
                        <photo-uploader v-model="meta_settings.featured_image" design_mode="horizontal"
                                        enable_clear="yes"/>
                        <p class="text-note mt-2">{{ $t('For your social sharing preview Image') }}</p>
                    </el-form-item>
                    <el-form-item class="ff-form-item" :label="$t('Security Code (Optional)')">
                        <el-input v-model="sanitizedShareKey" type="text" :max-length="20"
                                  :placeholder="$t('Security Code')"/>
                        <p class="text-note mt-2">
                            {{ $t('Add a Security Code to make your shareable URL extra secure.') }}</p>
                    </el-form-item>
                    <h5>{{ $t('Form Messages') }}</h5>
                    <el-row :gutter="30">
                        <el-col :span="12">
                            <el-form-item class="ff-form-item" :label="$t('Continue Button Text')">
                                <el-input v-model="sanitizedI18n.continue" type="text"
                                          :placeholder="$t('EG: Continue')"/>
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('Skip Button Text')">
                                <el-input v-model="sanitizedI18n.skip_btn" type="text"
                                          :placeholder="$t('Skip Button Text')"/>
                            </el-form-item>
                            <el-form-item class="ff-form-item"
                                          :label="$t('Keyboard instruction to go to next question')">
                                <el-input v-model="sanitizedI18n.keyboard_instruction" type="text"
                                          :placeholder="$t('EG: press Enter ↵')"/>
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('Hint for making a line break in Textarea')">
                                <el-input v-model="sanitizedI18n.long_text_help" type="text"
                                          :placeholder="$t('EG: Shift ⇧ + Enter ↵ to make a line break')"/>
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('Hint for multiple selection')">
                                <el-input v-model="sanitizedI18n.multi_select_hint" type="text"
                                          :placeholder="$t('EG: Choose as many as you like')"/>
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('Key Hint Text')">
                                <el-input
                                        v-model="sanitizedI18n.key_hint_text"
                                        type="text"
                                        :placeholder="$t('Enter key hint text shown to options')"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item class="ff-form-item" :label="$t('Confirm Button Text')">
                                <el-input v-model="sanitizedI18n.confirm_btn" type="text" :placeholder="$t('OK')"/>
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('Hint for Single selection')">
                                <el-input v-model="sanitizedI18n.single_select_hint" type="text"
                                          :placeholder="$t('EG: Select an option')"/>
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('Progress Text')">
                                <el-input v-model="sanitizedI18n.progress_text" type="text"
                                          :placeholder="$t('EG: {percent}% completed')"/>
                                <p class="text-note mt-2">{{
                                        $t('Available Variables: {percent}, {step}, {total}')
                                    }}</p>
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('Invalid Prompt')">
                                <el-input v-model="sanitizedI18n.invalid_prompt" type="text"
                                          :placeholder="$t('EG: Please fill out the field correctly')"/>
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('Default Placeholder')">
                                <el-input v-model="sanitizedI18n.default_placeholder" type="text"
                                          :placeholder="$t('EG: Type your answer here')"/>
                            </el-form-item>

                            <el-form-item class="ff-form-item" :label="$t('Key Hint Tooltip')">
                                <el-input
                                        v-model="sanitizedI18n.key_hint_tooltip"
                                        type="text"
                                        :placeholder="$t('Enter Key hint tooltip')"
                                />
                            </el-form-item>
                            <el-form-item class="ff-form-item" :label="$t('File Upload Size Limit Text')">
                                <el-input
                                        v-model="sanitizedI18n.limit"
                                        type="text"
                                        :placeholder="$t('Enter File Upload Field Size Limit text')"
                                />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
    import PhotoUploader from '@/common/PhotoUploader';
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import DOMPurify from "dompurify";

    export default {
        name: 'FormMetaSettings',
        props: ['meta_settings'],
        components: {
            PhotoUploader,
            Card,
            CardHead,
            CardBody
        },
        methods: {
            sanitizeInput(input) {
                return DOMPurify.sanitize(input.replace(/http-equiv\s*=\s*["']?[^"']*["']?/gi, ''));
            }
        },
        computed: {
            sanitizedTitle: {
                get() {
                    return this.meta_settings.title;
                },
                set(value) {
                    this.meta_settings.title = this.sanitizeInput(value);
                }
            },
            sanitizedDescription: {
                get() {
                    return this.meta_settings.description;
                },
                set(value) {
                    console.log(value)
                    this.meta_settings.description = this.sanitizeInput(value);
                }
            },
            sanitizedShareKey: {
                get() {
                    return this.meta_settings.share_key;
                },
                set(value) {
                    this.meta_settings.share_key = DOMPurify.sanitize(value);
                }
            },
            sanitizedI18n: {
                get() {
                    return this.meta_settings.i18n;
                },
                set(value) {
                    Object.keys(value).forEach(key => {
                        this.meta_settings.i18n[key] = this.sanitize(value[key]);
                    });
                }
            }
        }
    }
</script>
