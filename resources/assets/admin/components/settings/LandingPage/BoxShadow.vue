<template>
    <el-form-item class="ff-form-item">
        <template #label>
            {{ valueItem.label }}
            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tootlip_wrap">
                <template #content>
                    <p>
                        {{ $t("Choose Shadow for your form container") }}
                    </p>
                </template>
                <i class="ff-icon ff-icon-info-filled text-primary"></i>
            </el-tooltip>
        </template>
        <btn-group as="div">
            <btn-group-item as="div">
                <el-popover
                    width="300"
                    popper-class="ff-landing-layout-box-shadow-popover"
                    v-model="visible"
                    trigger="click"
                    :teleported="false"
                >
                    <div class="ff_type_settings">
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t("Color") }}
                            </label>
                            <div class="ff-type-value">
                                <el-color-picker
                                    :teleported="false"
                                    size="small"
                                    v-model="valueItem.color"
                                    show-alpha
                                >
                                </el-color-picker>
                            </div>
                        </div>

                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t("Horizontal") }}
                            </label>
                            <div class="ff-type-value">
                                <input type="number" v-model="valueItem.horizontal" />
                            </div>
                        </div>
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t("Vertical") }}
                            </label>
                            <div class="ff-type-value">
                                <input type="number" v-model="valueItem.vertical" />
                            </div>
                        </div>
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t("Blur") }}
                            </label>
                            <div class="ff-type-value">
                                <input type="number" v-model="valueItem.blur" />
                            </div>
                        </div>
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t("Spread") }}
                            </label>
                            <div class="ff-type-value">
                                <input type="number" v-model="valueItem.spread" />
                            </div>
                        </div>

                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t("Position") }}
                            </label>
                            <div class="ff-type-value">
                                <el-select :teleported="false" size="default" v-model="valueItem.position"
                                           :placeholder="$t('Select')">
                                    <el-option
                                        v-for="(item, key) in {'': 'Outline','inset': 'Inset'}"
                                        :key="key"
                                        :label="item"
                                        :value="key">
                                    </el-option>
                                </el-select>
                            </div>
                        </div>
                    </div>
                    <template #reference>
                        <el-button
                            size="default"
                            class="el-button--icon"
                        >
                            <template #icon>
                                <i class="el-icon-edit"></i>
                            </template>
                        </el-button>
                    </template>
                </el-popover>
            </btn-group-item>
            <btn-group-item as="div">
                <el-button
                    @click="reset"
                    size="default"
                    class="el-button--icon"
                >
                    <template #icon>
                        <i class="el-icon-refresh-left"></i>
                    </template>
                </el-button>
            </btn-group-item>
        </btn-group>
    </el-form-item>
</template>
<script>
import BtnGroup from "@/admin/components/BtnGroup/BtnGroup.vue";
import BtnGroupItem from "@/admin/components/BtnGroup/BtnGroupItem.vue";

export default {
    name: "ff_boxshadow",
    props: ["valueItem"],
    components: {
        BtnGroup,
        BtnGroupItem
    },
    data() {
        return {
            visible: false
        };
    },
    methods: {
        reset() {
            this.valueItem.position = "";
            this.valueItem.horizontal = "0";
            this.valueItem.vertical = "0";
            this.valueItem.blur = "0";
            this.valueItem.spread = "0";
            this.valueItem.color = "";
        }
    }
}
</script>
