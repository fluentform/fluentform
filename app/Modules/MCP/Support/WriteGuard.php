<?php

namespace FluentForm\App\Modules\MCP\Support;

defined('ABSPATH') or die;

/**
 * Safety rails for mutating MCP tools. Annotations are UX hints, not safety —
 * this is where real protection lives for destructive writes (entry deletion,
 * bulk trashing). The initial tool set ships only reversible writes (entry
 * status, notes) which rely on their permission_callback alone, so this guard is
 * unused today; it is the reference for any `destructive => true` ability added
 * later (here or in Pro via fluentform/mcp_loaded).
 *
 * Two mechanisms:
 *  1. Dry-run + confirmation token bound to the entity's CURRENT state, so an
 *     agent can never act on stale data (the fingerprint must still match at
 *     execute time, else a fresh preview is forced).
 *  2. Idempotency keys, so a retried mutation returns the cached result instead
 *     of running twice.
 *
 * CONTRACT: every ability marked destructive MUST route its mutation through
 * confirm() before mutating and expose `dry_run` + `confirm_token` in its schema.
 */
class WriteGuard
{
    const CONFIRM_TTL = 300;

    const IDEM_TTL = 86400;

    public static function preview($tool, $entityKey, $fingerprint, array $preview)
    {
        $token = substr(wp_hash($tool . '|' . $entityKey . '|' . $fingerprint . '|' . wp_generate_uuid4()), 0, 32);

        set_transient(self::confirmKey($tool, $entityKey), [
            'token'       => $token,
            'fingerprint' => $fingerprint,
        ], self::CONFIRM_TTL);

        return [
            'dry_run'            => true,
            'preview'            => $preview,
            'confirm_token'      => $token,
            'expires_in_seconds' => self::CONFIRM_TTL,
            'next_step'          => 'Call this tool again with the same parameters plus confirm_token (and an idempotency_key) to execute.',
        ];
    }

    /**
     * Validate a confirm_token against the entity's current fingerprint.
     *
     * @return true|\WP_Error
     */
    public static function confirm($tool, $entityKey, $currentFingerprint, $token)
    {
        if (empty($token)) {
            return MCPHelper::error(
                'confirmation_required',
                __('This action changes data. Call again with dry_run:true to preview, then pass the returned confirm_token to execute.', 'fluentform'),
                ['next_step' => 'set dry_run:true']
            );
        }

        $stored = get_transient(self::confirmKey($tool, $entityKey));

        if (!is_array($stored) || empty($stored['token'])) {
            return MCPHelper::error(
                'confirmation_expired',
                __('Your confirmation has expired. Run a fresh dry_run to preview and get a new confirm_token.', 'fluentform'),
                ['next_step' => 'set dry_run:true']
            );
        }

        if (!hash_equals((string) $stored['token'], (string) $token)) {
            return MCPHelper::error(
                'confirmation_invalid',
                __('The confirm_token does not match. Run a fresh dry_run.', 'fluentform'),
                ['next_step' => 'set dry_run:true']
            );
        }

        if ((string) $stored['fingerprint'] !== (string) $currentFingerprint) {
            delete_transient(self::confirmKey($tool, $entityKey));
            return MCPHelper::error(
                'state_changed',
                __('The record changed since you previewed it. Run a fresh dry_run to see the current state before executing.', 'fluentform'),
                ['next_step' => 'set dry_run:true']
            );
        }

        delete_transient(self::confirmKey($tool, $entityKey));

        return true;
    }

    public static function idempotent($tool, $entityKey, $key, callable $fn)
    {
        if (empty($key)) {
            return $fn();
        }

        $cacheKey = self::idemKey($tool, $entityKey, $key);
        $cached   = get_transient($cacheKey);
        if ($cached !== false) {
            return is_array($cached) ? array_merge($cached, ['idempotent_replay' => true]) : $cached;
        }

        $result = $fn();

        if (!is_wp_error($result)) {
            set_transient($cacheKey, $result, self::IDEM_TTL);
        }

        return $result;
    }

    private static function confirmKey($tool, $entityKey)
    {
        return 'ff_mcp_confirm_' . get_current_user_id() . '_' . md5($tool . '|' . $entityKey);
    }

    private static function idemKey($tool, $entityKey, $key)
    {
        return 'ff_mcp_idem_' . get_current_user_id() . '_' . md5($tool . '|' . $entityKey . '|' . $key);
    }
}
