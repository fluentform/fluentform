<template>
    <div class="el-form--label-top">
        <p>
            <strong>{{ listItem.label }}</strong>
        </p>

        <draggable
            v-if="editItem.settings.field_order"
            v-model="editItem.settings.field_order"
            class="vddl-list__handle ff_advanced_options_wrap"
            v-bind="stageDragOptions"
            item-key="id"
            @change="handleDrop"
        >
            <template #item="{ element: field }">
                <div class="dragable-address-fields">
                    <div class="vddl-nodrag nodrag-address-fields">
                        <div class="vddl-handle handle"></div>
                        <div class="address-field-option">
                            <i
                                @click="toggleAddressFieldInputs"
                                class="el-icon-caret-bottom el-icon-clickable pull-right"
                            ></i>

                            <el-checkbox v-model="editItem.fields[field.value].settings.visible">
                                {{ editItem.fields[field.value].settings.label }}
                            </el-checkbox>

                            <template v-if="!editItem.fields[field.value].settings.hasOwnProperty('country_list')">
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
                                        <label class="el-form-item__label" for="">{{ $t('Label') }}</label>

                                        <el-input v-model="editItem.fields[field.value].settings.label" size="small"/>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <div class="el-form-item">
                                        <radio-button
                                            :listItem="{ label: $t('Label Placement'), options: labelPlacementOptions }"
                                            v-model="editItem.fields.country.settings.label_placement"
                                        />
                                    </div>
                                </div>

                                <div class="form-group">
                                    <div class="el-form-item">
                                        <label class="el-form-item__label" for="">{{ $t('Placeholder') }}</label>

                                        <el-input
                                            v-model="editItem.fields[field.value].attributes.placeholder"
                                            size="small"
                                        />
                                    </div>
                                </div>

                                <wpuf_customCountryList :listItem="listItem" :editItem="editItem.fields[field.value]"/>

                                <validationRules labelPosition="left" :editItem="editItem.fields[field.value]"/>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </draggable>

        <el-form-item v-if="has_gmap_api" :label="$t('Autocomplete Feature')">
            <el-checkbox true-value="yes" false-value="no" v-model="editItem.settings.enable_g_autocomplete"
            >{{ $t('Enable Autocomplete(Google Map)') }}
            </el-checkbox>
        </el-form-item>
        <el-form-item v-if="has_gmap_api && editItem.settings.enable_g_autocomplete === 'yes'" :label="$t('Show Map')">
            <el-checkbox true-value="yes" false-value="no" v-model="editItem.settings.enable_g_map">
                {{ $t('Enable Map(Google Map)') }}
            </el-checkbox>
        </el-form-item>
        <el-form-item v-if="has_gmap_api && editItem.settings.enable_g_autocomplete === 'yes'">
            <template #label>
                {{ $t('Auto locate') }}
                <el-tooltip
                    poper-class="ff_tooltip_wrap"
                    :content="
                        $t(
                            'When map is enabled Please enable Geocoding API if you want to populate address after map marker drag end'
                        )
                    "
                    placement="top"
                >
                    <i class="tooltip-icon el-icon-info"></i>
                </el-tooltip>
            </template>

            <el-radio-group size="small" v-model="editItem.settings.enable_auto_locate">
                <el-radio-button value="on_load">
                    {{ $t('Page Load') }}
                </el-radio-button>
                <el-radio-button value="on_click">
                    {{ $t('On Click') }}
                </el-radio-button>
                <el-radio-button value="no">
                    {{ $t('Disable') }}
                </el-radio-button>
            </el-radio-group>
        </el-form-item>
    </div>
</template>

<script>
import fieldOptionSettings from './fieldOptionSettings.vue';
import customCountryList from './customCountryList.vue';
import validationRules from './validationRules.vue';
import RadioButton from './radioButton.vue';

export default {
    name: 'customAddressFields',
    props: ['listItem', 'editItem'],
    components: {
        wpuf_customCountryList: customCountryList,
        fieldOptionSettings,
        validationRules,
        RadioButton,
    },
    data() {
        return {
            has_gmap_api: !!window.FluentFormApp.has_address_gmap_api,
        };
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
        handleDrop(evt) {
            const movedElement = evt.moved.element;
            movedElement.id = new Date().getTime();
        },
        createDraggableList() {
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
        },
        updateFieldOrder() {
            // Check if autocomplete is enabled or disabled
            if (this.editItem.settings.enable_g_autocomplete === 'no') {
                // Filter out latitude and longitude if autocomplete is disabled
                this.editItem.settings.field_order = this.editItem.settings.field_order.filter(field => {
                    return field.value !== 'latitude' && field.value !== 'longitude';
                });
            } else if (this.editItem.settings.enable_g_autocomplete === 'yes') {
                // Ensure latitude and longitude are included if autocomplete is enabled
                const fieldOrder = this.editItem.settings.field_order.map(field => field.value);

                if (!fieldOrder.includes('latitude')) {
                    this.editItem.settings.field_order.push({
                        id: 7,
                        value: 'latitude',
                    });
                }
                if (!fieldOrder.includes('longitude')) {
                    this.editItem.settings.field_order.push({
                        id: 8,
                        value: 'longitude',
                    });
                }
            }
        },
    },
    watch: {
        'editItem.settings.enable_g_autocomplete': {
            handler() {
                this.updateFieldOrder();
            },
        },
    },
    computed: {
        labelPlacementOptions() {
            return this.editItem.fields.country.settings.label_placement_options;
        },
        stageDragOptions() {
            return {
                animation: 200,
                ghostClass: 'vddl-placeholder',
                dragClass: 'vddl-dragover',
                bubbleScroll: false,
                emptyInsertThreshold: 100,
                handle: '.handle',
                direction: 'horizontal'
            };
        },
    },
    mounted() {
        this.createDraggableList();
        this.updateFieldOrder();
    },
};
</script>
