<?php

namespace FluentForm\App\Modules\AiChat\Classes;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Services\FluentConversational\Classes\Converter\Converter;
use FluentForm\App\Services\FluentConversational\Classes\Form as BaseForm;
use FluentForm\Framework\Helpers\ArrayHelper;

/**
 * AI Chat Form Handler
 *
 * Handles AI Chat-specific form rendering and functionality.
 * Extends the base Form class to reuse common conversational form methods.
 *
 * @since 1.0.0
 */
class AiChatForm extends BaseForm
{
    /**
     * Boot AI Chat functionality
     */
    public function boot()
    {
        // Register AI Chat page handler
        add_action('wp', [$this, 'renderAiChatPage'], 100);

        // Register AI Chat shortcode
        add_shortcode('fluentform_ai_chat', [$this, 'renderAiChatShortcode']);
    }

    /**
     * Render AI Chat standalone page
     * URL: ?fluent-form-ai=66
     * AI Chat is now available for all forms, not just conversational forms
     */
    public function renderAiChatPage()
    {
        $paramKey = 'fluent-form-ai';

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Public form display, no nonce needed
        if (!isset($_REQUEST[$paramKey])) {
            return;
        }

        $request = wpFluentForm('request')->get();

        if ((isset($request[$paramKey])) && !wp_doing_ajax()) {
            $formId = (int) ArrayHelper::get($request, $paramKey);
            $this->renderAiChatPageHtml($formId);
        }
    }

