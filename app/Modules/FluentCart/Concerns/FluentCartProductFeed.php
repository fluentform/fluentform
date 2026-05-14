<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

use FluentCart\App\CPT\FluentProducts;
use FluentCart\App\Models\ProductDetail;
use FluentCart\App\Models\ProductMeta;
use FluentCart\App\Models\ProductVariation;
use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Support\Arr;

trait FluentCartProductFeed
{
    protected $fluentCartProductFeedKey = 'fluent_cart_product';

    protected $fluentCartProductFeedMetaKey = 'fluent_cart_product_feed';

    public function addFluentCartProductFeedType($types, $formId)
    {
        $types[] = $this->fluentCartProductFeedMetaKey;

        return array_values(array_unique($types));
    }

    public function addFluentCartProductFeedActiveType($types, $formId)
    {
        $types[$this->fluentCartProductFeedMetaKey] = $this->fluentCartProductFeedKey;

        return $types;
    }

    public function addFluentCartProductFeedIntegration($integrations, $formId)
    {
        $integrations[$this->fluentCartProductFeedKey] = [
            'title'                 => __('Fluent Cart Product', 'fluentform'),
            'logo'                  => defined('FLUENTCART_URL') ? FLUENTCART_URL . 'assets/images/logo/logo.svg' : '',
            'is_active'             => $this->canCreateFluentCartProducts(),
            'configure_title'       => __('Fluent Cart is required', 'fluentform'),
            'configure_message'     => __('Install and activate Fluent Cart to create products from form submissions.', 'fluentform'),
            'configure_button_text' => __('Install Fluent Cart', 'fluentform'),
        ];

        return $integrations;
    }

    public function formatFluentCartProductFeedListItem($feedData, $feed)
    {
        $feedData['name'] = Arr::get($feedData, 'name') ?: __('Fluent Cart Product', 'fluentform');
        $feedData['provider'] = $this->fluentCartProductFeedKey;
        $feedData['provider_title'] = __('Fluent Cart Product', 'fluentform');
        $feedData['provider_logo'] = defined('FLUENTCART_URL') ? FLUENTCART_URL . 'assets/images/logo/logo.svg' : '';

        return $feedData;
    }

    public function getFluentCartProductFeedDefaults($settings, $formId)
    {
        return [
            'conditionals'       => [
                'conditions' => [],
                'status'     => false,
                'type'       => 'all',
            ],
            'enabled'            => true,
            'name'               => '',
            'product_title'      => '',
            'short_description'  => '',
            'description'        => '',
            'price'              => '',
            'sku'                => '',
            'stock_quantity'     => '',
            'product_custom_fields' => [
                [
                    'label'      => '',
                    'item_value' => '',
                ],
            ],
            'product_image'      => '',
            'post_status'        => 'draft',
            'fulfillment_type'   => 'digital',
        ];
    }

