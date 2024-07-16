<template>
    <div v-if="showContext[itemIndex]" :style="contextMenuStyle[itemIndex]" class="context-menu mac-style">
        <div class="context-menu__item" @click.stop="handleDrag">
            <i class="el-icon el-icon-rank"></i>
            <span>Drag</span>
        </div>
        <div v-if="itemIndex > 0" @click.stop="handleUpDown(itemIndex, -1)" class="context-menu__item">
            <i class="el-icon el-icon-top"></i>
            <span>Move Up</span>
        </div>
        <div v-if="(itemIndex + 1) < wrapper.length" @click.stop="handleUpDown(itemIndex, 1)" class="context-menu__item">
            <i class="el-icon el-icon-bottom"></i>
            <span>Move Down</span>
        </div>
        <div class="context-menu__separator"></div>
        <div @click.stop="editSelected(itemIndex, item)" class="context-menu__item">
            <i class="el-icon el-icon-edit"></i>
            <span>Edit</span>
        </div>
        <div @click.stop="duplicateSelected(itemIndex, item)" class="context-menu__item">
            <i class="el-icon el-icon-document-copy"></i>
            <span>Duplicate</span>
        </div>
        <div class="context-menu__separator"></div>
        <div @click.stop="askRemoveConfirm(itemIndex)" class="context-menu__item context-menu__item--danger">
            <i class="el-icon el-icon-delete"></i>
            <span>Delete</span>
        </div>
        <div v-if="editorItem.element == 'container' && editorItem.columns.length > 1 && editorItem.modified"
             @click.stop="resetContainer()"
             class="context-menu__item">
            <i class="el-icon el-icon-refresh-right"></i>
            <span>Reset Container</span>
        </div>
    </div>
</template>
<script>
    export default {
        name: 'editorMenuContext',
        props: {
            contextMenuStyle: {},
            showContext: {},
            itemIndex :'',
            editorItem : ''
        }
    }
</script>