    /**
     * Render AI Chat via shortcode
     * Usage: [fluentform_ai_chat id="66"]
     * AI Chat is now available for all forms, not just conversational forms
     *
     * @param array $atts Shortcode attributes
     * @return string HTML output
     */
    public function renderAiChatShortcode($atts)
    {
        $atts = shortcode_atts([
            'id' => null,
            'height' => '600px',
            'width' => '100%',
        ], $atts);

        $formId = (int) $atts['id'];

        if (!$formId) {
            return '<div class="ff-ai-chat-error">' . esc_html__('Please provide a form ID', 'fluentform') . '</div>';
        }

        if (!$this->isAiChatEnabled($formId)) {
            return '<div class="ff-ai-chat-error">' . esc_html__('AI Chat is not enabled for this form', 'fluentform') . '</div>';
        }

        // Generate unique ID for this instance
        $instanceId = 'ff-ai-chat-' . $formId . '-' . wp_rand(1000, 9999);

        // Build iframe URL
        $iframeUrl = add_query_arg('fluent-form-ai', $formId, home_url('/'));

        // Return iframe embed
        ob_start();
        ?>
        <div class="ff-ai-chat-embed" id="<?php echo esc_attr($instanceId); ?>" style="width: <?php echo esc_attr($atts['width']); ?>; max-width: 100%;">
            <iframe
                src="<?php echo esc_url($iframeUrl); ?>"
                style="width: 100%; height: <?php echo esc_attr($atts['height']); ?>; border: none; border-radius: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);"
                title="<?php echo esc_attr__('AI Chat', 'fluentform'); ?>"
                loading="lazy"
            ></iframe>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Render AI Chat Settings page
     *
     * @param int $formId Form ID
     */
    public function renderAiChatSettings($formId)
    {
        // AI Chat is now available for all forms, not just conversational forms

        wp_enqueue_script(
            'fluent_forms_ai_chat_settings',
            fluentformMix('js/ai_chat_settings.js'),
            ['jquery'],
            FLUENTFORM_VERSION,
            true
        );

        // Force reload from database to get latest config
        $aiConfig = Helper::getFormMeta($formId, 'ai_chat_config', [], true);

        wp_localize_script('fluent_forms_ai_chat_settings', 'ff_ai_chat_vars', [
            'form_id'     => $formId,
            'ai_config'   => $aiConfig,
            'ajax_url'    => admin_url('admin-ajax.php'),
            'nonce'       => wp_create_nonce('fluentform_ai_chat'),
            'has_pro'     => defined('FLUENTFORMPRO'),
        ]);

        // Load Vue component styles (includes base SCSS imported in component)
        wp_enqueue_style(
            'fluent_forms_ai_chat_settings',
            fluentformMix('js/ai_chat_settings.css'),
            [],
            FLUENTFORM_VERSION
        );

        echo '<div id="ff_ai_chat_settings_app"><div style="text-align: center; margin: 60px 0px;"><h1>Loading AI Chat Settings...</h1></div></div>';
    }

    /**
     * Render AI Chat standalone page HTML
     *
     * @param int $formId Form ID
     */
    private function renderAiChatPageHtml($formId)
    {
        // Check if AI Chat is enabled for this form
        if (!$this->isAiChatEnabled($formId)) {
            echo '<h1 style="text-align: center; margin-top: 100px;">AI Chat is not enabled for this form.</h1>';
            exit();
        }

        // Use Helper to get form
        $form = Helper::getForm($formId);

        if (!$form) {
            echo '<h1 style="text-align: center; margin-top: 100px;">Form not found.</h1>';
            exit();
        }

        // Parse form fields
        $form->fields = is_string($form->form_fields) ? json_decode($form->form_fields, true) : $form->form_fields;

        if (!$form->fields || !isset($form->fields['fields'])) {
            echo '<h1 style="text-align: center; margin-top: 100px;">Invalid form structure.</h1>';
            exit();
        }

        // Get form settings using Helper
        $form->settings = Helper::getFormMeta($formId, 'formSettings', []);

        // Apply filters and convert form
        $form = wpFluentForm()->applyFilters('fluentform/rendering_form', $form);
        $form = Converter::convert($form);

        // Enqueue AI Chat scripts
        $this->enqueueAiChatScripts();

        // Get meta settings
        $metaSettings = $this->getMetaSettings($formId);
        $designSettings = $this->getDesignSettings($formId);

        // Get AI Chat config
        $aiChatConfig = $this->getAiChatConfig($formId);

        // Localize script data
        wp_localize_script('fluent_forms_ai_chat', 'fluent_forms_global_var', [
            'fluent_forms_admin_nonce' => wp_create_nonce('fluent_forms_admin_nonce'),
            'ajaxurl'                  => admin_url('admin-ajax.php'),
            'nonce'                    => wp_create_nonce(),
            'form'                     => $this->getLocalizedForm($form),
            'form_id'                  => $form->id,
            'assetBaseUrl'             => FLUENT_CONVERSATIONAL_FORM_DIR_URL . 'public',
            'i18n'                     => $metaSettings['i18n'],
            'design'                   => $designSettings,
            'hasPro'                   => defined('FLUENTFORMPRO'),
            'extra_inputs'             => $this->getExtraHiddenInputs($formId),
            'uploading_txt'            => __('Uploading', 'fluentform'),
            'upload_completed_txt'     => __('100% Completed', 'fluentform'),
            'date_i18n'                => \FluentForm\App\Modules\Component\Component::getDatei18n(),
            'rest'                     => Helper::getRestInfo(),
            'ai_chat_enabled'          => true,
            'ai_chat_display_mode'     => 'inline', // Always inline for standalone page
            'ai_chat_nonce'            => wp_create_nonce('fluentform_ai_chat'),
            'ai_chat_config'           => $aiChatConfig
        ]);

        $this->printLoadedScripts();

        // Render the AI Chat page template
        wpFluentForm('view')->render('public.ai-chat-page', [
            'generated_css' => $this->getGeneratedCss($formId),
            'design'        => $designSettings,
            'form_id'       => $formId,
            'meta'          => $metaSettings,
            'form'          => $form,
        ]);

        exit(200);
    }

    /**
     * Get AI Chat configuration for a form
     *
     * @param int $formId Form ID
     * @return array AI Chat configuration
     */
    private function getAiChatConfig($formId)
    {
        // Use Helper to get form meta
        $config = Helper::getFormMeta($formId, 'ai_chat_config');

        if ($config) {
            return $config;
        }

        return [
            'enabled' => false,
            'model' => 'gpt-3.5-turbo',
            'conversation_style' => 'friendly'
        ];
    }

    /**
     * Enqueue AI Chat scripts
     */
    private function enqueueAiChatScripts()
    {
        wp_enqueue_style(
            'fluent_forms_ai_chat',
            fluentformMix('css/ai-chat.css'),
            [],
            FLUENTFORM_VERSION
        );

        wp_enqueue_script(
            'fluent_forms_ai_chat',
            fluentformMix('js/ai-chat.js'),
            [],
            FLUENTFORM_VERSION,
            true
        );
    }
}

