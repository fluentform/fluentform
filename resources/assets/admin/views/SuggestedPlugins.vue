<template>
    <div class="add_on_modules suggested_plugins_view">
        <div class="modules_header mb-5">
            <h4 class="title mb-2">{{ $t('Recommended Plugins and Addons') }}</h4>
            <p class="text">{{ $t('Plugins that will extend your Fluent Forms Functionalities') }}</p>
        </div>

        <div class="modules_body">
            <div class="suggested_plugin_list">
                <div class="suggested_plugin_item ff_card ff_card_horizontal ff_card_s2" v-for="(plugin, pluginKey) in filteredPlugins" :key="pluginKey">
                    <div class="ff_card_body">
                        <div class="ff_media_group">
                            <div class="ff_media_head">
                                <div class="ff_icon_btn dark-soft md square">
                                    <img v-if="plugin.logo" :src="getLogoUrl(plugin.logo)" :alt="plugin.title" />
                                </div>
                            </div>

                            <div class="ff_media_body">
                                <div class="plugin_title_wrapper">
                                    <h4>{{ plugin.title }}</h4>

                                    <!-- Official Badge -->
                                    <el-tooltip v-if="plugin.badge_type === 'official'" effect="dark" placement="top">
                                        <div slot="content">{{ $t('Core plugins developed by Fluent team') }}</div>
                                        <span class="plugin_badge plugin_badge_official">
                                            {{ $t('Official') }}
                                        </span>
                                    </el-tooltip>

                                    <!-- Verified Badge -->
                                    <el-tooltip v-else-if="plugin.badge_type === 'verified'" effect="dark" placement="top">
                                        <div slot="content">{{ $t('3rd party plugins that have passed our security/quality audit') }}</div>
                                        <span class="plugin_badge plugin_badge_verified">
                                            <i class="el-icon-circle-check"></i> {{ $t('Verified') }}
                                        </span>
                                    </el-tooltip>

                                    <!-- Community Badge -->
                                    <el-tooltip v-else-if="plugin.badge_type === 'community'" effect="dark" placement="top">
                                        <div slot="content">{{ $t('Unverified or general 3rd party plugins') }}</div>
                                        <span class="plugin_badge plugin_badge_community">
                                            {{ $t('Community') }}
                                        </span>
                                    </el-tooltip>
                                </div>
                                <p class="text">{{ plugin.description }}</p>
                            </div>

                            <div class="plugin_actions">
                                <!-- Installing State -->
                                <el-button
                                    v-if="plugin.status === 'installing'"
                                    size="small"
                                    type="primary"
                                    loading
                                    disabled
                                >
                                    {{ $t('Installing...') }}
                                </el-button>

                                <!-- Activating State -->
                                <el-button
                                    v-else-if="plugin.status === 'activating'"
                                    size="small"
                                    type="primary"
                                    loading
                                    disabled
                                >
                                    {{ $t('Activating...') }}
                                </el-button>

                                <!-- Install Button -->
                                <el-button
                                    v-else-if="plugin.status === 'not_installed'"
                                    size="small"
                                    type="primary"
                                    @click="installPlugin(pluginKey)"
                                >
                                    {{ $t('Install') }} {{ plugin.title }}
                                </el-button>

                                <!-- Activate Button (already installed but inactive) -->
                                <el-button
                                    v-else-if="plugin.status === 'inactive'"
                                    size="small"
                                    type="primary"
                                    @click="activatePlugin(pluginKey)"
                                >
                                    {{ $t('Activate') }}
                                </el-button>

                                <!-- Active Badge -->
                                <span v-else-if="plugin.status === 'active'" class="installed_status">
                                    {{ $t('Already Active') }}
                                </span>

                                <!-- Learn More Link -->
                                <a
                                    v-if="plugin.wporg_url"
                                    :href="plugin.wporg_url"
                                    target="_blank"
                                    rel="noopener"
                                    class="text-secondary"
                                    style="font-size: 14px; text-decoration: none;"
                                >
                                    {{ $t('Learn More') }} <i class="el-icon-arrow-right"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script type="text/babel">
    // No external dependencies needed - using native JavaScript

    export default {
        name: 'fluent_suggested_plugins',
        data() {
            return {
                plugins: window.fluent_suggested_plugins?.plugins || {},
                nonce: window.fluent_suggested_plugins?.nonce || '',
                assetsUrl: window.fluent_suggested_plugins?.assets_url || ''
            }
        },
        computed: {
            filteredPlugins() {
                return this.plugins;
            }
        },
        methods: {
            getLogoUrl(logo) {
                // If logo already has http/https, return as is (for backward compatibility)
                if (logo && (logo.startsWith('http://') || logo.startsWith('https://'))) {
                    return logo;
                }
                // Otherwise combine with assets_url
                return this.assetsUrl + logo;
            },
            installPlugin(pluginKey) {
                this.$set(this.plugins[pluginKey], 'status', 'installing');

                const plugin = this.plugins[pluginKey];

                const url = FluentFormsGlobal.$rest.route('suggested-plugins/install-plugin');

                FluentFormsGlobal.$rest.post(url, {
                    plugin_slug: plugin.basename
                })
                .then((response) => {
                    if (response && response.message) {
                        // After successful installation, activate it
                        this.activatePlugin(pluginKey);
                    } else {
                        this.$set(this.plugins[pluginKey], 'status', 'not_installed');
                        this.$fail(response?.message || this.$t('Failed to install plugin'));
                    }
                })
                .catch(error => {
                    this.$set(this.plugins[pluginKey], 'status', 'not_installed');
                    this.$fail(error.message || this.$t('Failed to install plugin'));
                });
            },

            activatePlugin(pluginKey) {
                this.$set(this.plugins[pluginKey], 'status', 'activating');

                const plugin = this.plugins[pluginKey];

                const url = FluentFormsGlobal.$rest.route('suggested-plugins/activate-plugin');
                FluentFormsGlobal.$rest.post(url, {
                    plugin_slug: plugin.slug
                })
                .then((response) => {
                    if (response && response.message) {
                        this.$set(this.plugins[pluginKey], 'status', 'active');
                        this.$success(response.message || this.$t('Plugin activated successfully'));
                    } else {
                        this.$set(this.plugins[pluginKey], 'status', 'inactive');
                        this.$fail(response?.message || this.$t('Failed to activate plugin'));
                    }
                })
                .catch(error => {
                    this.$set(this.plugins[pluginKey], 'status', 'inactive');
                    this.$fail(error.message || this.$t('Failed to activate plugin'));
                });
            }
        }
    }
