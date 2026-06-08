<?php

namespace FluentForm\App\Http\Controllers;

use FluentForm\App\Modules\MCP\MCPInit;
use FluentForm\App\Modules\MCP\Support\PermissionGate;

/**
 * Backend for the FluentForm → Settings → MCP card.
 *
 * The MCP feature stores its on/off state in the dedicated, autoloaded
 * _fluentform_mcp_settings option (PermissionGate::isEnabled/setEnabled). This
 * controller owns the status / toggle / connection-snippet endpoints; the toggle
 * is instant rather than riding the generic global-settings save.
 */
class McpSettingsController extends Controller
{
    const TOOLKIT_PLUGIN_FILE = 'fluent-toolkit/fluent-toolkit.php';

    const TOOLKIT_DOWNLOAD_URL = 'https://github.com/WPManageNinja/fluent-toolkit';

    public function status()
    {
        $user = wp_get_current_user();

        return $this->sendSuccess([
            'mcp_enabled'          => PermissionGate::isEnabled(),
            'adapter_available'    => MCPInit::adapterAvailable(),
            'toolkit_installed'    => $this->isToolkitInstalled(),
            'can_auto_install'     => (bool) apply_filters('fluent_toolkit/can_auto_install', false),
            'toolkit_download_url' => self::TOOLKIT_DOWNLOAD_URL,
            'endpoint_url'         => MCPInit::getEndpointUrl(),
            'tools_count'          => MCPInit::toolsCount(),
            'app_passwords_url'    => admin_url('profile.php#application-passwords-section'),
            'plugins_url'          => admin_url('plugins.php'),
            'current_user_login'   => ($user && $user->exists()) ? $user->user_login : '',
            'is_local_dev'         => $this->isLocalDev(),
        ]);
    }

    public function toggle()
    {
        if (!current_user_can('manage_options')) {
            return $this->sendError([
                'message' => __('Sorry, you do not have permission to change the MCP setting.', 'fluentform'),
            ]);
        }

        $value   = $this->request->get('mcp_enabled');
        $enabled = is_string($value) ? in_array(strtolower($value), ['yes', 'true', '1', 'on'], true) : (bool) $value;

        PermissionGate::setEnabled($enabled);

        $stored = PermissionGate::isEnabled();

        return $this->sendSuccess([
            'mcp_enabled' => $stored,
            'message'     => $stored
                ? __('MCP enabled. AI agents with a valid application password can now reach the FluentForm tools.', 'fluentform')
                : __('MCP disabled. The endpoint will reject requests until re-enabled.', 'fluentform'),
        ]);
    }

    public function installAdapter()
    {
        if (!current_user_can('install_plugins')) {
            return $this->sendError([
                'message' => __('Sorry, you do not have permission to install plugins.', 'fluentform'),
            ]);
        }

        $canAutoInstall = (bool) apply_filters('fluent_toolkit/can_auto_install', false);
        if (!$canAutoInstall) {
            return $this->sendError([
                'message'              => __('Automatic install needs a Fluent Pro plugin. Install FluentHub / Fluent Toolkit manually, then reload this page to connect FluentForm with AI agents.', 'fluentform'),
                'toolkit_download_url' => self::TOOLKIT_DOWNLOAD_URL,
            ]);
        }

        do_action('fluent_toolkit/do_auto_install');

        wp_clean_plugins_cache();

        $available = MCPInit::adapterAvailable();

        return $this->sendSuccess([
            'adapter_available' => $available,
            'toolkit_installed' => $this->isToolkitInstalled(),
            'message'           => $available
                ? __('Adapter installed and activated. The MCP endpoint is ready.', 'fluentform')
                : __('Adapter installed. Please reload this page to finish connecting the MCP endpoint.', 'fluentform'),
        ]);
    }

    /**
     * Connection snippets for every supported client. Credentials are never sent:
     * each snippet carries placeholders the browser fills in, so an application
     * password never round-trips through the server.
     */
    public function getConfigSnippets()
    {
        $endpoint = MCPInit::getEndpointUrl();

        $localDevParam = $this->request->get('local_dev');
        $isLocalDev    = ($localDevParam === null || $localDevParam === '')
            ? $this->isLocalDev()
            : in_array(strtolower((string) $localDevParam), ['yes', 'true', '1', 'on'], true);

        $clients  = ['claude-code', 'claude-desktop', 'cursor', 'codex', 'generic'];
        $snippets = [];
        foreach ($clients as $client) {
            $snippets[$client] = $this->buildSnippet($client, $endpoint, $isLocalDev);
        }

        return $this->sendSuccess([
            'snippets'          => $snippets,
            'endpoint'          => $endpoint,
            'app_passwords_url' => admin_url('profile.php#application-passwords-section'),
            'is_local_dev'      => $isLocalDev,
        ]);
    }

