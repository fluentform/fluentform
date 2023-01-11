<template>
    <withLabel :item="item">
        <div :class="wrapperClass" v-if="!item.settings.enable_image_input">
            <template v-if="inputType == 'radio'">
                <div v-for="(option,index) in item.settings.advanced_options" :key="index" class="ff_radio_wrap">
                    <el-radio :label="option.value" v-model="item.attributes.value"> {{ option.label }} </el-radio>
                </div>
            </template>
            <template v-else>
                <div v-for="(option,index) in item.settings.advanced_options" :key="index" class="ff_radio_wrap">
                    <el-checkbox-group v-model="item.attributes.value">
                        <el-checkbox :label="option.value"></el-checkbox>
                    </el-checkbox-group>
                </div>
            </template>
        </div>
        <div :class="wrapperClass" class="ff_checkable_images" v-else>
            <div v-for="(option, index) in item.settings.advanced_options" class="ff_check_photo_item" :key="index">
                <div class="ff_photo_holder" :style="{ backgroundImage: 'url('+option.image+')' }"></div>
                <label><input :name="item.attributes.name" :value="option.value" v-model="item.attributes.value" :type="inputType"></input> <span v-html="option.label"></span></label>
            </div>
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputCheckable',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        inputType() {
            return this.item.attributes.type;
        },
        wrapperClass() {
            return this.item.settings.layout_class+' item_type_'+this.item.attributes.type;
        }
    }
}
</script>