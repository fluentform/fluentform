<template>
    <div class="ffc_design_elements">
        <el-form label-position="left" label-width="150px" :data="design_settings">
            <el-form-item label="Questions">
                <el-color-picker :predefine="predefinedColors"
                                 @active-change="(color) => { design_settings.question_color = color; }"
                                 color-format="hex" v-model="design_settings.question_color"></el-color-picker>
            </el-form-item>
            <el-form-item label="Answers">
                <el-color-picker :predefine="predefinedColors"
                                 @active-change="(color) => { design_settings.answer_color = color; }"
                                 color-format="hex" v-model="design_settings.answer_color"></el-color-picker>
            </el-form-item>
            <el-form-item label="Button">
                <el-color-picker :predefine="predefinedColors"
                                 @active-change="(color) => { design_settings.button_color = color; }"
                                 color-format="hex" v-model="design_settings.button_color"></el-color-picker>
            </el-form-item>
            <el-form-item label="Button Text">
                <el-color-picker :predefine="predefinedColors"
                                 @active-change="(color) => { design_settings.button_text_color = color; }"
                                 color-format="hex" v-model="design_settings.button_text_color"></el-color-picker>
            </el-form-item>
            <el-form-item label="Background">
                <el-color-picker :predefine="predefinedColors"
                                 @active-change="(color) => { design_settings.background_color = color; }"
                                 color-format="hex" v-model="design_settings.background_color"></el-color-picker>
            </el-form-item>

            <el-form-item label="Background Image">
                <photo-uploader v-model="design_settings.background_image" design_mode="horizontal" enable_clear="yes"/>
            </el-form-item>

            <el-form-item v-if="design_settings.background_image" label="BG Brightness">
                <el-slider :min="-100" input-size="mini" :max="100"
                           v-model="design_settings.background_brightness"></el-slider>
            </el-form-item>

            <el-form-item label="Disable Branding">
                <el-switch active-value="yes" inactive-value="no" v-model="design_settings.disable_branding"></el-switch>
            </el-form-item>
            <div v-if="!has_pro" class="fcc_pro_message">
                Design customization available on pro only. This is just a preview version. To use this feature please upgrade to Pro.
                <a target="_blank" rel="noopener" href="https://fluentforms.com/conversational-form" class="el-button el-button--success el-button--small">Get Fluent Forms Pro</a>
            </div>
        </el-form>
    </div>
</template>

<script type="text/babel">
import PhotoUploader from '../../../common/PhotoUploader';

export default {
    name: 'DesignElement',
    props: ['design_settings', 'has_pro'],
    components: {
        PhotoUploader
    },
    data() {
        return {
            predefinedColors: [
                '#86A329',
                '#5CD6C8',
                '#FBCE37',
                '#FA6B05',
                '#379CFB',
                '#D65C99',
                '#521442',
                '#026451',
                '#0487AF'
            ]
        }
    },
    methods: {
        save() {
            this.$emit('save');
        }
    }
}
</script>
