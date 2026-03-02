import { defineConfig, transformWithEsbuild } from 'vite'
import vue2 from '@vitejs/plugin-vue2'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import liveReload from 'vite-plugin-live-reload'
import path from 'path'
import fs from 'fs'

// Resolve ~ prefixed imports in SCSS/LESS files (webpack compat)
function tildeImportResolver() {
    const nodeModulesPath = path.resolve(__dirname, 'node_modules') + '/';
    return {
        name: 'tilde-import-resolver',
        enforce: 'pre',
        resolveId(source) {
            if (source.startsWith('~')) {
                const resolved = path.resolve(__dirname, 'node_modules', source.slice(1));
                if (fs.existsSync(resolved)) {
                    return resolved;
                }
            }
            return null;
        },
        transform(code, id) {
            if (id.endsWith('.scss') || id.endsWith('.less') || id.endsWith('.css')) {
                if (code.includes('~')) {
                    return code.replace(
                        /@import\s+["']~([^"']+)["']/g,
                        (match, pkg) => `@import "${nodeModulesPath}${pkg}"`
                    );
                }
            }
            return null;
        }
    };
}

const allInputs = {
    admin: {
        // JS entries
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
        // CSS entries (SCSS)
        'css/element-ui-css': 'resources/assets/admin/css/element-ui-css.scss',
        'css/fluent-forms-admin-sass': 'resources/assets/admin/css/fluent-forms-admin.scss',
        'css/settings_global': 'resources/assets/admin/css/settings_global.scss',
        'css/fluent-all-forms': 'resources/assets/admin/css/fluent-all-forms.scss',
        'css/admin_notices_css': 'resources/assets/admin/css/admin_notices.scss',
        'css/admin_docs': 'resources/assets/admin/css/admin_docs.scss',
        'css/add-ons': 'resources/assets/admin/css/add-ons.scss',
        'css/fluent-forms-reports': 'resources/assets/admin/css/fluent-forms-reports.scss',
        'css/payment_settings': 'resources/assets/admin/css/payment_settings.scss',
        'css/payment_entries_css': 'resources/assets/admin/css/payment_entries.scss',
        // CSS entries (LESS)
        'css/fluent-forms-admin': 'resources/assets/admin/styles/index.less',
    },
    public: {
        // JS entries
        'js/fluentform-advanced': 'resources/assets/public/fluentform-advanced.js',
        'js/form-submission': 'resources/assets/public/form-submission.js',
        'js/payment_handler': 'resources/assets/public/payment_handler.js',
        'js/fluentform_transactions_ui': 'resources/assets/public/transactions_ui.js',
        'js/form-save-progress': 'resources/assets/public/form-save-progress.js',
        // CSS entries
        'css/fluent-forms-public': 'resources/assets/public/scss/fluent-forms-public.scss',
        'css/fluentform-public-default': 'resources/assets/public/scss/fluentform-public-default.scss',
        'css/preview': 'resources/assets/preview/preview.scss',
        'css/choices': 'resources/assets/public/scss/choices.scss',
        'css/conversational_design_css': 'resources/assets/admin/conversion_templates/design_css.scss',
        'css/payment_skin': 'resources/assets/public/scss/skins/_payment.scss',
        'css/fluentform_transactions': 'resources/assets/public/scss/skins/_transactions.scss',
        'css/frameless': 'resources/assets/public/scss/frameless.scss',
    },
    gutenberg: {
        'js/fluent_gutenblock': 'guten_block/src/index.js',
        'css/fluent_gutenblock': 'guten_block/src/fluent_gutenblock.scss',
    },
    elementor: {
        'js/fluent-forms-elementor-widget': 'resources/assets/elementor/fluent-forms-elementor-widget.js',
        'css/fluent-forms-elementor-widget': 'resources/assets/elementor/fluent-forms-elementor-widget.scss',
    }
};

