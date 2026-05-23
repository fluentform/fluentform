<?php

namespace Dev\Test\Tests\Conversational;

use Dev\Test\Inc\TestCase;
use FluentForm\App\Services\FluentConversational\Classes\Converter\Converter;

/**
 * Conversational Converter feature anchor — round-trips a form fixture
 * through Converter::convert and asserts the output shape. Mirrors how
 * production calls Converter (see FluentConversational/Classes/Form.php:691
 * which decodes form_fields before calling convert).
 *
 * If this passes, the conversion pipeline is testable end-to-end via the
 * free PHPUnit harness without any conversational-side scaffold.
 */
class TestConverterAnchor extends TestCase
{
    /**
     * Mirror the production decode step before handing the form to Converter.
     */
    private function prepareForConversion($form)
    {
        $form->fields = json_decode($form->form_fields, true);
        return $form;
    }

    public function test_convert_returns_form_object_with_questions_attached()
    {
        $form = $this->prepareForConversion($this->loadFormFixture('single-field'));

        $converted = Converter::convert($form);

        $this->assertIsObject($converted, 'Converter::convert must return an object (mutated form)');
        // Note: property_exists() returns false for properties set dynamically
        // on classes without #[AllowDynamicProperties]. isset() is the correct
        // check here — Form model doesn't declare $questions, Converter sets
        // it via dynamic property assignment.
        $this->assertTrue(
            isset($converted->questions),
            'Converted form must have a questions property (set dynamically by Converter)'
        );
        $this->assertIsArray($converted->questions, 'questions must be an array');
    }

    public function test_convert_emits_at_least_one_question_for_supported_field()
    {
        $form = $this->prepareForConversion($this->loadFormFixture('single-field'));

        $converted = Converter::convert($form);

        $this->assertGreaterThanOrEqual(
            1,
            count($converted->questions),
            'single-field fixture has one input_text → converter must emit at least one question'
        );

        // Spot-check the shape of the first question (mirrors what the Vue
        // frontend reads off the wire).
        $first = $converted->questions[0];
        $this->assertIsArray($first, 'each question must be an associative array');
        $this->assertArrayHasKey('id', $first, 'question must have id');
        $this->assertArrayHasKey('type', $first, 'question must have type');
    }

    public function test_convert_skips_unsupported_field_types_silently()
    {
        // multi-step-with-conditions fixture contains a form_step element
        // (not a supported conversational field type). The converter should
        // skip it without erroring AND the output question count should be
        // strictly LESS than the input field count.
        $form = $this->prepareForConversion($this->loadFormFixture('multi-step-with-conditions'));
        $inputFieldCount = count($form->fields['fields']);

        $converted = Converter::convert($form);

        $this->assertLessThan(
            $inputFieldCount,
            count($converted->questions),
            'converter must skip unsupported types (form_step, section_break) — output should be fewer than input'
        );
    }
}
