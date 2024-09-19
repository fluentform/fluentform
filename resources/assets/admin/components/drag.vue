<template>
    <div
            ref="resizableDiv"
            class="resizable"
            :style="{ left: `${left}px`, width: `${width}` }"
            @mousedown.stop="startDrag"
    >
        <slot></slot>
        <div ref="resizerLeft" class="resizer resizer-left" @mousedown.stop="startResizeLeft"></div>
        <div ref="resizerRight" class="resizer resizer-right" @mousedown.stop="startResizeRight"></div>
    </div>
</template>

<script>
    const gridSize = 50;

    export default {
        name: 'ResizableDiv',
        props: {
            initialLeft: {
                type: Number,
                default: 0
            },
            containerId: {
                type: String,
                required: true
            },
            index: {
                type: Number,
                required: true
            }
        },
        data() {
            return {
                left: this.initialLeft,
                width: '100%',
                isResizing: false,
                isDragging: false,
                startX: 0,
                startWidth: 0,
                startLeft: 0,
                side: ''
            };
        },
        mounted() {
            this.$nextTick(() => {
                this.setLeftPosition(this.left);
                this.setInitialWidth();
            });
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        },
        beforeDestroy() {
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        },
        methods: {
            snapToGrid(value) {
                return Math.round(value / gridSize) * gridSize;
            },
            getBoundaries() {
                const container = document.getElementById(this.containerId);
                console.log(this.containerId)
                console.log('container.clientWidth',container.clientWidth)
                return { leftBound: 0, rightBound: container.clientWidth };
            },
            setLeftPosition(left) {
                const container = document.getElementById(this.containerId);
                const { leftBound, rightBound } = this.getBoundaries();
                const currentWidth = this.$refs.resizableDiv.offsetWidth;
                const maxLeft = Math.min(rightBound - currentWidth, container.clientWidth - currentWidth);
                left = Math.max(leftBound, Math.min(left, maxLeft));
                this.left = this.snapToGrid(left);
            },
            setInitialWidth() {
                const container = document.getElementById(this.containerId);
                this.startWidth = container.clientWidth;
            },
            setWidth(width) {
                const { leftBound, rightBound } = this.getBoundaries();
                const maxWidth = rightBound - this.left;

                width = Math.max(gridSize, Math.min(width, maxWidth));
                console.log('maxWidth',maxWidth)
                console.log('width',width)
                this.width = `${this.snapToGrid(width)}px`;
            },
            handleMouseMove(e) {
                if (this.isResizing) {
                    this.resize(e);
                    this.$emit('resizing', { index: this.index, left: this.left, width: this.width });
                } else if (this.isDragging) {
                    this.drag(e);
                    this.$emit('dragging', { index: this.index, left: this.left, width: this.width });
                }
            },
            handleMouseUp() {
                if (this.isResizing) {
                    this.stopResize();
                } else if (this.isDragging) {
                    this.stopDrag();
                }
            },
            resize(e) {
                if (this.side === 'right') {
                    const width = this.startWidth + e.clientX - this.startX;
                    this.setWidth(width);
                } else if (this.side === 'left') {
                    const left = this.startLeft + e.clientX - this.startX;
                    const newWidth = this.startWidth - (e.clientX - this.startX);
                    this.setLeftPosition(left);
                    this.setWidth(newWidth);
                }
            },
            drag(e) {
                const left = this.startLeft + e.clientX - this.startX;
                this.setLeftPosition(left);
            },
            stopResize() {
                this.isResizing = false;
                this.$emit('resized', { index: this.index, left: this.left, width: this.width });
            },
            stopDrag() {
                this.isDragging = false;
                this.$emit('dragged', { index: this.index, left: this.left, width: this.width });
            },
            startResizeRight(e) {
                this.isResizing = true;
                this.side = 'right';
                this.startX = e.clientX;
                this.startWidth = this.$refs.resizableDiv.offsetWidth;
                e.stopPropagation();
                this.$emit('resizeStart', { index: this.index });
            },
            startResizeLeft(e) {
                this.isResizing = true;
                this.side = 'left';
                this.startX = e.clientX;
                this.startWidth = this.$refs.resizableDiv.offsetWidth;
                this.startLeft = this.left;
                e.stopPropagation();
                this.$emit('resizeStart', { index: this.index });
            },
            startDrag(e) {
                if (e.target === this.$refs.resizableDiv) {
                    e.stopPropagation();
                    this.isDragging = true;
                    this.startX = e.clientX;
                    this.startLeft = this.left;
                    this.$emit('dragStart', { index: this.index });
                }
            }
        }
    };
</script>

<style scoped>
    .resizable {
        height: 100%;
        /*position: absolute;*/
        /*top: 0;*/
        box-sizing: border-box;
        background: white;
        border: 1px solid #ddd;
        user-select: none;
    }
    .resizer {
        width: 10px;
        height: 100%;
        position: absolute;
        top: 0;
        cursor: ew-resize;
        background: green;
    }
    .resizer-right {
        right: 0;
    }
    .resizer-left {
        left: 0;
    }
</style>
