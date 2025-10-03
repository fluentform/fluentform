<template>
    <div>
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
                     item.element == 'container' || item.element == 'repeater_container' ? 'hover-action-top-right' : 'hover-action-middle',
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
                    <div v-if="(item.element == 'container' || item.element == 'repeater_container') && item.columns.length > 1 && item.modified"
                         @click.stop="resetContainer()"
                         class="context-menu__item">
                        <i class="el-icon el-icon-refresh-right"></i>
                        <span>Reset Container</span>
                    </div>
                </div>
            </div>

            <i @click.stop="editorInserterPopup(index, wrapper)" class="popup-search-element ff-icon ff-icon-plus"></i>

            <div v-if="item.element == 'container' || item.element == 'repeater_container' " class="item-container" :class="[ { 'repeater-item-container': item.element === 'repeater_container' }]">
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
                                        :fieldNotSupportInContainerRepeater="fieldNotSupportInContainerRepeater"
                                        :wrapper="containerRow.fields">
                                    </list>
                                </vddl-list>
                            </pane>
                        </splitpanes>
                </vddl-nodrag>
                <div v-if="item.element == 'repeater_container'" class="repeat-field-actions">
                        <action-btn>
                            <action-btn-add size="mini"></action-btn-add>
                            <action-btn-remove size="mini"></action-btn-remove>
                        </action-btn>
                </div>

            </div>

            <template v-if="item.element != 'container' && hasRegistered(item)">
                <div class="ff_condition_icon" v-html="maybeConditionIcon(item.settings)"></div>
                <component :is="guessElTemplate(item)" :item="item"></component>
                <p style="font-style: italic;" v-if="item.settings.help_message" class="help-text"
                   v-html="item.settings.help_message"></p>
            </template>
        </vddl-draggable>

        <ff_removeElConfirm :editItem="editItem" :visibility.sync="showRemoveElConfirm" @on-confirm="onRemoveElConfirm"/>
    </div>
</template>

<script type="text/babel">
    import NestedHandler from "./NestedHandler.js";
    export default {
        name: 'list',
        props: NestedHandler.props,
        components: NestedHandler.components,
        data() {
            return {
                showRemoveElConfirm: false,
                removeElIndex: null,
                contextMenuIndex : {},
                contextMenuStyle :{},
            }
        },
        methods: NestedHandler.methods,
        mounted() {
            FluentFormEditorEvents.$on('keyboard-delete-selected-item', this.handleKeyboardDelete);
        },
        beforeDestroy() {
            FluentFormEditorEvents.$off('keyboard-delete-selected-item', this.handleKeyboardDelete);
        },
    };
</script>
