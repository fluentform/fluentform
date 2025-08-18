<template>
    <div
        class="panel__body--item js-editor-item"
        v-bind="$attrs"
        :class="{ selected: editItem.uniqElKey === item.uniqElKey }"
    >
        <div
            @click.right.prevent.stop="showContextMenu(index, $event)"
            @mouseenter="maybeHideContainerActions"
            @mouseleave="maybeShowContainerActions"
            @click="editSelected(index, item)"
            class="item-actions-wrapper"
            :class="[
                item.element === 'container' ? 'hover-action-top-right' : 'hover-action-middle',
                { 'context-menu-active': contextMenuIndex[index] },
            ]"
        >
            <div
                :style="contextMenuIndex[index] ? contextMenuStyle[index] : ''"
                class="item-actions"
                :class="item.element === 'container' ? 'container-actions' : 'field-actions'"
            >
                <div class="action-menu-item">
                    <i class="el-icon el-icon-rank"></i>
                    <span>Drag</span>
                </div>
                <div v-if="index > 0" @click.stop="handleUpDown(index, -1)" class="action-menu-item">
                    <i class="el-icon el-icon-top"></i>
                    <span>Move Up</span>
                </div>
                <div v-if="index + 1 < wrapper.length" @click.stop="handleUpDown(index, 1)" class="action-menu-item">
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
                <div
                    v-if="item.element === 'container' && item.columns.length > 1 && item.modified"
                    @click.stop="resetContainer()"
                    class="action-menu-item"
                >
                    <i class="el-icon el-icon-refresh-right"></i>
                    <span>Reset Container</span>
                </div>
            </div>
        </div>

        <i @click.stop="editorInserterPopup(index, wrapper)" class="popup-search-element ff-icon ff-icon-plus"></i>

        <div v-if="item.element === 'container'" class="item-container">
            <div class="ff_condition_icon" v-html="maybeConditionIcon(item.settings)"></div>
            <splitpanes class="default-theme" @resized="resize($event)">
                <pane
                    v-for="(containerRow, i) in item.columns"
                    :key="i"
                    :size="item.columns[i].width <= 10 ? 10 : item.columns[i].width"
                    min-size="10"
                >
                    <draggable
                        v-model="containerRow.fields"
                        class="vddl-list panel__body"
                        v-bind="containerDragOptions"
                        item-key="id"
                    >
                        <template #header v-show="!containerRow.fields.length">
                            <div
                                v-show="!containerRow.fields.length"
                                class="empty-dropzone-placeholder"
                            >
                                <i @click.stop="editorInserterPopup(0, containerRow.fields)"
                                   class="popup-search-element ff-icon ff-icon-plus"></i>
                            </div>
                        </template>
                        <template #item="{ element: field, index }">
                            <div>
                                <list
                                    :key="field.uniqElKey"
                                    :item="field"
                                    :index="index"
                                    :handleEdit="handleEdit"
                                    :allElements="allElements"
                                    :editItem="editItem"
                                    :wrapper="containerRow.fields"
                                />
                            </div>
                        </template>
                    </draggable>
                </pane>
            </splitpanes>
        </div>

        <div v-if="item.element !== 'container' && hasRegistered(item)">
            <div class="ff_condition_icon" v-html="maybeConditionIcon(item.settings)"></div>
            <component :is="guessElTemplate(item)" :item="item"/>
            <p
                style="font-style: italic"
                v-if="item.settings.help_message"
                class="help-text"
                v-html="item.settings.help_message"
            ></p>
        </div>
    </div>

    <ff_remove-el-confirm
        :dialogVisible="showRemoveElConfirm"
        :editItem="editItem"
        @confirm="onRemoveElConfirm"
        @close="showRemoveElConfirm = false"
    />
</template>

<script>
import NestedHandler from './NestedHandler.js';

export default {
    name: 'list',
    inject: ['eventBus'],
    props: NestedHandler.props,
    components: NestedHandler.components,
    data() {
        return {
            showRemoveElConfirm: false,
            removeElIndex: null,
            contextMenuIndex: {},
            contextMenuStyle: {},
            stageDrag: false,
        };
    },
    methods: NestedHandler.methods,
    computed: NestedHandler.computed,
    mounted() {
        FluentFormEditorEvents.on('keyboard-delete-selected-item', this.handleKeyboardDelete);
    },
    beforeUnmount() {
        FluentFormEditorEvents.off('keyboard-delete-selected-item', this.handleKeyboardDelete);
    },
};
</script>
