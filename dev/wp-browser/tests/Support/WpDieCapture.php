<?php

namespace Tests\Support;

/**
 * Captures `wp_send_json()` / `wp_die()` output so tests can assert the JSON
 * body and HTTP status a controller would have sent before terminating.
 *
 * WPTestCase swaps `wp_die` for a handler that throws `WPDieException` with the
 * HTTP status in the exception code. `wp_send_json()` echoes the JSON body
 * before calling `wp_die`, so the body is still in the output buffer when the
 * exception is thrown.
 */
class WpDieCapture
{
    /**
     * @return array{status:int, body:string, json:?array, died:bool}
     */
    public static function capture(callable $fn): array
    {
        $forceAjax = function () { return true; };
        $capturedStatus = 0;
        $statusCapture = function ($status_header, $code) use (&$capturedStatus) {
            $capturedStatus = (int) $code;
            return $status_header;
        };
        $ajaxHandler = function () {
            return function ($message, $title = '', $args = []) {
                $code = 0;
                if (is_array($args) && isset($args['response'])) {
                    $code = (int) $args['response'];
                }
                throw new \WPDieException(is_string($message) ? $message : '', $code);
            };
        };
        add_filter('wp_doing_ajax', $forceAjax, 10000);
        add_filter('wp_die_ajax_handler', $ajaxHandler, 10000);
        add_filter('status_header', $statusCapture, 10000, 2);

        ob_start();
        $died = false;
        $dieStatus = 0;
        try {
            $fn();
        } catch (\WPDieException $e) {
            $died = true;
            $dieStatus = (int) $e->getCode();
        }
        $body = ob_get_clean();
        remove_filter('wp_doing_ajax', $forceAjax, 10000);
        remove_filter('wp_die_ajax_handler', $ajaxHandler, 10000);
        remove_filter('status_header', $statusCapture, 10000);

        $json = json_decode($body, true);
        return [
            'status' => $capturedStatus ?: $dieStatus,
            'body'   => is_string($body) ? $body : '',
            'json'   => is_array($json) ? $json : null,
            'died'   => $died,
        ];
    }
}
