<template>
    <div class="option-fields-section" :class="isActive ? 'option-fields-section_active' : ''">
        <h5
            @click="toggleSection(sectionKey)"
            :class="isActive ? 'active' : ''"
            class="option-fields-section--title"
        >
            {{ $t(title) }}
        </h5>

        <div class="option-fields-section--content" v-show="isActive">
            <transition name="slide-fade">
                <draggable
                    class="v-row mb-15"
                    v-model="fields"
                    item-key="id"
                    v-bind="dragOptions"
                    :component-data="{
                        tag: 'div',
                        type: 'transition-group',
                        name: !stageDrag ? 'flip-list' : null,
                    }"
                    @start="handleDragStart"
                    @end="(evt) => handleDragEnd(evt, fields)"
                    :move="checkMove"
                >
                    <template #item="{ element }">
                        <div class="v-col--50">
                            <div
                                class="vddl-draggable btn-element"
                                :class="{
                                    disabled: isDisabled(element),
                                }"
                                :draggable="!isDisabled(element)"
                                @click="insertItem(element, $event)"
                            >
                                <i :class="element.editor_options.icon_class"></i>
                                <span>{{ element.editor_options.title }}</span>
                            </div>
                        </div>
                    </template>
                </draggable>
            </transition>
        </div>
    </div>
</template>

<script>
import { defineComponent } from 'vue';
import draggable from 'vuedraggable';

export default defineComponent({
    name: 'FieldSection',
    components: {
        draggable
    },
    props: {
        title: {
            type: String,
            required: true
        },
        sectionKey: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            default: false
        },
        toggleSection: {
            type: Function,
            required: true
        },
        fields: {
            type: Array,
            required: true
        },
        dragOptions: {
            type: Object,
            required: true
        },
        isDisabled: {
            type: Function,
            required: true
        },
        insertItem: {
            type: Function,
            required: true
        },
        handleDragStart: {
            type: Function,
            required: true
        },
        handleDragEnd: {
            type: Function,
            required: true
        },
        checkMove: {
            type: Function,
            required: true
        },
        stageDrag: {
            type: Boolean,
            default: false
        }
    }
});
</script>