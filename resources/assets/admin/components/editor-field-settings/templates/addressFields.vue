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
                :key="field.id || field.value"
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
                                    <label class="el-form-item__label" for="">{{ $t('Label') }}</label>

                                    <el-input
                                        v-model="editItem.fields[field.value].settings.label"
                                        size="small"
                                    />
                                </div>
                            </div>

                            <div class="form-group">
                                <div class="el-form-item">
                                    <radio-button :listItem="{label: $t('Label Placement'), options: labelPlacementOptions}" v-model="editItem.fields.country.settings.label_placement" />
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

        <!-- Autocomplete Provider Dropdown (manual) -->
        <el-form-item :label="$t('Autocomplete Provider')" style="width: 100%;" class="ff-full-width-select">
            <el-select v-model="editItem.settings.autocomplete_provider" placeholder="Select provider" style="width: 100%;">
                <el-option label="None" value="none" />
                <el-option label="Google Maps" value="google" :disabled="!has_gmap_api" />
                <el-option label="OpenStreetMap Geolocation (Nominatim)" value="html5" :disabled="!has_pro" />
            </el-select>
        </el-form-item>

        <small v-if="!has_gmap_api && editItem.settings.autocomplete_provider === 'google'">
           {{$t('Google Maps API key required. Configure in FluentForm Pro settings.')}}
        </small>

        <small v-if="editItem.settings.autocomplete_provider === 'html5'" class="mb-3" style="display: inline-block;">
            {{ $t("Address autocomplete with OpenStreetMap (Nominatim) is limited to 1 request per second across all users. Best for forms with low to moderate traffic. For high-traffic sites, consider Google Maps.") }}
        </small>

        <small v-if="!has_pro">
           {{$t('Autocomplete with Coordinates is available in Fluent Forms Pro.')}}
        </small>

        <!-- HTML5 Locate Radio (manual) -->
        <el-form-item v-if="editItem.settings.autocomplete_provider === 'html5'" :label="$t('OpenStreetMap Locate')">
            <el-radio-group size="small" v-model="editItem.settings.enable_auto_locate">
                <el-radio-button label="on_load">{{ $t('On Page Load') }}</el-radio-button>
                <el-radio-button label="on_click">{{ $t('On Click') }}</el-radio-button>
                <el-radio-button label="no">{{ $t('Disable') }}</el-radio-button>
            </el-radio-group>
        </el-form-item>

        <!-- Google Maps Options: Only show when provider is google and API key is present -->
        <el-form-item v-if="has_gmap_api  && editItem.settings.autocomplete_provider =='google'" :label="$t('Show Map')">
            <el-checkbox true-label="yes" false-label="no" v-model="editItem.settings.enable_g_map">
                {{ $t('Enable Map(Google Map)') }}
            </el-checkbox>
        </el-form-item>

        <el-form-item v-if="has_gmap_api && editItem.settings.autocomplete_provider =='google'">
            <div slot="label">
                {{ $t('Auto locate') }}
                <el-tooltip poper-class="ff_tooltip_wrap" :content="$t('When map is enabled Please enable Geocoding API if you want to populate address after map marker drag end')" placement="top">
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
                    {{ $t('On Click') }}
                </el-radio-button>
                <el-radio-button label="no">
                    {{ $t('Disable') }}
                </el-radio-button>
            </el-radio-group>
        </el-form-item>

        <el-form-item v-if="has_pro && ((editItem.settings.autocomplete_provider === 'google' && has_gmap_api) || editItem.settings.autocomplete_provider === 'html5')">
            <div slot="label">
                {{$t('Save Coordinates')}}
                <el-tooltip poper-class="ff_tooltip_wrap" :content="$t('If enabled, the user\'s latitude and longitude will be saved with the address field.')" placement="top">
                    <i class="tooltip-icon el-icon-info"></i>
                </el-tooltip>
            </div>
            <el-checkbox  true-label="yes" false-label="no" v-model="editItem.settings.save_coordinates">
                {{ $t('Save User Location (Latitude & Longitude)') }}
            </el-checkbox>
        </el-form-item>
    </div>
</template>

<script>
import fieldOptionSettings from './fieldOptionSettings.vue'
import customCountryList from './customCountryList.vue'
import validationRules from './validationRules.vue'
import RadioButton from "./radioButton.vue";

export default {
    name: 'customAddressFields',
    props: ['listItem', 'editItem'],
    components: {
        'wpuf_customCountryList': customCountryList,
        fieldOptionSettings,
        validationRules,
        RadioButton,
    },
    data() {
        return {
            has_gmap_api: !!window.FluentFormApp.has_address_gmap_api,
            has_pro: !!window.FluentFormApp.hasPro
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
    computed: {
        labelPlacementOptions() {
            return this.editItem.fields.country.settings.label_placement_options;
        }
    },
    mounted() {
        this.createDragableList();
    }
}
</script>
