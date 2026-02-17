<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Template variables in view files
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
      style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
<head>
    <meta name="viewport" content="width=device-width"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <title><?php esc_html_e('Email Summary', 'fluentform'); ?></title>
    <style type="text/css">
        .summary_table {
            width: 100%;
            text-align: left;
            border-collapse: collapse;
        }

        .summary_table tr td {
            border: 1px solid #e0e0e0;
            padding: 4px 10px;
        }

        .summary_table tr th {
            border: 1px solid #e0e0e0;
            padding: 8px 10px;
        }

        thead {
            background: #f6f6f6;
        }

        img {
            max-width: 100%;
        }

        body {
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: none;
            width: 100% !important;
            height: 100%;
            line-height: 1.6em;
        }

        body {
            background-color: #f6f6f6;
        }

        @media only screen and (max-width: 640px) {
            body {
                padding: 0 !important;
            }

            h1 {
                font-weight: 800 !important;
                margin: 20px 0 5px !important;
            }

            h2 {
                font-weight: 800 !important;
                margin: 20px 0 5px !important;
            }

            h3 {
                font-weight: 800 !important;
                margin: 20px 0 5px !important;
            }

            h4 {
                font-weight: 800 !important;
                margin: 20px 0 5px !important;
            }

            h1 {
                font-size: 22px !important;
            }

            h2 {
                font-size: 18px !important;
            }

            h3 {
                font-size: 16px !important;
            }

            .container {
                padding: 0 !important;
                width: 100% !important;
            }

            .content {
                padding: 0 !important;
            }

            .content-wrap {
                padding: 10px !important;
            }

            .invoice {
                width: 100% !important;
            }
        }
    </style>
</head>
<body itemscope itemtype="http://schema.org/EmailMessage"
      style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: none; width: 100% !important; height: 100%; line-height: 1.6em; background-color: #f6f6f6; margin: 0;"
      bgcolor="#f6f6f6">
