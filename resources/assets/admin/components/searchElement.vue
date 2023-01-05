<template>
    <div class="search-element">
        <el-input 
            class="el-input-transparent" 
            v-model="searchElementStr" 
            prefix-icon="el-icon-search"
            type="text" 
            :placeholder="placeholder" 
        />

        <div class="search-element-result mt-3" v-if="searchResult.length">
            <el-row :gutter="10" v-for="(itemMockList, i) in searchResult" :key="i">
                <el-col :span="8" v-for="(itemMock, i) in itemMockList" :key="i">
                    <vddl-draggable
                        class="element-card"
                        :draggable="itemMock"
                        :selected="insertItemOnClick"
                        :index="i"
                        :wrapper="itemMockList"
                        :disable-if="isDisabled(itemMock)"
                        :moved="moved"
                        effectAllowed="copy"
                    >
                        <i :class="itemMock.editor_options.icon_class"></i>
                        {{ itemMock.editor_options.title }}
                    </vddl-draggable>
                </el-col>
            </el-row>
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
            this.searchResult = _ff.chunk( searchResult, 3 );
        }
    }
}
</script>


