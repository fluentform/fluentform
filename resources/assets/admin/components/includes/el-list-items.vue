<template>
    <el-row :gutter="6">
        <el-col 
            :span="8" 
            v-for="(item, i) in list"
            :key="i"
        >
            <div class="element-card element-card-s1" @click="insertItemOnClick(item)">
                <i class="ff-icon" :class="item.editor_options.icon_class"></i>
                <span>{{ item.editor_options.title }}</span>
            </div>
        </el-col>
    </el-row>
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
