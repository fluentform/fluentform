<template>
    <el-popover
        v-if="fieldType === 'textarea'"
        ref="popover"
        :placement="placement"
        :width="220"
        trigger="click"
        class="ff_el_popover"
        popper-class="el-dropdown-list-wrapper"
    >
        <template #reference>
            <i class="ff_el_popover_textarea_icon el-icon el-icon-tickets"></i>
        </template>

        <template #default>
            <ul class="el-dropdown-menu el-dropdown-list">
                <li v-for="(item, item_index) in data" :key="item_index">
                    <span v-if="data.length > 1" class="group-title">{{ item.title }}</span>
                    <ul>
                        <li
                            v-for="(title, code, index) in item.shortcodes"
                            :key="index"
                            @click="insertShortcode(code)"
                            class="el-dropdown-menu__item"
                        >
                            {{ title }}
                        </li>
                    </ul>
                </li>
            </ul>
        </template>
    </el-popover>

    <div v-if="fieldType === 'textarea'" class="input-textarea-value">
        <el-input
            width="100%"
            v-model="model"
            :rows="rows"
            :placeholder="placeholder"
            type="textarea"
        ></el-input>
    </div>

    <el-input
        v-else
        v-model="model"
        :placeholder="placeholder"
        :type="fieldType"
    >
        <template #append>
            <el-popover
                ref="popover"
                :placement="placement"
                :width="200"
                trigger="click"
                popper-class="el-dropdown-list-wrapper"
            >
                <template #reference>
                    <i class="ff_el_popover_text_icon el-icon el-icon-tickets"></i>
                </template>

                <template #default>
                    <ul class="el-dropdown-menu el-dropdown-list">
                        <li v-for="(item, item_index) in data" :key="item_index">
                            <span v-if="data.length > 1" class="group-title">{{ item.title }}</span>
                            <ul>
                                <li
                                    v-for="(title, code, index) in item.shortcodes"
                                    :key="index"
                                    @click="insertShortcode(code)"
                                    class="el-dropdown-menu__item"
                                >
                                    {{ title }}
                                </li>
                            </ul>
                        </li>
                    </ul>
                </template>
            </el-popover>
        </template>
    </el-input>
</template>

<script>
export default {
    name: 'inputPopover',
    props: {
        modelValue: {
            type: String,
            default: ''
        },
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
            default: 'More'
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
            popoverVisible: false
        }
    },
    computed: {
        model: {
            get() {
                return this.modelValue === undefined || this.modelValue === null
                    ? ''
                    : this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        }
    },
    methods: {
        insertShortcode(codeString) {
            this.model += codeString.replace(/param_name/, this.attrName)
            this.popoverVisible = false
        }
    }
}
</script>