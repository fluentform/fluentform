<template>
    <div class="search-element">
        <div class="ff-input-wrap">
            <el-input
                :class="[searchElementStr.length > 0 ? 'active' : '']"
                v-model="searchElementStr"
                type="text"
                :placeholder="placeholder"
            >
                <template #prefix>
                    <span class="el-icon el-icon-search"></span>
                </template>
            </el-input>
        </div>

        <div class="search-element-result" v-show="searchResult.length">
            <div class="option-fields-section">
                <draggable
                    class="option-fields-section--content"
                    v-model="searchResult"
                    v-bind="sideBarDragOptions"
                    item-key="id"
                    :component-data="{
                        tag: 'div',
                        type: 'transition-group',
                        name: !stageDrag ? 'flip-list' : null,
                    }"
                >
                    <template #item="{ element }">
                        <div class="v-col--50">
                            <div
                                :class="{
                                    disabled: isDisabled(element),
                                }"
                                @click="insertItemOnClick(element, $event)"
                            >
                                <div class="vddl-draggable btn-element">
                                    <i :class="element.editor_options.icon_class"></i>
                                    <span>{{ element.editor_options.title }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </draggable>
            </div>
        </div>
    </div>
</template>

<script>
import draggable from 'vuedraggable';

export default {
    name: 'search-element',
    components: { draggable },
    props: {
        list: {
            type: Array,
            required: true,
        },
        insertItemOnClick: {
            type: Function,
            required: true,
        },
        isDisabled: {
            type: Function,
            required: true,
        },
        placeholder: {
            type: String,
        },
        sideBarDragOptions: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            searchElementStr: '',
            searchResult: [],
            tags: window.FluentFormApp.element_search_tags,
            stageDrag: false,
        };
    },
    watch: {
        searchElementStr() {
            const searchElementStr = this.searchElementStr.trim().toLowerCase();
            const tags = this.tags;
            let searchResult = [];

            if (searchElementStr) {
                searchResult = this.list.filter(item => {
                    if (tags[item.element]) {
                        let search = this.makeSearchString(item);
                        search += tags[item.element].toString();
                        return search.toLowerCase().includes(searchElementStr);
                    }
                    return false;
                });
                this.updateSidebar(true);
            } else {
                this.updateSidebar(false);
            }
            this.searchResult = searchResult;
        },
    },
    methods: {
        handleSearchFocus(e) {
            if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
                e.preventDefault();
                this.$refs.searchInput.focus();
            }
        },
        makeSearchString(field) {
            let searchStr = '';
            const { name, type } = field.attributes || {};
            if (name) searchStr += name;
            if (type) searchStr += type;
            if (field.element) searchStr += field.element;
            if (field.settings?.label) searchStr += field.settings.label;
            if (field.editor_options?.title) searchStr += field.editor_options.title;

            if (field.fields && typeof field.fields === 'object') {
                for (const item in field.fields) {
                    searchStr += this.makeSearchString(field.fields[item]);
                }
            }
            return searchStr.toString();
        },
        updateSidebar(value) {
            this.$emit('update:modelValue', value);
        },
    },
    mounted() {
        this.$refs.searchInput.focus()
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this.handleSearchFocus);
    }
}
</script>
