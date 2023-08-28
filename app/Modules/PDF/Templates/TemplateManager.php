<?php

namespace FluentForm\App\Modules\PDF\Templates;

use FluentForm\App\Services\Emogrifier\Emogrifier;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentFormPdf\Classes\Controller\AvailableOptions;

abstract class TemplateManager
{
    public $workingDir = '';
    public $tempDir = '';
    public $pdfCacheDir = '';

    public $fontDir = '';

    public $headerHtml = '';

    public function __construct()
    {
        $dirStructure = AvailableOptions::getDirStructure();

        $this->workingDir = $dirStructure['workingDir'];
        $this->tempDir = $dirStructure['tempDir'];
        $this->pdfCacheDir = $dirStructure['pdfCacheDir'];
        $this->fontDir = $dirStructure['fontDir'];
    }

    abstract public function getSettingsFields();

    abstract public function generatePdf($submissionId, $settings, $outPut, $fileName = '');

    public function viewPDF($submissionId, $settings)
    {
        $this->generatePdf($submissionId, $settings, 'I');
    }

    /*
     * This name should be unique otherwise, it may just return from another file cache
     */
    public function outputPDF($submissionId, $settings, $fileName = '', $forceClear = false)
    {
        $fileName = $this->pdfCacheDir . '/' . $fileName;
        if (!$forceClear && file_exists($fileName . '.pdf')) {
            return $fileName . '.pdf';
        }

        $this->generatePdf($submissionId, $settings, 'F', $fileName);

        if (file_exists($fileName . '.pdf')) {
            return $fileName . '.pdf';
        }

        return false;
    }

    public function downloadPDF($submissionId, $settings)
    {
        return $this->generatePdf($submissionId, $settings, 'D');
    }

    public function getGenerator($mpdfConfig)
    {
        $defaults = [
            'fontDir' => [
                $this->fontDir
            ],
            'tempDir' => $this->tempDir,
            'curlCaCertificate' => ABSPATH . WPINC . '/certificates/ca-bundle.crt',
            'curlFollowLocation' => true,
            'allow_output_buffering' => true,
            'autoLangToFont' => true,
            'autoScriptToLang' => true,
            'useSubstitutions' => true,
            'ignore_invalid_utf8' => true,
            'setAutoTopMargin' => 'stretch',
            'setAutoBottomMargin' => 'stretch',
            'enableImports' => true,
            'use_kwt' => true,
            'keepColumns' => true,
            'biDirectional' => true,
            'showWatermarkText' => true,
            'showWatermarkImage' => true,
        ];

        $mpdfConfig = wp_parse_args($mpdfConfig, $defaults);

        $mpdfConfig = apply_filters_deprecated(
            'fluentform_mpdf_config',
            [
                $mpdfConfig
            ],
            FLUENTPDF_FRAMEWORK_UPGRADE,
            'fluentform_mpdf_config',
            'Use fluentform_mpdf_config instead of fluentform_mpdf_config.'
        );

        $mpdfConfig = apply_filters('fluentform/mpdf_config', $mpdfConfig);

        if (!class_exists('\Mpdf\Mpdf')) {
            require_once FLUENTFORM_PDF_PATH . 'vendor/autoload.php';
        }

        return new \Mpdf\Mpdf($mpdfConfig);
    }

    public function pdfBuilder($fileName, $feed, $body = '', $footer = '', $outPut = 'I')
    {
        $body = str_replace('{page_break}', '<page_break />', $body);

        $appearance = Arr::get($feed, 'appearance');
        $mpdfConfig = array(
            'mode' => 'utf-8',
            'format' => Arr::get($appearance, 'paper_size'),
            'margin_header' => 10,
            'margin_footer' => 10,
            'orientation' => Arr::get($appearance, 'orientation'),
        );

        if ($fontFamily = Arr::get($appearance, 'font_family')) {
            $mpdfConfig['default_font'] = $fontFamily;
        }

        if (!defined('FLUENTFORMPRO')) {
            $footer .= '<p style="text-align: center;">Powered By <a target="_blank" href="https://wpmanageninja.com/downloads/fluentform-pro-add-on/">Fluent Forms</a></p>';
        }

        $mpdfExtraConfig = [];

        $pdfGenerator = $this->getGenerator($mpdfConfig);
        if (Arr::get($appearance, 'security_pass')) {
            $password = Arr::get($appearance, 'security_pass');
            $mpdfExtraConfig['password'] = $password;
        }

        if (Arr::get($appearance, 'language_direction') == 'rtl') {

            $mpdfExtraConfig['direction'] = 'rtl';
            $body = '<div class="ff_rtl">' . $body . '</div>';
            if ($footer) {
                $footer = '<div class="ff_rtl">' . $footer . '</div>';
            }
            if ($this->headerHtml) {
                $this->headerHtml = '<div class="ff_rtl">' . $this->headerHtml . '</div>';
            }
        }
        if ($this->headerHtml) {
            
            $this->headerHtml = $this->applyInlineCssStyles($this->headerHtml, $appearance);
            $mpdfExtraConfig['htmlHeader'] = $this->headerHtml;
        }

        $body = $this->applyInlineCssStyles($body, $appearance, true);
        if (!empty($appearance['watermark_text']) || !empty($appearance['watermark_image'])) {
            $alpha = Arr::get($appearance, 'watermark_opacity');
            if (!$alpha || $alpha > 100) {
                $alpha = 5;
            }
            $alpha = $alpha / 100;

            if (!empty($appearance['watermark_image'])) {
                $mpdfExtraConfig['watermark_image'] = [
                    'image' => $appearance['watermark_image'],
                    'alpha' => $alpha,
                    'behind' => Arr::isTrue($appearance, 'watermark_img_behind')
                ];

            } else {
                $mpdfExtraConfig['watermark_text'] = [
                    'text' => $appearance['watermark_text'],
                    'alpha' => $alpha,
                ];
            }
        }
        $footer = $this->applyInlineCssStyles($footer, $appearance);
        
        $content = '<div class="ff_pdf_wrapper">' . $body . '</div>';

        do_action('fluent_pdf_make', [
                'footer'=> $footer, 
                'body' => $content
            ], 
            $fileName,
            $outPut,
            $mpdfConfig, 
            $mpdfExtraConfig
        );
        return ;
    }

