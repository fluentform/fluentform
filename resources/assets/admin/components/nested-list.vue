<template>
    <div>
        <vddl-draggable 
            class="panel-body-item js-editor-item"
            :class="{ 'selected': editItem.uniqElKey == item.uniqElKey }"
            :draggable="item"
            :index="index"
            effect-allowed="move"
            type="existingElement"
            :dragstart="handleDragstart"
            :dragend="handleDragend"
            :moved="handleMoved"
            :wrapper="wrapper"
        >

            <div @click="editSelected(index, item)" class="panel-body-item-actions"
                :class="item.element == 'container' ? 'panel-item-hover-action-container' : 'panel-item-hover-action'">
                <div class="icon-group">
                    <div class="icon-group-btn">
                        <i class="el-icon el-icon-rank"></i>
                    </div>
                    <div class="icon-group-btn" @click="editSelected(index, item)">
                        <i class="el-icon el-icon-edit"></i>
                    </div>
                    <div class="icon-group-btn" @click="duplicateSelected(index, item)">
                        <i class="el-icon el-icon-document-copy"></i>
                    </div>
                    <div class="icon-group-btn" @click="askRemoveConfirm(index)">
                        <i class="el-icon el-icon-delete"></i>
                    </div>
                    <div class="icon-group-btn" @click="resetContainer()" v-if="item.element == 'container' && item.columns.length > 1">
                        <i class="el-icon el-icon-refresh-right"></i>
                    </div>
                </div>
            </div>

            <div v-if="item.element != 'container'" class="popup-search-element" @click.stop="editorInserterPopup(index, wrapper)">
                <i class="el-icon el-icon-plus"></i>
            </div>

            <div v-if="item.element == 'container'" class="panel-body-column-container">
                <div class="ff_condition_icon" v-html="maybeConditionIcon(item.settings)"></div>
                <vddl-nodrag style="width: 100%">
                    <splitpanes
                        @resized="resize($event)"
                    >
                        <pane
                            v-for="(containerRow, i) in item.columns"
                            :key="i"
                            :size="item.columns[i].width <= 10 ? 10 : item.columns[i].width"
                            min-size="10"
                        >
                            <vddl-list class="panel-body"
                                    :list="containerRow.fields"
                                    :drop="handleDrop"
                                    :horizontal="false">

                                <div v-show="!containerRow.fields.length" class="empty-dropzone-placeholder">
                                    <div class="popup-search-element" @click.stop="editorInserterPopup(0, containerRow.fields)">
                                        <i class="el-icon el-icon-plus"></i>
                                    </div>
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

        <ff_removeElConfirm
                :editItem="editItem"
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
            }
        },
        methods: NestedHandler.methods
    };
</script>
