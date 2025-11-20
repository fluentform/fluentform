<template>
    <withLabel :item="item">
        <div :class="wrapperClass" v-if="!item.settings.enable_image_input">
            <template v-if="inputType == 'radio'">
                <div v-for="(option,index) in item.settings.advanced_options" :key="index" style="line-height: 25px;">
                    <input type="radio" :value="option.value" v-model="item.attributes.value"> {{ option.label }}
                </div>
            </template>
            <template v-else>
                <div v-for="(option,index) in item.settings.advanced_options" :key="index" style="line-height: 25px;">
                    <input type="checkbox" :value="option.value" v-model="item.attributes.value"> {{ option.label }}
                </div>
                <!-- Other option for checkbox -->
                <div v-if="item.settings.enable_other_option === 'yes'" class="ff-el-form-check ff-other-option" style="line-height: 25px;">
                    <input type="checkbox" :value="'other_' + item.attributes.name" v-model="item.attributes.value" >
                    {{ item.settings.other_option_label || 'Other' }}
                </div>
            </template>
        </div>
        <div :class="wrapperClass" class="ff_checkable_images" v-else>
            <div v-for="(option, i) in item.settings.advanced_options" class="ff_check_photo_item" :key="i">
                <div class="ff_photo_holder" :style="{ backgroundImage: 'url('+option.image+')' }"></div>
                <label>
                    <input :name="item.attributes.name" :value="option.value" v-model="item.attributes.value" :type="inputType">
                    <span v-html="option.label"></span>
                </label>
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
