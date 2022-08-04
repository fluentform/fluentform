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
            <div @click="editSelected(index, item)" class="item-actions-wrapper"
                 :class="item.element == 'container' ? 'hover-action-top-right' : 'hover-action-middle'">
                <div class="item-actions">
                    <i class="icon icon-arrows"></i>
                    <i @click="editSelected(index, item)" class="icon icon-pencil"></i>
                    <i @click="duplicateSelected(index, item)" class="icon icon-clone"></i>
                    <i @click="askRemoveConfirm(index)" class="icon icon-trash-o"></i>
                </div>
            </div>

            <i @click.stop="editorInserterPopup(index, wrapper)" class="popup-search-element">+</i>

            <div ref="container" v-if="item.element == 'container'" class="item-container">
                <template v-for="(containerRow, index) in item.columns">
                    <el-tooltip class="item" effect="dark" :content="`width: ${containerRow.width ? containerRow.width : (100 / item.columns.length).toFixed(2)}%, left: ${containerRow.left ? containerRow.left : 0}px`" placement="right">
                        <vue-resizable
                            :style="`margin-left: ${containerRow.left}px; left: 0px;`"
                            class="resizable"
                            :key="index"
                            :class="`col-${index+1}`"
                            :active="handlers"
                            :fit-parent="fit"
                            :width="width[index]"
                            :height="'auto'"
                            :left="left[index]"
                            :minHeight="109"
                            :index="index"
                            :min-width="minW | checkEmpty"
                            :max-width="maxW | checkEmpty"
                            @resize:end="resizeEnd($event, `${index}`)"
                            @resize:move="resizeMove($event, `${index}`)"
                            @mount="resizeMount($event, `${index}`)"
                        >
                            <vddl-list class="panel__body"
                                       :list="containerRow.fields"
                                       :drop="handleDrop"
                                       :horizontal="false">

                                <div v-show="!containerRow.fields.length"
                                     style="padding-top: 13px; transform: translateY(50%)"
                                     class="empty-dropzone-placeholder">
                                    <i @click.stop="editorInserterPopup(0, containerRow.fields)"
                                       class="popup-search-element">+</i>
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
                        </vue-resizable>
                    </el-tooltip>
                </template>
            </div>

            <template v-if="item.element != 'container' && hasRegistered(item)">
                <div class="ff_condition_icon" v-html="maybeConditionIcon(item.settings)"></div>
                <component :is="guessElTemplate(item)" :item="item"></component>
                <p style="font-style: italic;" v-if="item.settings.help_message" class="help-text"
                   v-html="item.settings.help_message"></p>
            </template>
        </vddl-draggable>

        <ff_removeElConfirm
            :visibility.sync="showRemoveElConfirm"
            @on-confirm="onRemoveElConfirm"/>
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
            handlers: ["l", "r"],
            fit: true,
            minW: 50,
            maxW: "",
            width: [],
            left: [],
        }
    },
    methods: NestedHandler.methods,

    filters: {
        checkEmpty(value) {
            return typeof value !== "number" ? 0 : value;
        }
    }
};
</script>
