<?php

namespace FluentForm\App\Modules\Form;

use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Helpers\ArrayHelper;

class TokenBasedSpamProtection
{
    private $app;
    private $tokenName = 'ff_spam_protection_token';

    public function __construct(Application $application)
    {
        $this->app = $application;
    }

    private function generateTokenForSpamProtection($formId)
    {
        $timestamp = time();
        $randomString = wp_generate_password(12, false);
        $data = $timestamp . '|' . $formId . '|' . $randomString;
        $hash = hash_hmac('sha256', $data, wp_salt());
        return base64_encode($data . '|' . $hash);
    }

    public function renderTokenField($form)
    {
        if (!$this->isEnabled($form->id)) {
            return;
        }

        $token = $this->generateTokenForSpamProtection($form->id);
        ?>
        <input
                type="hidden"
                name="<?php
                echo esc_attr($this->tokenName); ?>"
                value="<?php
                echo esc_attr($token); ?>"
        />
        <?php
    }

    public function verify($insertData, $requestData, $formId)
    {
        if (!$this->isEnabled($formId)) {
            return;
        }

        $tokenFieldFound = false;
        $isSpam = false;

        $token = ArrayHelper::get($requestData, $this->tokenName);

        if ($token) {
            $tokenFieldFound = true;

            $decodedToken = base64_decode($token);
            $parts = explode('|', $decodedToken);

            if (count($parts) !== 4) {
                $this->handleSpam('Invalid token format');
            }

            list($timestamp, $tokenFormId, $randomString, $receivedHash) = $parts;

            $data = $timestamp . '|' . $tokenFormId . '|' . $randomString;
            $expectedHash = hash_hmac('sha256', $data, wp_salt());

            if ($receivedHash !== $expectedHash || $tokenFormId != $formId) {
                $this->handleSpam('Invalid token');
            }

            $minimumSubmissionTime = apply_filters('fluentform/minimum_submission_time', 3, $formId); // 3 seconds default
            if (time() - intval($timestamp) < $minimumSubmissionTime) {
                $this->handleSpam('Form submitted too quickly');
            }

            $maximumSubmissionTime = apply_filters('fluentform/maximum_submission_time', 3600, $formId); // 1 hour default
            if (time() - intval($timestamp) > $maximumSubmissionTime) {
                $this->handleSpam('Token expired');
            }
        } else {
            $isSpam = true;
        }

        if (!$tokenFieldFound) {
            $this->handleSpam('Token field not found');
        }

        if ($isSpam) {
            $this->handleSpam('Spam detected');
        }

        // If we reach here, the token check passed
        return;
    }

    private function handleSpam($reason)
    {
        do_action('fluentform/spam_attempt_caught', $reason);
        
        wp_send_json(
            [
                'errors' => __($reason, 'fluentform')
            ],
            422
        );
    }

    public function isEnabled($formId = false)
    {
        $option = get_option('_fluentform_global_form_settings');
        $status = 'yes' == ArrayHelper::get($option, 'misc.tokenBasedSpamProtectionStatus');
        return apply_filters('fluentform/token_based_spam_protection_status', $status, $formId);
    }
}