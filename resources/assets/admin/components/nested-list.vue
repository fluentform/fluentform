<template>
    <div
            class="resizable-element"
            :style="elementStyle"
            :ref="`container-${index}`"
            :id="`container-${index}`"
    >
        <vddl-draggable class="panel__body--item js-editor-item"
                        :class="{ 'selected': editItem.uniqElKey == item.uniqElKey }"
                        :draggable="item"
                        :index="index"
                        effect-allowed="move"
                        type="existingElement"
                        :dragstart="handleDragstart"
                        :dragend="handleDragend"
                        :moved="handleMoved"
                        :wrapper="wrapper">

            <div @click.right.prevent.stop="showContextMenu(index, $event)" @mouseenter='maybeHideContainerActions' @mouseleave="maybeShowContainerActions" @click="editSelected(index, item)" class="item-actions-wrapper"
                 :class="[
                     item.element == 'container' ? 'hover-action-top-right' : 'hover-action-middle',
                     { 'context-menu-active': contextMenuIndex[index] }
                 ]">
                <div :style="contextMenuIndex[index] ? contextMenuStyle[index] : ''" class="item-actions " :class="item.element == 'container' ? 'container-actions' : 'field-actions'">


                    <div class="action-menu-item" >
                        <i class="el-icon el-icon-rank"></i>
                        <span>Drag</span>
                    </div>
                    <div v-if="index > 0" @click.stop="handleUpDown(index, -1)" class="action-menu-item">
                        <i class="el-icon el-icon-top"></i>
                        <span>Move Up</span>
                    </div>
                    <div v-if="(index + 1) < wrapper.length" @click.stop="handleUpDown(index, 1)" class="action-menu-item">
                        <i class="el-icon el-icon-bottom"></i>
                        <span>Move Down</span>
                    </div>
                    <div class="context-menu__separator"></div>
                    <div @click.stop="editSelected(index, item)" class="action-menu-item">
                        <i class="el-icon el-icon-edit"></i>
                        <span>Edit</span>
                    </div>
                    <div @click.stop="duplicateSelected(index, item)" class="action-menu-item">
                        <i class="el-icon el-icon-document-copy"></i>
                        <span>Duplicate</span>
                    </div>
                    <div class="context-menu__separator"></div>
                    <div @click.stop="askRemoveConfirm(index)" class="action-menu-item action-menu-item-danger">
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
            </div>

            <i @click.stop="editorInserterPopup(index, wrapper)" class="popup-search-element ff-icon ff-icon-plus"></i>

            <div v-if="item.element == 'container'" class="item-container">
                <div class="ff_condition_icon" v-html="maybeConditionIcon(item.settings)"></div>
                <vddl-nodrag style="width: 100%">
                    <splitpanes
                                class="default-theme"
                                @resized="resize($event)"
                        >
                            <pane
                                v-for="(containerRow, i) in item.columns"
                                :key="i"
                                :size="item.columns[i].width <= 10 ? 10 : item.columns[i].width"
                                min-size="10"
                            >
                                <vddl-list class="panel__body"
                                        :list="containerRow.fields"
                                        :drop="handleDrop"
                                        :horizontal="false">

                                    <div v-show="!containerRow.fields.length" style="padding-top: 15px;"
                                        class="empty-dropzone-placeholder">
                                        <i @click.stop="editorInserterPopup(0, containerRow.fields)"
                                        class="popup-search-element ff-icon ff-icon-plus"></i>
                                    </div>
                                    <list v-for="(field, list_index) in containerRow.fields"
                                        :key="field.uniqElKey"
                                        :item="field"
                                        :index="list_index"
                                        :handleEdit="handleEdit"
                                        :allElements="allElements"
                                        :editItem="editItem"
                                        :wrapper="containerRow.fields">
                                    </list>
                                </vddl-list>
                            </pane>
                        </splitpanes>
                </vddl-nodrag>

            </div>

            <template v-if="item.element != 'container' && hasRegistered(item)">
                <div class="ff_condition_icon" v-html="maybeConditionIcon(item.settings)"></div>
                <component :is="guessElTemplate(item)" :item="item"></component>
                <p style="font-style: italic;" v-if="item.settings.help_message" class="help-text"
                   v-html="item.settings.help_message"></p>
            </template>
        </vddl-draggable>

        <ff_removeElConfirm :editItem="editItem" :visibility.sync="showRemoveElConfirm" @on-confirm="onRemoveElConfirm"/>


        <Resizer
                :element="element"
                :containerWidth="containerWidth"
                :gridSize="gridSize"
                :index="index"
                :elements="allElements"
                @element-resized="handleElementResize"
                @layout-optimized="handleLayoutOptimize"
        />

    </div>
</template>

<script type="text/babel">
    import NestedHandler from "./NestedHandler.js";
    import Resizer from '@/admin/components/resizer.vue';

    export default {
        name: 'list',
        props: NestedHandler.props,
        components: {
            ...NestedHandler.components,
            Resizer
        },
        data() {
            return {
                showRemoveElConfirm: false,
                removeElIndex: null,
                contextMenuIndex : {},
                contextMenuStyle :{},
                containerWidth:100,
                gridSize:10,
                element : this.item,
            }
        },
        computed: {
            elementStyle() {
                return {
                    left: `${this.element?.position?.left || 0}px`,   // Default left to 0 if not defined
                    width: `${this.element?.position?.width || 100}%`, // Default width to 100 if not defined
                    transition: 'width 0.2s, left 0.3s'
                };
            },
            containerWidths() {

            },
        },
        methods: {
            handleElementResize(element, position) {
                console.log('Element resized:', element, position);
                // Update your data or perform any necessary actions
            },
            handleLayoutOptimize(updatedElements) {
                console.log('Layout optimized:', updatedElements);
                this.allElements = updatedElements;
            },
            ...NestedHandler.methods,

        }
    };
</script>


<style>
    .resizable-element {
        border: 1px solid #ddd;
        background: white;
        box-sizing: border-box;
        user-select: none;
        position: relative;
        transition: width 0.2s ease-in-out, left 0.2s ease-in-out;
    }

    .element-header {
        padding: 8px;
        background: #f5f5f5;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .element-header h3 {
        margin: 0;
        font-size: 14px;
    }

    .element-content {
        padding: 10px;
    }

    .resizer {
        width: 10px;
        height: 100%;
        position: absolute;
        right: -5px;
        top: 0;
        cursor: e-resize;
    }

    .edit-button {
        padding: 4px 8px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
    }
</style>

