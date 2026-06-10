<template>
    <div class="ff_mcp_settings" v-loading="loading">
        <div class="ff_card">
            <div class="ff_card_head">
                <h5 class="title">{{ $t('MCP for AI Agents') }}</h5>
                <p class="text">
                    {{ $t('Let AI assistants (Claude, Cursor, Codex, and other MCP clients) securely read your forms and entries and run operator tasks through the Model Context Protocol. Ships off; enable it, then connect with a WordPress application password. Every request stays behind WordPress auth, your FluentForm role, and per-tool permission checks.') }}
                </p>
            </div>

            <div class="ff_card_body">
                <el-form label-position="top">
                    <el-form-item>
                        <template slot="label">
                            <span>{{ $t('Enable MCP Server') }}</span>
                        </template>
                        <el-switch
                            v-model="status.mcp_enabled"
                            :active-value="true"
                            :inactive-value="false"
                            @change="toggle"
                            :disabled="saving"
                        />
                        <span class="ff_tools_count" v-if="status.mcp_enabled">
                            {{ status.tools_count }} {{ $t('tools available') }}
                        </span>
                    </el-form-item>
                </el-form>

                <el-collapse v-if="status.mcp_enabled && tools.length" class="ff_mcp_tools">
                    <el-collapse-item name="tools">
                        <template slot="title">
                            <span class="ff_mcp_tools_title">{{ $t('Available tools') }} ({{ tools.length }})</span>
                        </template>
                        <div v-for="(groupTools, groupName) in groupedTools" :key="groupName" class="ff_mcp_tool_group">
                            <div class="ff_mcp_tool_group_title">{{ groupName }}</div>
                            <div v-for="tool in groupTools" :key="tool.name" class="ff_mcp_tool_row">
                                <div class="ff_mcp_tool_head">
                                    <span class="ff_mcp_tool_label">{{ tool.label }}</span>
                                    <el-tag size="mini" :type="tool.write ? 'warning' : 'info'">
                                        {{ tool.write ? $t('Write') : $t('Read') }}
                                    </el-tag>
                                </div>
                                <div class="ff_mcp_tool_desc">{{ tool.description }}</div>
                            </div>
                        </div>
                    </el-collapse-item>
                </el-collapse>

                <el-alert
                    v-if="status.mcp_enabled && !status.adapter_available"
                    type="warning"
                    :closable="false"
                    show-icon
                    class="ff_mcp_alert"
                >
                    <template slot="title">
                        {{ $t('No MCP adapter detected') }}
                    </template>
                    <p>
                        {{ $t('The MCP server needs an adapter (FluentHub / Fluent Toolkit, or the standalone MCP Adapter plugin) on WordPress 6.9+. Install one to expose the endpoint.') }}
                    </p>
                    <el-button
                        size="small"
                        type="primary"
                        :loading="installing"
                        v-if="status.can_auto_install"
                        @click="installAdapter"
                    >{{ $t('Install Adapter') }}</el-button>
                    <a
                        v-else
                        :href="status.toolkit_download_url"
                        target="_blank"
                        rel="noopener"
                    >{{ $t('Download the toolkit') }}</a>
                </el-alert>

                <div v-if="status.mcp_enabled && status.adapter_available" class="ff_mcp_connect">
                    <el-form label-position="top">
                        <el-form-item :label="$t('Endpoint URL')">
                            <el-input readonly :value="status.endpoint_url" class="ff_mcp_endpoint">
                                <el-button slot="append" @click="copy(status.endpoint_url)">{{ $t('Copy') }}</el-button>
                            </el-input>
                        </el-form-item>
                    </el-form>

                    <p class="ff_mcp_hint">
                        {{ $t('Create an application password for your account, then add the connection below to your AI client.') }}
                        <a :href="status.app_passwords_url" target="_blank" rel="noopener">{{ $t('Create application password') }}</a>
                    </p>

                    <el-tabs v-model="activeClient">
                        <el-tab-pane
                            v-for="(item, key) in snippets"
                            :key="key"
                            :label="clientLabel(key)"
                            :name="key"
                        >
                            <p class="ff_mcp_instructions">{{ item.instructions }}</p>
                            <pre class="ff_mcp_snippet"><code>{{ item.snippet }}</code></pre>
                            <el-button size="small" @click="copy(item.snippet)">{{ $t('Copy snippet') }}</el-button>
                        </el-tab-pane>
                    </el-tabs>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'McpSettings',
    data() {
        return {
            loading: true,
            saving: false,
            installing: false,
            activeClient: 'claude-code',
            status: {
                mcp_enabled: false,
                adapter_available: false,
                can_auto_install: false,
                toolkit_download_url: '',
                endpoint_url: '',
                tools_count: 0,
                app_passwords_url: ''
            },
            tools: [],
            snippets: {},
            clientLabels: {
                'claude-code': 'Claude Code',
                'claude-desktop': 'Claude Desktop',
                'cursor': 'Cursor',
                'codex': 'Codex',
                'generic': 'Other / curl'
            }
        };
    },
    computed: {
        groupedTools() {
            const groups = {};
            this.tools.forEach(tool => {
                const key = tool.group || 'General';
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(tool);
            });
            return groups;
        }
    },
    methods: {
        clientLabel(key) {
            return this.clientLabels[key] || key;
        },
        fetchStatus() {
            this.loading = true;
            FluentFormsGlobal.$rest.get('mcp/status')
                .then(response => {
                    this.status = response;
                    this.tools = response.tools || [];
                    if (response.mcp_enabled && response.adapter_available) {
                        this.fetchSnippets();
                    }
                })
                .catch(e => {
                    this.$fail((e && e.message) || this.$t('Failed to load MCP settings.'));
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        fetchSnippets() {
            FluentFormsGlobal.$rest.get('mcp/config-snippets')
                .then(response => {
                    this.snippets = response.snippets || {};
                })
                .catch(() => {});
        },
        toggle(value) {
            this.saving = true;
            FluentFormsGlobal.$rest.post('mcp/toggle', { mcp_enabled: value ? 'yes' : 'no' })
                .then(response => {
                    this.status.mcp_enabled = response.mcp_enabled;
                    this.$success(response.message);
                    if (response.mcp_enabled && this.status.adapter_available) {
                        this.fetchSnippets();
                    }
                })
                .catch(e => {
                    this.status.mcp_enabled = !value;
                    this.$fail((e && e.message) || this.$t('Failed to update the MCP setting.'));
                })
                .finally(() => {
                    this.saving = false;
                });
        },
        installAdapter() {
            this.installing = true;
            FluentFormsGlobal.$rest.post('mcp/install-adapter', {})
                .then(response => {
                    this.$success(response.message);
                    this.fetchStatus();
                })
                .catch(e => {
                    this.$fail((e && e.message) || this.$t('Adapter install failed.'));
                })
                .finally(() => {
                    this.installing = false;
                });
        },
        copy(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this.$success(this.$t('Copied to clipboard.'));
                });
            }
        }
    },
    mounted() {
        this.fetchStatus();
        jQuery('head title').text('MCP for AI Agents - Fluent Forms');
    }
};
</script>

