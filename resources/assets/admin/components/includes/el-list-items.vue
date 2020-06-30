<template>
    <div class="editor-inserter__content-items">
        <div v-for="item, i in list"
            @click="insertItemOnClick(item)"
            :key="i"
            class="editor-inserter__content-item"
            :title="item.editor_options.title">
            <i class="icon" :class="item.editor_options.icon_class"></i>
            <div>{{ item.editor_options.title }}</div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'el-list-items',
    props: {
        list: Array,
        insertItemOnClick: Function
    }
}
</script>
