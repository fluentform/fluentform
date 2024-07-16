<template>
    <div v-if="showContext[index]" :style="contextMenuStyle[index]" class="context-menu mac-style">
        <div class="context-menu__item" @click.stop="handleDrag">
            <i class="el-icon el-icon-rank"></i>
            <span>Drag</span>
        </div>
        <div v-if="index > 0" @click.stop="handleUpDown(index, -1)" class="context-menu__item">
            <i class="el-icon el-icon-top"></i>
            <span>Move Up</span>
        </div>
        <div v-if="(index + 1) < wrapper.length" @click.stop="handleUpDown(index, 1)" class="context-menu__item">
            <i class="el-icon el-icon-bottom"></i>
            <span>Move Down</span>
        </div>
        <div class="context-menu__separator"></div>
        <div @click.stop="editSelected(index, item)" class="context-menu__item">
            <i class="el-icon el-icon-edit"></i>
            <span>Edit</span>
        </div>
        <div @click.stop="duplicateSelected(index, item)" class="context-menu__item">
            <i class="el-icon el-icon-document-copy"></i>
            <span>Duplicate</span>
        </div>
        <div class="context-menu__separator"></div>
        <div @click.stop="askRemoveConfirm(index)" class="context-menu__item context-menu__item--danger">
            <i class="el-icon el-icon-delete"></i>
            <span>Delete</span>
        </div>
        <div v-if="item.element == 'container' && item.columns.length > 1 && item.modified"
             @click.stop="resetContainer()"
             class="context-menu__item">
            <i class="el-icon el-icon-refresh-right"></i>
            <span>Reset Container</span>
        </div>
    </div>
</template>

<script>
    export default {
        name: "editorContextMenu"
        data(){
            return {
                showContext : {},
            }
        }
    }
</script>

<style scoped>

</style>
