<template>
    <div>
        <el-popover
            ref="input-popover1"
            placement="right-end"
            offset="50"
            popper-class="el-dropdown-list-wrapper"
            v-model="visible"
            trigger="click">
            <div class="el_pop_data_group">
                <div  class="el_pop_data_headings">
                    <ul class="ff_list_button ff_list_button_small">
                        <li
                            class="ff_list_button_item"
                            v-for="(item, item_index) in data"
                            :key="item_index"
                            :data-item_index="item_index"
                            :class="(activeIndex == item_index) ? 'active' : ''"
                            @click="activeIndex = item_index"
                        >
                            <a @click.prevent href="#" class="ff_list_button_link">{{item.title}}</a>
                        </li>
                    </ul>
                </div>
                <div class="el_pop_data_body">
                    <ul 
                        class="ff_list_border_bottom"
                        v-for="(item, current_index) in data" 
                        v-show="activeIndex == current_index" 
                        :class="'el_pop_body_item_'+current_index" 
                        :key="current_index"
                    >
                        <li @click="insertShortcode(code)" v-for="(label, code, i) in item.shortcodes" :key="i" style="cursor: pointer;">
                            <span class="lead-title">{{label}}</span>
                            <span class="lead-text">{{code}}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </el-popover>
        <el-button class="editor-add-shortcode el-button--soft"
            size="small"
            v-popover:input-popover1
            :type="btnType"
            v-html="buttonText"
            :plain="plain"
        />
    </div>
</template>

<script>
    export default {
        name: 'inputPopoverDropdownExtended',
        props: {
            data: Array,
            close_on_insert: {
                type: Boolean,
                default() {
                    return true;
                }
            },
            buttonText: {
                type: String,
                default() {
                    return 'Add Shortcodes <i class="el-icon-arrow-down el-icon--right"></i>';
                }
            },
            btnType: {
                type: String,
                default() {
                    return 'success';
                }
            },
            plain: {
                type: Boolean,
                default() {
                    return false
                }
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
                this.$emit('command', code);
                if(this.close_on_insert) {
                    this.visible = false;
                }
            }
        },
        mounted() {
        }
    }
</script>
