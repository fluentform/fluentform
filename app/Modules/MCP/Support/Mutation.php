<?php

namespace FluentForm\App\Modules\MCP\Support;

defined('ABSPATH') || exit;

/**
 * The single write path for MCP tools. Every mutation an agent performs goes
 * through here so two cross-cutting concerns live in one place:
 *
 *   - Accountability: one audit record per write, into FluentForm's own
 *     fluentform_logs (component "MCP"), so it shows up in Tools → Logs next to
 *     every other form event — who (wp user), what tool, redacted params,
 *     success/failure — without a separate log file to find.
 *   - Safety for destructive writes: runGuarded() routes through WriteGuard's
 *     dry-run → confirm_token → idempotency flow before mutating.
 *
 * Reversible writes (status change, note, create) use run(): execute, then
 * audit. Destructive writes (permanent delete, bulk) use runGuarded().
 */
class Mutation
{
    const AUDIT_COMPONENT = 'MCP';

    /**
     * Run a reversible mutation and audit the outcome.
     *
     * @param string         $tool   Ability name.
     * @param array          $params Raw tool params (redacted before logging).
     * @param callable       $apply  Performs the mutation; returns an envelope array or WP_Error.
     * @param array|callable $target ['form_id'=>, 'entry_id'=>] for log linkage, or a
     *                               callable($result) that derives it (e.g. create-form,
     *                               whose form id only exists after $apply runs).
     * @return array|\WP_Error
     */
    public static function run($tool, array $params, callable $apply, $target = [])
    {
        $result = $apply();
        self::audit($tool, self::resolveTarget($target, $result), $params, $result);

        return $result;
    }

    /**
     * Run a destructive mutation behind WriteGuard. The tool must expose dry_run
     * and confirm_token in its schema. First call with dry_run:true returns a
     * preview + confirm_token bound to $fingerprint; the second call (same params
     * + confirm_token) executes once and audits.
     *
     * @param string   $tool        Ability name.
     * @param array    $params      Raw tool params (dry_run, confirm_token, idempotency_key).
     * @param string   $entityKey   Stable id of the target, e.g. "submission:42".
     * @param string   $fingerprint State string that must still match at execute time.
     * @param callable $preview     Returns the preview payload (array).
     * @param callable $apply       Performs the mutation; returns an envelope array or WP_Error.
     * @param array|callable $target Audit linkage (see run()).
     * @return array|\WP_Error
     */
    public static function runGuarded($tool, array $params, $entityKey, $fingerprint, callable $preview, callable $apply, $target = [])
    {
        if (!empty($params['dry_run'])) {
            return WriteGuard::preview($tool, $entityKey, $fingerprint, $preview());
        }

        $idemKey = isset($params['idempotency_key']) ? $params['idempotency_key'] : '';

        // Replay before confirm: tokens are single-use, so a lost-response retry
        // arrives with a consumed token and would otherwise die as "expired".
        $replay = WriteGuard::replay($tool, $entityKey, $idemKey);
        if (null !== $replay) {
            return $replay;
        }

        $token   = isset($params['confirm_token']) ? $params['confirm_token'] : '';
        $confirm = WriteGuard::confirm($tool, $entityKey, $fingerprint, $token);
        if (is_wp_error($confirm)) {
            return $confirm;
        }

        $result = WriteGuard::idempotent($tool, $entityKey, $idemKey, $apply);

        self::audit($tool, self::resolveTarget($target, $result), $params, $result);

        return $result;
    }

    private static function resolveTarget($target, $result)
    {
        if (is_callable($target)) {
            $target = $target($result);
        }

        return is_array($target) ? $target : [];
    }

    /**
     * Write one audit row via FluentForm's log pipeline. Best-effort: a logging
     * failure must never break the tool call, so it's swallowed.
     */
    private static function audit($tool, array $target, array $params, $result)
    {
        $isError = is_wp_error($result);

        $payload = [
            'actor'   => 'mcp',
            'user_id' => get_current_user_id(),
            'tool'    => $tool,
            'params'  => self::redact($params),
            'result'  => $isError ? 'error' : 'success',
        ];
        if ($isError) {
            $code                  = $result->get_error_code();
            $payload['error_code'] = $code ? $code : 'error';
        }

        try {
            do_action('fluentform/log_data', [
                'title'            => $tool,
                'status'           => $isError ? 'failed' : 'success',
                'description'      => wp_json_encode($payload),
                'parent_source_id' => isset($target['form_id']) ? (int) $target['form_id'] : null,
                'source_id'        => isset($target['entry_id']) ? (int) $target['entry_id'] : null,
                'source_type'      => 'mcp',
                'component'        => self::AUDIT_COMPONENT,
            ]);
        } catch (\Throwable $e) {
            // Never let auditing failure surface to the agent.
            return;
        }
    }

    /**
     * Recursively mask values whose key looks like a credential, so a token an
     * agent passes (or a tool echoes) never lands in the audit log in clear.
     */
    public static function redact($data, $depth = 0)
    {
        if ($depth > 6 || !is_array($data)) {
            return $data;
        }

        $sensitive = '/(pass(word)?|secret|token|api[_-]?key|authorization|bearer|nonce)/i';

        $out = [];
        foreach ($data as $key => $value) {
            if (is_string($key) && preg_match($sensitive, $key)) {
                $out[$key] = '[redacted]';
                continue;
            }
            $out[$key] = is_array($value) ? self::redact($value, $depth + 1) : $value;
        }

        return $out;
    }
}
