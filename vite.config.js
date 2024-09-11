import {defineConfig} from "vite";
import {viteStaticCopy} from "vite-plugin-static-copy";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import fs from "fs";

let serverConfig = fs.readFileSync('./config/vite.json', 'utf8');
serverConfig = JSON.parse(serverConfig)

const {ElementPlusResolver} = require("unplugin-vue-components/resolvers");
const Components = require("unplugin-vue-components/vite");
// https://vitejs.dev/config/

//Add All CSS and js here
const inputs = [
    'resources/assets/admin/fluent_forms_global.js',
    'resources/assets/admin/all_forms_app.js',
    // 'resources/assets/admin/settings/global_settings.js',
    // 'resources/assets/admin/transfer/transfer.js',
    // 'resources/assets/admin/form_settings_app.js',
    // 'resources/assets/admin/editor_app.js',
    // 'resources/assets/admin/form_entries_app.js',

    // 'resources/assets/libs/chartjs/chart.js',
    // 'resources/assets/libs/chartjs/vue-chartjs.js',
    // 'resources/assets/libs/flatpickr/flatpickr.css',
    // 'resources/assets/libs/flatpickr/flatpickr.js',
    // 'resources/assets/libs/choices/choices.min.js',

    // 'resources/assets/public/fluentform-advanced.js',
    // 'resources/assets/public/form-submission.js',
    // 'resources/assets/public/form-save-progress.js',
    // 'resources/assets/admin/fluentform_editor_script.js',
    // 'resources/assets/admin/copier.js',
    // 'resources/assets/admin/admin_notices.js',
    // 'resources/assets/admin/modules.js',
    // 'resources/assets/admin/documentation.js',
    // 'resources/assets/admin/form_preview_app.js',
    // 'resources/assets/admin/AllEntries/all-entries.js',
    // 'resources/assets/admin/conversion_templates/conversational_design.js',
    // 'resources/assets/admin/fluent_forms_editor_helper.js',
    // 'resources/assets/admin/css/element-ui-css.scss',
    // 'resources/assets/admin/css/settings_global.scss',
    // 'resources/assets/admin/styles/index.less',
    'resources/assets/admin/css/fluent-all-forms.scss',
    // 'resources/assets/admin/css/fluent-forms-admin.scss',
    // 'resources/assets/admin/css/admin_notices.scss',
    // 'resources/assets/admin/css/admin_docs.scss',
    // 'resources/assets/admin/css/admin_docs.scss',
    // 'resources/assets/admin/css/fluent_gutenblock.scss',
    // 'resources/assets/public/scss/fluent-forms-public.scss',
    // 'resources/assets/public/scss/fluentform-public-default.scss',
    // 'resources/assets/preview/preview.scss',
    // 'resources/assets/public/scss/choices.scss',
    // 'resources/assets/elementor/fluent-forms-elementor-widget.scss',
    // 'resources/assets/admin/conversion_templates/design_css.scss',
    // 'resources/assets/admin/fluent_gutenblock.jsx',

]
export default defineConfig({
    plugins: [
        vue(),
        react(),
        //liveReload([`${__dirname}/**/*\.php`]),
        viteStaticCopy({
            targets: [
                {src: "resources/images", dest: ""},
                {src: "resources/public/lib", dest: "public/"},
            ],
        }),
        AutoImport({
            resolvers: [
                ElementPlusResolver({
                  importStyle: "sass",
                  directives: true,
                  version: "2.1.5",
                }),
            ],
        }),
        Components({
            // resolvers: [ElementPlusResolver()],
            directives: false,
        }),
    ],
    css: {
        preprocessorOptions: {
            less: {
                javascriptEnabled: true,
            },
        },
    },

    build: {
        manifest: true,
        outDir: "assets",
        //assetsDir: '',
        publicDir: "assets",
        //root: '/',
        emptyOutDir: true, // delete the contents of the output directory before each build

        // https://rollupjs.org/guide/en/#big-list-of-options
        rollupOptions: {
            input: inputs,
            output: {
                chunkFileNames: "[name].js",
                entryFileNames: "[name].js",
            },
        },
    },

    resolve: {
        alias: {
            vue: "vue/dist/vue.esm-bundler.js",
            "@": path.resolve(__dirname, "resources/assets/"),
        },
    },

    server: {
        host: serverConfig.host,
        port: serverConfig.port,
        strictPort: serverConfig.strict_port,
        hmr: {
            port: serverConfig.port,
            host: serverConfig.host,
            protocol: serverConfig.vite_protocol,
        },
    },
    esbuild: {
        loader: 'js',
    },
    optimizeDeps: {
        esbuildOptions: {
            // include: ["vue"],
            // Set up the specific loaders for TypeScript and JavaScript
            // loader: {
            //     '.ts': 'ts',
            //     '.js': 'js',
            // },
        },
    },
});
