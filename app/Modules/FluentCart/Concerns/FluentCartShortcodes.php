<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

use FluentForm\Framework\Support\Arr;

trait FluentCartShortcodes
{
    public function addFluentFormsConfirmationShortcodes($groups, $context = [])
    {
        $groups[] = $this->getFluentFormsShortcodeGroup();

        return $groups;
    }

    public function addFluentFormsEmailShortcodes($shortCodes)
    {
        $shortCodes['fluent_forms'] = $this->getFluentFormsShortcodeGroup();

        return $shortCodes;
    }

    public function parseFluentFormsCartSmartCode($code, $data)
    {
        $code = trim((string) $code, '{} ');

        if (strpos($code, 'fluentform.') !== 0) {
            return $code;
        }

        $context = $this->getFluentFormContextFromCartData($data);

        if (!$context) {
            return '';
        }

        $key = substr($code, strlen('fluentform.'));

        switch ($key) {
            case 'entry_id':
                return (string) $context['submission_id'];
            case 'form_title':
                return $context['form'] ? (string) $context['form']->title : '';
            case 'status':
                return (string) $context['submission']->status;
            case 'payment_status':
                return (string) $context['submission']->payment_status;
            case 'all_data':
                return $this->formatFluentFormResponseForEmail($context['response']);
            case 'uploads':
                return $this->formatFluentFormUploadUrls($this->extractFluentFormUploadUrls($context['response']));
        }

        if (strpos($key, 'entry.') === 0 || strpos($key, 'input.') === 0 || strpos($key, 'field.') === 0) {
            $fieldName = preg_replace('/^(entry|input|field)\./', '', $key);
            return $this->stringifyFluentFormValue(Arr::get($context['response'], $fieldName, ''));
        }

        return '';
    }

    protected function getFluentFormsShortcodeGroup()
    {
        return [
            'title'      => __('Fluent Forms', 'fluentform'),
            'key'        => 'fluent_forms',
            'shortcodes' => [
                '{{fluentform.entry_id}}'          => __('Fluent Forms Entry ID', 'fluentform'),
                '{{fluentform.form_title}}'        => __('Fluent Forms Form Title', 'fluentform'),
                '{{fluentform.status}}'            => __('Fluent Forms Entry Status', 'fluentform'),
                '{{fluentform.payment_status}}'    => __('Fluent Forms Payment Status', 'fluentform'),
                '{{fluentform.all_data}}'          => __('All submitted Fluent Forms data', 'fluentform'),
                '{{fluentform.uploads}}'           => __('Uploaded file URLs', 'fluentform'),
                '{{fluentform.input.FIELD_NAME}}'  => __('Submitted field value by field name', 'fluentform'),
            ],
        ];
    }

    protected function formatFluentFormResponseForEmail($response)
    {
        if (!$response || !is_array($response)) {
            return '';
        }

        $html = '<table cellpadding="6" cellspacing="0" border="0">';

        foreach ($response as $key => $value) {
            if ($value === '' || $value === null || $value === []) {
                continue;
            }

            $html .= '<tr><th align="left">' . esc_html($key) . '</th><td>' . wp_kses_post($this->stringifyFluentFormValue($value)) . '</td></tr>';
        }

        return $html . '</table>';
    }

    protected function stringifyFluentFormValue($value)
    {
        if (is_array($value)) {
            $links = $this->extractFluentFormUploadUrls($value);

            if ($links) {
                return $this->formatFluentFormUploadUrls($links);
            }

            return esc_html(implode(', ', array_map([$this, 'stringifyFluentFormValue'], $value)));
        }

        $value = (string) $value;

        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return '<a href="' . esc_url($value) . '">' . esc_html($value) . '</a>';
        }

        return esc_html($value);
    }

    protected function extractFluentFormUploadUrls($value)
    {
        $urls = [];

        if (is_array($value)) {
            foreach ($value as $item) {
                $urls = array_merge($urls, $this->extractFluentFormUploadUrls($item));
            }
        } elseif (is_string($value) && filter_var($value, FILTER_VALIDATE_URL)) {
            $urls[] = $value;
        }

        return array_values(array_unique($urls));
    }

    protected function formatFluentFormUploadUrls($urls)
    {
        if (!$urls) {
            return '';
        }

        $links = array_map(function ($url) {
            return '<a href="' . esc_url($url) . '">' . esc_html(basename(parse_url($url, PHP_URL_PATH)) ?: $url) . '</a>';
        }, $urls);

        return implode('<br />', $links);
    }
}
