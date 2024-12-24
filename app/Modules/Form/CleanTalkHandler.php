<?php

namespace FluentForm\App\Modules\Form;

use FluentForm\Framework\Helpers\ArrayHelper as Arr;

class CleanTalkHandler
{
    public static function enqueueCleantalk()
    {
        $settings = get_option('_fluentform_cleantalk_details');
        $accessKey = Arr::get($settings, 'accessKey');
        if (!$accessKey) {
            return false;
        }

        $services = Arr::get($settings, 'services');
        if (!in_array('bot_prevention', $services)) {
            return false;
        }

        if (!wp_script_is('cleantalk-bot-detector')) {
            wp_enqueue_script(
                'cleantalk-bot-detector',
                'https://moderate.cleantalk.org/ct-bot-detector-wrapper.js',
                [],
                FLUENTFORM_VERSION,
                true
            );
        }
    }

    public static function isCleanTalkEnabled()
    {
        return get_option('_fluentform_cleantalk_keys_status') === '1';
    }

    public static function isSpamSubmission($formData, $form)
    {
        $settings = get_option('_fluentform_cleantalk_details');
        $accessKey = Arr::get($settings, 'accessKey');
        $services = Arr::get($settings, 'services');
        if ($services) {
            if (in_array('spam_protection', $services)) {
                require_once FLUENTFORM_DIR_PATH . 'app/Services/Libraries/cleantalk-antispam/cleantalk-antispam.php';

                if (!class_exists('\CleantalkAntiSpam\CleantalkAntispam')) {
                    return false;
                }

                $userEmail = '';
                $userName = '';
                $message = '';

                $cleanTalkRequestParams = self::getCleanTalkRequest($formData, $form);
                foreach ($cleanTalkRequestParams as $param) {
                    $userEmail = Arr::get($param, 'email_field');
                    $userName = Arr::get($param, 'username_field');
                    $message = Arr::get($param, 'message_field');
                }

                $cleantalkAntispam = new \CleantalkAntiSpam\CleantalkAntispam($accessKey, $userEmail, $userName, $message);
                $response = $cleantalkAntispam->handle();

                if ($response->allow === 1) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return false;
    }

    protected static function getCleanTalkRequest($data, $form)
    {
        $info = [
            'email_field'    => '',
            'username_field' => '',
            'message_field'  => '',
        ];

        $maps = [
            'input_name'  => 'username_field',
            'input_email' => 'email_field',
            'textarea'    => 'message_field',
        ];
        $inputs = FormFieldsParser::getInputs($form, ['attributes']);

        foreach ($inputs as $input) {
            $element = Arr::get($input, 'element');
            $key = Arr::get($input, 'attributes.name');
            if (isset($maps[$element]) && !$info[$maps[$element]]) {
                $value = Arr::get($data, $key);
                if ($value) {
                    if (is_array($value)) {
                        $value = implode(' ', $value);
                    }
                    $info[$maps[$element]] = $value;
                }
            }
        }

        return apply_filters('fluentform/cleantalk_fields', $info, $data, $form);
    }
}
