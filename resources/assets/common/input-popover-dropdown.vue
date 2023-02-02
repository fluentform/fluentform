<template>
    <div>
        <el-popover
            ref="input-popover1"
            placement="right-end"
            offset="200"
            popper-class="el-dropdown-list-wrapper"
            v-model="visible"
            trigger="click">
            <div class="el_pop_data_group">
                <div  class="el_pop_data_headings">
                    <ul class="ff_data_item_group ff_data_item_group_s2 small">
                        <li
                            class="ff_data_item"
                            v-for="(item,item_index) in data"
                            :key="item_index"
                            :data-item_index="item_index"
                            :class="(activeIndex == item_index) ? 'active' : ''"
                        >
                            <a class="ff_data_item_link" href="#" @click.prevent="activeIndex = item_index">{{item.title}}</a>
                        </li>
                    </ul>
                </div>
                <div class="el_pop_data_body">
                    <ul 
                        class="ff_list ff_list_flush"
                        v-for="(item,current_index) in data" 
                        v-show="activeIndex == current_index" 
                        :class="'el_pop_body_item_'+current_index"
                        :key="current_index"
                    >
                        <li v-for="(label, code, index) in item.shortcodes" :key="index">
                            <a href="#" @click.prevent="insertShortcode(code)" >
                                <span class="lead-title">{{label}}</span>
                                <span class="lead-text">{{code}}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </el-popover>
        <el-button 
            class="el-button--soft-2"
            size="mini"
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
                    return '<span>Add Shortcodes</span> <i class="el-icon-arrow-down el-icon"></i>';
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
