<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') || exit;

use FluentForm\App\Models\Form;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\Acl\Acl;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\PermissionGate;

/**
 * Discovery tool — the agent's entry point into a FluentForm site.
 *
 * `get-forms-context` is the documented "call this first" tool. One call tells
 * the agent who it is, what it's allowed to do, the entry/form status enums, a
 * compact list of the forms it may access, and headline counts — so it never
 * guesses a status string or a form id. It's cached (60s) per user and
 * invalidated when forms change, because it's called every session.
 */
class ContextTools
{
    const CACHE_TTL = 60;

    const CACHE_PREFIX = 'fluentform_mcp_context_';

    const CACHE_VERSION_OPTION = '_fluentform_mcp_context_ver';

    // Verified FluentForm domain enums. Hardcoded (filterable) so the agent gets
    // the complete valid set even when a status currently has zero rows.
    const ENUMS = [
        // Submission.status column values. `favorites` is NOT a status — it is the
        // is_favourite flag — so it is excluded from the writable status enum.
        'submission_statuses' => ['unread', 'read', 'spam', 'trashed'],
        'form_statuses'       => ['published', 'unpublished'],
        'note_statuses'       => ['', 'read', 'unread'],
    ];

    public static function definitions()
    {
        return [
            'fluentform/get-forms-context' => [
                'label'       => __('Get Forms Context', 'fluentform'),
                'group'       => __('Discovery', 'fluentform'),
                'description' => __('START HERE — call once per session. Returns who you are and your permissions, the site info, every valid enum value (submission/form statuses), headline counts, a compact list of forms you can access (id, title, status, entries), and usage guidelines. Use this before any other tool so you never guess a status string or a form id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => new \stdClass(),
                ],
                'execute_callback'    => [self::class, 'getContext'],
                'permission_callback' => function () {
                    return PermissionGate::canAny(PermissionGate::readRoleCaps());
                },
                'annotations' => ['readonly' => true],
            ],
        ];
    }

    public static function getContext($params = [])
    {
        $userId   = get_current_user_id();
        $cacheKey = self::cacheKey($userId);

        $cached = get_transient($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        $context = self::buildContext($userId);
        set_transient($cacheKey, $context, self::CACHE_TTL);

        return $context;
    }

    private static function cacheKey($userId)
    {
        return self::CACHE_PREFIX . self::cacheVersion() . '_' . $userId;
    }

    private static function cacheVersion()
    {
        return (int) get_option(self::CACHE_VERSION_OPTION, 0);
    }

    private static function buildContext($userId)
    {
        $user    = get_user_by('ID', $userId);
        $isAdmin = $user && user_can($user, 'manage_options');

        $you = [
            'wp_user_id'  => (int) $userId,
            'name'        => $user ? $user->display_name : null,
            'email'       => $user ? $user->user_email : null,
            'is_admin'    => (bool) $isAdmin,
            'permissions' => self::grantedPermissions(),
        ];

        $site = [
            'name'       => get_bloginfo('name'),
            'url'        => site_url(),
            'version'    => defined('FLUENTFORM_VERSION') ? FLUENTFORM_VERSION : null,
            'pro_active' => defined('FLUENTFORMPRO_VERSION') || defined('FLUENTFORMPRO'),
            'timezone'   => wp_timezone_string(),
        ];

        $canForms = PermissionGate::can('fluentform_forms_manager') || PermissionGate::can('fluentform_dashboard_access');

        return MCPHelper::envelope(
            self::summary(),
            [
                'you'        => $you,
                'site'       => $site,
                'stats'      => self::buildStats(),
                'forms'      => $canForms ? self::accessibleForms() : [],
                'enums'      => apply_filters('fluentform/mcp_enums', self::ENUMS),
                'guidelines' => self::guidelines(),
            ]
        );
    }

    private static function grantedPermissions()
    {
        $granted = [];
        foreach (Acl::getPermissionSet() as $permission) {
            if (Acl::hasPermission($permission)) {
                $granted[] = $permission;
            }
        }

        return array_values($granted);
    }

    /**
     * Compact list of forms the user can access. A "specific forms" manager only
     * sees their assigned forms; an unrestricted user sees all. Capped so a site
     * with thousands of forms can't blow the context window — list-forms paginates.
     */
    private static function accessibleForms()
    {
        $query = Form::query()->select(['id', 'title', 'status', 'type'])->orderBy('id', 'DESC');
        FormAccess::applyScope($query, 'id');

        $forms = $query->limit(50)->get();

        $out = [];
        foreach ($forms as $form) {
            $out[] = [
                'id'     => (int) $form->id,
                'title'  => $form->title,
                'status' => $form->status,
                'type'   => $form->type,
            ];
        }

        return $out;
    }

    private static function buildStats()
    {
        return [
            'forms_total'          => self::safeCount(function () {
                return FormAccess::applyScope(Form::query(), 'id')->count();
            }),
            'submissions_total'    => self::safeCount(function () {
                return FormAccess::applyScope(Submission::query(), 'form_id')
                    ->where('status', '!=', 'trashed')->count();
            }),
            'submissions_last_30d' => self::safeCount(function () {
                $since = gmdate('Y-m-d H:i:s', strtotime('-30 days', current_time('timestamp')));
                return FormAccess::applyScope(Submission::query(), 'form_id')
                    ->where('status', '!=', 'trashed')
                    ->where('created_at', '>=', $since)
                    ->count();
            }),
        ];
    }

    private static function safeCount(callable $fn)
    {
        try {
            $val = $fn();
            return null === $val ? null : (int) $val;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private static function summary()
    {
        return __('FluentForm context loaded. Use list-submissions and get-submission for entries, get-form-stats for per-form numbers.', 'fluentform');
    }

    private static function guidelines()
    {
        $default = 'Call get-forms-context once per session, then list-forms / get-form to inspect a form and list-submissions / get-submission to read entries. '
            . 'list-submissions and get-form-stats require a form_id from this payload. '
            . 'Dates are ISO-8601 with the site offset. '
            . 'Use the exact enum values from this payload — never invent a status. '
            . 'Writes (update-submission-status, add-submission-note) require the manage-entries permission and act on one entry at a time.';

        return apply_filters('fluentform/mcp_guidelines', $default);
    }

    /**
     * Clear the cached context for all users by bumping the version baked into
     * the cache key. A direct options-table DELETE would silently no-op on
     * sites with a persistent object cache (transients never hit wp_options
     * there); the key bump works everywhere, and orphaned entries age out via
     * the 60s TTL.
     */
    public static function invalidateCache()
    {
        update_option(self::CACHE_VERSION_OPTION, self::cacheVersion() + 1, false);
    }
}
