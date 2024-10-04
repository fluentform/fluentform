<template>
    <el-popover
        ref="inputPopover1"
        placement="bottom"
        :width="170"
        popper-class="el-dropdown-list-wrapper"
        trigger="click"
    >
        <template #default>
            <ul class="el-dropdown-menu el-dropdown-list">
                <li v-for="(item, i) in data" :key="i">
                    <span v-if="data.length > 1" class="group-title">{{ item.title }}</span>
                    <ul>
                        <li
                            v-for="(title, code, i) in item.shortcodes"
                            :key="i"
                            @click="insertShortcode(code)"
                            class="el-dropdown-menu__item"
                        >
                            {{ title }}
                        </li>
                    </ul>
                </li>
            </ul>
        </template>
        <template #reference>
            <el-button class="editor-add-shortcode" type="primary" size="large">
                {{ $t('Add Shortcodes') }}
                <template #icon>
                    <i class="el-icon-arrow-down el-icon--right"></i>
                </template>
            </el-button>
        </template>
    </el-popover>
</template>

<script>
export default {
    name: 'InputPopoverDropdown',
    props: {
        data: Array,
    },
    methods: {
        insertShortcode(code) {
            this.$emit('command', code);
        },
    },
};
</script>