export default defineConfig(({ mode, command }) => {
    const buildType = mode || 'admin';

    if (!allInputs[buildType]) {
        console.warn(`Unknown build type: ${buildType}. Available: ${Object.keys(allInputs).join(', ')}`);
        console.warn('Defaulting to admin build');
    }

    const inputs = allInputs[buildType] || allInputs.admin;
    const isProduction = command === 'build';
    const manifest = `manifest.${buildType}.json`;

    const isGutenbergBuild = buildType === 'gutenberg';

    const plugins = [
        tildeImportResolver(),
        liveReload([]),
    ];

    // Static copy only runs once (admin mode)
    if (buildType === 'admin') {
        plugins.push(
            viteStaticCopy({
                targets: [
                    { src: 'resources/assets/libs', dest: '' },
                    { src: 'resources/img', dest: '' },
                    { src: 'index.php', dest: '' },
                ]
            })
        );
    }

    // Fix CSS font paths: CSS is in css/ subdirectory, fonts in fonts/ subdirectory.
    // Vite computes relative URLs from assetsDir root, not the CSS file's subdirectory,
    // so ./fonts/ needs to be corrected to ../fonts/
    plugins.push({
        name: 'fix-css-font-paths',
        enforce: 'post',
        generateBundle(options, bundle) {
            for (const [fileName, asset] of Object.entries(bundle)) {
                if (fileName.endsWith('.css') && asset.type === 'asset') {
                    asset.source = asset.source.replace(/url\(\.\/fonts\//g, 'url(../fonts/');
                }
            }
        }
    });

    if (isGutenbergBuild) {
        plugins.push({
            name: 'treat-js-as-jsx',
            enforce: 'pre',
            async transform(code, id) {
                if (!id.match(/guten_block\/.*\.js$/)) return null;
                return transformWithEsbuild(code, id + '.jsx', {
                    jsx: 'transform',
                    jsxFactory: 'wp.element.createElement',
                    jsxFragment: 'wp.element.Fragment',
                });
            }
        });
    } else {
        plugins.push(vue2());
    }

    return {
        base: './',
        plugins,
        css: {
            preprocessorOptions: {
                scss: {
                    quietDeps: true,
                    silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin'],
                    includePaths: [path.resolve(__dirname, 'node_modules')],
                    importer(url) {
                        if (url.startsWith('~')) {
                            const bare = url.slice(1);
                            const resolved = path.resolve(__dirname, 'node_modules', bare);
                            // Check if this resolves to a .css file (inline it since Sass
                            // won't @import .css files natively)
                            const cssPath = resolved + '.css';
                            if (fs.existsSync(cssPath)) {
                                return { contents: fs.readFileSync(cssPath, 'utf8') };
                            }
                            if (fs.existsSync(resolved)) {
                                if (fs.statSync(resolved).isFile()) {
                                    return { contents: fs.readFileSync(resolved, 'utf8') };
                                }
                            }
                            return { file: resolved };
                        }
                        return null;
                    }
                },
                less: {
                    javascriptEnabled: true
                }
            }
        },
        build: {
            manifest,
            outDir: 'assets',
            publicDir: false,
            emptyOutDir: false,
            assetsDir: '.',
            minify: isProduction,
            sourcemap: !isProduction,
            chunkSizeWarningLimit: 3000,
            cssMinify: isProduction,
            rollupOptions: {
                input: inputs,
                external: isGutenbergBuild
                    ? ['underscore', 'react', 'react-dom', 'react/jsx-runtime']
                    : [],
                output: {
                    chunkFileNames: `js/${buildType}-[name].js`,
                    entryFileNames: '[name].js',
                    assetFileNames(assetInfo) {
                        const name = assetInfo.name || '';
                        // CSS renaming to match expected output filenames
                        const cssRenames = {
                            'index.css': 'fluent-forms-admin',
                            'fluent-forms-admin.css': 'fluent-forms-admin-sass',
                            '_payment.css': 'payment_skin',
                            '_transactions.css': 'fluentform_transactions',
                            'design_css.css': 'conversational_design',
                        };
                        if (name.endsWith('.css')) {
                            if (cssRenames[name]) return `css/${cssRenames[name]}.[ext]`;
                            return 'css/[name].[ext]';
                        }
                        // Fonts
                        if (name.match(/\.(woff2?|ttf|eot|otf)$/)) {
                            return 'fonts/[name].[ext]';
                        }
                        return '[name].[ext]';
                    },
                }
            },
        },
        resolve: {
            extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
            alias: {
                '@': path.resolve(__dirname, 'resources/assets'),
                'vue': 'vue/dist/vue.esm.js',
            },
        },
        server: {
            port: 8881,
            strictPort: true,
            cors: true,
            origin: '*',
            hmr: {
                port: 8881,
                host: 'localhost',
                protocol: 'ws',
                overlay: true,
            },
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
            }
        },
        esbuild: {
            target: 'es2015',
        },
    };
});
