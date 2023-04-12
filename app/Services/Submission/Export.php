<?php

namespace FluentForm\App\Services\Submission;

use Exception;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\Form\FormDataParser;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;

class Export
{
    /**
     * @var \FluentForm\Framework\Foundation\Application
     */
    protected $app;

    /**
     * @var \FluentForm\App\Models\Submission|\FluentForm\Framework\Database\Query\Builder|\FluentForm\Framework\Database\Orm\Builder
     */
    protected $model;

    public function __construct(Application $application) {
        $this->app = $application;
        $this->model = new Submission;
    }

    public function index()
    {
        $args = $this->app->request->get();
        if (!defined('FLUENTFORM_EXPORTING_ENTRIES')) {
            define('FLUENTFORM_EXPORTING_ENTRIES', true);
        }
        $formId = intval(Arr::get($args, 'form_id'));
        try {
            $form = Form::findOrFail($formId);
        } catch (Exception $e) {
            exit('No Form Found');
        }
        $type = sanitize_key(Arr::get($args,'format', 'csv'));
        if (!in_array($type, ['csv', 'ods', 'xlsx', 'json'])) {
            exit('Invalid requested format');
        }
        if ('json' == $type) {
           $this->exportAsJSON($form, $args);
        }
        if (!defined('FLUENTFORM_DOING_CSV_EXPORT')) {
            define('FLUENTFORM_DOING_CSV_EXPORT', true);
        }
        $formInputs = FormFieldsParser::getEntryInputs($form, ['admin_label', 'raw']);
        $inputLabels = FormFieldsParser::getAdminLabels($form, $formInputs);
        $submissions = $this->getSubmissions($args);
        $submissions = FormDataParser::parseFormEntries($submissions, $form, $formInputs);
        $exportData = [];
        foreach ($submissions as $submission) {
            $submission->response = json_decode($submission->response, true);
            $temp = [];
            foreach ($inputLabels as $field => $label) {
                $content = trim(
                    wp_strip_all_tags(
                        FormDataParser::formatValue(
                            Arr::get($submission->user_inputs, $field)
                        )
                    )
                );
                $temp[] = Helper::sanitizeForCSV($content);
            }

            if ($form->has_payment) {
                $temp[] = round($submission->payment_total / 100, 1);
                $temp[] = $submission->payment_status;
                $temp[] = $submission->currency;
            }

            $temp[] = @$submission->id;
            $temp[] = @$submission->status;
            $temp[] = (string) @$submission->created_at;
            $exportData[] = $temp;
        }

        $extraLabels = [];
        if ($form->has_payment) {
            $extraLabels[] = 'payment_total';
            $extraLabels[] = 'payment_status';
            $extraLabels[] = 'currency';
        }
        $extraLabels[] = 'entry_id';
        $extraLabels[] = 'entry_status';
        $extraLabels[] = 'created_at';
        $inputLabels = array_merge($inputLabels, $extraLabels);
        $data = array_merge([array_values($inputLabels)], $exportData);
        $data = apply_filters_deprecated(
            'fluentform_export_data',
            [
                $data,
                $form,
                $exportData,
                $inputLabels
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/export_data',
            'Use fluentform/export_data instead of fluentform_export_data'
        );
        $data = apply_filters('fluentform/export_data', $data, $form, $exportData, $inputLabels);
        $fileName = sanitize_title($form->title, 'export', 'view') . '-' . date('Y-m-d');
        $this->downloadOfficeDoc($data, $type, $fileName);
    }

    private function exportAsJSON($form, $args)
    {
        $formInputs = FormFieldsParser::getEntryInputs($form, ['admin_label', 'raw']);
        $submissions = $this->getSubmissions($args);
        $submissions = FormDataParser::parseFormEntries($submissions, $form, $formInputs);
        foreach ($submissions as $submission) {
            $submission->response = json_decode($submission->response, true);
        }
        header('Content-disposition: attachment; filename=' . sanitize_title($form->title, 'export', 'view') . '-' . date('Y-m-d') . '.json');
        header('Content-type: application/json');
        echo json_encode($submissions); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $submissions is escaped before being passed in.
        exit();
    }

    private function getSubmissions($args)
    {
        $query = $this->model->customQuery($args);
        $entries = fluentFormSanitizer(Arr::get($args, 'entries', []));
        $query->when(is_array($entries) && (count($entries) > 0), function ($q) use ($entries) {
            return $q->whereIn('id', $entries);
        });
        return $query->get();
    }

    private function downloadOfficeDoc($data, $type = 'csv', $fileName = null)
    {
        $data = array_map(function ($item) {
            return array_map(function ($itemValue) {
                if (is_array($itemValue)) {
                    return implode(', ', $itemValue);
                }
                return $itemValue;
            }, $item);
        }, $data);
        require_once $this->app->make('path.app') . '/Services/Spout/Autoloader/autoload.php';
        $fileName = ($fileName) ? $fileName . '.' . $type : 'export-data-' . date('d-m-Y') . '.' . $type;
        $writer = \Box\Spout\Writer\WriterFactory::create($type);
        $writer->openToBrowser($fileName);
        $writer->addRows($data);
        $writer->close();
        die();
    }
}
