<template>
    <div class="ff_conv_section" v-if="supportedFields.includes(item.element)">
        <div class="panel__body--item js-editor-item" :class="{ selected: editItem.uniqElKey === item.uniqElKey }">
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
                    <div
                        v-if="index + 1 < wrapper.length"
                        @click.stop="handleUpDown(index, 1)"
                        class="action-menu-item"
                    >
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
                        class="context-menu__item"
                    >
                        <i class="el-icon el-icon-refresh-right"></i>
                        <span>Reset Container</span>
                    </div>
                </div>
            </div>

            <i @click.stop="editorInserterPopup(index, wrapper)" class="popup-search-element ff-icon ff-icon-plus"></i>

            <div
                class="ff_conv_section_wrapper"
                :class="'ff_conv_layout_' + item.style_pref.layout"
                v-if="hasRegistered(item)"
            >
                <div class="ff_condition_icon" v-html="maybeConditionIcon(item.settings)"></div>
                <div class="ff_conv_input">
                    <component :is="guessElTemplate(item)" :item="item"></component>
                    <p
                        style="font-style: italic"
                        v-if="item.settings.help_message"
                        class="help-text"
                        v-html="item.settings.help_message"
                    ></p>
                </div>
                <style-pref-preview :pref="item.style_pref" />
            </div>
        </div>

        <ff_remove-el-confirm
            :dialogVisible="showRemoveElConfirm"
            :editItem="editItem"
            @confirm="onRemoveElConfirm"
            @close="showRemoveElConfirm = false"
        />
    </div>
</template>

<script type="text/babel">
import NestedHandler from './NestedHandler.js';
import StylePrefPreview from '../conversion_templates/StylePrefPreview.vue';

NestedHandler.components['style-pref-preview'] = StylePrefPreview;

export default {
    name: 'NestedListConversion',
    inject: ['eventBus'],
    props: NestedHandler.props,
    components: NestedHandler.components,
    data() {
        return {
            showRemoveElConfirm: false,
            removeElIndex: null,
            supportedFields: window.FluentFormApp.conversational_form_fields,
            contextMenuIndex: {},
            contextMenuStyle: {},
        };
    },
    methods: NestedHandler.methods,
};
</script>
