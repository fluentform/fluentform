<?php

namespace FluentForm\App\Services\Blocks;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Support\Arr;
use FluentFormPro\classes\FormStyler;

/**
 * GutenbergBlock class for handling Fluent Forms Gutenberg block functionality
 * @since 1.0.0
 */
class GutenbergBlock
{
    /**
     * Register the Gutenberg block
     * @return void
     */
    public static function register()
    {
        if (!function_exists('register_block_type')) {
            return;
        }

        register_block_type('fluentfom/guten-block', [
            'render_callback' => [self::class, 'render'],
            'attributes'      => BlockAttributes::getAttributes(),
            'api_version'     => 3,
        ]);
    }

    /**
     * Get available preset styles for the block
     *
     * @return array Available preset styles
     */
    public static function getPresetStyles()
    {
        if (!class_exists('FluentFormPro\classes\FormStyler')) {
            return [];
        }

        $formStyler = new FormStyler();
        return $formStyler->getBlockPresets();
    }

    /**
     * Render the Gutenberg block
     *
     * @param array $atts Block attributes
     * @return string Rendered block HTML
     */
    public static function render($atts)
    {
        $formId = intval(Arr::get($atts, 'formId', 0));

        if (!$formId) {
            return '<div class="fluentform-no-form-selected"><p>' . __('Please select a form', 'fluentformpro') . '</p></div>';
        }

        $className = sanitize_text_field(Arr::get($atts, 'className', ''));
        $themeStyle = sanitize_text_field(Arr::get($atts, 'themeStyle', ''));
        $selectedPreset = sanitize_text_field(Arr::get($atts, 'selectedPreset', ''));
        $customizePreset = Arr::get($atts, 'customizePreset', false);
        $presetStyles = Arr::get($atts, 'presetStyles', []);
        $type = Helper::isConversionForm($formId) ? 'conversational' : '';

        // Handle preset styles
        if (!empty($selectedPreset) && !$customizePreset) {
            $themeStyle = $selectedPreset;
        } elseif (!empty($presetStyles) && $customizePreset) {
            $themeStyle = 'ffs_custom';
        }

        // Generate CSS - order matters for specificity
        $customCSS = '';
        
        // Always add preset styles first (lower specificity)
        if (!empty($selectedPreset) || (!empty($presetStyles) && $customizePreset)) {
            $presetCSS = StyleProcessor::processPresetStyles($atts, $formId);
            if ($presetCSS) {
                $customCSS .= $presetCSS;
            }
        }

        // Custom block styles
        $customBlockCss = Arr::get($atts, 'customCss', '');
        if ($customBlockCss = json_decode($customBlockCss)) {
            $stylesId = 'fluentform-block-custom-styles-' . $formId;
            $individualStyleTag = '<style id="' . esc_attr($stylesId) . '">' . $customBlockCss . '</style>';

            // Also attach to frontend style handles
            if (wp_style_is('fluent-form-styles', 'enqueued') || wp_style_is('fluent-form-styles', 'registered')) {
                wp_add_inline_style('fluent-form-styles', $customBlockCss);
            }
            if (wp_style_is('fluentform-public-default', 'enqueued') || wp_style_is('fluentform-public-default', 'registered')) {
                wp_add_inline_style('fluentform-public-default', $customBlockCss);
            }
        }

        // Custom CSS for block styling
        $inlineStyle = '';

        // Add the CSS inline with the form
        if ($customCSS) {
            // Create a unique ID for this form's styles
            $styleId = 'fluentform-block-styles-' . $formId;

            // Add the styles inline with the form
            $inlineStyle = '<style id="' . esc_attr($styleId) . '">' . $customCSS . '</style>';

            // Also attach to frontend style handles
            if (wp_style_is('fluent-form-styles', 'enqueued') || wp_style_is('fluent-form-styles', 'registered')) {
                wp_add_inline_style('fluent-form-styles', $customCSS);
            }
            // Default skin CSS if loaded
            if (wp_style_is('fluentform-public-default', 'enqueued') || wp_style_is('fluentform-public-default', 'registered')) {
                wp_add_inline_style('fluentform-public-default', $customCSS);
            }
        }

        // Return the form with inline styles
        $formOutput = do_shortcode('[fluentform theme="' . $themeStyle . '" css_classes="' . $className . ' ff_guten_block ff_guten_block-' . $formId . '" id="' . $formId . '"  type="' . $type . '"]');

        if ($formOutput) {
            $allStyles = '';
            if ($inlineStyle) {
                $allStyles .= $inlineStyle;
            }
            if (!empty($individualStyleTag)) {
                $allStyles .= $individualStyleTag;
            }
            
            if ($allStyles) {
                return $allStyles . $formOutput;
            }
            return $formOutput;
        }

        return '';
    }
}