<style scoped>
.ff_mcp_endpoint ::v-deep .el-input-group__append {
    flex: 0 0 auto;
    width: auto;
    white-space: nowrap;
}
.ff_mcp_endpoint ::v-deep .el-input-group__append .el-button {
    margin: 0;
    padding: 9px 18px;
    white-space: nowrap;
}
.ff_mcp_snippet {
    background: #1d2327;
    color: #e2e4e7;
    border-radius: 6px;
    padding: 16px 20px;
    margin: 0 0 12px;
    overflow-x: auto;
    line-height: 1.6;
    font-size: 12px;
}
.ff_mcp_snippet code {
    display: block;
    background: transparent;
    color: inherit;
    padding: 0;
    font-family: Consolas, Monaco, 'Courier New', monospace;
    white-space: pre;
}
.ff_mcp_tools {
    margin: 4px 0 20px;
    border-top: none;
}
.ff_mcp_tools_title {
    font-weight: 600;
}
.ff_mcp_tool_group {
    margin-bottom: 14px;
}
.ff_mcp_tool_group_title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: #7a8194;
    margin: 6px 0;
}
.ff_mcp_tool_row {
    padding: 8px 0;
    border-bottom: 1px solid #f0f1f5;
}
.ff_mcp_tool_row:last-child {
    border-bottom: none;
}
.ff_mcp_tool_head {
    display: flex;
    align-items: center;
    gap: 8px;
}
.ff_mcp_tool_label {
    font-weight: 600;
    color: #1a1a1a;
}
.ff_mcp_tool_desc {
    margin-top: 2px;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
}
</style>
