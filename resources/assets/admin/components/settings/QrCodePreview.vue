<template>
    <div class="ff-qr-preview" v-if="url">
        <canvas ref="qrCanvas" class="ff-qr-canvas"></canvas>
        <div class="ff-qr-actions mt-2">
            <el-button size="small" icon="el-icon-download" @click="downloadQr">
                {{ $t('Download QR Code') }}
            </el-button>
        </div>
    </div>
</template>

<script>
import QRCode from 'qrcode';

export default {
    name: 'QrCodePreview',
    props: {
        url: {
            type: String,
            default: ''
        }
    },
    watch: {
        url: {
            handler(val) {
                if (val) {
                    this.$nextTick(() => this.renderQr());
                }
            },
            immediate: true
        }
    },
    methods: {
        renderQr() {
            if (!this.url || !this.$refs.qrCanvas) return;
            QRCode.toCanvas(this.$refs.qrCanvas, this.url, {
                width: 180,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
        },
        downloadQr() {
            if (!this.$refs.qrCanvas) return;
            const link = document.createElement('a');
            link.download = 'form-qr-code.png';
            link.href = this.$refs.qrCanvas.toDataURL('image/png');
            link.click();
        }
    },
    mounted() {
        if (this.url) {
            this.renderQr();
        }
    }
};
</script>
