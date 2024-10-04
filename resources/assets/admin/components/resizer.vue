<template>
    <div ref="resizer" className="resizer"></div>
</template>

<script>
    export default {
        name: 'Resizer',
        props: {


            minWidth: {
                type: Number,
                default: 200
            },
            maxWidth: {
                type: Number,
                default: 2000
            },
            index: {
                type: Number,
            },
        },
        data() {
            return {
                isResizing: false,
                startX: 0,
                startWidth: 0,
                container: null,
            };
        },
        mounted() {
            this.container = this.$el.parentElement; // Get parent container
            this.initializeResizer();
        },
        beforeDestroy() {
            this.destroyResizer();
        },
        methods: {
            initializeResizer() {
                this.$refs.resizer.style.position = 'absolute';
                this.$refs.resizer.style.right = '-5px';
                this.$refs.resizer.style.top = '0';
                this.$refs.resizer.style.bottom = '0';
                this.$refs.resizer.style.width = '10px';
                this.$refs.resizer.style.cursor = 'ew-resize';
                this.$refs.resizer.style.zIndex = '10';
                this.$refs.resizer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'; // Visible for debugging

                this.$refs.resizer.addEventListener('mousedown', this.startResize);
            },
            startResize(event) {
                this.isResizing = true;
                this.startX = event.clientX;
                this.startWidth = this.container.offsetWidth;

                document.addEventListener('mousemove', this.resize);
                document.addEventListener('mouseup', this.stopResize);
                event.preventDefault();
            },
            resize(event) {
                if (!this.isResizing) return;

                const dx = event.clientX - this.startX;
                let newWidth = this.startWidth + dx;
                newWidth = Math.max(this.minWidth, Math.min(newWidth, this.maxWidth));

                this.container.style.width = `${newWidth}px`;
                // this.$set(this.editorConfig, 'bodyWidth', newWidth); // Set the new width in the editorConfig
                this.$emit('resize', newWidth); // Emit the resize event
            },
            stopResize() {
                this.isResizing = false;
                document.removeEventListener('mousemove', this.resize);
                document.removeEventListener('mouseup', this.stopResize);
            },
            destroyResizer() {
                this.$refs.resizer.removeEventListener('mousedown', this.startResize);
            }
        }
    };
</script>

<style scoped>
    .resizer {
        position: absolute;
        right: -5px;
        top: 0;
        bottom: 0;
        width: 10px;
        cursor: ew-resize;
        z-index: 10;
        background-color: rgba(0, 0, 0, 0.1); /* Visible for debugging */
    }
</style>
