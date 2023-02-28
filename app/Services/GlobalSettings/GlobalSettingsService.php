<?php

namespace FluentForm\App\Services\GlobalSettings;

use FluentForm\Framework\Support\Arr;

class GlobalSettingsService
{
    public function get($attributes = [])
    {
        $values = [];
        $key = Arr::get($attributes, 'key');

        if (is_array($key)) {
            foreach ($key as $key_item) {
                $sanitizedKey = sanitize_text_field($key_item);
                $values[$key_item] = get_option($sanitizedKey);
            }
        } else {
            $values[$key] = get_option($key);
        }

        return apply_filters('fluentform_get_global_settings_values', $values, $key);
    }

    public function store($attributes = [])
    {
        $key = Arr::get($attributes, 'key');

        $globalSettingsHelper = new GlobalSettingsHelper();

        $allowedMethods = [
            'storeReCaptcha',
            'storeHCaptcha',
            'storeTurnstile',
            'storeSaveGlobalLayoutSettings',
            'storeMailChimpSettings',
            'storeEmailSummarySettings',
        ];

        $method = '';
        $container = [];
        if (is_array($key)) {
            foreach ($key as $item) {
                $method = 'store' . ucwords($item);
                if (in_array($method, $allowedMethods)) {
                    $container[] = $globalSettingsHelper->{$method}($attributes);
                }
            }
            return $container;
        } else {
            $method = 'store' . ucwords($key);
        }

        do_action('fluentform_saving_global_settings_with_key_method', $attributes);

        if (in_array($method, $allowedMethods)) {
            return $globalSettingsHelper->{$method}($attributes);
        }
    }
}