    public function getFluentCartProductFeedSettingsFields($settings, $formId)
    {
        return [
            'fields' => [
                [
                    'key'         => 'name',
                    'label'       => __('Name', 'fluentform'),
                    'required'    => true,
                    'placeholder' => __('Your Feed Name', 'fluentform'),
                    'component'   => 'text',
                ],
                [
                    'key'         => 'product_title',
                    'label'       => __('Product Title', 'fluentform'),
                    'required'    => true,
                    'placeholder' => __('Example: {inputs.product_name}', 'fluentform'),
                    'component'   => 'value_text',
                    'inline_tip'  => __('Use smartcodes to create a Fluent Cart product title from the submitted form data.', 'fluentform'),
                ],
                [
                    'key'         => 'price',
                    'label'       => __('Price', 'fluentform'),
                    'required'    => true,
                    'placeholder' => __('Example: 49.99', 'fluentform'),
                    'component'   => 'value_text',
                    'inline_tip'  => __('Provide a decimal amount or a smartcode that resolves to a number.', 'fluentform'),
                ],
                [
                    'key'         => 'sku',
                    'label'       => __('SKU', 'fluentform'),
                    'placeholder' => __('Optional SKU', 'fluentform'),
                    'component'   => 'value_text',
                ],
                [
                    'key'         => 'stock_quantity',
                    'label'       => __('Stock Quantity', 'fluentform'),
                    'placeholder' => __('Leave empty to disable stock management', 'fluentform'),
                    'component'   => 'value_text',
                    'inline_tip'  => __('Use a numeric value or an input smartcode, for example {inputs.quantity}. Do not use label smartcodes here.', 'fluentform'),
                ],
                [
                    'key'       => 'fulfillment_type',
                    'label'     => __('Product Type', 'fluentform'),
                    'component' => 'select',
                    'options'   => [
                        'digital'  => __('Digital', 'fluentform'),
                        'physical' => __('Physical', 'fluentform'),
                    ],
                ],
                [
                    'key'       => 'post_status',
                    'label'     => __('Product Status', 'fluentform'),
                    'component' => 'select',
                    'options'   => [
                        'draft'   => __('Draft', 'fluentform'),
                        'publish' => __('Published', 'fluentform'),
                    ],
                ],
                [
                    'key'        => 'short_description',
                    'label'      => __('Short Description', 'fluentform'),
                    'component'  => 'value_textarea',
                    'inline_tip' => __('Shown as the Fluent Cart product excerpt.', 'fluentform'),
                ],
                [
                    'key'       => 'description',
                    'label'     => __('Description', 'fluentform'),
                    'component' => 'value_textarea',
                ],
                [
                    'key'         => 'product_image',
                    'label'       => __('Product Image', 'fluentform'),
                    'placeholder' => __('Attachment ID or uploaded file URL', 'fluentform'),
                    'component'   => 'value_text',
                    'inline_tip'  => __('Use an upload field smartcode or attachment ID. The first URL will be used.', 'fluentform'),
                ],
                [
                    'key'         => 'product_custom_fields',
                    'label'       => __('Custom Fields', 'fluentform'),
                    'component'   => 'dropdown_many_fields',
                    'remote_text' => __('Fluent Cart Field', 'fluentform'),
                    'local_text'  => __('Form Value', 'fluentform'),
                    'options'     => $this->getFluentCartProductCustomFieldOptions(),
                    'inline_tip'  => __('Map submitted values into Fluent Cart product custom fields. Each row is stored as product meta.', 'fluentform'),
                ],
                [
                    'key'       => 'conditionals',
                    'label'     => __('Conditional Logics', 'fluentform'),
                    'tips'      => __('Create the Fluent Cart product only when conditions match.', 'fluentform'),
                    'component' => 'conditional_block',
                ],
                [
                    'key'            => 'enabled',
                    'label'          => __('Status', 'fluentform'),
                    'component'      => 'checkbox-single',
                    'checkbox_label' => __('Enable This Feed', 'fluentform'),
                ],
            ],
            'integration_title' => __('Fluent Cart Product', 'fluentform'),
        ];
    }

    public function sanitizeFluentCartProductFeedValues($settings, $integrationId, $formId)
    {
        $defaults = $this->getFluentCartProductFeedDefaults([], $formId);
        $settings = wp_parse_args($settings, $defaults);

        foreach (['name', 'product_title', 'price', 'sku', 'stock_quantity', 'product_image'] as $key) {
            $settings[$key] = sanitize_text_field((string) Arr::get($settings, $key, ''));
        }

        $settings['short_description'] = sanitize_textarea_field((string) Arr::get($settings, 'short_description', ''));
        $settings['description'] = wp_kses_post((string) Arr::get($settings, 'description', ''));
        $settings['post_status'] = in_array($settings['post_status'], ['draft', 'publish'], true) ? $settings['post_status'] : 'draft';
        $settings['fulfillment_type'] = in_array($settings['fulfillment_type'], ['digital', 'physical'], true) ? $settings['fulfillment_type'] : 'digital';
        $settings['enabled'] = $this->isTruthySetting($settings['enabled']);
        $settings['product_custom_fields'] = $this->sanitizeFluentCartProductCustomFields(Arr::get($settings, 'product_custom_fields', []));

        if (isset($settings['conditionals']['status'])) {
            $settings['conditionals']['status'] = $this->isTruthySetting($settings['conditionals']['status']);
        }

        return $settings;
    }

    public function setFluentCartProductFeedMetaKey($data, $integrationId)
    {
        $data['meta_key'] = $this->fluentCartProductFeedMetaKey;

        return $data;
    }

