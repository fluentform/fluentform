<?php

namespace FluentForm\App\Modules\MCP;

defined('ABSPATH') || exit;

use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\PermissionGate;
use FluentForm\App\Modules\MCP\Tools\ContextTools;
use FluentForm\App\Modules\MCP\Tools\FormTools;
use FluentForm\App\Modules\MCP\Tools\SubmissionTools;
use FluentForm\App\Modules\MCP\Tools\ReportTools;
use FluentForm\App\Modules\MCP\Tools\IntegrationTools;

/**
 * Single source of truth for every FluentForm MCP ability.
 *
 * Each tool class owns its own definitions() slice (schema next to code); this
 * class merges them, wraps every execute_callback so unhandled exceptions become
 * structured WP_Errors the agent can read (instead of the adapter's generic
 * "Tool execution failed"), and registers each as a WP ability.
 *
 * Pro tools are NOT listed here — they push abilities via the
 * fluentform/mcp_loaded action + fluentform/mcp_ability_names filter.
 */
class AbilitiesRegistrar
{
    private static function toolClasses()
    {
        return [
            ContextTools::class,
            FormTools::class,
            SubmissionTools::class,
            ReportTools::class,
            IntegrationTools::class,
        ];
    }

    /**
     * Tool classes that register only when the advanced-tools opt-in is on.
     * Their whole catalogue slice is withheld until an admin enables the group.
     */
    private static function advancedToolClasses()
    {
        return [
            \FluentForm\App\Modules\MCP\Tools\StylingTools::class,
            \FluentForm\App\Modules\MCP\Tools\ConditionTools::class,
        ];
    }

    public static function getDefinitions()
    {
        $defs = [];

        foreach (self::toolClasses() as $class) {
            if (class_exists($class) && method_exists($class, 'definitions')) {
                $defs = array_merge($defs, (array) $class::definitions());
            }
        }

        $advancedOn = PermissionGate::isNewToolsEnabled();

        if ($advancedOn) {
            foreach (self::advancedToolClasses() as $class) {
                if (class_exists($class) && method_exists($class, 'definitions')) {
                    $defs = array_merge($defs, (array) $class::definitions());
                }
            }
        } else {
            // Withhold advanced definitions declared inline on always-on classes
            // (e.g. the bulk tool inside SubmissionTools).
            foreach ($defs as $name => $def) {
                if (!empty($def['advanced'])) {
                    unset($defs[$name]);
                }
            }
        }

        return $defs;
    }

    /**
     * The agent-facing catalogue: each ability's display metadata, projected
     * from its own definition (group declared inline; read/write derived from
     * the readonly annotation). The single source the settings card reads, so
     * the UI can never drift from what the server actually exposes.
     */
    public static function catalogue()
    {
        $out = [];
        foreach (self::getDefinitions() as $name => $def) {
            $out[] = [
                'name'        => $name,
                'label'       => isset($def['label']) ? $def['label'] : $name,
                'description' => isset($def['description']) ? $def['description'] : '',
                'group'       => isset($def['group']) ? $def['group'] : __('General', 'fluentform'),
                'write'       => empty($def['annotations']['readonly']),
            ];
        }

        return $out;
    }

    public static function register()
    {
        foreach (self::getDefinitions() as $name => $definition) {
            $args = [
                'label'               => $definition['label'],
                'description'         => $definition['description'],
                'category'            => 'fluentform',
                'execute_callback'    => self::wrapExecuteCallback($name, $definition['execute_callback']),
                'permission_callback' => $definition['permission_callback'],
                'meta'                => [
                    'show_in_rest' => true,
                    'mcp'          => ['public' => true],
                ],
            ];

            if (!empty($definition['input_schema'])) {
                $args['input_schema'] = $definition['input_schema'];
            }

            if (!empty($definition['output_schema'])) {
                $args['output_schema'] = $definition['output_schema'];
            }

            if (!empty($definition['annotations'])) {
                $args['meta']['annotations'] = $definition['annotations'];
            }

            wp_register_ability($name, $args);
        }
    }

    /**
     * Convert any unhandled \Throwable from a tool into a structured WP_Error
     * carrying the real message (and, under WP_DEBUG, the file + a short trace).
     * Without this the agent only sees the adapter's generic failure surface and
     * retries blindly against tools that may have partially succeeded.
     */
    private static function wrapExecuteCallback($toolName, $callback)
    {
        return function ($params) use ($toolName, $callback) {
            try {
                return call_user_func($callback, $params);
            } catch (\Throwable $e) {
                /**
                 * Fires when an MCP tool throws. Lets sites log/alert before the
                 * structured error reaches the agent.
                 *
                 * @since 6.2.5
                 *
                 * @param array $context { exception: \Throwable, tool: string, params: mixed }
                 */
                do_action('fluentform/mcp_tool_exception', [
                    'exception' => $e,
                    'tool'      => $toolName,
                    'params'    => $params,
                ]);

                $details = ['tool' => $toolName, 'exception' => get_class($e), 'retryable' => true];

                // File/line/trace help an operator but this payload reaches the
                // remote agent — raw paths would leak the server layout. Off by
                // default, opt-in, and reduced to a basename when on.
                $exposeDetails = apply_filters('fluentform/mcp_expose_error_details', false);
                if ($exposeDetails) {
                    $details['file']  = basename($e->getFile()) . ':' . $e->getLine();
                    $details['trace'] = array_slice(explode("\n", $e->getTraceAsString()), 0, 5);
                }

                return MCPHelper::error(ErrorCodes::TOOL_FAILED, $e->getMessage(), $details);
            }
        };
    }
}
