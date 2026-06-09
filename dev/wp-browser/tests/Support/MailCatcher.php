<?php

namespace Tests\Support;

/**
 * Reads outbound email captured by the WordPress test framework's MockPHPMailer.
 * FluentForm is mostly notifications, so notification/integration tests assert
 * "the right email went to the right recipient with the rendered body" here.
 *
 * Call clear() in setUp/_before, trigger the action, then read sent().
 */
class MailCatcher
{
    public static function clear(): void
    {
        if (function_exists('reset_phpmailer_instance')) {
            reset_phpmailer_instance();
        }
    }

    /**
     * Every email sent since the last clear().
     *
     * @return array<int, array{to:array, subject:string, body:string, header:string}>
     */
    public static function sent(): array
    {
        if (!function_exists('tests_retrieve_phpmailer_instance')) {
            return [];
        }
        $mailer = tests_retrieve_phpmailer_instance();
        if (!$mailer || empty($mailer->mock_sent)) {
            return [];
        }

        return array_map(function ($mail) {
            return [
                'to'      => $mail['to'] ?? [],
                'subject' => $mail['subject'] ?? '',
                'body'    => $mail['body'] ?? '',
                'header'  => $mail['header'] ?? '',
            ];
        }, $mailer->mock_sent);
    }

    public static function count(): int
    {
        return count(self::sent());
    }

    public static function lastTo(): ?string
    {
        $sent = self::sent();
        if (!$sent) {
            return null;
        }
        $last = end($sent);
        return $last['to'][0][0] ?? null;
    }
}
