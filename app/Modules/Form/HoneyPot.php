<?php

namespace FluentForm\App\Modules\Form;

use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Helpers\ArrayHelper;

class HoneyPot
{
    private $app;

    public function __construct(Application $application)
    {
        $this->app = $application;
    }

    public function renderHoneyPot($form)
    {
        if (!$this->isEnabled($form->id)) {
            return;
        }
    
        $fieldName = $this->getFieldName($form->id);
        $fieldId = 'ff_' . $form->id . '_item_sf';
        $randomClass = 'form_field_' . rand(10, 99) .'_item_sf';
    
        $labels = ['Newsletter', 'Updates', 'Contact', 'Subscribe', 'Notify'];
        $randomLabel = $labels[array_rand($labels)];
        ?>
        <style>
            .<?php echo esc_attr($randomClass); ?> {
                display: none !important;
                position: absolute !important;
                transform: translateX(1000%) !important;
            }
        </style>
        <script>
            (function() {
                const style = document.createElement('style');
                style.textContent = '.<?php echo esc_js($randomClass); ?> { display: none !important; position: absolute !important; transform: translateX(1000%) !important; }';
                document.head.appendChild(style);
            })();
        </script>
        <div class="ff-el-group <?php echo esc_attr($randomClass); ?>" style="display: none !important; position: absolute !important; transform: translateX(1000%) !important;">
            <div class="ff-el-input--label asterisk-right">
                <label for="<?php echo esc_attr($fieldId); ?>" aria-label="<?php echo esc_attr($randomLabel); ?>">
                    <?php echo esc_html($randomLabel); ?>
                </label>
            </div>
            <div class="ff-el-input--content">
                <input type="text"
                       name="<?php echo esc_attr($fieldName); ?>"
                       class="ff-el-form-control"
                       id="<?php echo esc_attr($fieldId); ?>"
                >
            </div>
        </div>
        <?php
    }
    
    public function verify($insertData, $requestData, $formId)
    {
        if (!$this->isEnabled($formId)) {
            return;
        }

        if (ArrayHelper::get($requestData, $this->getFieldName($formId))) {
            wp_send_json(
                [
                    'errors' => 'Sorry! You can not submit this form at this moment!',
                ],
                422
            );
        }
        return;
    }
    
    public function isEnabled($formId = false)
    {
        $option = get_option('_fluentform_global_form_settings');
        $status = 'yes' == ArrayHelper::get($option, 'misc.honeypotStatus');
        
        return apply_filters('fluentform/honeypot_status', $status, $formId);
    }
    
    private function getFieldName($formId)
    {
        $honeyPotName = 'item_' . $formId . '__fluent_sf';
        return apply_filters('fluentform/honeypot_name', $honeyPotName, $formId);
    }
}
