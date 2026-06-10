<?php

namespace FluentForm\App\Modules\MCP\Support;

defined('ABSPATH') || exit;

/**
 * Shared formatting + validation utilities for the FluentForm MCP module.
 *
 * Every tool funnels its output through here so responses are uniform,
 * token-lean, and safe for an AI agent to reason over:
 *
 *   1. Dates leave the boundary as ISO-8601 strings carrying the site offset —
 *      never the raw DB datetime (FluentForm stores submission timestamps in
 *      site-local time, so a naive value would be timezone-ambiguous).
 *   2. Every success returns the same envelope: a one-line `summary` the agent
 *      can quote, the `data`, and `meta` (schema_version, paging, warnings).
 *   3. Errors return WP_Error whose message is a JSON envelope, so the agent can
 *      branch on a stable `code` and read `fields`/`hint` (the adapter forwards
 *      only the WP_Error message, dropping error_data).
 */
class MCPHelper
{
    const SCHEMA_VERSION = '1.0';

    const MAX_PER_PAGE = 100;

    const HARD_MAX_PER_PAGE = 200;

    const PREVIEW_CHARS = 150;

    public static function envelope($summary, $data, array $meta = [])
    {
        $base = [
            'schema_version' => self::SCHEMA_VERSION,
            'generated_at'   => gmdate('c'),
            'timezone'       => wp_timezone_string(),
        ];

        return [
            'summary' => $summary,
            'data'    => $data,
            'meta'    => array_merge($base, $meta),
        ];
    }

    public static function error($code, $message, array $details = [])
    {
        $error = array_merge([
            'code'      => $code,
            'message'   => $message,
            'retryable' => false,
        ], $details);

        $json = wp_json_encode(['error' => $error]);

        return new \WP_Error($code, false !== $json ? $json : $message, $details);
    }

    /**
     * Normalize a stored datetime to an ISO-8601 string. FluentForm writes
     * submission/form timestamps in site-local time, so a bare string is parsed
     * against the site timezone and emitted with its offset. GMT/ISO inputs and
     * DateTime objects are passed through. Empty/zero-dates return null.
     */
    public static function toIso8601($value)
    {
        if (!$value) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('c');
        }

        if (is_object($value) && isset($value->date)) {
            $tz = isset($value->timezone) ? $value->timezone : wp_timezone_string();
            try {
                return (new \DateTime($value->date, new \DateTimeZone($tz)))->format('c');
            } catch (\Exception $e) {
                return null;
            }
        }

        if (is_string($value)) {
            if (strpos($value, '0000-00-00') === 0) {
                return null;
            }
            try {
                $dt = new \DateTime($value, wp_timezone());
                if ((int) $dt->format('Y') < 1) {
                    return null;
                }
                return $dt->format('c');
            } catch (\Exception $e) {
                return null;
            }
        }

        return null;
    }

    public static function htmlToText($html)
    {
        if (!$html) {
            return '';
        }

        $text = wp_strip_all_tags((string) $html);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);

        return trim($text);
    }

    public static function preview($html, $chars = self::PREVIEW_CHARS)
    {
        $text = self::htmlToText($html);
        if (mb_strlen($text) > $chars) {
            return mb_substr($text, 0, $chars) . '…';
        }

        return $text;
    }

    /**
     * Clamp page/per_page from agent input. Defaults small and caps so a careless
     * `per_page: 5000` can never flood the context window. $maxPerPage lets a
     * compact-row tool raise its own ceiling, itself clamped to HARD_MAX_PER_PAGE.
     *
     * @return array{page:int, per_page:int}
     */
    public static function pagination($params, $defaultPerPage = 15, $maxPerPage = self::MAX_PER_PAGE)
    {
        $page    = isset($params['page']) ? (int) $params['page'] : 1;
        $perPage = isset($params['per_page']) ? (int) $params['per_page'] : $defaultPerPage;

        $max = ($maxPerPage > self::HARD_MAX_PER_PAGE) ? self::HARD_MAX_PER_PAGE : (int) $maxPerPage;

        if ($page < 1) {
            $page = 1;
        }
        if ($perPage < 1) {
            $perPage = $defaultPerPage;
        }
        if ($perPage > $max) {
            $perPage = $max;
        }

        return ['page' => $page, 'per_page' => $perPage];
    }

    public static function pagingMeta($paginator)
    {
        if (is_object($paginator) && method_exists($paginator, 'total')) {
            $current = method_exists($paginator, 'currentPage') ? (int) $paginator->currentPage() : 1;
            $perPage = method_exists($paginator, 'perPage') ? (int) $paginator->perPage() : 0;
            $total   = (int) $paginator->total();
            $last    = method_exists($paginator, 'lastPage') ? (int) $paginator->lastPage() : 1;
        } else {
            $arr     = is_array($paginator) ? $paginator : (array) $paginator;
            $current = isset($arr['current_page']) ? (int) $arr['current_page'] : 1;
            $perPage = isset($arr['per_page']) ? (int) $arr['per_page'] : 0;
            $total   = isset($arr['total']) ? (int) $arr['total'] : 0;
            $last    = isset($arr['last_page']) ? (int) $arr['last_page'] : 1;
        }

        return [
            'page' => [
                'current'  => $current,
                'per_page' => $perPage,
                'total'    => $total,
                'pages'    => $last,
                'has_more' => $current < $last,
            ],
        ];
    }

    public static function paginatorTotal($paginator)
    {
        if (is_object($paginator) && method_exists($paginator, 'total')) {
            return (int) $paginator->total();
        }
        $arr = is_array($paginator) ? $paginator : (array) $paginator;
        return isset($arr['total']) ? (int) $arr['total'] : 0;
    }

    public static function paginatorItems($paginator)
    {
        if (is_object($paginator) && method_exists($paginator, 'items')) {
            return $paginator->items();
        }

        $arr = is_array($paginator) ? $paginator : (array) $paginator;

        return isset($arr['data']) ? $arr['data'] : [];
    }
}
