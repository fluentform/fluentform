<template>
    <div v-if="app_ready" class="ff_file_upload_wrap" :class="'ff_photo_' + design_mode_name">
        <div v-if="for_editor_advance_option" class="ff_photo_card" :class="'ff_photo_' + design_mode_name">
            <div v-if="app_ready" class="wpf_photo_holder">
                <img style="max-width: 100%" v-if="image_url" :src="image_url"/>
                <div @click="initUploader" class="photo_widget_btn"><span
                    class="dashicons dashicons-cloud-upload"></span></div>
                <div @click="image_url = ''" v-if="enable_clear_name == 'yes' && image_url"
                     class="photo_widget_btn_clear"><span
                    class="dashicons dashicons-trash"></span></div>
            </div>
        </div>
        <template v-else>
            <div @click="initUploader" class="el-button el-button--upload el-button--default is-plain">
                <i class="el-icon el-icon-upload"></i>
                <span>{{ $t('Upload Media') }}</span>
            </div>
            <div class="mt-2" v-if="image_url.length > 0">
                <div class="ff_file_upload_result">
                    <div class="ff_file_upload_preview">
                        <img :src="image_url"/>
                    </div>
                    <div class="ff_file_upload_data">
                        <el-button
                            class="el-button--icon"
                            type="danger"
                            icon="el-icon-delete"
                            size="mini"
                            @click="image_url = ''"
                        ></el-button>

                        <div v-if="image_name" class="ff_file_upload_description">
                            {{ image_name }}
                        </div>
                        <div v-if="image_size" class="ff_file_upload_size">
                            {{ image_size }}
                        </div>
                    </div>
                </div><!-- .ff_file_upload_result -->
            </div>
        </template>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'photo_widget',
        props: ['value', 'design_mode', 'enable_clear', 'for_advanced_option'],
        data() {
            return {
                app_ready: false,
                image_url: this.value,
                design_mode_name: this.design_mode || 'small',
                enable_clear_name: this.enable_clear,
                image_name: '',
                image_size: '',
                for_editor_advance_option : this.for_advanced_option || false
            }
        },
        watch: {
            image_url() {
                this.$emit('input', this.image_url);
            }
        },
        methods: {
            initUploader(event) {
                const that = this;
                const send_attachment_bkp = wp.media.editor.send.attachment;
                wp.media.editor.send.attachment = function (props, attachment) {
                    that.image_url = attachment.url;
                    that.handleImageName(attachment.url);
                    that.image_size = attachment.filesizeHumanReadable;
                    wp.media.editor.send.attachment = send_attachment_bkp;
                };
                wp.media.editor.open();
                return false;
            },
            handleImageName(url) {
                if (!url) url = this.image_url;
                let name = url.substring(url.lastIndexOf("/")+1, url.length);
                // 15 character for suitable visible name
                if (name.length > 15) {
                    name = name.slice(0, 15) + '...' + name.substring(name.lastIndexOf(".") - 2, name.length);
                }
                this.image_name = name;
            }
        },
        mounted() {
            if (!window.wpActiveEditor) {
                window.wpActiveEditor = null;
            }
            this.app_ready = true;
            this.handleImageName()
        }
    }
</script>
