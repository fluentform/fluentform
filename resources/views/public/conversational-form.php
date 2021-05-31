<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
        "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>
<head>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
    <meta http-equiv="Imagetoolbar" content="No"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php echo esc_html($meta['title']); ?></title>
    <meta name="description" content="<?php echo strip_tags($meta['description']) ?>">
    <style id="ffc_generated_css" type="text/css">
        <?php echo $generated_css; ?>
    </style>
    <style type="text/css">
        <?php
            echo $submit_css;
        ?>
    </style>

    <style type="text/css">
        body {
            height: 100%;
            width: 100%;
            overflow: hidden;
            margin: 0;
            padding: 0;
            max-width: 100vw;
            font-family: sans-serif;
        }
        html, body, div, span, applet, object, iframe,
        h1, h2, h3, h4, h5, h6, p, blockquote, pre,
        a, abbr, acronym, address, big, cite, code,
        del, dfn, em, img, ins, kbd, q, s, samp,
        small, strike, strong, sub, sup, tt, var,
        b, u, i, center,
        dl, dt, dd, ol, ul, li,
        fieldset, form, label, legend,
        table, caption, tbody, tfoot, thead, tr, th, td,
        article, aside, canvas, details, embed,
        figure, figcaption, footer, header, hgroup,
        menu, nav, output, ruby, section, summary,
        time, mark, audio, video {
            margin: 0;
            padding: 0;
            border: 0;
            font-size: 100%;
            font: inherit;
            vertical-align: baseline;
        }
        /* HTML5 display-role reset for older browsers */
        article, aside, details, figcaption, figure,
        footer, header, hgroup, menu, nav, section {
            display: block;
        }
        body {
            line-height: 1;
        }
        body * {
            box-sizing: border-box;
        }
        ol, ul {
            list-style: none;
        }
        blockquote, q {
            quotes: none;
        }
        blockquote:before, blockquote:after,
        q:before, q:after {
            content: '';
            content: none;
        }
        .ff_conv_app {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
        }
    </style>
</head>
<body class="ff_conversation_page_body  ff_conversation_page_<?php echo $form_id; ?>">
<div class="ffc_conv_wrapper">
    <div class="ff_conv_app ff_conv_app_frame ff_conv_app_<?php echo $form_id; ?>">
        <div style="width: 100%" id="app"></div>
    </div>
</div>
<?php
wp_footer();
?>
</body>
</html>
