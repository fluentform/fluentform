<template>
    <div>
        <el-popover
            ref="input-popover1"
            placement="bottom"
            width="170"
            popper-class="el-dropdown-list-wrapper"
            trigger="click">
            <ul class="el-dropdown-menu el-dropdown-list">
                <li v-for="(item, i) in data" :key="i">
                    <span v-if="data.length > 1" class="group-title">{{ item.title }}</span>
                    <ul>
                        <li v-for="(title, code, i) in item.shortcodes" :key="i"
                            @click="insertShortcode(code)"
                            class="el-dropdown-menu__item">
                            {{ title }}
                        </li>
                    </ul>
                </li>
            </ul>
        </el-popover>
        <el-button class="editor-add-shortcode"
                   v-popover:input-popover1
                   :size="size"
                   type="primary">
            {{ $t('Add Shortcodes') }}
            <i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
    </div>
</template>

<script>
    export default {
        name: 'inputPopoverDropdown',
        props: {
            data: Array,
            size: {
                type: String,
                default: 'small'
            }
        },
        methods: {
            insertShortcode(code) {
                this.$emit('command', code);
            }
        }
    }
</script>