</script>

<style lang="scss">
@import '../styles/_variables.scss';

.suggested_plugins_view {
    .suggested_plugin_list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .ff_card_horizontal {
        border: 1px solid #E2E8F0;
        transition: all 0.2s ease;
        padding: 0!important;
        &:hover {
            border-color: #CBD5E1;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .ff_card_body {
            padding: 20px 24px;
        }

        .ff_media_group {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 0;

            .ff_media_head {
                flex-shrink: 0;
            }

            .ff_media_body {
                flex: 1;
                min-width: 0;

                .plugin_title_wrapper {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 4px;

                    h4 {
                        margin: 0;
                        font-size: 15px;
                        font-weight: 600;
                    }

                    .plugin_badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        padding: 3px 10px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                        line-height: 1.5;
                        white-space: nowrap;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;

                        i {
                            font-size: 13px;
                        }

                        &.plugin_badge_official {
                            background: #2C6CFF;
                            color: $white;
                            border: none;
                        }

                        &.plugin_badge_verified {
                            background: transparent;
                            color: #2C6CFF;
                            border: 1.5px solid #2C6CFF;

                            i {
                                color: #2C6CFF;
                            }
                        }

                        &.plugin_badge_community {
                            background: #F3F4F6;
                            color: #6B7280;
                            border: none;
                        }
                    }
                }

                .text {
                    font-size: 13px;
                    margin: 0;
                    line-height: 1.5;
                }
            }

            .plugin_actions {
                flex-shrink: 0;
                display: flex;
                align-items: center;

                gap: 12px;
                margin-left: auto;

              button{
                justify-content: center;
              }

                .el-button--small {
                    line-height: 1;
                }

                .installed_status {
                    display: inline-flex;
                    align-items: center;
                    padding: 7px 16px;
                    background: $--color-primary-light-9;
                    color: $--color-primary;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 500;
                    justify-content: center;
                }
            }
        }
    }

    // Responsive adjustments
    @media (max-width: 1024px) {
        .ff_card_horizontal .ff_media_group {
            flex-wrap: wrap;

            .plugin_actions {
                width: 100%;
                margin-left: 0;
                justify-content: flex-start;
                margin-top: 12px;
            }
        }
    }
}
</style>
