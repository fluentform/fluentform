<template>
    <div class="add_on_modules">
        <div class="modules_header">
            <div class="module_title">
                {{ $t('Fluent Forms Modules') }}
            </div>
            <p>{{ $t('Here is the list of all Fluent Forms modules.You can enable or disable the modules based on your need.') }}</p>
        </div>
        <div class="modules_body">
            <div class="ff_module_navs">
                <div class="ff_module_selectors">
                    <el-radio-group size="small" v-model="module_type">
                        <el-radio-button label="all">{{ $t('All') }}</el-radio-button>
                        <el-radio-button label="crm">{{ $t('CRM & SASS Integrations') }}</el-radio-button>
                        <el-radio-button label="wp_core">{{ $t('WP Core Modules') }}</el-radio-button>
                    </el-radio-group>
                </div>
                <div class="ff_mdoules_search">
                    <el-input size="small" :placeholder="$t('Search Modules')" v-model="search" class="input-with-select">
                        <el-button slot="append" icon="el-icon-search"></el-button>
                    </el-input>
                </div>

            </div>
            <div v-for="(addon, addonKey) in filteredAddons" :class="'addon_enabled_'+addon.enabled" class="add_on_card">
                <div class="addon_header">{{addon.title}}</div>
                <div class="addon_body">
                    <img v-if="addon.logo" :src="addon.logo" />
                    {{addon.description}}
                </div>
                <div class="addon_footer">
                    <template v-if="addon.purchase_url">
                        <a class="pro_update_btn" rel="noopener" :href="addon.purchase_url">{{ $t('Upgrade To Pro') }}</a>
                    </template>
                    <template v-else>
                        <el-switch active-color="#13ce66" @change="saveStatus(addonKey)" active-value="yes" inactive-value="no" v-model="addon.enabled" />
                        <span>{{ $t('Currently') }}</span> <span v-if="addon.enabled == 'yes'">{{ $t('Enabled') }}</span><span v-else>{{ $t('Disabled') }}</span>
                    </template>
                    <a style="float: right;text-decoration: none;" v-if="addon.config_url && addon.enabled == 'yes'" :href="addon.config_url"><span class="dashicons dashicons-admin-generic"></span></a>
                </div>
            </div>
            <div style="text-align: center" v-if="is_no_modules">
                <h3>{{ $t('Sorry!No modules found based on your filter') }}</h3>
            </div>
        </div>
    </div>
</template>

<script type="text/babel">
    import each from 'lodash/each';
    import isEmpty from 'lodash/isEmpty';

    export default {
        name: 'fluent_addon_modules',
        data() {
            return {
                search: '',
                addOns: window.fluent_addon_modules.addons,
                has_pro: window.fluent_addon_modules.has_pro,
                module_type: 'all'
            }
        },
        computed: {
            filteredAddons() {
                let addons = window.fluent_addon_modules.addons;
                if(this.search) {
                    let filteredAddons = {};
                    each(addons, (addOn, addOnKey) => {
                        let obString = JSON.stringify(addOn);
                        if(obString.indexOf(this.search) !== -1) {
                            filteredAddons[addOnKey] = addOn;
                        }
                    });
                    addons = filteredAddons;
                }

                if(this.module_type != 'all') {
                    let filteredAddons = {};
                    each(addons, (addOn, addOnKey) => {
                       if(addOn.category == this.module_type) {
                           filteredAddons[addOnKey] = addOn;
                       }
                    });
                    addons = filteredAddons;
                }
                return addons;
            },
            is_no_modules() {
                return isEmpty(this.filteredAddons);
            }
        },
        methods: {
            saveStatus(addonKey) {
                let addonModules = {};
                jQuery.each(this.addOns, (key, addon) => {
                    addonModules[key] = addon.enabled;
                });
                FluentFormsGlobal.$post({
                    action: 'fluentform_update_modules',
                    addons: addonModules
                })
                    .then((response) => {
                        this.$message({
                            message: response.data.message,
                            type: 'success',
                            offset: 32
                        });
                    })
                    .fail(error => {

                    })
                    .always(() => {

                    });
            },
            $t(str) {
                let transString = window.fluent_addon_modules.addOnModule_str[str];
                if(transString) {
                    return transString;
                }
                return str;
            },
        }
    }
</script>