    public function getPdfCss($appearance)
    {
        $mainColor = Arr::get($appearance, 'font_color');
        if (!$mainColor) {
            $mainColor = '#4F4F4F';
        }
        $secondaryColor = Arr::get($appearance, 'accent_color');
        if (!$secondaryColor) {
            $secondaryColor = '#EAEAEA';
        }
        $headingColor = Arr::get($appearance, 'heading_color');

        $fontSize = Arr::get($appearance, 'font_size', 14);

        ob_start();
?>
        .ff_pdf_wrapper, p, li, td, th {
        color: <?php echo $mainColor; ?>;
        font-size: <?php echo $fontSize; ?>px;
        }

        .ff_all_data, table {
        empty-cells: show;
        border-collapse: collapse;
        border: 1px solid <?php echo $secondaryColor; ?>;
        width: 100%;
        color: <?php echo $mainColor; ?>;
        }
        hr {
        color: <?php echo $secondaryColor; ?>;
        background-color: <?php echo $secondaryColor; ?>;
        }
        h1, h2, h3, h4, h5, h6 {
        color: <?php echo $headingColor; ?>;
        }
        .ff_all_data th {
        border-bottom: 1px solid <?php echo $secondaryColor; ?>;
        border-top: 1px solid <?php echo $secondaryColor; ?>;
        padding-bottom: 10px !important;
        }
        .ff_all_data tr td {
        padding-left: 30px !important;
        padding-top: 15px !important;
        padding-bottom: 15px !important;
        }

        .ff_all_data tr td, .ff_all_data tr th {
        border: 1px solid <?php echo $secondaryColor; ?>;
        text-align: left;
        }

        table, .ff_all_data {width: 100%; overflow:wrap;} img.alignright { float: right; margin: 0 0 1em 1em; }
        img.alignleft { float: left; margin: 0 10px 10px 0; }
        .center-image-wrapper {text-align:center;}
        .center-image-wrapper img.aligncenter {display: initial; margin: 0; text-align: center;}
        .alignright { float: right; }
        .alignleft { float: left; }
        .aligncenter { display: block; margin-left: auto; margin-right: auto; text-align: center; }

        .invoice_title {
        padding-bottom: 10px;
        display: block;
        }
        .ffp_table thead th {
        background-color: #e3e8ee;
        color: #000;
        text-align: left;
        vertical-align: bottom;
        }
        table th {
        padding: 5px 10px;
        }
        .ff_rtl table th, .ff_rtl table td {
        text-align: right !important;
        }
<?php
        $css = ob_get_clean();

        $pdfGeneratorCss = apply_filters_deprecated(
            'fluentform_pdf_generator_css',
            [
                $css,
                $appearance
            ],
            FLUENTPDF_FRAMEWORK_UPGRADE,
            'fluentform/pdf_generator_css',
            'Use fluentform/pdf_generator_css instead of fluentform_pdf_generator_css.'
        );
        return apply_filters('fluentform/pdf_generator_css', $css, $appearance);
    }

    private function applyInlineCssStyles($html, $appearance, $keepBodyTag = false)
    {
        $html = $this->resolveCenteredImage($html);
        try {
            // apply CSS styles inline for picky email clients
            $emogrifier = new Emogrifier($html, $this->getPdfCss($appearance));
            if ($keepBodyTag) {
                $html = $emogrifier->emogrify();
            } else {
                $html = $emogrifier->emogrifyBodyContent();
            }
        } catch (\Exception $e) {
        }
        return $html;
    }

    private function resolveCenteredImage($html)
    {
        if (strpos($html, '<img') === false) {
            return $html;
        }
        preg_match_all('/(<img[^>]+>)/i', $html, $matches);
        foreach ($matches[0] as $image) {
            if (strpos($image, 'aligncenter') !== false) {
                $newImg = "<div class='center-image-wrapper'> $image </div>";
                $newHtml = str_replace($image, $newImg, $html);
                if ($newHtml) {
                    $html = $newHtml;
                }
            }
        }
        return $html;
    }
}
