<template>
    <div v-if="app_ready" class="ff_file_upload_wrap" :class="'ff_photo_' + design_mode_name">
        <div @click="initUploader" class="el-button el-button--upload el-button--default is-plain">
            <i class="el-icon el-icon-upload"></i>
            <span>{{$t('Upload Media')}}</span>
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
                        {{image_name}}
                    </div>
                    <div v-if="image_size" class="ff_file_upload_size">
                        {{image_size}}
                    </div>
                </div>
            </div><!-- .ff_file_upload_result -->
        </div>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'photo_widget',
        props: ['value', 'design_mode', 'enable_clear'],
        data() {
            return {
                app_ready: false,
                image_url: this.value,
                design_mode_name: this.design_mode || 'small',
                enable_clear_name: this.enable_clear,
                image_name: '',
                image_size: ''
            }
        },
        watch: {
            image_url() {
                this.$emit('input', this.image_url);
            }
        },
        methods: {
            initUploader(event) {
                var that = this;
                var send_attachment_bkp = wp.media.editor.send.attachment;
                wp.media.editor.send.attachment = function (props, attachment) {
                    that.image_url = attachment.url;
                    that.image_name = attachment.filename;
                    that.image_size = attachment.filesizeHumanReadable;
                    wp.media.editor.send.attachment = send_attachment_bkp;
                };
                wp.media.editor.open();
                return false;
            }
        },
        mounted() {
            if (!window.wpActiveEditor) {
                window.wpActiveEditor = null;
            }
            this.app_ready = true;
        }
    }
</script>
