<template>
    <div class="ff_form_integrations">
        <card>
            <card-head>
                <card-head-group class="justify-between">
                    <div class="ff_integration_header_left">
                        <h5 class="title">{{ $t('All Form Integrations') }}</h5>
                        <span v-if="integrations.length" class="ff_integration_count">
                            {{ integrations.length }} {{ integrations.length === 1 ? $t('integration') : $t('integrations') }}
                        </span>
                    </div>
                    <div v-if="!isEmpty(available_integrations)" class="ff_integration_actions">

                        <el-dropdown @command="add" :hide-on-click="false" trigger="click">
                            <el-button type="primary" size="medium">
                                <i class="el-icon-plus"></i>
                                {{ $t('Add New Integration') }}
                            </el-button>
                            <el-dropdown-menu class="ff_integration_dropdown" slot="dropdown">

                                <div class="ff_dropdown_list">
                                    <template v-if="hasCategories">
                                        <div v-for="(category, categoryName) in categorizedIntegrations" :key="categoryName" class="ff_integration_category">
                                            <div class="ff_category_header">{{ categoryName }}</div>
                                            <el-dropdown-item
                                                v-for="(integration, integration_name) in category"
                                                :key="integration_name"
                                                :command="integration_name"
                                                class="ff_integration_item"
                                            >
                                                <span class="ff_integration_item_title">{{ integration.title }}</span>
                                                <span v-if="!integration.is_active" class="ff_integration_item_badge">
                                                    {{ $t('Configure') }}
                                                </span>
                                            </el-dropdown-item>
                                        </div>
                                    </template>
                                    <template v-else>
                                        <el-dropdown-item
                                            v-for="(integration, integration_name) in available_integrations"
                                            :key="integration_name"
                                            :command="integration_name"
                                            class="ff_integration_item"
                                        >
                                            <span class="ff_integration_item_title">{{ integration.title }}</span>
                                            <span v-if="!integration.is_active" class="ff_integration_item_badge">
                                                {{ $t('Configure') }}
                                            </span>
                                        </el-dropdown-item>
                                    </template>

                                </div>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </card-head-group>
            </card-head>
            <card-body>
                <div v-if="has_pro && isEmpty(available_integrations) && !loading" class="ff_integration_empty_state">
                    <div class="ff_empty_icon">
                        <i class="ff-icon-modules"></i>
                    </div>
                    <h6>{{ $t('No Modules Configured') }}</h6>
                    <p>{{ $t(this.integrationsResource.instruction) }}</p>
                    <a class="el-button el-button--primary" :href="all_module_config_url">
                        <i class="el-icon-setting"></i>
                        {{ $t('Configure Modules') }}
                    </a>
                </div>

                <!-- Integrations Table -->
                <div class="ff-table-container">
                    <el-skeleton :loading="loading" animated :rows="6">
                        <template v-if="!isEmpty(available_integrations)">
                            <!-- Empty State -->
                            <div v-if="integrations.length === 0" class="ff_table_empty_state">
                                <div class="ff_empty_icon ff_empty_icon--sm">
                                    <i class="ff-icon-link"></i>
                                </div>
                                <h6>{{ $t('No Integrations Yet') }}</h6>
                                <p>{{ $t('Connect your favorite tools to supercharge your forms') }}</p>
                            </div>

                            <!-- Integrations List with Drag & Drop -->
                            <div v-else class="ff_integration_list">
                                <!-- Table Header -->
                                <div class="ff_integration_list_header">
                                    <div class="ff_col ff_col_order">{{ $t('Order') }}</div>
                                    <div class="ff_col ff_col_status">{{ $t('Status') }}</div>
                                    <div class="ff_col ff_col_integration">{{ $t('Integration') }}</div>
                                    <div class="ff_col ff_col_name">{{ $t('Feed Name') }}</div>
                                    <div class="ff_col ff_col_actions">{{ $t('Actions') }}</div>
                                </div>

                                <!-- Draggable List -->
                                <vddl-list
                                    class="ff_integration_list_body"
                                    :list="integrations"
                                    :drop="handleDrop"
                                    :horizontal="false"
                                >
                                    <vddl-draggable
                                        v-for="(integration, index) in integrations"
                                        :key="'feed-' + integration.id"
                                        class="ff_integration_row"
                                        :draggable="integration"
                                        :index="index"
                                        :wrapper="integrations"
                                        effect-allowed="move"
                                        :moved="handleMoved"
                                    >
                                        <!-- Order Number with Drag Handle -->
                                        <div class="ff_col ff_col_order">
                                            <vddl-handle class="ff_drag_handle" :handle-left="20" :handle-top="20">
                                                <el-tooltip :content="$t('Drag to reorder')" placement="top">
                                                    <span class="ff_order_badge">
                                                        <i class="el-icon-rank"></i>
                                                        {{ index + 1 }}
                                                    </span>
                                                </el-tooltip>
                                            </vddl-handle>
                                        </div>

                                        <!-- Status -->
                                        <div class="ff_col ff_col_status">
                                            <el-switch
                                                v-model="integration.enabled"
                                                active-color="#00b27f"
                                                @change="handleActive(integration)"
                                            />
                                        </div>

                                        <!-- Integration Info -->
                                        <div class="ff_col ff_col_integration">
                                            <div class="ff_integration_info">
                                                <div class="ff_integration_logo">
                                                    <img v-if="integration.provider_logo" :src="integration.provider_logo" :alt="integration.provider" />
                                                    <span v-else class="ff_integration_logo_placeholder">
                                                        {{ getInitials(integration.provider) }}
                                                    </span>
                                                </div>
                                                <div class="ff_integration_details">
                                                    <span class="ff_integration_provider">{{ formatProviderName(integration.provider) }}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Feed Name -->
                                        <div class="ff_col ff_col_name">
                                            <span class="ff_feed_name">{{ integration.name }}</span>
                                        </div>

                                        <!-- Actions -->
                                        <div class="ff_col ff_col_actions">
                                            <div class="ff_action_buttons">
                                                <el-tooltip :content="$t('Edit Integration')" placement="top">
                                                    <el-button
                                                        class="el-button--soft el-button--icon"
                                                        @click.stop="edit(integration)"
                                                        type="primary"
                                                        icon="ff-icon-setting"
                                                        size="small"
                                                    />
                                                </el-tooltip>
                                                <el-tooltip :content="$t('Duplicate')" placement="top">
                                                    <el-button
                                                        class="el-button--soft el-button--icon"
                                                        @click.stop="duplicate(integration)"
                                                        type="info"
                                                        icon="el-icon-copy-document"
                                                        size="small"
                                                    />
                                                </el-tooltip>
                                                <remove @on-confirm="removeIntegration(integration.id, index)">
                                                    <el-tooltip :content="$t('Delete')" placement="top">
                                                        <el-button
                                                            class="el-button--soft el-button--icon"
                                                            size="small"
                                                            type="danger"
                                                            icon="ff-icon-trash"
                                                        />
                                                    </el-tooltip>
                                                </remove>
                                            </div>
                                        </div>
                                    </vddl-draggable>
                                </vddl-list>
                            </div>
                        </template>
                    </el-skeleton>
                </div>

                


                <div v-if="!has_pro" class="ff_upgrade_section">
                    <div class="ff_upgrade_content">
                        <div class="ff_upgrade_icon">
                            <i class="ff-icon-star"></i>
                        </div>
                        <h5>{{ $t('Unlock Powerful Integrations') }}</h5>
                        <p>{{ $t(this.integrationsResource.instruction) }}</p>
                        <div class="ff_btn_group">
                            <a class="el-button el-button--primary" :href="upgrade_url">
                                <i class="el-icon-unlock"></i>
                                {{ $t('Upgrade to PRO') }}
                            </a>
                            <a class="el-button el-button--default" :href="integrationsResource.list_url">
                                {{ $t('See All Integrations') }}
                            </a>
                        </div>
                    </div>
                    <div class="ff_upgrade_image">
                        <img :src="integrationsResource.asset_url" alt="integrations" />
                    </div>
                </div>
            </card-body>
        </card>
    </div>