<table class="body-wrap"
       style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; background-color: #f6f6f6; margin: 0;"
       bgcolor="#f6f6f6">
    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
        <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;"
            valign="top"></td>
        <td class="container" width="600"
            style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; display: block !important; max-width: 600px !important; clear: both !important; margin: 0 auto;"
            valign="top">
            <div class="content"
                 style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; max-width: 600px; display: block; margin: 0 auto; padding: 20px;">
                <table class="main" width="100%" cellpadding="0" cellspacing="0"
                       style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; border-radius: 3px; background-color: #fff; margin: 0; border: 1px solid #e9e9e9;"
                       bgcolor="#fff">
                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="alert alert-warning"
                            style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 16px; vertical-align: top; color: #fff; font-weight: 500; text-align: center; border-radius: 3px 3px 0 0; background-color: #673ab7; margin: 0; padding: 20px;"
                            align="center" bgcolor="#FF9F00" valign="top">
                            <?php
                            if ( ! empty( $single_form ) && ! empty( $form_title ) ) {
                                /* translators: %s: form title */
                                echo esc_html( sprintf( __( 'Weekly Email Summary for %s', 'fluentform' ), $form_title ) );
                            } else {
                                esc_html_e( 'Weekly Email Summary of Your Forms', 'fluentform' );
                            }
                            ?>
                        </td>
                    </tr>
                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <td class="content-wrap"
                            style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 20px;"
                            valign="top">
                            <table width="100%" cellpadding="0" cellspacing="0"
                                   style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                    <td class="content-block"
                                        style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;"
                                        valign="top">
                                        <b><?php esc_html_e('Hello There,', 'fluentform'); ?></b><br/>
                                        <?php
                                        if ( ! empty( $single_form ) ) {
                                            printf(
                                                /* translators: %d is the number of days */
                                                esc_html__( 'Here is how this form performed in the last %d days.', 'fluentform' ),
                                                intval( $days )
                                            );
                                        } else {
                                            printf(
                                                /* translators: %d is the Number Email Summary Days */
                                                esc_html__( 'Let\'s see how your forms performed in the last %d days.', 'fluentform' ),
                                                intval( $days )
                                            );
                                        }
                                        ?>
                                    </td>
                                </tr>
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                    <td class="content-block"
                                        style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;"
                                        valign="top">
                                        <?php
                                        $has_submissions = ! empty( $submissions ) && ( is_array( $submissions ) ? count( $submissions ) : ( method_exists( $submissions, 'count' ) ? $submissions->count() : 0 ) ) > 0;
                                        $has_draft_column = false;
                                        if ( $has_submissions ) {
                                            foreach ( $submissions as $s ) {
                                                $dt = isset( $s->draft_total ) ? (int) $s->draft_total : 0;
                                                if ( $dt > 0 ) {
                                                    $has_draft_column = true;
                                                    break;
                                                }
                                            }
                                        }
                                        $draft_total_display = isset( $draft_total ) ? (int) $draft_total : 0;
                                        if ( $has_submissions ) :
                                        ?>
                                        <table class="summary_table">
                                            <thead>
                                            <tr>
                                                <th><?php esc_html_e('Form', 'fluentform'); ?></th>
                                                <th><?php esc_html_e('Entries', 'fluentform'); ?></th>
                                                <?php if ( $has_draft_column ) : ?>
                                                <th><?php esc_html_e('Incomplete', 'fluentform'); ?></th>
                                                <?php endif; ?>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <?php foreach ($submissions as $submission): ?>
                                                <tr>
                                                    <td><?php echo esc_html($submission->title); ?></td>
                                                    <td><?php echo esc_attr($submission->total); ?></td>
                                                    <?php if ( $has_draft_column ) : ?>
                                                    <td><?php echo esc_attr( isset( $submission->draft_total ) ? (int) $submission->draft_total : 0 ); ?></td>
                                                    <?php endif; ?>
                                                </tr>
                                            <?php endforeach; ?>
                                            </tbody>
                                        </table>
                                        <?php elseif ( ! empty( $single_form ) && $draft_total_display > 0 ) : ?>
                                        <p>
                                            <?php
                                            printf(
                                                /* translators: %d is the number of days */
                                                esc_html__( 'No completed entries were received for this form in the last %d days.', 'fluentform' ),
                                                intval( $days )
                                            );
                                            ?>
                                        </p>
                                        <p>
                                            <?php
                                            printf(
                                                /* translators: %s: number of incomplete/draft submissions */
                                                esc_html__( 'Incomplete (draft) submissions: %s', 'fluentform' ),
                                                '<strong>' . esc_html( (string) $draft_total_display ) . '</strong>'
                                            );
                                            ?>
                                        </p>
                                        <?php else : ?>
                                        <p>
                                            <?php
                                            if ( ! empty( $single_form ) ) {
                                                printf(
                                                    /* translators: %d is the number of days */
                                                    esc_html__( 'No entries were received for this form in the last %d days.', 'fluentform' ),
                                                    intval( $days )
                                                );
                                            } else {
                                                printf(
                                                    /* translators: %d is the number of days */
                                                    esc_html__( 'No entries were received in the last %d days.', 'fluentform' ),
                                                    intval( $days )
                                                );
                                            }
                                            ?>
                                        </p>
                                        <?php endif; ?>
                                    </td>
                                </tr>

                                <?php if ( ! empty( $integration_stats ) && is_array( $integration_stats ) ) : ?>
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                    <td class="content-block"
                                        style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;"
                                        valign="top">
                                        <h3><?php esc_html_e('Integrations', 'fluentform'); ?></h3>
                                        <?php
                                        $has_processing = false;
                                        foreach ( $integration_stats as $maybe_counts ) {
                                            if ( is_array( $maybe_counts ) && ! empty( $maybe_counts['processing'] ) ) {
                                                $has_processing = true;
                                                break;
                                            }
                                        }
                                        ?>
                                        <table class="summary_table">
                                            <thead>
                                            <tr>
                                                <th><?php esc_html_e('Integration', 'fluentform'); ?></th>
                                                <th><?php esc_html_e('Successful', 'fluentform'); ?></th>
                                                <th><?php esc_html_e('Failed', 'fluentform'); ?></th>
                                                <?php if ( $has_processing ) : ?>
                                                    <th><?php esc_html_e('Processing', 'fluentform'); ?></th>
                                                <?php endif; ?>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <?php foreach ( $integration_stats as $name => $counts ) : ?>
                                                <tr>
                                                    <td><?php echo esc_html( $name ); ?></td>
                                                    <td><?php echo esc_attr( (string) ( isset( $counts['success'] ) ? $counts['success'] : 0 ) ); ?></td>
                                                    <td><?php echo esc_attr( (string) ( isset( $counts['failed'] ) ? $counts['failed'] : 0 ) ); ?></td>
                                                    <?php if ( $has_processing ) : ?>
                                                        <td><?php echo esc_attr( (string) ( isset( $counts['processing'] ) ? $counts['processing'] : 0 ) ); ?></td>
                                                    <?php endif; ?>
                                                </tr>
                                            <?php endforeach; ?>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <?php endif; ?>

                                <?php if ($payments): ?>
                                    <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                        <td class="content-block"
                                            style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;"
                                            valign="top">
                                            <h3><?php esc_html_e('Payments', 'fluentform'); ?></h3>
                                            <table class="summary_table">
                                                <thead>
                                                <tr>
                                                    <th><?php esc_html_e('Form', 'fluentform'); ?></th>
                                                    <th><?php esc_html_e('Payment Total', 'fluentform'); ?></th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <?php foreach ($payments as $payment): ?>
                                                    <tr>
                                                        <td><?php echo esc_html($payment->title); ?></td>
                                                        <td><?php echo esc_attr($payment->readable_amount); ?></td>
                                                    </tr>
                                                <?php endforeach; ?>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                <?php endif; ?>

                                <?php if ( ! empty( $single_form ) && ! empty( $form_id ) ) : ?>
                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                    <td class="content-block"
                                        style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;"
                                        valign="top">
                                        <a href="<?php echo esc_url( admin_url( 'admin.php?page=fluent_forms&route=entries&form_id=' . intval( $form_id ) ) ); ?>"><?php esc_html_e( 'View entries', 'fluentform' ); ?></a>
                                        &nbsp;|&nbsp;
                                        <a href="<?php echo esc_url( admin_url( 'admin.php?page=fluent_forms_reports&form_id=' . intval( $form_id ) . '&range=week' ) ); ?>"><?php esc_html_e( 'View Reports', 'fluentform' ); ?></a>
                                    </td>
                                </tr>
                                <?php endif; ?>

                                <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                                    <td class="content-block"
                                        style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0; padding: 0 0 20px;"
                                        valign="top">
                                        <?php
                                        $generateText = sprintf(
                                            /* translators: 1: opening anchor tag, 2: site name, 3: closing anchor tag */
                                            __('This email has been generated from Fluent Forms at %1$s%2$s%3$s.', 'fluentform'),
                                            '<a href="' .  site_url() . '">',
                                            get_bloginfo('name'),
                                            '</a>'
                                        );
                                        $generateText = apply_filters_deprecated(
                                            'fluentform_email_summary_body_text',
                                            [
                                                $generateText,
                                                $submissions
                                            ],
                                            FLUENTFORM_FRAMEWORK_UPGRADE,
                                            'fluentform/email_summary_body_text',
                                            'Use fluentform/email_summary_body_text instead of fluentform_email_summary_body_text.'
                                        );
                                        $generateText = apply_filters('fluentform/email_summary_body_text', $generateText, $submissions);
                                        ?>
                                        <?php echo wp_kses_post($generateText); ?>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <div class="footer"
                     style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; width: 100%; clear: both; color: #999; margin: 0; padding: 20px;">
                    <table width="100%"
                           style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                        <tr style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; margin: 0;">
                            <td class="aligncenter content-block"
                                style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 12px; vertical-align: top; color: #999; text-align: center; margin: 0; padding: 0 0 20px;"
                                align="center" valign="top">
                                <?php
                                if ( ! empty( $single_form ) && ! empty( $form_id ) ) {
                                    $site_url     = site_url();
                                    $settings_url = admin_url(
                                        'admin.php?page=fluent_forms&form_id=' . intval( $form_id ) . '&route=settings&sub_route=form_settings#/basic_settings'
                                    );
                                    $footerText   = sprintf(
                                        /* translators: 1: opening anchor to site URL, 2: site URL text, 3: closing anchor, 4: opening anchor to per-form settings, 5: closing anchor */
                                        __( 'This email has been sent from %1$s%2$s%3$s via Fluent Forms. You can disable this email from %4$shere%5$s', 'fluentform' ),
                                        '<a href="' . esc_url( $site_url ) . '">',
                                        esc_html( $site_url ),
                                        '</a>',
                                        '<a href="' . esc_url( $settings_url ) . '">',
                                        '</a>'
                                    );
                                } else {
                                    $footerText = sprintf(
                                        /* translators: 1: opening anchor tag to site, 2: closing anchor tag, 3: opening anchor tag to settings, 4: closing anchor tag */
                                        __( 'This email has been sent from %1$syour website%2$s via Fluent Forms. You can disable this email from %3$shere%4$s', 'fluentform' ),
                                        '<a href="' . site_url() . '">',
                                        '</a>',
                                        '<a href="' . admin_url( 'admin.php?page=fluent_forms_settings' ) . '">',
                                        '</a>'
                                    );
                                }
                                $footerText = apply_filters_deprecated(
                                    'fluentform_email_summary_footer_text',
                                    [
                                        $footerText,
                                    ],
                                    FLUENTFORM_FRAMEWORK_UPGRADE,
                                    'fluentform/email_summary_footer_text',
                                    'Use fluentform/email_summary_footer_text instead of fluentform_email_summary_footer_text.'
                                );
                                $footerText = apply_filters( 'fluentform/email_summary_footer_text', $footerText );
                                ?>
                                <p>
                                    <?php echo wp_kses_post( $footerText ); ?>
                                </p>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </td>
        <td style="font-family: 'Helvetica Neue',Helvetica,Arial,sans-serif; box-sizing: border-box; font-size: 14px; vertical-align: top; margin: 0;"
            valign="top"></td>
    </tr>
</table>
</body>
</html>