    public function createFluentCartProductFromFeed($feed, $formData, $entry, $form)
    {
        $formId = absint(is_object($form) ? $form->id : Arr::get($form, 'id'));
        $entryId = absint(is_object($entry) ? $entry->id : Arr::get($entry, 'id'));

        try {
            if (!$this->canCreateFluentCartProducts()) {
                throw new \RuntimeException(__('Fluent Cart product API is not available.', 'fluentform'));
            }

            $values = Arr::get($feed, 'processedValues', Arr::get($feed, 'settings', []));
            $title = sanitize_text_field((string) Arr::get($values, 'product_title', ''));
            $price = $this->parseFluentCartProductPrice(Arr::get($values, 'price', ''));

            if (!$title) {
                throw new \RuntimeException(__('Product title is required.', 'fluentform'));
            }

            if ($price === null) {
                throw new \RuntimeException(__('Product price must be a valid number.', 'fluentform'));
            }

            $stockQuantity = $this->parseOptionalPositiveInteger(Arr::get($values, 'stock_quantity', ''));
            $imageMedia = $this->resolveFluentCartProductImage(Arr::get($values, 'product_image', ''));

            $created = $this->insertFluentCartProductFromFeedValues($values, $title, $price, $stockQuantity, $imageMedia);
            $productId = absint(Arr::get($created, 'product_id'));
            $variationId = absint(Arr::get($created, 'variation_id'));

            update_post_meta($productId, '_fluentform_source_form_id', $formId);
            update_post_meta($productId, '_fluentform_source_entry_id', $entryId);
            update_post_meta($productId, '_fluentform_source_feed_id', absint(Arr::get($feed, 'id')));

            if ($entryId) {
                Helper::setSubmissionMeta($entryId, '_ff_fluentcart_created_product_id', $productId, $formId);
                Helper::setSubmissionMeta($entryId, '_ff_fluentcart_created_variation_id', $variationId, $formId);
                Helper::setSubmissionMeta($entryId, '_ff_fluentcart_product_feed_id', absint(Arr::get($feed, 'id')), $formId);
            }

            do_action('fluentform/integration_action_result', $feed, 'success', sprintf(
                __('Fluent Cart product %s has been created.', 'fluentform'),
                '<a href="' . esc_url($this->getFluentCartProductAdminUrl($productId)) . '" target="_blank" rel="noopener">#' . absint($productId) . '</a>'
            ));
        } catch (\Throwable $exception) {
            do_action('fluentform/integration_action_result', $feed, 'failed', $exception->getMessage());
        }
    }

    protected function canCreateFluentCartProducts()
    {
        return class_exists(FluentProducts::class)
            && class_exists(ProductDetail::class)
            && class_exists(ProductVariation::class)
            && class_exists(ProductMeta::class);
    }

    protected function getFluentCartProductAdminUrl($productId)
    {
        return admin_url('admin.php?page=fluent-cart#/products/' . absint($productId));
    }

