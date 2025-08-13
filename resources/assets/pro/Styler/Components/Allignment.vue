<template>
    <div class="ff-control-content">
        <div class="ff-control-field">
            <label class="ff-control-title">
                {{ $t(item.label) }}
            </label>
            <div class="ff-control-input-wrapper">
                <el-button-group>
                    <el-button :class="(item.value == 'left') ? 'ff_align_active' : ''" size="mini" icon="dashicons dashicons-editor-alignleft" @click="alignment('left')"></el-button>
                    <el-button :class="(item.value == 'center') ? 'ff_align_active' : ''" size="mini" icon="dashicons dashicons-editor-aligncenter" @click="alignment('center')"></el-button>
                    <el-button :class="(item.value == 'right') ? 'ff_align_active' : ''" size="mini" icon="dashicons dashicons-editor-alignright" @click="alignment('right')"></el-button>
                </el-button-group>
            </div>
        </div>
    </div>
</template>
<script type="text/babel">
    export default {
        name: 'ff_allignment_item',
        props: ['item'],        
        methods: {
            alignment(val) {
                this.item.value = val
            }
        }
    }
</script>
