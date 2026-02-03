import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue2';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load server config
const serverConfigPath = path.resolve(__dirname, 'config/vite.json');
const serverConfig = JSON.parse(fs.readFileSync(serverConfigPath, 'utf8'));

// RTL CSS files to generate after build
const rtlCssFiles = [
    'fluent-forms-public',
    'fluentform-public-default',
    'settings_global',
    'element-ui-css',
    'fluent-all-forms',
    'fluent-forms-admin-sass',
    'fluent-forms-admin',
    'add-ons',
    'admin_docs',
    'fluent-forms-reports'
];

// Plugin to generate RTL CSS and manifest PHP after build
const postBuildPlugin = () => ({
    name: 'fluentform-post-build',
    closeBundle: async () => {
        // Fix font paths in CSS files (change ./fonts/ to ../fonts/)
        console.log('\n🔄 Fixing font paths in CSS files...');
        const cssDir = './assets/css';
        const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
        for (const file of cssFiles) {
            const filePath = `${cssDir}/${file}`;
            let content = fs.readFileSync(filePath, 'utf8');
            // Fix font URLs: ./fonts/ -> ../fonts/
            content = content.replace(/url\(\.\/fonts\//g, 'url(../fonts/');
            fs.writeFileSync(filePath, content, 'utf8');
        }
        console.log('✅ Font paths fixed\n');

        // Generate RTL CSS
        console.log('🔄 Generating RTL CSS files...');
        const rtlPromises = rtlCssFiles.map(async (file) => {
            const inputPath = `./assets/css/${file}.css`;
            const outputPath = `./assets/css/${file}-rtl.css`;
            try {
                if (fs.existsSync(inputPath)) {
                    await execAsync(`npx rtlcss ${inputPath} ${outputPath}`);
                    console.log(`  ✅ ${file}-rtl.css`);
                }
            } catch (error) {
                console.error(`  ❌ Failed: ${file}-rtl.css`);
            }
        });
        await Promise.all(rtlPromises);
        console.log('✅ RTL CSS generation complete\n');

        // Copy manifest.json to config directory
        const manifestPath = './assets/.vite/manifest.json';
        if (fs.existsSync(manifestPath)) {
            fs.copyFileSync(manifestPath, './config/vite_manifest.json');
            console.log('✅ Manifest copied to config/vite_manifest.json\n');

            // Clean up .vite directory
            fs.rmSync('./assets/.vite', { recursive: true, force: true });
        }
    }
});

// Entry points
const entries = {
    // Admin JS
    'js/fluent_forms_global': 'resources/assets/admin/fluent_forms_global.js',
    'js/fluentform-global-settings': 'resources/assets/admin/settings/global_settings.js',
    'js/fluentform-transfer': 'resources/assets/admin/transfer/transfer.js',
    'js/form_settings_app': 'resources/assets/admin/form_settings_app.js',
    'js/fluent-forms-editor': 'resources/assets/admin/editor_app.js',
    'js/form_entries': 'resources/assets/admin/form_entries_app.js',
    'js/payment_entries': 'resources/assets/admin/payment_entries.js',
    'js/fluent-all-forms-admin': 'resources/assets/admin/all_forms_app.js',
    'js/fluentform_editor_script': 'resources/assets/admin/fluentform_editor_script.js',
    'js/copier': 'resources/assets/admin/copier.js',
    'js/admin_notices': 'resources/assets/admin/admin_notices.js',
    'js/modules': 'resources/assets/admin/modules.js',
    'js/docs': 'resources/assets/admin/documentation.js',
    'js/form_preview_app': 'resources/assets/admin/form_preview_app.js',
    'js/all_entries': 'resources/assets/admin/AllEntries/all-entries.js',
    'js/reports': 'resources/assets/admin/Reports/reports.js',
    'js/conversational_design': 'resources/assets/admin/conversion_templates/conversational_design.js',
    'js/fluent_forms_editor_helper': 'resources/assets/admin/fluent_forms_editor_helper.js',

    // Public JS
    'js/fluentform-advanced': 'resources/assets/public/fluentform-advanced.js',
    'js/form-submission': 'resources/assets/public/form-submission.js',
    'js/media-capture': 'resources/assets/public/media-capture.js',
    'js/payment_handler': 'resources/assets/public/payment_handler.js',
    'js/fluentform_transactions_ui': 'resources/assets/public/transactions_ui.js',
    'js/form-save-progress': 'resources/assets/public/form-save-progress.js',

    // Elementor
    'js/fluent-forms-elementor-widget': 'resources/assets/elementor/fluent-forms-elementor-widget.js',

    // Gutenberg (React)
    'js/fluent_gutenblock': 'guten_block/src/index.js',

    // Admin CSS
    'css/element-ui-css': 'resources/assets/admin/css/element-ui-css.scss',
    'css/fluent-forms-admin-sass': 'resources/assets/admin/css/fluent-forms-admin.scss',
    'css/settings_global': 'resources/assets/admin/css/settings_global.scss',
    'css/fluent-all-forms': 'resources/assets/admin/css/fluent-all-forms.scss',
    'css/admin_notices': 'resources/assets/admin/css/admin_notices.scss',
    'css/admin_docs': 'resources/assets/admin/css/admin_docs.scss',
    'css/add-ons': 'resources/assets/admin/css/add-ons.scss',
    'css/fluent-forms-reports': 'resources/assets/admin/css/fluent-forms-reports.scss',
    'css/payment_settings': 'resources/assets/admin/css/payment_settings.scss',
    'css/payment_entries': 'resources/assets/admin/css/payment_entries.scss',
    'css/conversational_design': 'resources/assets/admin/conversion_templates/design_css.scss',
    'css/fluent-forms-admin': 'resources/assets/admin/styles/index.scss',

    // Public CSS
    'css/fluent-forms-public': 'resources/assets/public/scss/fluent-forms-public.scss',
    'css/fluentform-public-default': 'resources/assets/public/scss/fluentform-public-default.scss',
    'css/preview': 'resources/assets/preview/preview.scss',
    'css/choices': 'resources/assets/public/scss/choices.scss',
    'css/payment_skin': 'resources/assets/public/scss/skins/_payment.scss',
    'css/fluentform_transactions': 'resources/assets/public/scss/skins/_transactions.scss',
    'css/frameless': 'resources/assets/public/scss/frameless.scss',
    'css/ff-themes': 'resources/assets/public/scss/themes/index.scss',
    'css/media-capture': 'resources/assets/public/scss/media-capture.scss',
    'css/fluent-forms-elementor-widget': 'resources/assets/elementor/fluent-forms-elementor-widget.scss',
    'css/fluent_gutenblock': 'guten_block/src/fluent_gutenblock.scss',
};

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';

    return {
        plugins: [
            nodePolyfills({
                // Only include polyfills needed
                include: ['util', 'buffer', 'process'],
                globals: {
                    Buffer: true,
                    process: true,
                },
            }),
            vue(),
            react({
                // Use classic runtime - transforms JSX to createElement calls
                // WordPress provides React via wp.element
                jsxRuntime: 'classic'
            }),
            viteStaticCopy({
                targets: [
                    { src: 'resources/assets/libs/*', dest: 'libs' },
                    { src: 'resources/img/*', dest: 'img' },
                    { src: 'node_modules/clipboard/dist/clipboard.min.js', dest: 'libs' },
                    { src: 'node_modules/element-ui/lib/theme-chalk/fonts/*', dest: 'fonts' },
                    { src: 'index.php', dest: '.' }
                ]
            }),
            isProd && postBuildPlugin()
        ].filter(Boolean),

        base: './',

        build: {
            outDir: 'assets',
            emptyOutDir: true,
            manifest: true,
            sourcemap: !isProd,
            commonjsOptions: {
                transformMixedEsModules: true,
                include: [/node_modules/],
                ignore: ['util']
            },
            rollupOptions: {
                input: entries,
                output: {
                    entryFileNames: '[name].js',
                    chunkFileNames: 'js/chunks/[name]-[hash].js',
                    assetFileNames: (assetInfo) => {
                        // Put fonts in fonts folder
                        if (/\.(woff2?|ttf|eot|otf)$/.test(assetInfo.name)) {
                            return 'fonts/[name][extname]';
                        }
                        return '[name][extname]';
                    }
                },
                // Ensure CommonJS modules are properly transformed
                shimMissingExports: true
            }
        },

        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'resources/assets'),
                'vue': 'vue/dist/vue.esm.js',
                '~element-ui': path.resolve(__dirname, 'node_modules/element-ui'),
                '~element-theme-chalk': path.resolve(__dirname, 'node_modules/element-theme-chalk'),
                '~splitpanes': path.resolve(__dirname, 'node_modules/splitpanes'),
                '~normalize.css': path.resolve(__dirname, 'node_modules/normalize.css'),
                '~primer-tooltips': path.resolve(__dirname, 'node_modules/primer-tooltips')
            },
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
        },

        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler',
                    silenceDeprecations: ['legacy-js-api', 'import']
                },
                less: {
                    javascriptEnabled: true
                }
            }
        },

        server: {
            port: serverConfig.port,
            strictPort: serverConfig.strict_port,
            cors: true,
            hmr: {
                port: serverConfig.port,
                host: serverConfig.host,
                protocol: serverConfig.vite_protocol
            }
        },

        optimizeDeps: {
            include: ['vue', 'element-ui', 'vue-router', 'vuex']
        }
    };
});
