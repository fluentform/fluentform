<template>
    <div v-if="app_ready" class="ff_photo_upload" :class="'ff_photo_' + design_mode_name">
        <img style="max-width: 100%" v-if="image_url" :src="image_url"/>
        <div @click="initUploader" class="ff_photo_upload_btn">
            <i class="el-icon el-icon-upload"></i>
        </div>
        <div @click="image_url = ''" v-if="enable_clear_name == 'yes' && image_url" class="ff_photo_upload_btn_clear ff_icon_btn ff_icon_btn_clickable mini danger">
            <i class="el-icon el-icon-delete-solid"></i>
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
                enable_clear_name: this.enable_clear
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
