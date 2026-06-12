<?php
/**
 * Minimal WordPress shim for the FluentForm MCP unit tests.
 *
 * The MCP support layer (MCPHelper, PermissionGate) and the tool definitions are
 * pure logic that only leans on a small set of WP functions. Rather than boot a
 * full WordPress install, we stub exactly those functions here so the suite runs
 * anywhere with just `php`. Nothing in this file is loaded in production.
 */

defined('ABSPATH') or define('ABSPATH', __DIR__ . '/');

if (!class_exists('WP_Error')) {
    class WP_Error
    {
        public $code;
        public $message;
        public $data;

        public function __construct($code = '', $message = '', $data = '')
        {
            $this->code    = $code;
            $this->message = $message;
            $this->data    = $data;
        }

        public function get_error_message()
        {
            return $this->message;
        }

        public function get_error_code()
        {
            return $this->code;
        }
    }
}

if (!function_exists('is_wp_error')) {
    function is_wp_error($thing)
    {
        return $thing instanceof WP_Error;
    }
}

if (!function_exists('__')) {
    function __($text, $domain = 'default')
    {
        return $text;
    }
}

if (!function_exists('_n')) {
    function _n($single, $plural, $number, $domain = 'default')
    {
        return 1 === (int) $number ? $single : $plural;
    }
}

if (!function_exists('esc_html__')) {
    function esc_html__($text, $domain = 'default')
    {
        return $text;
    }
}

if (!function_exists('wp_json_encode')) {
    function wp_json_encode($data, $options = 0, $depth = 512)
    {
        return json_encode($data, $options, $depth);
    }
}

if (!function_exists('wp_timezone_string')) {
    function wp_timezone_string()
    {
        return 'UTC';
    }
}

if (!function_exists('wp_timezone')) {
    function wp_timezone()
    {
        return new DateTimeZone('UTC');
    }
}

if (!function_exists('sanitize_text_field')) {
    function sanitize_text_field($str)
    {
        return trim(preg_replace('/[\r\n\t ]+/', ' ', strip_tags((string) $str)));
    }
}

if (!function_exists('current_time')) {
    function current_time($type)
    {
        return time();
    }
}

if (!function_exists('wp_strip_all_tags')) {
    function wp_strip_all_tags($string, $remove_breaks = false)
    {
        $string = preg_replace('@<(script|style)[^>]*?>.*?</\\1>@si', '', (string) $string);
        $string = strip_tags($string);
        return trim($string);
    }
}

$GLOBALS['__mcp_test_filters'] = [];

if (!function_exists('add_filter')) {
    function add_filter($hook, $cb, $priority = 10, $args = 1)
    {
        $GLOBALS['__mcp_test_filters'][$hook][] = $cb;
        return true;
    }
}

if (!function_exists('apply_filters')) {
    function apply_filters($hook, $value = null)
    {
        $extra = array_slice(func_get_args(), 2);
        if (!empty($GLOBALS['__mcp_test_filters'][$hook])) {
            foreach ($GLOBALS['__mcp_test_filters'][$hook] as $cb) {
                $value = call_user_func_array($cb, array_merge([$value], $extra));
            }
        }
        return $value;
    }
}

if (!function_exists('do_action')) {
    function do_action($hook, ...$args)
    {
        // no-op
    }
}

/**
 * In-memory option store so PermissionGate::isEnabled/setEnabled can be tested.
 */
$GLOBALS['__mcp_test_options'] = [];

if (!function_exists('get_option')) {
    function get_option($name, $default = false)
    {
        return array_key_exists($name, $GLOBALS['__mcp_test_options'])
            ? $GLOBALS['__mcp_test_options'][$name]
            : $default;
    }
}

if (!function_exists('update_option')) {
    function update_option($name, $value, $autoload = null)
    {
        $GLOBALS['__mcp_test_options'][$name] = $value;
        return true;
    }
}

/**
 * Toggleable current_user_can for permission tests.
 */
$GLOBALS['__mcp_test_can'] = true;

if (!function_exists('current_user_can')) {
    function current_user_can($capability, ...$args)
    {
        return (bool) $GLOBALS['__mcp_test_can'];
    }
}

$GLOBALS['__mcp_test_transients'] = [];

if (!function_exists('set_transient')) {
    function set_transient($key, $value, $ttl = 0)
    {
        $GLOBALS['__mcp_test_transients'][$key] = $value;
        return true;
    }
}

if (!function_exists('get_transient')) {
    function get_transient($key)
    {
        return array_key_exists($key, $GLOBALS['__mcp_test_transients'])
            ? $GLOBALS['__mcp_test_transients'][$key]
            : false;
    }
}

if (!function_exists('delete_transient')) {
    function delete_transient($key)
    {
        unset($GLOBALS['__mcp_test_transients'][$key]);
        return true;
    }
}

if (!function_exists('wp_hash')) {
    function wp_hash($data, $scheme = 'auth')
    {
        return md5('ff-test|' . $data);
    }
}

if (!function_exists('wp_generate_uuid4')) {
    function wp_generate_uuid4()
    {
        static $n = 0;
        $n++;
        return sprintf('uuid-%08d', $n);
    }
}

if (!function_exists('get_current_user_id')) {
    function get_current_user_id()
    {
        return 1;
    }
}

// Arr (used by the tool classes) needs MacroableTrait at parse time and
// Helper::value at call time; Collection is never reached by Arr::get.
require_once dirname(__DIR__, 2) . '/vendor/wpfluent/framework/src/WPFluent/Support/MacroableTrait.php';
require_once dirname(__DIR__, 2) . '/vendor/wpfluent/framework/src/WPFluent/Support/Helper.php';
require_once dirname(__DIR__, 2) . '/vendor/wpfluent/framework/src/WPFluent/Support/Arr.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Support/ErrorCodes.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Support/MCPHelper.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Support/PermissionGate.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Support/FormAccess.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Support/WriteGuard.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Support/Mutation.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/ContextTools.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/FormTools.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/SubmissionTools.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/ReportTools.php';
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/IntegrationTools.php';
if (file_exists(dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/StylingTools.php')) {
    require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/StylingTools.php';
}
if (file_exists(dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/ConditionTools.php')) {
    require_once dirname(__DIR__, 2) . '/app/Modules/MCP/Tools/ConditionTools.php';
}
require_once dirname(__DIR__, 2) . '/app/Modules/MCP/AbilitiesRegistrar.php';
