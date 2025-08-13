import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import fs from 'fs';

let serverConfig = fs.readFileSync('./config/vite.json', 'utf8');
serverConfig = JSON.parse(serverConfig);

const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');
const Components = require('unplugin-vue-components/vite');
// https://vitejs.dev/config/

//Add All CSS and js here - FluentForm Core + Pro Assets
const inputs = [
    // FluentForm Core JavaScript Assets
    'resources/assets/admin/fluent_forms_global.js',
    'resources/assets/admin/all_forms_app.js',
    'resources/assets/admin/editor_app.js',
    'resources/assets/admin/form_settings_app.js',
    'resources/assets/admin/settings/global_settings.js',
    'resources/assets/admin/AllEntries/all-entries.js',
    'resources/assets/admin/form_entries_app.js',
    'resources/assets/admin/transfer/transfer.js',
    'resources/assets/admin/modules.js',
    'resources/assets/admin/documentation.js',
    'resources/assets/admin/admin_notices.js',
    'resources/assets/admin/fluent_forms_editor_helper.js',
    'resources/assets/admin/fluentform_editor_script.js',
    'resources/assets/public/form-submission.js',
    'resources/assets/public/fluentform-advanced.js',
    'resources/assets/public/form-save-progress.js',
    'resources/assets/admin/copier.js',
    'resources/assets/admin/form_preview_app.js',
    'resources/assets/admin/conversion_templates/conversational_design.js',
    'resources/assets/admin/fluent_gutenblock.jsx',

    // FluentFormPro JavaScript Assets (Element UI -> Element Plus migration needed)
    // TODO: Migrate these from Element UI to Element Plus
    // 'resources/assets/pro/Inventory/inventory-list.js',
    // 'resources/assets/pro/PaymentEntries/payment-entries.js',
    // 'resources/assets/pro/PaymentSettings/payment-settings.js',
    // 'resources/assets/pro/StepFormEntries/step-form-entries.js',
    // 'resources/assets/pro/Styler/app.js',

    // FluentFormPro JavaScript Assets (Vue 2 -> Vue 3 migration needed)
    // TODO: Migrate these from Vue 2 to Vue 3
    // 'resources/assets/pro/js/analytics.js',

    // FluentFormPro JavaScript Assets (No Vue dependency - compatible)
    'resources/assets/pro/js/chainedSelectScript.js',
    'resources/assets/pro/js/chatFieldScript.js',
    'resources/assets/pro/js/fluentformproPostUpdate.js',
    'resources/assets/pro/js/fluentformproUserUpdate.js',
    'resources/assets/pro/js/tinyMceInit.js',
    // TODO: Check if chart-bar.js needs Vue migration
    // 'resources/assets/pro/js/components/chart-bar.js',

    // FluentFormPro Public JavaScript Assets
    'resources/assets/pro/public/ff_gmap.js',
    'resources/assets/pro/public/ff_paypal.js',
    'resources/assets/pro/public/formatPrice.js',
    'resources/assets/pro/public/paddle_handler.js',
    'resources/assets/pro/public/payment_handler.js',
    'resources/assets/pro/public/paystack_handler.js',
    'resources/assets/pro/public/razorpay_handler.js',
    'resources/assets/pro/public/transactions_ui.js',

    // Third-party Libraries (Core)
    'resources/assets/libs/flatpickr/flatpickr.css',
    'resources/assets/libs/flatpickr/flatpickr.js',
    'resources/assets/libs/choices/choices.min.js',

    // Third-party Libraries (Pro)
    'resources/assets/pro/libs/math-expression-evaluator.min.js',
    'resources/assets/pro/libs/math-expression.min.js',
    'resources/assets/pro/libs/pickr/pickr.min.js',
    'resources/assets/pro/libs/lity/lity.min.js',
    'resources/assets/pro/libs/rangeslider/rangeslider.js',
    'resources/assets/pro/libs/intl-tel-input/js/intlTelInput.min.js',
    'resources/assets/pro/libs/intl-tel-input/js/utils.js',

    // jQuery File Upload (has missing dependencies - TODO: install blueimp packages)
    'resources/assets/pro/libs/jQuery-File-Upload-10.32.0/js/jquery.fileupload.js',
    // 'resources/assets/pro/libs/jQuery-File-Upload-10.32.0/js/jquery.fileupload-ui.js', // Missing blueimp-tmpl
    'resources/assets/pro/libs/jQuery-File-Upload-10.32.0/js/jquery.fileupload-validate.js',
    'resources/assets/pro/libs/jQuery-File-Upload-10.32.0/js/jquery.iframe-transport.js',
    'resources/assets/pro/libs/jQuery-File-Upload-10.32.0/js/vendor/jquery.ui.widget.js',

    // FluentForm Core CSS/SCSS
    'resources/assets/admin/css/fluent-all-forms.scss',
    'resources/assets/admin/css/settings_global.scss',
    'resources/assets/admin/css/fluent-forms-admin.scss',
    'resources/assets/admin/css/element-plus-css.scss',
    'resources/assets/admin/css/admin_notices.scss',
    'resources/assets/admin/css/admin_docs.scss',
    'resources/assets/preview/preview.scss',
    'resources/assets/public/scss/fluent-forms-public.scss',
    'resources/assets/public/scss/fluentform-public-default.scss',
    'resources/assets/admin/css/fluent_gutenblock.scss',
    'resources/assets/public/scss/choices.scss',
    'resources/assets/elementor/fluent-forms-elementor-widget.scss',
    'resources/assets/admin/conversion_templates/design_css.scss',

    // FluentFormPro CSS/SCSS (Element UI -> Element Plus migration needed)
    // TODO: Update these to use Element Plus classes
    // 'resources/assets/pro/PaymentEntries/payment_entries.scss',
    // 'resources/assets/pro/PaymentSettings/payment_settings.scss',
    // 'resources/assets/pro/Styler/scss/style.scss',

    // FluentFormPro CSS/SCSS (Element Plus compatible)
    'resources/assets/pro/public/form_landing.scss',
    'resources/assets/pro/public/frameless.scss',
    'resources/assets/pro/public/skins/_payment.scss',
    'resources/assets/pro/public/skins/_transactions.scss',
    // TODO: Fix SCSS variables in _modern_base.scss
    // 'resources/assets/pro/public/skins/_modern_base.scss',

    // Third-party CSS (Pro)
    'resources/assets/pro/libs/pickr/themes/classic.min.css',
    'resources/assets/pro/libs/pickr/themes/monolith.min.css',
    'resources/assets/pro/libs/pickr/themes/nano.min.css',
    'resources/assets/pro/libs/lity/lity.min.css',
    'resources/assets/pro/libs/rangeslider/rangeslider.css',
    'resources/assets/pro/libs/intl-tel-input/css/intlTelInput.min.css',
    'resources/assets/pro/libs/jQuery-File-Upload-10.32.0/css/jquery.fileupload.css',
    'resources/assets/pro/libs/jQuery-File-Upload-10.32.0/css/jquery.fileupload-ui.css',
];
export default defineConfig({
    base: '/assets/', // Set base URL for assets to match WordPress plugin structure
    plugins: [
        vue(),
        react({
            include: /\.(jsx|js|tsx|ts)$/,
        }),
        //liveReload([`${__dirname}/**/*\.php`]),
        viteStaticCopy({
            targets: [
                { src: 'resources/images', dest: '' },
                { src: 'resources/public/lib', dest: 'public/' },
            ],
        }),
        AutoImport({
            resolvers: [
                ElementPlusResolver({
                    importStyle: false, // Disable auto style import
                    directives: true,
                    version: '2.1.5',
                }),
            ],
        }),
        // Components({
        //     resolvers: [
        //         ElementPlusResolver({
        //             importStyle: false, // Disable auto style import to avoid issues
        //         })
        //     ],
        //     directives: false,
        // }),
    ],
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
            scss: {
                // additionalData removed to avoid @use conflicts
            },
        },
    },

    build: {
        manifest: true,
        outDir: 'assets',
        assetsDir: '', // Put assets directly in the root of outDir to avoid nested assets/assets/
        emptyOutDir: true, // delete the contents of the output directory before each build

        // https://rollupjs.org/guide/en/#big-list-of-options
        rollupOptions: {
            input: inputs,
            output: {
                chunkFileNames: '[name].js',
                entryFileNames: '[name].js',
            },
        },
    },

    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm-bundler.js',
            '@': path.resolve(__dirname, 'resources/assets/'),
            // FluentForm path aliases for Pro assets
            '@fluentform/common': path.resolve(__dirname, 'resources/assets/admin/common'),
            '@fluentform/admin': path.resolve(__dirname, 'resources/assets/admin'),
            '@fluentform/public': path.resolve(__dirname, 'resources/assets/public'),
        },
    },

    server: {
        host: serverConfig.host,
        port: serverConfig.port,
        strictPort: serverConfig.strict_port,
        cors: {
            origin: '*', // Allow all origins
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        },
        hmr: {
            host: serverConfig.host,
            port: serverConfig.port,
            protocol: serverConfig.vite_protocol,
        },
    },
    esbuild: {
        loader: 'jsx',
        include: /\.(jsx|js|tsx|ts)$/,
        exclude: [],
    },
    optimizeDeps: {
        include: [
            'vue',
            '@vueuse/core',
            '@vueuse/shared',
            'vue-demi'
        ],
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
                '.jsx': 'jsx',
                '.ts': 'tsx',
                '.tsx': 'tsx',
            },
        },
    },
});