    protected function insertFluentCartProductFromFeedValues($values, $title, $price, $stockQuantity, $imageMedia)
    {
        $postStatus = Arr::get($values, 'post_status') === 'publish' ? 'publish' : 'draft';
        $fulfillmentType = Arr::get($values, 'fulfillment_type') === 'physical' ? 'physical' : 'digital';
        $priceInCents = absint(round($price * 100));
        $manageStock = $stockQuantity !== null ? 1 : 0;
        $stockStatus = (!$manageStock || $stockQuantity > 0) ? 'in-stock' : 'out-of-stock';

        $productId = wp_insert_post([
            'post_title'   => $title,
            'post_name'    => sanitize_title($title),
            'post_content' => wp_kses_post((string) Arr::get($values, 'description', '')),
            'post_excerpt' => sanitize_textarea_field((string) Arr::get($values, 'short_description', '')),
            'post_status'  => $postStatus,
            'post_type'    => FluentProducts::CPT_NAME,
            'post_author'  => get_current_user_id(),
        ], true);

        if (is_wp_error($productId)) {
            throw new \RuntimeException($productId->get_error_message());
        }

        $detail = null;
        $variation = null;

        try {
            $detailData = [
                'post_id'               => $productId,
                'fulfillment_type'      => $fulfillmentType,
                'variation_type'        => 'simple',
                'manage_stock'          => $manageStock,
                'stock_availability'    => $stockStatus,
                'min_price'             => $priceInCents,
                'max_price'             => $priceInCents,
                'manage_downloadable'   => 0,
                'other_info'            => [
                    'source' => 'fluent_forms',
                ],
            ];

            if ($imageMedia) {
                $detailData['default_media'] = [$imageMedia];
            }

            $detail = ProductDetail::query()->create($detailData);

            if (!$detail) {
                throw new \RuntimeException(__('Failed to create Fluent Cart product detail.', 'fluentform'));
            }

            $variantData = [
                'post_id'          => $productId,
                'serial_index'     => 1,
                'variation_title'  => $title,
                'item_price'       => $priceInCents,
                'compare_price'    => 0,
                'stock_status'     => $stockStatus,
                'payment_type'     => 'onetime',
                'manage_stock'     => $manageStock,
                'total_stock'      => $stockQuantity !== null ? $stockQuantity : 0,
                'available'        => $stockQuantity !== null ? $stockQuantity : 0,
                'committed'        => 0,
                'on_hold'          => 0,
                'fulfillment_type' => $fulfillmentType,
                'item_status'      => 'active',
                'item_cost'        => 0,
                'downloadable'     => 'false',
                'other_info'       => [
                    'description'      => '',
                    'payment_type'     => 'onetime',
                    'billing_summary'  => '',
                    'source'           => 'fluent_forms',
                ],
            ];

            $sku = sanitize_text_field((string) Arr::get($values, 'sku', ''));
            if ($sku && $this->fluentCartTableHasColumn('fct_product_variations', 'sku')) {
                $existingSku = ProductVariation::query()->where('sku', $sku)->first();
                if ($existingSku) {
                    throw new \RuntimeException(sprintf(__('SKU "%s" is already in use.', 'fluentform'), $sku));
                }
                $variantData['sku'] = $sku;
            } elseif ($sku) {
                $variantData['other_info']['sku'] = $sku;
            }

            $variation = ProductVariation::query()->create($variantData);

            if (!$variation) {
                throw new \RuntimeException(__('Failed to create Fluent Cart product variation.', 'fluentform'));
            }

            $detail->update([
                'default_variation_id' => absint($variation->id),
            ]);

            if ($imageMedia) {
                update_post_meta($productId, 'fluent-products-gallery-image', [$imageMedia]);
                if (!empty($imageMedia['id'])) {
                    set_post_thumbnail($productId, absint($imageMedia['id']));
                }
                ProductMeta::query()->create([
                    'object_id'   => absint($variation->id),
                    'object_type' => 'product_variant_info',
                    'meta_key'    => 'product_thumbnail',
                    'meta_value'  => [$imageMedia],
                ]);
            }

            $this->storeFluentCartProductCustomFields($productId, Arr::get($values, 'product_custom_fields', []));

            return [
                'product_id'   => absint($productId),
                'variation_id' => absint($variation->id),
            ];
        } catch (\Throwable $exception) {
            if ($variation) {
                ProductMeta::query()->where('object_id', $variation->id)->where('object_type', 'product_variant_info')->delete();
                $variation->delete();
            }

            if ($detail) {
                $detail->delete();
            }

            wp_delete_post($productId, true);

            throw $exception;
        }
    }

    protected function parseFluentCartProductPrice($value)
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        $value = preg_replace('/[^0-9.,-]/', '', $value);
        $value = str_replace(',', '', $value);

        if (!is_numeric($value) || (float) $value < 0) {
            return null;
        }

