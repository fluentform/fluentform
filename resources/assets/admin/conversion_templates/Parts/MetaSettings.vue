<template>
    <div class="ffc_meta_settings">
        <h3>Meta Settings & Form Messages</h3>
        <el-form :data="meta_settings" label-position="top">
            <el-form-item label="Meta Title">
                <el-input v-model="meta_settings.title" type="text" :max-length="60" placeholder="Meta Title" />
            </el-form-item>
            <el-form-item label="Meta Description">
                <el-input v-model="meta_settings.description" type="textarea" :max-length="160" placeholder="Meta Description" />
            </el-form-item>
            <el-row :gutter="30">
                <el-col :span="12">
                    <el-form-item label="Featured Image">
                        <photo-uploader v-model="meta_settings.featured_image" design_mode="horizontal" enable_clear="yes"/>
                        <p class="ffc_help">For your social sharing preview Image</p>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="Security Code (Optional)">
                        <el-input v-model="meta_settings.share_key" type="text" :max-length="20" placeholder="Security Code" />
                        <p class="ffc_help">A Salt to secure your share url so nobody can guess by form ID.</p>
                    </el-form-item>
                </el-col>
            </el-row>
            <h3>Form Messages</h3>
            <el-row :gutter="30">
                <el-col :span="12">
                    <el-form-item label="Continue Button Text">
                        <el-input v-model="meta_settings.i18n.continue" type="text" placeholder="EG: Continue" />
                    </el-form-item>
                    <el-form-item label="Skip Button Text">
                        <el-input v-model="meta_settings.i18n.skip_btn" type="text" placeholder="Skip Button Text" />
                    </el-form-item>
                    <el-form-item label="Keyboard instruction to go to next question">
                        <el-input v-model="meta_settings.i18n.keyboard_instruction" type="text" placeholder="EG: press Enter ↵" />
                    </el-form-item>
                    <el-form-item label="Hint for making a line break in Textarea">
                        <el-input v-model="meta_settings.i18n.long_text_help" type="text" placeholder="EG: Shift ⇧ + Enter ↵ to make a line break" />
                    </el-form-item>
                    <el-form-item label="Hint for multiple selection">
                        <el-input v-model="meta_settings.i18n.multi_select_hint" type="text" placeholder="EG: Choose as many as you like" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="Confirm Button Text">
                        <el-input v-model="meta_settings.i18n.confirm_btn" type="text" placeholder="OK" />
                    </el-form-item>
                    <el-form-item label="Hint for Single selection">
                        <el-input v-model="meta_settings.i18n.single_select_hint" type="text" placeholder="EG: Select an option" />
                    </el-form-item>
                    <el-form-item label="Progress Text">
                        <el-input v-model="meta_settings.i18n.progress_text" type="text" placeholder="EG: {percent}% completed" />
                        <p class="ffc_help">Available Variables: {percent}, {step}, {total}</p>
                    </el-form-item>
                  <el-form-item label="Invalid Prompt">
                    <el-input v-model="meta_settings.i18n.invalid_prompt" type="text" placeholder="EG: Please fill out the field correctly" />
                  </el-form-item>
                </el-col>
            </el-row>
        </el-form>
    </div>
</template>

<script type="text/babel">
import PhotoUploader from '../../../common/PhotoUploader';

export default {
    name: 'FormMetaSettings',
    components: {
        PhotoUploader
    },
    props: ['meta_settings']
}
</script>
