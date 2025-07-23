<?php

namespace FluentForm\App\Modules\Ai;

use Exception;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Modules\Acl\Acl;
use FluentForm\App\Services\Settings\Customizer;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentForm\Framework\Support\Sanitizer;

/**
 * AI Form Styler - Generate CSS styles for Fluent Forms using AI
 *
 * Features:
 * - Only works with Fluent Forms Pro
 * - Works in custom CSS/JS page for existing forms
 * - Integrates with AI form creation process
 * - Generates CSS using AI based on user prompts
 * - Applies styles using Fluent Forms CSS class structure
 *
 * @since 6.0.0
 */
class AiFormStyler
{
    private $customizer;
    private $request;
    
    public function __construct()
    {
        // Only initialize if Fluent Forms Pro is available
        if (!Helper::hasPro()) {
            return;
        }

        $this->customizer = new Customizer();
        $this->request = wpFluentForm('request');
        add_action('wp_ajax_fluentform_ai_generate_styles', [$this, 'generateStyles'], 11, 0);
        add_action('wp_ajax_fluentform_ai_apply_styles', [$this, 'applyStyles'], 11, 0);

        // Hook into form creation to apply styles if requested
        add_action('fluentform/inserted_new_form', [$this, 'maybeApplyStylesOnFormCreation'], 10, 2);
    }

