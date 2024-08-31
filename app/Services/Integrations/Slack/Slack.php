<?php

namespace FluentForm\App\Services\Integrations\Slack;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Modules\Form\FormDataParser;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\Framework\Helpers\ArrayHelper;

class Slack
{

    /**
     * The slack integration settings of the form.
     *
     * @var array $settings
     */
    protected $settings = [];
    
    /**
     * Handle slack notifier.
     *
     * @param $feed
     * @param $formData
     * @param $form
     * @param $entry
     *
     * @return array
     */
    public static function handle($feed, $formData, $form, $entry)
    {
        $settings = $feed['processedValues'];

        $inputs = FormFieldsParser::getEntryInputs($form);

        $labels = FormFieldsParser::getAdminLabels($form, $inputs);

        $labels = apply_filters('fluentform/slack_field_label_selection', $labels, $settings, $form);
    
        $formData = self::getFormData($inputs, $formData, $form);
    
        $slackTitle = ArrayHelper::get($settings, 'textTitle');
    
        list($title, $footerText) = self::getHeaderFooter($slackTitle, $form, $settings);
    
    
        $fields = self::getFields($formData, $labels);
        $slackHook = ArrayHelper::get($settings, 'webhook');

        $titleLink = admin_url(
            'admin.php?page=fluent_forms&form_id='
            . $form->id
            . '&route=entries#/entries/'
            . $entry->id
        );
    
        $result = self::sendData($title, $titleLink, $fields, $footerText, $slackHook);
    
        if (is_wp_error($result)) {
            $status = 'failed';
            $message = $result->get_error_message();
        } else {
            $message = $result['response'];
            $status = 200 == $result['response']['code'] ? 'success' : 'failed';
        }
    
        $status = ($status === 'failed') ? 'failed' : 'success';
        $message = ($status === 'failed') ? $message : 'Submission notification has been successfully delivered to slack channel';
    
        do_action('fluentform/integration_action_result', $feed, $status, $message);
        return [
            'status'  => $status,
            'message' => $message,
        ];
    }
    
    private static function getFormData($inputs, $formData, $form)
    {
        foreach ($inputs as $name => $input) {
            if (empty($formData[$name])) {
                continue;
            }
            if ('tabular_grid' == ArrayHelper::get($input, 'element', '')) {
                $formData[$name] = Helper::getTabularGridFormatValue($formData[$name], $input, '<br />', ', ',
                    'markdown');
            }
        }
        $formData = FormDataParser::parseData((object)$formData, $inputs, $form->id);
        return $formData;
    }
    
    private static function getFields($formData, $labels)
    {
        $fields = [];
        foreach ($formData as $attribute => $value) {
            $value = str_replace('<br />', "\n", $value);
            $value = str_replace('&', '&amp;', $value);
            $value = str_replace('<', '&lt;', $value);
            $value = str_replace('>', '&gt;', $value);
            if (!isset($labels[$attribute]) || empty($value)) {
                continue;
            }
            $fields[] = [
                'title' => $labels[$attribute],
                'value' => $value,
                'short' => false,
            ];
        }
        return $fields;
    }
    
    private static function getHeaderFooter($slackTitle, $form, $settings)
    {
        if ('' === $slackTitle) {
            $title = 'New submission on ' . $form->title;
        } else {
            $title = $slackTitle;
        }
        
        $footerText = ArrayHelper::get($settings, 'footerText');
        if ($footerText === '') {
            $footerText = "fluentform";
        }
        return array($title, $footerText);
    }
    
    private static function sendData($title, $titleLink, $fields, $footerText, $slackHook)
    {
        $body = [
            'payload' => json_encode([
                'attachments' => [
                    [
                        'color'      => '#0078ff',
                        'fallback'   => $title,
                        'title'      => $title,
                        'title_link' => $titleLink,
                        'fields'     => $fields,
                        'footer'     => $footerText,
                        'ts'         => round(microtime(true) * 1000)
                    ]
                ]
            ])
        ];
    
        return wp_remote_post($slackHook, [
            'method'      => 'POST',
            'timeout'     => 30,
            'redirection' => 5,
            'httpversion' => '1.0',
            'headers'     => [],
            'body'        => $body,
            'cookies'     => [],
        ]);
    }
}
