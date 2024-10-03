<template>
    <div class="resizer"  @mousedown.prevent.stop="startResize"></div>
</template>

<script>
    export default {
        name: 'Resizer',
        props: {
            element: {
                type: Object,
                required: true,
            },
            containerWidth: {
                type: Number,
                default: 100,
            },
            gridSize: {
                type: Number,
                default: 10,
            }
        },
        data() {
            return {
                isResizing: false,
                startX: 0,
                startWidth: 0,
            };
        },
        methods: {
            validateAndSetPosition() {
                const defaultPosition = { width: this.containerWidth, left: 0 };
                this.$set(this.element, 'position', this.element.position || defaultPosition);
                this.element.position = { width: this.element.position.width || this.containerWidth, left: this.element.position.left || 0 };
            },
            startResize(event) {
                this.validateAndSetPosition();
                this.isResizing = true;
                this.startX = event.clientX;
                this.startWidth = this.element.position.width;

                const mouseMoveHandler = (e) => this.resize(e);
                const mouseUpHandler = () => {
                    this.stopResize();
                    document.removeEventListener('mousemove', mouseMoveHandler);
                    document.removeEventListener('mouseup', mouseUpHandler);
                };

                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);

                event.preventDefault();
            },
            resize(event) {
                if (!this.isResizing) return;

                let newWidth = this.calculateNewWidth(event.clientX);

                this.element.position.width = this.clampWidth(newWidth, this.gridSize, this.containerWidth - this.element.position.left);
                this.$emit('element-resized', this.element, this.element.position);
            },
            calculateNewWidth(clientX) {
                const dx = clientX - this.startX;
                let newWidth = this.startWidth + dx;
                newWidth = Math.round(newWidth / this.gridSize) * this.gridSize;
                return newWidth;
            },
            clampWidth(newWidth, min, max) {
                return Math.max(min, Math.min(newWidth, max));
            },
            stopResize() {
                this.isResizing = false;
                this.saveElementPosition();
            },
            saveElementPosition() {
                const positionKey = `element-position-${this.element.uniqElKey}`;
                localStorage.setItem(positionKey, JSON.stringify(this.element.position));
            }
        }
    };
</script>

<style>
    .resizer {
        position: absolute;
        right: -5px;
        top: 0;
        bottom: 0;
        width: 10px;
        cursor: ew-resize;

    }
    .resizable-element {
        position: relative;
        transition: width 0.05s ease;
    }
</style>
