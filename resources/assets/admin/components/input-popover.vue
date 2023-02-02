<template>
    <div>
        <el-popover
            ref="input-popover"
            :placement="placement"
            width="240"
            popper-class="ff_dropdown_menu_wrapper has-scroll"
            trigger="click"
        >
            <ul class="el-dropdown-menu ff_dropdown_menu">
                <li v-for="(item, i) in data" :key="i">
                    <span v-if="data.length > 1" class="group-title">{{ item.title }}</span>
                    <ul>
                        <li 
                            class="el-dropdown-menu__item"
                            v-for="(title, code, i) in item.shortcodes" 
                            @click="insertShortcode(code)" 
                            :key="i"
                        >
                            {{ title }}
                        </li>
                    </ul>
                </li>
            </ul>
        </el-popover>

        <div v-if="fieldType == 'textarea'" class="ff_input_textarea_value">
            <div class="el-button el-button--info el-button--soft-2 el-button--mini el-button--icon" v-popover:input-popover>
                <i class="el-icon el-icon-tickets"></i>
            </div>
            <el-input :rows="rows" :placeholder="placeholder" type="textarea" v-model="model"></el-input>
        </div>

        <el-input class="ff_input_group_append" :placeholder="placeholder" v-else v-model="model" :type="fieldType">
            <el-button class="el-more-button" slot="append" :icon="icon" v-popover:input-popover></el-button>
        </el-input>
    </div>
</template>

<script>
export default {
    name: 'inputPopover',
    props: {
        value : String,
        placeholder: {
            type: String,
            default: ''
        },
        placement: {
            type: String,
            default: 'bottom'
        },
        icon: {
            type: String,
            default: 'el-icon-more'
        },
        fieldType: {
            type: String,
            default: 'text'
        },
        data: Array,
        attrName: {
            type: String,
            default: 'attribute_name'
        },
        rows: {
            type: Number,
            default: 2
        }
    },
    data() {
        return {
            model: this.value,
        }
    },
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    methods: {
        insertShortcode(codeString) {
            if (this.model == undefined) {
                this.model = '';
            }
            this.model += codeString.replace(/param_name/, this.attrName);
        }
    }
}
</script>
