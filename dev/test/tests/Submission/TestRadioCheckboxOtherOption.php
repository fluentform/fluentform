<?php

namespace Dev\Test\Tests\Submission;

use Dev\Test\Inc\TestCase;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Modules\Form\FormFieldsParser;

/**
 * Regression tests for the radio/checkbox "Other" option stored value
 * (support ticket #158217): it was saved with a hardcoded English
 * "Other: " prefix instead of the field's (translated) label, which
 * entry details, PDFs and exports display verbatim.
 */
class TestRadioCheckboxOtherOption extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        // Form ids repeat after DB truncation — drop the per-id static cache
        FormFieldsParser::resetData();
    }

    public function test_checkbox_other_value_is_stored_with_the_fields_other_label()
    {
        $form = $this->loadFormFixture('radio-checkbox-other-option');

        $submission = $this->submitFormDirectly($form, [
            'checkbox'                   => ['Item 1', '__ff_other_checkbox__'],
            'checkbox__ff_other_input__' => 'Test',
        ]);
        $response = json_decode($submission->response, true);

        $this->assertSame(
            ['Item 1', 'Autre (préciser): Test'],
            array_values($response['checkbox']),
            'checkbox "Other" value must be stored with the field\'s configured label, not hardcoded English "Other"'
        );
    }

    public function test_radio_other_value_is_stored_with_the_fields_other_label()
    {
        $form = $this->loadFormFixture('radio-checkbox-other-option');

        $submission = $this->submitFormDirectly($form, [
            'input_radio'                   => '__ff_other_input_radio__',
            'input_radio__ff_other_input__' => 'Réfection toiture',
        ]);
        $response = json_decode($submission->response, true);

        $this->assertSame(
            'Autre (préciser): Réfection toiture',
            $response['input_radio'],
            'radio "Other" value must be stored with the field\'s configured label, not hardcoded English "Other"'
        );
    }

    public function test_other_value_falls_back_to_translated_default_when_label_is_empty()
    {
        $form = $this->loadFormFixture('radio-checkbox-other-option');

        // Blank the label so the code falls back to __('Other', 'fluentform')
        $fields = json_decode($form->form_fields, true);
        $fields['fields'][1]['settings']['other_option_label'] = '';
        Form::query()->where('id', $form->id)->update(['form_fields' => json_encode($fields)]);
        $form = Form::find($form->id);
        FormFieldsParser::resetData();

        // Simulate a locale where "Other" is translated
        $translate = function ($translation, $text) {
            return 'Other' === $text ? 'Autre' : $translation;
        };
        add_filter('gettext_fluentform', $translate, 10, 2);

        try {
            $submission = $this->submitFormDirectly($form, [
                'input_radio'                   => '__ff_other_input_radio__',
                'input_radio__ff_other_input__' => 'Test',
            ]);
        } finally {
            remove_filter('gettext_fluentform', $translate, 10);
        }
        $response = json_decode($submission->response, true);

        $this->assertSame(
            'Autre: Test',
            $response['input_radio'],
            'with no configured label, the stored prefix must use the translated __("Other") default'
        );
    }

    /**
     * Translation plugins (WPML etc.) translate field data via the
     * fluentform/rendering_field_data_{element} filter.
     */
    public function test_other_label_respects_rendering_field_data_filter()
    {
        $form = $this->loadFormFixture('radio-checkbox-other-option');

        $translate = function ($data) {
            $data['settings']['other_option_label'] = 'Sonstiges';
            return $data;
        };
        add_filter('fluentform/rendering_field_data_input_radio', $translate);

        try {
            $submission = $this->submitFormDirectly($form, [
                'input_radio'                   => '__ff_other_input_radio__',
                'input_radio__ff_other_input__' => 'Test',
            ]);
        } finally {
            remove_filter('fluentform/rendering_field_data_input_radio', $translate);
        }
        $response = json_decode($submission->response, true);

        $this->assertSame(
            'Sonstiges: Test',
            $response['input_radio'],
            'the stored prefix must use the label provided by the rendering_field_data filter (translation plugins)'
        );
    }

    /**
     * Prepare a field the way FormValidationService hands it to validateInput.
     */
    private function fieldForValidation($form, $key)
    {
        $fields = FormFieldsParser::getInputs($form, ['rules', 'raw']);
        $field = $fields[$key];
        $field['data_key'] = $key;
        $field['name'] = $field['raw']['attributes']['name'];

        return $field;
    }

    public function test_validate_input_accepts_the_localized_other_prefix()
    {
        $form = $this->loadFormFixture('radio-checkbox-other-option');

        $radioError = Helper::validateInput(
            $this->fieldForValidation($form, 'input_radio'),
            ['input_radio' => 'Autre (préciser): Test'],
            $form
        );
        $this->assertSame('', $radioError, 'a localized "Other" radio value must pass validation');

        $checkboxError = Helper::validateInput(
            $this->fieldForValidation($form, 'checkbox'),
            ['checkbox' => ['Item 1', 'Autre (préciser): Test']],
            $form
        );
        $this->assertSame('', $checkboxError, 'a localized "Other" checkbox value must pass validation');
    }

    public function test_validate_input_still_accepts_the_legacy_english_other_prefix()
    {
        $form = $this->loadFormFixture('radio-checkbox-other-option');

        $radioError = Helper::validateInput(
            $this->fieldForValidation($form, 'input_radio'),
            ['input_radio' => 'Other: Something'],
            $form
        );
        $this->assertSame('', $radioError, 'legacy English "Other: " radio value must keep passing validation');

        $checkboxError = Helper::validateInput(
            $this->fieldForValidation($form, 'checkbox'),
            ['checkbox' => ['Item 2', 'Other: Something']],
            $form
        );
        $this->assertSame('', $checkboxError, 'legacy English "Other: " checkbox value must keep passing validation');
    }

    public function test_validate_input_still_rejects_values_outside_the_options()
    {
        $form = $this->loadFormFixture('radio-checkbox-other-option');

        $error = Helper::validateInput(
            $this->fieldForValidation($form, 'input_radio'),
            ['input_radio' => 'totally-not-an-option'],
            $form
        );
        $this->assertNotSame('', $error, 'arbitrary values must still be rejected');

        $checkboxError = Helper::validateInput(
            $this->fieldForValidation($form, 'checkbox'),
            ['checkbox' => ['Item 1', 'rogue-value']],
            $form
        );
        $this->assertNotSame('', $checkboxError, 'arbitrary checkbox values must still be rejected');
    }

    public function test_other_option_value_prefix_builder()
    {
        $build = function ($label) {
            return Helper::getOtherOptionValuePrefix([
                'settings' => ['other_option_label' => $label],
            ]);
        };

        $this->assertSame('Autre (préciser): ', $build('Autre (préciser)'));
        // A label that already ends with a colon must not produce "::"
        $this->assertSame('Autre : ', $build('Autre :'));
        $this->assertSame('Autre: ', $build('Autre:'));
        // Empty label falls back to the (translatable) default
        $this->assertSame('Other: ', $build(''));
        $this->assertSame('Other: ', Helper::getOtherOptionValuePrefix([]));
    }
}
