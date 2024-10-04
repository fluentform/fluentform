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
        watch: {
            isResizing(newVal, oldVal) {
                if (newVal) {
                    this.container.style.zIndex = 99;
                    jQuery('#grid-view').addClass('show-grid');
                } else {
                    this.container.style.zIndex = 2;

                    jQuery('#grid-view').removeClass('show-grid'); // Removes the class when resizing stops
                }
                console.log('Resizing state changed:', newVal); // Debug log for when resizing state changes
            }
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

<style >
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
    .form-editor__body-content{
        position: relative;
    }
    .show-grid{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;

        /* Using multiple background gradients to create colored columns */
        background-image: linear-gradient(to right, rgb(183 197 205) 25%, transparent 25%), linear-gradient(to right, rgba(0, 255, 0, 0.2) 25%, transparent 25%);

        background-size: calc(100% / 4) 100%; /* Defaulting to 4 columns */
        z-index: 10;
        background-size: calc(100% / 24) 100%;
    }
</style>
