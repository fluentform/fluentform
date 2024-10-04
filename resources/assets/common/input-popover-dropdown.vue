<template>
    <div>
        <el-popover
            ref="inputPopover1"
            placement="right-end"
            :offset="20"
            width="500"
            popper-class="el-dropdown-list-wrapper"
            :visible="visible"
            trigger="click"
            @hide="visible = false"
            @show="visible = true"
        >
            <template #reference>
                <el-button
                    class="editor-add-shortcode el-button--soft"
                    size="small"
                    :type="btnType"
                    :plain="plain"
                    @click="visible = !visible"
                >
                    <span v-html="buttonText"></span>
                </el-button>
            </template>
            <div class="el_pop_data_group">
                <div class="el_pop_data_headings">
                    <ul class="ff_list_button ff_list_button_small">
                        <li
                            v-for="(item, item_index) in data"
                            :key="item_index"
                            :data-item_index="item_index"
                            :class="['ff_list_button_item', { active: activeIndex === item_index }]"
                            @click="activeIndex = item_index"
                        >
                            <a @click.prevent href="#" class="ff_list_button_link">{{ item.title }}</a>
                        </li>
                    </ul>
                </div>
                <div class="el_pop_data_body">
                    <ul
                        v-for="(item, current_index) in data"
                        v-show="activeIndex === current_index"
                        :class="['ff_list_border_bottom', `el_pop_data_body_item_${current_index}`]"
                        :key="current_index"
                    >
                        <li
                            v-for="(label, code, i) in item.shortcodes"
                            :key="i"
                            @click="insertShortcode(code)"
                            style="cursor: pointer;"
                        >
                            <span class="lead-title">{{ label }}</span>
                            <span class="lead-text">{{ code }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </el-popover>
    </div>
</template>

<script>
export default {
    name: 'InputPopoverDropdownExtended',
    props: {
        data: Array,
        closeOnInsert: {
            type: Boolean,
            default: true
        },
        buttonText: {
            type: String,
            default: 'Add Shortcodes <i class="el-icon-arrow-down el-icon--right"></i>'
        },
        btnType: {
            type: String,
            default: 'success'
        },
        plain: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            activeIndex: 0,
            visible: false
        }
    },
    methods: {
        insertShortcode(code) {
            this.$emit('command', code)
            if (this.closeOnInsert) {
                this.visible = false
            }
        }
    }
}
</script>