    private function isToolkitInstalled()
    {
        if (defined('FLUENT_TOOLKIT_VERSION')) {
            return true;
        }

        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = get_plugins();

        return isset($plugins[self::TOOLKIT_PLUGIN_FILE]);
    }

    private function buildSnippet($client, $endpoint, $isLocalDev)
    {
        $basic = '<base64(your-username:application-password)>';
        $user  = '<your-username>';
        $pass  = '<your-application-password>';

        switch ($client) {
            case 'claude-desktop':
                $env = [
                    'WP_API_URL'      => $endpoint,
                    'WP_API_USERNAME' => $user,
                    'WP_API_PASSWORD' => $pass,
                    'OAUTH_ENABLED'   => 'false',
                ];
                if ($isLocalDev) {
                    $env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
                }
                $snippet = wp_json_encode([
                    'mcpServers' => [
                        'fluentform' => [
                            'command' => 'npx',
                            'args'    => ['-y', '@automattic/mcp-wordpress-remote@latest'],
                            'env'     => $env,
                        ],
                    ],
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                $instructions = __('Add this to your Claude Desktop config (Settings → Developer → Edit Config), fill in your username + application password, then restart Claude Desktop.', 'fluentform');
                break;

            case 'cursor':
                $snippet = wp_json_encode([
                    'mcpServers' => [
                        'fluentform' => [
                            'url'     => $endpoint,
                            'type'    => 'http',
                            'headers' => ['Authorization' => 'Basic ' . $basic],
                        ],
                    ],
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                $instructions = __('Add to Cursor’s mcp.json, replacing the placeholder with base64 of "username:application-password".', 'fluentform');
                break;

            case 'codex':
                $snippet = "Settings → Connect to a custom MCP\n\n"
                    . "Name:       fluentform\n"
                    . "Transport:  Streamable HTTP\n"
                    . "URL:        {$endpoint}\n\n"
                    . "Header:\n  Key:    Authorization\n  Value:  Basic {$basic}";
                $instructions = __('In Codex, add a custom MCP server with Streamable HTTP transport and the Authorization header above.', 'fluentform');
                break;

            case 'generic':
                $snippet = "URL:   {$endpoint}\n"
                    . "Auth:  Authorization: Basic {$basic}\n\n"
                    . "# Quick test (curl base64-encodes for you):\n"
                    . "curl -s -u '{$user}:{$pass}' \\\n"
                    . "  -X POST {$endpoint} \\\n"
                    . "  -H 'Content-Type: application/json' \\\n"
                    . "  -H 'Accept: application/json, text/event-stream' \\\n"
                    . '  -d \'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"c","version":"1.0"}}}\'';
                $instructions = __('Any MCP client that speaks Streamable HTTP can connect using this URL and a Basic auth header.', 'fluentform');
                break;

            case 'claude-code':
            default:
                $client  = 'claude-code';
                $snippet = "claude mcp add \\\n"
                    . "  --transport http \\\n"
                    . "  fluentform {$endpoint} \\\n"
                    . "  --header \"Authorization: Basic {$basic}\"";
                $instructions = __('Run this in your terminal where Claude Code is installed, with base64 of "username:application-password".', 'fluentform');
                break;
        }

        return [
            'client'       => $client,
            'snippet'      => $snippet,
            'instructions' => $instructions,
        ];
    }

    private function isLocalDev()
    {
        $host = '';
        $home = home_url();
        if ($home) {
            $parsed = wp_parse_url($home, PHP_URL_HOST);
            $host   = $parsed ? strtolower($parsed) : '';
        }

        $isLocal = false;
        if ($host) {
            foreach (['.test', '.local', '.localhost', '.lab'] as $tld) {
                if (substr($host, -strlen($tld)) === $tld) {
                    $isLocal = true;
                    break;
                }
            }
            if (!$isLocal && in_array($host, ['localhost', '127.0.0.1', '::1'], true)) {
                $isLocal = true;
            }
        }

        return (bool) apply_filters('fluentform/mcp_is_local_dev', $isLocal, $host);
    }
}