        return (float) $value;
    }

    protected function parseOptionalPositiveInteger($value)
    {
        $value = trim((string) $value);

        if ($value === '') {
            return null;
        }

        $value = preg_replace('/[^0-9]/', '', $value);

        if ($value === '') {
            return null;
        }

        return max(0, absint($value));
    }

    protected function resolveFluentCartProductImage($value)
    {
        $value = $this->normalizeFluentCartProductImageValue($value);

        if (!$value) {
            return null;
        }

        $attachmentId = is_numeric($value) ? absint($value) : 0;
        $url = '';

        if (!$attachmentId) {
            if (preg_match('/https?:\/\/[^\s,"\']+/i', $value, $matches)) {
                $url = esc_url_raw($matches[0]);
                $attachmentId = absint(attachment_url_to_postid($url));
            }
        }

        if ($attachmentId) {
            $url = wp_get_attachment_url($attachmentId);
        }

        if (!$url) {
            return null;
        }

        return [
            'id'    => $attachmentId,
            'url'   => esc_url_raw($url),
            'title' => sanitize_text_field(get_the_title($attachmentId)),
        ];
    }

    protected function normalizeFluentCartProductImageValue($value)
    {
        if (is_array($value)) {
            $first = reset($value);

            if (is_array($first)) {
                return (string) (Arr::get($first, 'url') ?: Arr::get($first, 'id'));
            }

            return (string) $first;
        }

        $value = trim((string) $value);

        if (!$value) {
            return '';
        }

        $decoded = json_decode($value, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $this->normalizeFluentCartProductImageValue($decoded);
        }

        $unserialized = maybe_unserialize($value);
        if (is_array($unserialized)) {
            return $this->normalizeFluentCartProductImageValue($unserialized);
        }

        return $value;
    }

    protected function isTruthySetting($value)
    {
        return $value === true || $value === 'true' || $value === 'yes' || $value === '1' || $value === 1;
    }

    protected function sanitizeFluentCartProductCustomFields($fields)
    {
        if (!is_array($fields)) {
            return [];
        }

        $sanitized = [];

        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            $label = sanitize_text_field((string) Arr::get($field, 'label', ''));
            $value = sanitize_text_field((string) Arr::get($field, 'item_value', ''));

            if ($label === '' && $value === '') {
                continue;
            }

            $sanitized[] = [
                'label'      => $label,
                'item_value' => $value,
            ];
        }

        return $sanitized ?: [
            [
                'label'      => '',
                'item_value' => '',
            ],
        ];
    }

    protected function storeFluentCartProductCustomFields($productId, $fields)
    {
        if (!$productId || !is_array($fields)) {
            return;
        }

        $productId = absint($productId);
        $metaValues = [];

        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            $metaKey = sanitize_key(str_replace(' ', '_', (string) Arr::get($field, 'label', '')));

            if (!$metaKey) {
                continue;
            }

            $metaValues[$metaKey] = sanitize_text_field((string) Arr::get($field, 'item_value', ''));
        }

        if (!$metaValues) {
            return;
        }

        $existingMetas = [];
        $existingRows = ProductMeta::query()
            ->where('object_id', $productId)
            ->where('object_type', 'product')
            ->whereIn('meta_key', array_keys($metaValues))
            ->get();

        foreach ($existingRows as $row) {
            $existingMetas[$row->meta_key] = $row;
        }

        $newRows = [];
        $now = current_time('mysql', true);

        foreach ($metaValues as $metaKey => $metaValue) {
            if (!empty($existingMetas[$metaKey])) {
                $existingMetas[$metaKey]->meta_value = $metaValue;
                $existingMetas[$metaKey]->save();
                continue;
            }

            $newRows[] = [
                'object_id'   => absint($productId),
                'object_type' => 'product',
                'meta_key'    => $metaKey,
                'meta_value'  => $metaValue,
                'created_at'  => $now,
                'updated_at'  => $now,
            ];
        }

        if ($newRows) {
            ProductMeta::query()->insert($newRows);
        }
    }

    protected function getFluentCartProductCustomFieldOptions()
    {
        $options = [
            'vendor_code'      => __('Vendor Code', 'fluentform'),
            'external_id'      => __('External ID', 'fluentform'),
            'source_entry_id'  => __('Source Entry ID', 'fluentform'),
            'source_form_id'   => __('Source Form ID', 'fluentform'),
            'manufacturer'     => __('Manufacturer', 'fluentform'),
            'brand'            => __('Brand', 'fluentform'),
            'supplier'         => __('Supplier', 'fluentform'),
            'internal_note'    => __('Internal Note', 'fluentform'),
        ];

        $options = apply_filters('fluent_cart/product_custom_field_options', $options);

        return apply_filters('fluentform/fluent_cart_product_feed_custom_field_options', $options);
    }

    protected function fluentCartTableHasColumn($table, $column)
    {
        static $columns = [];

        global $wpdb;

        $tableName = $wpdb->prefix . $table;

        if (!isset($columns[$tableName])) {
            // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
            $columns[$tableName] = $wpdb->get_col("DESCRIBE `{$tableName}`", 0) ?: [];
        }

        return in_array($column, $columns[$tableName], true);
    }
}
