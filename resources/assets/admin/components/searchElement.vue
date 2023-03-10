<template>
    <div class="search-element">
        <div class="ff-input-wrap">
            <span class="el-icon el-icon-search"></span>
            <el-input v-model="searchElementStr" type="text" :placeholder="placeholder" />
        </div>

        <div class="search-element-result" v-show="searchResult.length" style="margin-top: 15px;">
            <div v-for="(itemMockList, i) in searchResult" :key="i" class="v-row mb15">
                <div class="v-col--50" v-for="(itemMock, i) in itemMockList" :key="i">
                    <vddl-draggable
                        class="btn-element"
                        :draggable="itemMock"
                        :selected="insertItemOnClick"
                        :index="i"
                        :wrapper="itemMockList"
                        :disable-if="isDisabled(itemMock)"
                        :moved="moved"
                        effectAllowed="copy">
                        <i :class="itemMock.editor_options.icon_class"></i>
                        {{ itemMock.editor_options.title }}
                    </vddl-draggable>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'search-element',
    props: {
        list: {
            type: Array,
            required: true
        },
        insertItemOnClick: {
            type: Function,
            required: true
        },
        isDisabled: {
            type: Function,
            required: true
        },
        moved: {
            type: Function,
            required: true
        },
        placeholder: {
            type: String
        },
        isSidebarSearch: Boolean
    },
    data() {
        return {
            searchElementStr: '',
            searchResult: [],
            tags: window.FluentFormApp.element_search_tags
        }
    },
    watch: {
        searchElementStr() {
            const searchElementStr = this.searchElementStr.trim().toLowerCase();
            const tags = this.tags;
            let searchResult = [];

            if (searchElementStr) {
                searchResult = this.list.filter((item) => {
                    if (tags[item.element]) {
                        return tags[item.element].toString().toLowerCase().includes(searchElementStr);
                    }
                });
                this.$emit('update:isSidebarSearch', true);
            } else {
                this.$emit('update:isSidebarSearch', false);
            }
            this.searchResult = _ff.chunk( searchResult, 2 );
        }
    }
}
</script>


