<template>
    <div ref="resizer" class="resizer"></div>
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
                default: 0 // Provide a default value if applicable
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
            if (this.container) {
                this.initializeResizer();
            } else {
                console.error('Parent container not found');
            }
        },
        beforeUnmount() { 
            this.destroyResizer();
        },
        methods: {
            initializeResizer() {
                const resizer = this.$refs.resizer;
                resizer.style.position = 'absolute';
                resizer.style.right = '-5px';
                resizer.style.top = '0';
                resizer.style.bottom = '0';
                resizer.style.width = '10px';
                resizer.style.cursor = 'ew-resize';
                resizer.style.zIndex = '10';
                resizer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'; // Visible for debugging

                resizer.addEventListener('mousedown', this.startResize);
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

                // Calculate the maximum width as the parent's width
                const parentWidth = this.container.parentElement.offsetWidth;
                const maxWidth = Math.min(this.maxWidth, parentWidth);

                // Clamp the new width between minWidth and maxWidth
                newWidth = this.clampWidth(newWidth, this.minWidth, maxWidth);

                // Set the container's width
                this.container.style.width = `${newWidth}px`;

                // Emit the resize event with the new width
                this.$emit('resize', newWidth);
            },
            stopResize() {
                this.isResizing = false;
                document.removeEventListener('mousemove', this.resize);
                document.removeEventListener('mouseup', this.stopResize);
            },
            destroyResizer() {
                this.$refs.resizer.removeEventListener('mousedown', this.startResize);
            },
            clampWidth(newWidth, min, max) {
                return Math.max(min, Math.min(newWidth, max));
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
