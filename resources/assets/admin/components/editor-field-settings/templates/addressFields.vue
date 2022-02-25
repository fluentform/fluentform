<template>
    <div class="el-form--label-top">
        <p><strong>{{ listItem.label }}</strong></p>
    

        <vddl-list
            v-if="editItem.settings.field_order"
            :drop="handleDrop"
            class="vddl-list__handle ff_advnced_options_wrap"
            :list="editItem.settings.field_order"
            :horizontal="false"
        >
            <vddl-draggable
                v-for="(field, index) in editItem.settings.field_order"
                :moved="handleMoved"
                class="dragable-address-fields"
                :key="field.id"
                :draggable="field"
                :index="index"
                :wrapper="editItem.settings.field_order"
                effect-allowed="move"
            >
                <vddl-nodrag class="nodrag-address-fields">
                    <vddl-handle
                        :handle-left="20"
                        :handle-top="20"
                        class="handle">
                    </vddl-handle>
                    
                    <div class="address-field-option">
                        <i @click="toggleAddressFieldInputs" class="el-icon-caret-bottom el-icon-clickable pull-right"></i>
    
                        <el-checkbox v-model="editItem.fields[field.value].settings.visible">
                            {{ editItem.fields[field.value].settings.label }}
                        </el-checkbox>
    
                        <template
                            v-if="!editItem.fields[field.value].settings.hasOwnProperty('country_list')"
                        >
                            <fieldOptionSettings
                                class="address-field-option__settings"
                                :field="editItem.fields[field.value]"
                            />
                        </template>
    
                        <div
                            v-if="editItem.fields[field.value].settings.hasOwnProperty('country_list')"
                            class="address-field-option__settings"
                        >
                            <div class="form-group">
                                <div class="el-form-item">
                                    <label class="el-form-item__label" for="">Label</label>
                                    
                                    <el-input
                                        v-model="editItem.fields[field.value].settings.label"
                                        size="small"
                                    />
                                </div>
                            </div>
        
                            <div class="form-group">
                                <div class="el-form-item">
                                    <label class="el-form-item__label" for="">Placeholder</label>
                                    
                                    <el-input
                                        v-model="editItem.fields[field.value].attributes.placeholder"
                                        size="small"
                                    />
                                </div>
                            </div>
        
                            <wpuf_customCountryList
                                :listItem="listItem"
                                :editItem="editItem.fields[field.value]"
                            />
        
                            <validationRules
                                labelPosition="left"
                                :editItem="editItem.fields[field.value]"
                            />
                        </div>
                    </div>
                </vddl-nodrag>
            </vddl-draggable>
            

        </vddl-list>
       

        <el-form-item v-if="has_gmap_api" label="Autocomplete Feature">
            <el-checkbox true-label="yes" false-label="no" v-model="editItem.settings.enable_g_autocomplete">Enable
                Autocomplete (Google Map)
            </el-checkbox>
        </el-form-item>
        <el-form-item v-if="has_gmap_api  && editItem.settings.enable_g_autocomplete =='yes'" label="Show Map">
            <el-checkbox true-label="yes" false-label="no" v-model="editItem.settings.enable_g_map">
                Enable Map (Google Map)
            </el-checkbox>
        </el-form-item>


        <el-form-item v-if="has_gmap_api && editItem.settings.enable_g_autocomplete =='yes'">
            <div slot="label">
                Auto locate
                <el-tooltip  effect="dark" content="When map is enabled Please enable
Geocoding API if you want to populate address after map marker drag end" placement="top">
                    <i class="tooltip-icon el-icon-info"></i>
                </el-tooltip>
            </div>

            <el-radio-group
                    size="small"
                    v-model="editItem.settings.enable_auto_locate"
            >
                <el-radio-button label="on_load">
                    {{ $t('Page Load') }}
                </el-radio-button>
                <el-radio-button label="on_click">
                    {{ $t('On Click ') }}
                </el-radio-button>
                <el-radio-button label="no">
                    {{ $t('Disable') }}
                </el-radio-button>
            </el-radio-group>
        </el-form-item>


    </div>
</template>

<script>
import fieldOptionSettings from './fieldOptionSettings.vue'
import customCountryList from './customCountryList.vue'
import validationRules from './validationRules.vue'

export default {
    name: 'customAddressFields',
    props: ['listItem', 'editItem'],
    components: {
        'wpuf_customCountryList': customCountryList,
        fieldOptionSettings,
        validationRules
    },
    data() {
        return {
            has_gmap_api: !!window.FluentFormApp.has_address_gmap_api
        }
    },
    methods: {
        toggleAddressFieldInputs(event) {
            if (!jQuery(event.target).parent().find('.address-field-option__settings').hasClass('is-open')) {
                jQuery(event.target).removeClass('el-icon-caret-bottom');
                jQuery(event.target).addClass('el-icon-caret-top');
                jQuery(event.target).parent().find('.address-field-option__settings').addClass('is-open');
                jQuery(event.target).parent().find('.required-checkbox').addClass('is-open');
            } else {
                jQuery(event.target).removeClass('el-icon-caret-top');
                jQuery(event.target).addClass('el-icon-caret-bottom');
                jQuery(event.target).parent().find('.address-field-option__settings').removeClass('is-open');
                jQuery(event.target).parent().find('.required-checkbox').removeClass('is-open');
            }
        },
        handleMoved(item) {
            const { index, list } = item;
            list.splice(index, 1);
        },
        handleDrop(data) {
            const { index, list, item } = data;
            item.id = new Date().getTime();
            list.splice(index, 0, item);
        },
        createDragableList() {
            if (!this.editItem.settings.field_order) {
                this.$set(this.editItem.settings, 'field_order', []);
                let i = 0;
                let optionToRender = [];
    
                for (let key in this.editItem.fields) {
                    optionToRender.push({
                        id: i++,
                        value: key,
                    });
                }
                this.editItem.settings.field_order = optionToRender;
            }
            
        }
    },
    mounted() {
        this.createDragableList()
    }
}
</script>
