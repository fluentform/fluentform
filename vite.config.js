import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import fs from 'fs';
import { exec } from 'child_process';

let serverConfig = fs.readFileSync('./config/vite.json', 'utf8');
serverConfig = JSON.parse(serverConfig);

const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');
const Components = require('unplugin-vue-components/vite');

// Custom plugin to generate RTL CSS files
const rtlCssPlugin = () => {
    return {
        name: 'rtl-css-generator',
        writeBundle() {
            const rtlCommands = [
                'rtlcss ./assets/fluent-forms-public.css ./assets/fluent-forms-public-rtl.css',
                'rtlcss ./assets/fluentform-public-default.css ./assets/fluentform-public-default-rtl.css',
                'rtlcss ./assets/settings_global.css ./assets/settings_global_rtl.css',
                'rtlcss ./assets/element-ui-css.css ./assets/element-ui-css-rtl.css',
                'rtlcss ./assets/fluent-all-forms.css ./assets/fluent-all-forms-rtl.css',
                'rtlcss ./assets/fluent-forms-admin.css ./assets/fluent-forms-admin-rtl.css',
                'rtlcss ./assets/add-ons.css ./assets/add-ons-rtl.css',
                'rtlcss ./assets/admin_docs.css ./assets/admin_docs-rtl.css'
            ];

            rtlCommands.forEach(command => {
                exec(command, (error) => {
                    if (error) {
                        console.warn(`RTL CSS generation warning: ${error.message}`);
                    }
                });
            });
        }
    };
};

// https://vitejs.dev/config/

//Add All CSS and js here
const inputs = [
    // Admin JS files
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
    'resources/assets/admin/copier.js',
    'resources/assets/admin/form_preview_app.js',
    'resources/assets/admin/conversion_templates/conversational_design.js',
    // 'resources/assets/admin/fluent_gutenblock.jsx',

    // Public JS files
    'resources/assets/public/form-submission.js',
    'resources/assets/public/fluentform-advanced.js',
    'resources/assets/public/form-save-progress.js',

    // Library files
    'resources/assets/libs/flatpickr/flatpickr.css',
    'resources/assets/libs/flatpickr/flatpickr.js',
    'resources/assets/libs/choices/choices.min.js',

    // Admin CSS/SCSS files
    'resources/assets/admin/css/element-ui-css.scss',
    'resources/assets/admin/css/fluent-all-forms.scss',
    'resources/assets/admin/css/settings_global.scss',
    'resources/assets/admin/css/fluent-forms-admin.scss',
    'resources/assets/admin/css/admin_notices.scss',
    'resources/assets/admin/css/admin_docs.scss',
    'resources/assets/admin/css/add-ons.scss',
    'resources/assets/admin/css/fluent_gutenblock.scss',

    // Public CSS/SCSS files
    'resources/assets/preview/preview.scss',
    'resources/assets/public/scss/fluent-forms-public.scss',
    'resources/assets/public/scss/fluentform-public-default.scss',
    'resources/assets/public/scss/choices.scss',

    // Other CSS/SCSS files
    'resources/assets/elementor/fluent-forms-elementor-widget.scss',
    'resources/assets/admin/conversion_templates/design_css.scss',

    // Less files
    'resources/assets/admin/styles/index.less',
];
export default defineConfig({
    define: {
        // Vue 3 feature flags
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    plugins: [
        vue(),
        react(),
        //liveReload([`${__dirname}/**/*\.php`]),
        viteStaticCopy({
            targets: [
                { src: 'resources/images', dest: '' },
                { src: 'resources/public/lib', dest: 'public/' },
                { src: 'resources/assets/libs', dest: 'libs' },
                { src: 'resources/img', dest: 'img' },
                { src: 'index.php', dest: '' },
            ],
        }),
        AutoImport({
            resolvers: [
                ElementPlusResolver({
                    importStyle: 'sass',
                    directives: true,
                    version: '2.1.5',
                    exclude: ['ElLabel'] // Exclude ElLabel since it doesn't exist in Element Plus
                }),
            ],
        }),
        Components({
            // resolvers: [ElementPlusResolver()],
            directives: false,
        }),
        rtlCssPlugin(),
    ],
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
            scss: {
                // additionalData removed to avoid conflicts with @use rules
            },
        },
    },

    build: {
        manifest: true,
        outDir: 'assets',
        //assetsDir: '',
        publicDir: 'assets',
        //root: '/',
        emptyOutDir: true, // delete the contents of the output directory before each build
        sourcemap: true, // Enable source maps for debugging

        // https://rollupjs.org/guide/en/#big-list-of-options
        rollupOptions: {
            input: inputs,
            output: {
                chunkFileNames: '[name].js',
                entryFileNames: '[name].js',
            },
            onwarn(warning, warn) {
                // Suppress certain warnings
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
                warn(warning);
            },
        },
    },

    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm-bundler.js',
            '@': path.resolve(__dirname, 'resources/assets/'),
        },
        dedupe: ['vue'],
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
        loader: 'js',
    },
    optimizeDeps: {
        include: ['vue', 'vuex', 'element-plus', 'mitt', 'lodash'],
        esbuildOptions: {
            target: 'es2015',
        },
    },
});