</template>

<script>
    import remove from '../../confirmRemove.vue';
    import isEmpty from 'lodash/isEmpty';
    import Card from '@/admin/components/Card/Card.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import BtnGroup from '@/admin/components/BtnGroup/BtnGroup.vue';
    import BtnGroupItem from '@/admin/components/BtnGroup/BtnGroupItem.vue';
    import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';

    export default {
        name: 'generalSettings',
        props: ['form_id', 'inputs', 'has_pro', 'editorShortcodes'],
        components: {
            remove,
            Card,
            CardHead,
            CardBody,
            BtnGroup,
            BtnGroupItem,
            CardHeadGroup
        },
        data() {
            return {


                loading: true,
                integrations: [],
                errors: new Errors,
                available_integrations: {},
                all_module_config_url: '',
                instruction: "Fluent Forms Pro has tons of integrations to take your forms to the next level. From payment gateways to quiz building, SMS notifications to email marketing - you'll get integrations for various purposes. Even if you don't find your favorite tools, you can integrate them easily with Zapier.",
                integrationsAsset: window.FluentFormApp.integrations_asset_url,
                upgrade_url: window.FluentFormApp.upgrade_url,
                integrations_url: window.FluentFormApp.integrations_url,
                integrationsResource: window.FluentFormApp.integrationsResource,
                integrationCategories: {
                    'Email Marketing': ['mailchimp', 'activecampaign', 'campaign_monitor', 'constantcontact', 'convertkit', 'drip', 'getresponse', 'mailerlite', 'mailjet', 'sendinblue', 'sendfox', 'moosend', 'emailoctopus', 'fluentcrm', 'automizy', 'ontraport', 'sendpulse', 'beehiiv'],
                    'CRM': ['hubspot', 'salesforce', 'zohocrm', 'pipedrive', 'airtable', 'salesflare', 'insightly', 'agilecrm', 'close', 'capsule', 'freshsales', 'keap_infusionsoft', 'nutshell'],
                    'Payment': ['stripe', 'paypal', 'mollie', 'razorpay', 'paystack', 'square'],
                    'Automation': ['zapier', 'webhook', 'pabbly', 'integrately', 'integromat', 'n8n'],
                    'SMS & Messaging': ['twilio', 'clicksend', 'messagebird', 'textmagic', 'telegram', 'slack', 'discord'],
                    'Other': []
                }
            }
        },
        methods: {
            add(integration_name) {
                if (!integration_name) {
                    return;
                }
                let integration = this.available_integrations[integration_name];

                if(!integration.is_active) {
                    this.$confirm(integration.configure_message, integration.configure_title, {
                        confirmButtonText: integration.configure_button_text,
                        cancelButtonText: 'Cancel',
                        type: 'warning'
                    }).then(() => {
                        window.location.href = integration.global_configure_url;
                        return;
                    }).catch(() => {});
                    return;
                }

                this.$router.push({
                    name: 'edit_integration',
                    params: {
                        integration_id: 0,
                        integration_name: integration_name
                    }
                });
                return;
            },
            edit(integration) {
                this.$router.push({
                    name: 'edit_integration',
                    params: {
                        integration_id: integration.id,
                        integration_name: integration.provider
                    }
                });
            },
            duplicate(integration) {
                this.$router.push({
                    name: 'edit_integration',
                    params: {
                        integration_id: 0,
                        integration_name: integration.provider
                    },
                    query: {
                        duplicate_from: integration.id
                    }
                });
            },
            handleActive(row) {
                let data = {
                    form_id: this.form_id,
                    status: row.enabled,
                    integration_id: row.id,
                };

                this.errors.clear();
                this.saving = true;

                const url = FluentFormsGlobal.$rest.route('updateFormIntegrationSettings', this.form_id);

                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        if(response.created) {
                            this.$router.push({
                                name: 'allIntegrations'
                            });
                        }
                        this.$success(response.message);
                    })
                    .catch((error) => {
                        row.enabled = !row.enabled; // Revert on error
                        const message = error?.message || error?.data?.message;
                        this.$fail(message);
                    })
                    .finally(() => this.saving = false);
            },
            removeIntegration(feed_id, index) {
                const url = FluentFormsGlobal.$rest.route('deleteFormIntegration', this.form_id);
                let data = {
                    integration_id: feed_id,
                    form_id: this.form_id
                };
                this.deleting = true;
                FluentFormsGlobal.$rest.delete(url, data)
                    .then(response => {
                        this.$success(response.message);
                        this.integrations.splice(index, 1);
                        this.originalOrder = this.integrations.map(i => i.id);
                    })
                    .catch((error) => {
                        const message = error?.message || error?.data?.message;
                        this.$fail(message);
                    })
                    .finally(() => {});
            },
            handleDrop(data) {
                const { index, list, item } = data;
                // Manually insert the item at the new position
                list.splice(index, 0, item);
                // Save the order after Vue updates
                this.$nextTick(() => {
                    this.saveOrder();
                });
            },
            handleMoved(data) {
                const { index, list } = data;
                // Remove the item from its original position
                list.splice(index, 1);
            },
            saveOrder() {
                // Get unique IDs in current order
                const order = [...new Set(this.integrations.map(item => item.id))];
                const url = FluentFormsGlobal.$rest.route('updateIntegrationOrder', this.form_id);

                FluentFormsGlobal.$rest.post(url, {
                    form_id: this.form_id,
                    order: order
                })
                    .then(response => {
                        this.$success(this.$t('Order updated'));
                    })
                    .catch((error) => {
                        const message = error?.message || error?.data?.message;
                        this.$fail(message);
                    });
            },
            getFeeds() {
                this.loading = true;

                const url = FluentFormsGlobal.$rest.route('getIntegrations', this.form_id);
                FluentFormsGlobal.$rest.get(url)
                    .then(response => {
                        this.integrations = response.feeds;
                        this.available_integrations = response.available_integrations;
                        this.all_module_config_url = response.all_module_config_url;
                    })
                    .catch(error => {
                        console.log(error);
                        this.errors.record(error);
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            getInitials(name) {
                if (!name) return '?';
                return name.replace(/_feeds?$/i, '')
                    .split(/[_\s-]/)
                    .map(word => word.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join('');
            },
            formatProviderName(provider) {
                if (!provider) return '';
                return provider
                    .replace(/_feeds?$/i, '')
                    .split(/[_-]/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            },
            isEmpty
        },
        computed: {
            activeCount() {
                return this.integrations.filter(i => i.enabled).length;
            },
            inactiveCount() {
                return this.integrations.filter(i => !i.enabled).length;
            },


            hasCategories() {
                return Object.keys(this.available_integrations).length > 10;
            },
            categorizedIntegrations() {
                const result = {};
                const categorized = new Set();

                Object.entries(this.integrationCategories).forEach(([category, keywords]) => {
                    const categoryIntegrations = {};

                    Object.keys(this.available_integrations).forEach(key => {
                        const keyLower = key.toLowerCase();
                        if (keywords.some(kw => keyLower.includes(kw))) {
                            categoryIntegrations[key] = this.available_integrations[key];
                            categorized.add(key);
                        }
                    });

                    if (Object.keys(categoryIntegrations).length > 0) {
                        result[category] = categoryIntegrations;
                    }
                });

                const otherIntegrations = {};
                Object.keys(this.available_integrations).forEach(key => {
                    if (!categorized.has(key)) {
                        otherIntegrations[key] = this.available_integrations[key];
                    }
                });

                if (Object.keys(otherIntegrations).length > 0) {
                    result['Other'] = otherIntegrations;
                }

                return result;
            }
        },
        beforeMount() {
            this.getFeeds();
        },
        beforeCreate() {
            jQuery('head title').text('Form Integrations - Fluent Forms');
        }
    }
</script>