    /**
     * Generate CSS styles using AI based on user requirements
     */
    public function generateStyles()
    {
        try {
            // Check if Pro is available
            if (!Helper::hasPro()) {
                throw new Exception(__('This feature requires Fluent Forms Pro.', 'fluentform'));
            }

            Acl::verifyNonce();

            $request = $this->request;
            $formId = absint($request->get('form_id'));
            $stylePrompt = Sanitizer::sanitizeTextField($request->get('style_prompt'));
            $colorScheme = Sanitizer::sanitizeTextField($request->get('color_scheme', ''));
            $styleType = Sanitizer::sanitizeTextField($request->get('style_type', 'modern'));

            if (!$formId || !$stylePrompt) {
                throw new Exception(__('Form ID and style prompt are required.', 'fluentform'));
            }

            // Validate form exists and user has permission
            if (!current_user_can('fluentform_forms_manager')) {
                throw new Exception(__('You do not have permission to modify this form.', 'fluentform'));
            }
            
            // Get form structure for context
            $form = Form::find($formId);
            if (!$form) {
                throw new Exception(__('Form not found.', 'fluentform'));
            }
            
            $formFields = json_decode($form->form_fields, true);
            $fieldTypes = $this->extractFieldTypes($formFields);
            
            // Generate styles using AI
            $generatedStyles = $this->requestAiStyles([
                'form_id' => $formId,
                'style_prompt' => $stylePrompt,
                'color_scheme' => $colorScheme,
                'style_type' => $styleType,
                'field_types' => $fieldTypes,
                'form_title' => $form->title
            ]);

            $previewCss = $this->generatePreviewCss($generatedStyles, $formId);

            wp_send_json_success([
                'styles' => $generatedStyles,
                'preview_css' => $previewCss,
                'message' => __('Styles generated successfully!', 'fluentform')
            ], 200);
            
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Apply generated styles to the form
     */
    public function applyStyles()
    {
        try {
            // Check if Pro is available
            if (!Helper::hasPro()) {
                throw new Exception(__('This feature requires Fluent Forms Pro.', 'fluentform'));
            }

            Acl::verifyNonce();
            
            $request = $this->request;
            $formId = absint($request->get('form_id'));
            $styles = $request->get('styles');
            
            if (!$formId || !$styles) {
                throw new Exception(__('Form ID and styles are required.', 'fluentform'));
            }
            
            // Generate final CSS with form ID scoping
            $finalCss = $this->generateFinalCss($styles, $formId);

            // Store the CSS using the Customizer service
            $this->customizer->store([
                'form_id' => $formId,
                'css' => $finalCss,
                'js' => '' // No JS for now
            ]);

            wp_send_json_success([
                'message' => __('Styles applied successfully!', 'fluentform'),
                'css' => $finalCss
            ], 200);
            
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }



    /**
     * Extract field types from form structure for AI context
     */
    private function extractFieldTypes($formFields)
    {
        $fieldTypes = [];
        
        if (!isset($formFields['fields']) || !is_array($formFields['fields'])) {
            return $fieldTypes;
        }
        
        foreach ($formFields['fields'] as $field) {
            if (isset($field['element'])) {
                $fieldTypes[] = $field['element'];
            }
        }
        
        return array_unique($fieldTypes);
    }

    /**
     * Request AI-generated styles using ChatGPT
     */
    private function requestAiStyles($params)
    {
        $prompt = $this->buildStylePrompt($params);

        // Check if ChatGPT is available and enabled
        if (Helper::hasPro() && class_exists('FluentFormPro\classes\Chat\ChatApi')) {
            $chatApi = new \FluentFormPro\classes\Chat\ChatApi();

            if ($chatApi->isApiEnabled()) {
                return $this->requestChatGptStyles($prompt, $chatApi);
            }
        }



        // Fallback to original AI API
        $queryArgs = [
            'user_prompt' => $prompt,
            'site_url' => site_url(),
            'site_title' => get_bloginfo('name'),
            'has_pro' => Helper::hasPro(),
            'has_payment' => false, // Not needed for styling
            'request_type' => 'css_generation',
            'task_type' => 'styling',
            'request_id' => uniqid('ff_ai_style_')
        ];

        $result = (new FluentFormAIAPI())->makeRequest($queryArgs);
        
        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message());
        }
       
        $response = trim(Arr::get($result, 'response', ''), '"');

        // Check if the endpoint returned CSS styles directly (new endpoint format)
        if (isset($result['css_styles'])) {
            return ['css' => $result['css_styles']];
        }

        // Extract JSON from response if wrapped in code blocks
        if (false !== preg_match('/```json(.*?)```/s', $response, $matches)) {
            $response = trim($matches[1]);
        } elseif (false !== preg_match('/```css(.*?)```/s', $response, $matches)) {
            // If AI returns CSS directly, wrap it in a structure
            return ['css' => trim($matches[1])];
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If JSON parsing fails, treat as raw CSS
            return ['css' => $response];
        }

        // Check if the AI returned form fields instead of CSS
        if (isset($decoded['fields']) || isset($decoded['title'])) {
            // AI returned form structure instead of CSS, generate fallback CSS
            return $this->generateFallbackCss($params);
        }

        return $decoded;
    }

    /**
     * Apply styles automatically when a form is created via AI
     * This hooks into the form creation process
     */
    public function maybeApplyStylesOnFormCreation($formId, $formData)
    {
        // Only proceed if Pro is available
        if (!Helper::hasPro()) {
            return;
        }

        // Check if this is an AI-generated form with style request
        $request = wpFluentForm('request');
        $stylePrompt = $request->get('style_prompt', '');
        $colorScheme = $request->get('color_scheme', '');
        $styleType = $request->get('style_type', 'modern');

        // If no style prompt, don't proceed
        if (empty($stylePrompt)) {
            return;
        }

        try {
            $form = Form::find($formId);
            if (!$form) {
                return;
            }

            $formFields = json_decode($form->form_fields, true);
            $fieldTypes = $this->extractFieldTypes($formFields);

            $generatedStyles = $this->requestAiStyles([
                'form_id' => $formId,
                'style_prompt' => $stylePrompt,
                'color_scheme' => $colorScheme,
                'style_type' => $styleType,
                'field_types' => $fieldTypes,
                'form_title' => $form->title
            ]);

            $finalCss = $this->generateFinalCss($generatedStyles, $formId);
            $this->customizer->store([
                'form_id' => $formId,
                'css' => $finalCss,
                'js' => ''
            ]);

        } catch (Exception $e) {
            error_log('AI Form Styler: Error applying styles during form creation - ' . $e->getMessage());
        }
    }

    /**
     * Generate fallback CSS when AI returns form structure instead of styles
     */
    private function generateFallbackCss($params)
    {
        $formId = $params['form_id'];
        $styleType = $params['style_type'] ?? 'modern';
        $colorScheme = $params['color_scheme'] ?? '';

        // Generate basic CSS based on style type and color scheme
        $css = ".fluent_form_FF_ID {\n";
        $css .= "  max-width: 600px;\n";
        $css .= "  margin: 20px auto;\n";

        if ($styleType === 'modern') {
            $css .= "  background: #ffffff;\n";
            $css .= "  border-radius: 8px;\n";
            $css .= "  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n";
            $css .= "  padding: 30px;\n";
        } elseif ($styleType === 'minimal') {
            $css .= "  background: transparent;\n";
            $css .= "  padding: 20px;\n";
        } else {
            $css .= "  background: #f8f9fa;\n";
            $css .= "  border: 1px solid #e9ecef;\n";
            $css .= "  padding: 25px;\n";
        }

        $css .= "}\n\n";

        // Add field group spacing
        $css .= ".fluent_form_FF_ID .ff-el-group {\n";
        $css .= "  margin-bottom: 20px;\n";
        $css .= "}\n\n";

        // Add label spacing
        $css .= ".fluent_form_FF_ID .ff-el-input--label {\n";
        $css .= "  margin-bottom: 8px;\n";
        $css .= "  display: block;\n";
        $css .= "  font-weight: 500;\n";
        $css .= "  color: #333;\n";
        $css .= "}\n\n";

        // Add form control styles
        $css .= ".fluent_form_FF_ID .ff-el-form-control {\n";
        $css .= "  width: 100%;\n";
        $css .= "  border: 1px solid #ddd;\n";
        $css .= "  border-radius: 4px;\n";
        $css .= "  padding: 12px 15px;\n";
        $css .= "  font-size: 14px;\n";
        $css .= "  line-height: 1.5;\n";
        $css .= "  transition: border-color 0.3s ease, box-shadow 0.3s ease;\n";
        $css .= "  box-sizing: border-box;\n";
        $css .= "}\n\n";

        $css .= ".fluent_form_FF_ID .ff-el-form-control:focus {\n";
        $css .= "  border-color: #007cba;\n";
        $css .= "  outline: none;\n";
        $css .= "  box-shadow: 0 0 0 2px rgba(0, 124, 186, 0.2);\n";
        $css .= "}\n\n";

        // Add submit button wrapper spacing
        $css .= ".fluent_form_FF_ID .ff_submit_btn_wrapper {\n";
        $css .= "  margin-top: 25px;\n";
        $css .= "  text-align: left;\n";
        $css .= "}\n\n";

        // Add submit button styles
        $css .= ".fluent_form_FF_ID .ff-btn-submit {\n";
        $css .= "  background-color: #007cba;\n";
        $css .= "  color: white;\n";
        $css .= "  border: none;\n";
        $css .= "  padding: 14px 28px;\n";
        $css .= "  border-radius: 4px;\n";
        $css .= "  font-size: 16px;\n";
        $css .= "  font-weight: 500;\n";
        $css .= "  cursor: pointer;\n";
        $css .= "  transition: background-color 0.3s ease, transform 0.2s ease;\n";
        $css .= "  min-width: 120px;\n";
        $css .= "}\n\n";

        $css .= ".fluent_form_FF_ID .ff-btn-submit:hover {\n";
        $css .= "  background-color: #005a87;\n";
        $css .= "  transform: translateY(-1px);\n";
        $css .= "}\n\n";

        // Add checkbox and radio spacing
        $css .= ".fluent_form_FF_ID .ff-el-form-check {\n";
        $css .= "  margin-bottom: 10px;\n";
        $css .= "}\n\n";

        $css .= ".fluent_form_FF_ID .ff-el-form-check-label {\n";
        $css .= "  margin-left: 8px;\n";
        $css .= "  font-size: 14px;\n";
        $css .= "}\n";

        return ['css' => $css];
    }

    /**
     * Static method to check if AI styling is available
     */
    public static function isAvailable()
    {
        return Helper::hasPro();
    }

    /**
     * Static method to apply styles to a newly created form
     * Can be called from AiFormBuilder or other form creation processes
     */
    public static function applyStylesToForm($formId, $styleData)
    {
        if (!Helper::hasPro()) {
            return false;
        }

        try {
            $styler = new self();

            $form = Form::find($formId);
            if (!$form) {
                return false;
            }

            $formFields = json_decode($form->form_fields, true);
            $fieldTypes = $styler->extractFieldTypes($formFields);

            $generatedStyles = $styler->requestAiStyles([
                'form_id' => $formId,
                'style_prompt' => $styleData['style_prompt'] ?? '',
                'color_scheme' => $styleData['color_scheme'] ?? '',
                'style_type' => $styleData['style_type'] ?? 'modern',
                'field_types' => $fieldTypes,
                'form_title' => $form->title
            ]);

            $finalCss = $styler->generateFinalCss($generatedStyles, $formId);
            $styler->customizer->store([
                'form_id' => $formId,
                'css' => $finalCss,
                'js' => ''
            ]);

            return [
                'success' => true,
                'css' => $finalCss,
                'styles' => $generatedStyles
            ];

        } catch (Exception $e) {
            error_log('AI Form Styler: Error in applyStylesToForm - ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Request styles from ChatGPT API
     */
    private function requestChatGptStyles($prompt, $chatApi)
    {
        $args = [
            'role' => 'user',
            'content' => $prompt
        ];

        $result = $chatApi->makeRequest($args);

        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message());
        }

        $response = trim(Arr::get($result, 'choices.0.message.content', ''));

        // First, try to extract JSON from code blocks
        if (preg_match('/```json\s*(.*?)\s*```/s', $response, $matches)) {
            $jsonContent = trim($matches[1]);

            $decoded = json_decode($jsonContent, true);
            if (json_last_error() === JSON_ERROR_NONE && isset($decoded['css'])) {
                return $decoded;
            }
        }

        // If no JSON block found, try to extract any code block
        $response = $chatApi->maybeExtractCodeFromResponse($response);

        // Try to parse as JSON
        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If JSON parsing fails, treat as raw CSS
            return ['css' => $response];
        }

        // Validate that we got CSS, not form fields
        if (isset($decoded['fields']) || isset($decoded['title']) || isset($decoded['is_conversational'])) {
            throw new Exception(__('ChatGPT returned form structure instead of CSS. Please try again with a more specific styling request.', 'fluentform'));
        }

        return $decoded;
    }

    /**
     * Build the AI prompt for style generation
     */
    private function buildStylePrompt($params)
    {
        $formId = $params['form_id'];
        $stylePrompt = $params['style_prompt'];
        $colorScheme = $params['color_scheme'];
        $styleType = $params['style_type'];
        $fieldTypes = $params['field_types'];
        $formTitle = $params['form_title'];

        // Enhance prompt if background images are requested
        $stylePrompt = $this->enhanceBackgroundImagePrompt($stylePrompt);
        
        $prompt = "STYLING REQUEST: Generate CSS styles for a Fluent Forms contact form.\n\n";
        $prompt .= "You are a CSS expert specializing in form styling. Your task is to generate CSS styles for a Fluent Forms contact form.\n\n";
        $prompt .= "CRITICAL INSTRUCTIONS:\n";
        $prompt .= "- Generate ONLY CSS code, never form fields or HTML\n";
        $prompt .= "- Use the provided Fluent Forms CSS classes\n";
        $prompt .= "- Return properly formatted CSS with line breaks and indentation\n";
        $prompt .= "- This is a STYLING request, not a form creation request\n\n";
        $prompt .= "Form Details:\n";
        $prompt .= "- Form ID: {$formId}\n";
        $prompt .= "- Form Title: {$formTitle}\n";
        $prompt .= "- Field Types: " . implode(', ', $fieldTypes) . "\n\n";
        
        $prompt .= "Style Requirements:\n";
        $prompt .= "- Style Request: {$stylePrompt}\n";
        if ($colorScheme) {
            $prompt .= "- Color Scheme: {$colorScheme}\n";
        }
        $prompt .= "- Style Type: {$styleType}\n\n";
        
        $prompt .= $this->getFluentFormsCssStructure();
        
        $prompt .= "\nIMPORTANT CSS SELECTOR RULES:\n";
        $prompt .= "- Use the official Fluent Forms selector: .fluent_form_FF_ID\n";
        $prompt .= "- FF_ID will be automatically replaced with the form ID\n";
        $prompt .= "- For nested elements: .fluent_form_FF_ID .ff-el-group\n\n";

        $prompt .= "Please generate CSS that:\n";
        $prompt .= "1. Uses the Fluent Forms CSS classes provided above\n";
        $prompt .= "2. Implements the requested styling\n";
        $prompt .= "3. Uses the official selector: .fluent_form_FF_ID for form scoping\n";
        $prompt .= "4. Follows modern CSS best practices\n";
        $prompt .= "5. Ensures good accessibility and usability\n";
        $prompt .= "6. Uses direct color values (not CSS custom properties in rgba())\n";
        $prompt .= "7. Ensures all CSS rules are properly closed with braces\n";
        $prompt .= "8. Includes proper spacing: form margin (20px auto), field groups margin-bottom (20px), input padding (12px 15px), label margin-bottom (8px)\n";
        $prompt .= "9. For background images: Use open source images from Unsplash (https://images.unsplash.com/photo-[id]?w=1920&h=1080&fit=crop) or Pexels (https://images.pexels.com/photos/[id]/pexels-photo-[id].jpeg?w=1920&h=1080&fit=crop) with appropriate IDs, or CSS gradients/patterns as fallback\n";
        $prompt .= "10. If backdrop/background images are requested, use suitable image URLs or create attractive CSS gradients or patterns\n\n";
        
        $prompt .= "OUTPUT FORMAT:\n";
        $prompt .= "Since this is a styling request, return your response in this format:\n\n";
        $prompt .= "CSS_STYLES:\n";
        $prompt .= "```css\n";
        $prompt .= "/* Your generated CSS here with proper formatting */\n";
        $prompt .= "```\n\n";
        $prompt .= "Alternative format (if the above doesn't work):\n";
        $prompt .= "```json\n";
        $prompt .= "{\n";
        $prompt .= '  "css": "/* Your generated CSS here with proper formatting */"' . "\n";
        $prompt .= "}\n";
        $prompt .= "```\n\n";
        $prompt .= "FINAL REMINDERS:\n";
        $prompt .= "- Generate CSS styles only, never form fields\n";
        $prompt .= "- Use proper CSS formatting with line breaks\n";
        $prompt .= "- Ensure all CSS rules are complete and valid\n";
        $prompt .= "- Focus on the styling requirements provided above";
        
        return $prompt;
    }

    /**
     * Enhance prompt when background images are requested
     */
    private function enhanceBackgroundImagePrompt($stylePrompt)
    {
        $backgroundKeywords = ['background image', 'backdrop', 'background picture', 'image background', 'wallpaper', 'background photo'];

        $hasBackgroundRequest = false;
        foreach ($backgroundKeywords as $keyword) {
            if (stripos($stylePrompt, $keyword) !== false) {
                $hasBackgroundRequest = true;
                break;
            }
        }

        if ($hasBackgroundRequest) {
            $stylePrompt .= ". For background images, you can use open source images from Unsplash or Pexels. Use URLs like 'https://images.unsplash.com/photo-[id]?w=1920&h=1080&fit=crop' for Unsplash or 'https://images.pexels.com/photos/[id]/pexels-photo-[id].jpeg?w=1920&h=1080&fit=crop' for Pexels. Choose appropriate image IDs that match the theme (e.g., nature, business, abstract). Alternatively, create attractive CSS gradients or patterns as fallback.";
        }

        return $stylePrompt;
    }





    /**
     * Static method to apply AI styles during form creation
     * Can be called from the AI form creation endpoint
     */
    public static function applyStylesOnFormCreation($formId, $styleData)
    {
        if (!Helper::hasPro()) {
            return false;
        }

        $styler = new self();
        return $styler->generateStylesForNewForm(
            $formId,
            $styleData['style_prompt'] ?? '',
            $styleData['color_scheme'] ?? '',
            $styleData['style_type'] ?? 'modern'
        );
    }

    /**
     * Check if AI Form Styler is available and user has permission
     */
    public static function canUseAiStyling()
    {
        return Helper::hasPro() && current_user_can('fluentform_forms_manager');
    }

    /**
     * Get Fluent Forms CSS structure for AI context
     */
    private function getFluentFormsCssStructure()
    {
        return "
Fluent Forms CSS Classes Structure:

Main Structure:
- .fluent_form_FF_ID - Main form wrapper (FF_ID will be replaced with form ID dynamically)
- .ff-el-group - Individual field container
- .ff-el-input--label - Field labels
- .ff-el-input--content - Input wrapper

Core Input Classes:
- .ff-el-form-control - All inputs (text, email, textarea, select)
- input[type=\"text\"].ff-el-form-control - Text inputs
- input[type=\"email\"].ff-el-form-control - Email inputs
- textarea.ff-el-form-control - Text areas
- select.ff-el-form-control - Dropdowns

Field Types:
- .ff-name-field-wrapper - Name field container
- .ff-t-container - Table layout
- .ff-t-cell - Individual name cells

Checkboxes:
- .ff-el-form-check - Checkbox wrapper
- .ff-el-form-check-label - Checkbox label
- .ff-el-form-check-input - Checkbox input

Submit Button:
- .ff-btn-submit - Submit button
- .ff_submit_btn_wrapper - Button container

Common Modifiers:
- .ff-el-is-required - Required field labels
- .asterisk-right - Asterisk positioning
- .ff-form-loaded - Form loaded state
- [aria-invalid=\"true\"] - Invalid fields
- [aria-required=\"true\"] - Required fields

Field ID Pattern: ff_{FORM_ID}_{FIELD_NAME}

EXAMPLE CSS STRUCTURE:
```css
.fluent_form_FF_ID {
    /* Main form styles with proper margin */
    margin: 20px auto;
    padding: 30px;
}

.fluent_form_FF_ID .ff-el-group {
    /* Field group spacing */
    margin-bottom: 20px;
}

.fluent_form_FF_ID .ff-el-input--label {
    /* Label spacing */
    margin-bottom: 8px;
}

.fluent_form_FF_ID .ff-el-form-control {
    /* Input field styles with proper padding */
    padding: 12px 15px;
    width: 100%;
    box-sizing: border-box;
}

.fluent_form_FF_ID .ff-btn-submit {
    /* Submit button styles */
    padding: 14px 28px;
    margin-top: 25px;
}
```

IMPORTANT CSS Guidelines:
1. Always use .fluent_form_FF_ID as the main selector
2. Use standard CSS syntax - avoid complex CSS custom property combinations
3. Use rgba() with direct color values instead of CSS variables in rgba()
4. Ensure all CSS selectors are properly closed with braces
5. For background images/backdrops: Use CSS gradients, patterns, or data URIs
6. Example background patterns:
   - Linear gradients: background: linear-gradient(45deg, #color1, #color2)
   - Radial gradients: background: radial-gradient(circle, #color1, #color2)
   - Patterns: background: repeating-linear-gradient(45deg, #color1, #color1 10px, #color2 10px, #color2 20px)
";
    }

    /**
     * Generate preview CSS for testing
     */
    private function generatePreviewCss($styles, $formId)
    {
        $css = '';

        // Handle different response formats
        if (isset($styles['css'])) {
            $css = $styles['css'];
        } elseif (is_string($styles)) {
            $css = $styles;
        } elseif (is_array($styles) && !empty($styles)) {
            // If it's an array, try to find CSS content
            foreach ($styles as $key => $value) {
                if (is_string($value) && (strpos($value, '{') !== false || strpos($value, 'css') !== false)) {
                    $css = $value;
                    break;
                }
            }
            // If still no CSS found, try the first value
            if (empty($css)) {
                $css = reset($styles);
            }
        }

        if (!empty($css) && is_string($css)) {
            return $this->scopeCssWithFormId($css, $formId);
        }

        return '';
    }

    /**
     * Generate final CSS with proper form ID scoping
     */
    private function generateFinalCss($styles, $formId)
    {
        if (isset($styles['css'])) {
            $css = $this->scopeCssWithFormId($styles['css'], $formId);

            // Validate CSS before returning
            $errors = $this->validateCss($css);
            if (!empty($errors)) {
                // Log errors for debugging but still return cleaned CSS
                error_log('AI Form Styler CSS validation warnings: ' . implode(', ', $errors));
            }

            return $css;
        }

        return '';
    }

    /**
     * Scope CSS selectors with form ID using Fluent Forms official selector
     */
    private function scopeCssWithFormId($css, $formId)
    {
        $officialSelector = ".fluent_form_FF_ID";

        // Replace any existing form selectors with the official one
        $css = str_replace(".fluentform_{$formId}", $officialSelector, $css);
        $css = str_replace(".fluentform", $officialSelector, $css);

        // Replace placeholders - FF_ID will be dynamically replaced by Fluent Forms
        $css = str_replace('{form_id}', 'FF_ID', $css);

        // Basic CSS cleanup and validation
        $css = $this->cleanupCss($css);

        return $css;
    }

    /**
     * Clean up and validate CSS
     */
    private function cleanupCss($css)
    {
        // Remove any malformed CSS custom property usage in rgba()
        $css = preg_replace('/rgba\(var\([^)]+\),\s*[\d.]+\)/', 'rgba(255, 107, 107, 0.5)', $css);

        // Fix missing closing braces by counting opening and closing braces
        $openBraces = substr_count($css, '{');
        $closeBraces = substr_count($css, '}');

        if ($openBraces > $closeBraces) {
            // Add missing closing braces
            $css .= str_repeat('}', $openBraces - $closeBraces);
        }

        // Remove problematic :root definitions that cause parsing issues
        $css = preg_replace('/:root\s*\{[^}]*--primary-color-rgb[^}]*\}/', '', $css);

        // Replace complex CSS variable usage with direct values
        $css = str_replace('rgba(var(--primary-color-rgb), 0.5)', 'rgba(255, 107, 107, 0.5)', $css);
        $css = str_replace('rgba(var(--primary-color-rgb), 0.3)', 'rgba(255, 107, 107, 0.3)', $css);

        // Fix CSS custom property definitions that might cause ACE editor issues
        $css = preg_replace('/--[\w-]+:\s*[\d,\s]+;/', '', $css);

        // Remove any incomplete CSS rules at the end
        $css = preg_replace('/[^}]*$/', '', $css);

        // Ensure proper CSS structure - remove any orphaned properties
        $css = preg_replace('/^\s*[^{]*:\s*[^;]*;/', '', $css);

        // Format CSS properly with line breaks and indentation
        $css = $this->formatCss($css);

        return $css;
    }

    /**
     * Format CSS with proper line breaks and indentation for readability
     */
    private function formatCss($css)
    {
        // Convert \n to actual line breaks first
        $css = str_replace('\\n', "\n", $css);

        // Remove all existing whitespace first
        $css = preg_replace('/\s+/', ' ', $css);
        $css = trim($css);

        // Add line breaks after opening braces
        $css = str_replace('{', "{\n", $css);

        // Add line breaks after closing braces
        $css = str_replace('}', "}\n\n", $css);

        // Add line breaks after semicolons (but not inside comments)
        $css = preg_replace('/;(?![^\/\*]*\*\/)/', ";\n", $css);

        // Add proper indentation
        $lines = explode("\n", $css);
        $formatted = [];
        $indentLevel = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                $formatted[] = '';
                continue;
            }

            // Decrease indent for closing braces
            if (strpos($line, '}') !== false) {
                $indentLevel--;
            }

            // Add indentation
            $indent = str_repeat('  ', max(0, $indentLevel));
            $formatted[] = $indent . $line;

            // Increase indent for opening braces
            if (strpos($line, '{') !== false) {
                $indentLevel++;
            }
        }

        // Join lines and clean up extra blank lines
        $css = implode("\n", $formatted);
        $css = preg_replace('/\n{3,}/', "\n\n", $css);

        return trim($css);
    }

    /**
     * Validate CSS syntax for common issues that cause ACE editor errors
     */
    private function validateCss($css)
    {
        $errors = [];

        // Check for balanced braces
        $openBraces = substr_count($css, '{');
        $closeBraces = substr_count($css, '}');

        if ($openBraces !== $closeBraces) {
            $errors[] = 'Unbalanced braces: ' . $openBraces . ' opening, ' . $closeBraces . ' closing';
        }

        // Check for incomplete CSS rules
        if (preg_match('/[^}]\s*$/', trim($css))) {
            $errors[] = 'CSS appears to end with incomplete rule';
        }

        // Check for problematic CSS custom property usage
        if (preg_match('/rgba\(var\([^)]+\)/', $css)) {
            $errors[] = 'Complex CSS custom property usage in rgba() detected';
        }

        return $errors;
    }
}
