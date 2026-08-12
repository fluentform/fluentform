<template>
    <div class="ff_mcp_settings" v-loading="loading">
        <div class="ff_card">
            <div class="ff_card_head">
                <h5 class="title">{{ $t('MCP for AI Agents') }}</h5>
                <p class="text">
                    {{ $t('Let AI assistants (Claude, Cursor, Codex, and other MCP clients) securely read your forms and entries and run operator tasks through the Model Context Protocol. Ships off; enable it, then connect with a WordPress application password. Every request runs as the WordPress user whose application password is used, with exactly that user\'s FluentForm access and form scope — an agent can never reach a form its user cannot. Tools that change data require a preview-then-confirm step before they write.') }}
                </p>
            </div>

            <div class="ff_card_body">
                <el-alert
                    v-if="statusError"
                    :title="$t('Could not load the MCP status — the controls below may not reflect the real server state. Reload the page to try again.')"
                    type="error"
                    :closable="false"
                    show-icon
                    class="ff_mcp_status_error"
                />
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
                            :disabled="saving || statusError"
                        />
                        <span class="ff_tools_count" v-if="status.mcp_enabled">
                            {{ status.tools_count }} {{ $t('tools available') }}
                        </span>
                    </el-form-item>
                </el-form>

                <el-collapse v-if="status.mcp_enabled && tools.length" class="ff_mcp_tools">
                    <el-collapse-item name="tools">
                        <template slot="title">
                            <span class="ff_mcp_tools_title">{{ $t('Available tools') }} ({{ status.tools_count }})</span>
                        </template>
                        <div class="ff_mcp_tool_list">
                            <span
                                v-for="tool in tools"
                                :key="tool.name"
                                class="ff_mcp_tool_chip"
                                :class="{ 'ff_mcp_tool_chip--locked': tool.available === false }"
                                :title="tool.available === false ? $t('Available in Fluent Forms Pro') : ''"
                            >
                                {{ tool.label }}
                                <el-tag v-if="tool.pro" size="mini" type="success">{{ $t('Pro') }}</el-tag>
                                <el-tag v-if="tool.available !== false" size="mini" :type="tool.write ? 'warning' : 'info'">{{ tool.write ? $t('Write') : $t('Read') }}</el-tag>
                            </span>
                        </div>
                    </el-collapse-item>
                </el-collapse>

                <div v-if="status.mcp_enabled && !status.adapter_available" class="ff_mcp_adapter">
                    <template v-if="status.adapter_installed">
                        <p class="ff_mcp_adapter_text">
                            {{ $t('FluentHub is installed but not active. Activate it from the Plugins page, then reload this page to expose the AI agent tools.') }}
                        </p>
                        <a class="ff_mcp_get_fluenthub" :href="status.plugins_url">{{ $t('Open Plugins page') }}</a>
                    </template>
                    <template v-else>
                        <p class="ff_mcp_adapter_text">
                            {{ $t('Fluent Forms ships AI agent tools, but they only become available once FluentHub is installed and active.') }}
                        </p>
                        <div class="ff_mcp_adapter_actions">
                            <el-button
                                v-if="status.can_auto_install"
                                type="primary"
                                :loading="installing"
                                @click="installAdapter"
                            >{{ $t('Install FluentHub') }}</el-button>
                            <a
                                v-else
                                class="ff_mcp_get_fluenthub"
                                :href="status.toolkit_download_url"
                                target="_blank"
                                rel="noopener"
                            >{{ $t('Get FluentHub') }}</a>
                        </div>
                    </template>
                </div>

                <div v-if="status.mcp_enabled && status.adapter_available" class="ff_mcp_connect">
                    <el-form label-position="top">
                        <el-form-item :label="$t('Endpoint URL')">
                            <el-input readonly :value="status.endpoint_url" class="ff_mcp_endpoint">
                                <el-button slot="append" @click="copy(status.endpoint_url)">{{ $t('Copy') }}</el-button>
                            </el-input>
                        </el-form-item>
                    </el-form>

                    <p class="ff_mcp_hint">
                        {{ $t('Create an application password, then enter it below with your username. The snippet\'s Basic auth header is base64-encoded for you in the browser — no manual encoding — and your password never leaves this page.') }}
                        <a :href="status.app_passwords_url" target="_blank" rel="noopener">{{ $t('Create application password') }}</a>
                    </p>

                    <el-form label-position="top" class="ff_mcp_creds">
                        <el-form-item :label="$t('WordPress username')">
                            <el-input v-model="username" :placeholder="$t('WordPress username')" />
                        </el-form-item>
                        <el-form-item :label="$t('Application password')">
                            <el-input v-model="appPassword" type="password" show-password :placeholder="$t('Application password')" />
                        </el-form-item>
                    </el-form>

                    <div v-if="snippetsLoadFailed" class="ff_mcp_snippets_error">
                        <el-alert
                            :title="$t('Could not load the connection snippets. The endpoint and credentials above still work — retry to show the ready-to-copy configuration for each client.')"
                            type="error"
                            :closable="false"
                            show-icon
                        />
                        <el-button size="small" :loading="snippetsLoading" @click="fetchSnippets" class="ff_mcp_snippets_retry">{{ $t('Retry') }}</el-button>
                    </div>

                    <el-tabs v-else v-model="activeClient">
                        <el-tab-pane
                            v-for="(item, key) in snippets"
                            :key="key"
                            :label="clientLabel(key)"
                            :name="key"
                        >
                            <p class="ff_mcp_instructions">{{ item.instructions }}</p>
                            <pre class="ff_mcp_snippet"><code>{{ renderSnippet(item) }}</code></pre>
                            <el-alert
                                v-if="snippetError(item)"
                                :title="snippetError(item)"
                                type="error"
                                :closable="false"
                                show-icon
                                class="ff_mcp_snippet_error"
                            />
                            <el-button size="small" :disabled="!!snippetError(item)" @click="copy(renderSnippet(item))">{{ $t('Copy snippet') }}</el-button>
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
            statusError: false,
            snippetsLoading: false,
            snippetsLoadFailed: false,
            saving: false,
            installing: false,
            activeClient: 'claude-code',
            username: '',
            appPassword: '',
            status: {
                mcp_enabled: false,
                adapter_available: false,
                adapter_installed: false,
                can_auto_install: false,
                toolkit_download_url: '',
                endpoint_url: '',
                tools_count: 0,
                app_passwords_url: '',
                plugins_url: ''
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
    methods: {
        clientLabel(key) {
            return this.clientLabels[key] || key;
        },
        fetchStatus() {
            this.loading = true;
            FluentFormsGlobal.$rest.get('mcp/status')
                .then(response => {
                    this.statusError = false;
                    this.status = response;
                    this.tools = response.tools || [];
                    if (response.current_user_login && !this.username) {
                        this.username = response.current_user_login;
                    }
                    if (response.mcp_enabled && response.adapter_available) {
                        this.fetchSnippets();
                    }
                })
                .catch(e => {
                    // Keep the switch/controls disabled and surfaced as errored rather
                    // than rendering the default "disabled" status as if it were real.
                    this.statusError = true;
                    this.$fail((e && e.message) || this.$t('Failed to load MCP settings.'));
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        fetchSnippets() {
            this.snippetsLoading = true;
            this.snippetsLoadFailed = false;
            FluentFormsGlobal.$rest.get('mcp/config-snippets')
                .then(response => {
                    this.snippets = response.snippets || {};
                })
                .catch(e => {
                    // Surface a persistent, retryable error instead of only a toast:
                    // without snippets the client tabs render blank, so the connection
                    // area would look broken with no explanation once the toast fades.
                    this.snippetsLoadFailed = true;
                    this.$fail((e && e.message) || this.$t('Failed to load the connection snippets.'));
                })
                .finally(() => {
                    this.snippetsLoading = false;
                });
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
        renderSnippet(item) {
            const snippet = (item && item.snippet) || '';
            if (!snippet) {
                return '';
            }
            const u = (this.username || '').trim();
            const p = (this.appPassword || '').trim();
            const format = (item && item.format) || 'text';
            let text = snippet;

            if (u && p) {
                const basic = this.utf8Base64(`${u}:${p}`);
                if (null !== basic) {
                    text = text.split('<base64(your-username:application-password)>').join(basic);
                }
            }
            if (u) {
                text = text.split('<your-username>').join(this.escapeForFormat(u, format));
            }
            if (p) {
                text = text.split('<your-application-password>').join(this.escapeForFormat(p, format));
            }
            return text;
        },
        // btoa only accepts Latin-1; a non-ASCII password would throw. Encode to
        // UTF-8 bytes first so any valid credential base64-encodes. null on failure.
        utf8Base64(str) {
            try {
                return btoa(unescape(encodeURIComponent(str)));
            } catch (e) {
                return null;
            }
        },
        // Escape a credential for the syntax it is substituted into, so a value
        // with a quote/backslash/newline can't break the JSON config or the shell
        // command (a copied, invalid config, or worse in a shell).
        escapeForFormat(value, format) {
            const v = String(value);
            if ('json' === format) {
                // The placeholder sits inside an existing JSON string, so escape
                // the contents and drop the quotes JSON.stringify adds.
                return JSON.stringify(v).slice(1, -1);
            }
            if ('shell' === format) {
                // Safe inside a single-quoted argument: close, escaped quote, reopen.
                return v.split("'").join("'\\''");
            }
            return v;
        },
        // Non-empty when credentials are entered but can't be encoded for this
        // client, so the copy button is disabled instead of copying a broken value.
        snippetError(item) {
            const u = (this.username || '').trim();
            const p = (this.appPassword || '').trim();
            if (!u || !p) {
                return '';
            }
            const snippet = (item && item.snippet) || '';
            if (
                -1 !== snippet.indexOf('<base64(your-username:application-password)>')
                && null === this.utf8Base64(`${u}:${p}`)
            ) {
                return this.$t('These credentials can’t be encoded for this client. Check the username and application password.');
            }
            return '';
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
                navigator.clipboard.writeText(text)
                    .then(() => this.$success(this.$t('Copied to clipboard.')))
                    .catch(() => this.fallbackCopy(text));
                return;
            }
            this.fallbackCopy(text);
        },
        fallbackCopy(text) {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.position = 'absolute';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand('copy');
                document.body.removeChild(ta);
                if (ok) {
                    this.$success(this.$t('Copied to clipboard.'));
                } else {
                    this.$fail(this.$t('Copy is unavailable here — select the text and press Ctrl/Cmd+C.'));
                }
            } catch (e) {
                this.$fail(this.$t('Copy is unavailable here — select the text and press Ctrl/Cmd+C.'));
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
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}
.ff_mcp_tools {
    margin: 4px 0 20px;
    border: none;
}
/* Drop Element UI's default collapse dividers so the only rule below the tools
   list is the section's own border-top — otherwise the two stack as a doubled line. */
.ff_mcp_tools ::v-deep .el-collapse-item__header,
.ff_mcp_tools ::v-deep .el-collapse-item__wrap {
    border-bottom: none;
}
.ff_mcp_tools_title {
    font-weight: 600;
}
.ff_mcp_tool_list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.ff_mcp_tool_chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border: 1px solid #eceef2;
    border-radius: 6px;
    font-size: 12px;
    color: #1a1a1a;
}
.ff_mcp_tool_chip--locked {
    opacity: 0.6;
    border-style: dashed;
    color: #6b7280;
}
.ff_mcp_adapter {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eceef2;
}
.ff_mcp_adapter_text {
    margin: 0 0 16px;
    color: #4b5563;
    font-size: 13px;
    line-height: 1.6;
}
.ff_mcp_adapter_actions {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
}
.ff_mcp_get_fluenthub {
    display: inline-block;
    background: #1d2327;
    color: #fff;
    padding: 9px 18px;
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
}
.ff_mcp_get_fluenthub:hover {
    background: #000;
    color: #fff;
}

/* Connection block: even vertical rhythm so inputs, hints and the client
   tabs don't crowd each other. */
.ff_mcp_connect {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #eceef2;
}
.ff_mcp_hint {
    margin: 6px 0 20px;
    color: #4b5563;
    font-size: 13px;
    line-height: 1.6;
}
.ff_mcp_creds ::v-deep .el-form-item {
    margin-bottom: 18px;
}
.ff_mcp_connect ::v-deep .el-tabs {
    margin-top: 20px;
}
.ff_mcp_connect ::v-deep .el-tabs__header {
    margin-bottom: 18px;
}
.ff_mcp_instructions {
    margin: 8px 0 12px;
    color: #4b5563;
    font-size: 13px;
    line-height: 1.6;
}
.ff_mcp_snippets_retry {
    margin-top: 12px;
}
</style>
