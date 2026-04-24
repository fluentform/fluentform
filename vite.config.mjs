export { default } from './vite/vite.config.mjs';

const inputs = {
    documentation: 'resources/admin/boot/documentation.js',
    addons: 'resources/admin/boot/addons.js',
};

function writePhpManifestConfig() {
    return {
        name: 'write-fluentform-php-manifest',
        closeBundle() {
            const manifestPath = path.resolve(__dirname, 'assets/manifest.json');
            const phpConfigPath = path.resolve(__dirname, 'config/vite_config.php');

            if (!fs.existsSync(manifestPath)) {
                return;
            }

            const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

            normalizeEntryCss(manifestContent, {
                'resources/admin/boot/documentation.js': 'documentation',
                'resources/admin/boot/addons.js': 'addons',
            });

            fs.writeFileSync(
                manifestPath,
                `${JSON.stringify(manifestContent, null, 2)}\n`
            );

            const php = `<?php return ${toPhpArray(manifestContent)};`;
            fs.writeFileSync(phpConfigPath, php);
        }
    };
}

function normalizeEntryCss(manifestContent, entryMap) {
    Object.entries(entryMap).forEach(([manifestKey, cssName]) => {
        const entry = manifestContent[manifestKey];

        if (!entry?.css?.length) {
            return;
        }

        const originalCssPath = entry.css[0];
        const absoluteOriginalPath = path.resolve(__dirname, 'assets', originalCssPath);
        const normalizedCssPath = `admin/css/${cssName}.css`;
        const absoluteNormalizedPath = path.resolve(__dirname, 'assets', normalizedCssPath);

        if (fs.existsSync(absoluteOriginalPath)) {
            fs.mkdirSync(path.dirname(absoluteNormalizedPath), { recursive: true });
            fs.renameSync(absoluteOriginalPath, absoluteNormalizedPath);
        }

        entry.css = [normalizedCssPath];
    });
}

function toPhpArray(value, indent = 0) {
    const spacing = '    ';
    const currentIndent = spacing.repeat(indent);
    const nextIndent = spacing.repeat(indent + 1);

    if (Array.isArray(value)) {
        const items = value.map((item) => `${nextIndent}${toPhpArray(item, indent + 1)},`);
        return `[\n${items.join('\n')}\n${currentIndent}]`;
    }

    if (value && typeof value === 'object') {
        const entries = Object.entries(value).map(([key, item]) => {
            return `${nextIndent}${toPhpArray(key)} => ${toPhpArray(item, indent + 1)},`;
        });

        return `[\n${entries.join('\n')}\n${currentIndent}]`;
    }

    if (typeof value === 'string') {
        return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (value === null) {
        return 'null';
    }

    return String(value);
}

export default defineConfig({
    base: './',
    plugins: [
        vue(),
        writePhpManifestConfig(),
    ],
    build: {
        manifest: 'manifest.json',
        outDir: 'assets',
        emptyOutDir: false,
        assetsDir: '',
        sourcemap: true,
        rollupOptions: {
            input: inputs,
            output: {
                entryFileNames: 'admin/js/[name].js',
                chunkFileNames: 'admin/chunks/[name]-[hash].js',
                assetFileNames(assetInfo) {
                    const originalFile = assetInfo.originalFileNames?.[0] || '';

                    if (originalFile.includes('resources/admin/styles/modules/documentation/index.scss')) {
                        return 'admin/css/documentation[extname]';
                    }

                    if (originalFile.includes('resources/admin/styles/modules/addons/index.scss')) {
                        return 'admin/css/addons[extname]';
                    }

                    return 'admin/assets/[name]-[hash][extname]';
                },
            },
        },
    },
    resolve: {
        alias: {
            vue: '@vue/compat',
            '@admin': path.resolve(__dirname, 'resources/admin'),
            '@bootstrap': path.resolve(__dirname, 'resources/admin/bootstrap'),
            '@services': path.resolve(__dirname, 'resources/admin/services'),
            '@compat': path.resolve(__dirname, 'resources/admin/compat'),
            '@modules': path.resolve(__dirname, 'resources/admin/modules'),
            '@shared': path.resolve(__dirname, 'resources/admin/shared'),
            '@utils': path.resolve(__dirname, 'resources/admin/shared/utils'),
            '@boot': path.resolve(__dirname, 'resources/admin/boot'),
        },
    },
    server: {
        port: viteServerConfig.port,
        strictPort: Boolean(viteServerConfig.strict_port),
        cors: true,
        origin: '*',
        hmr: {
            port: viteServerConfig.port,
            host: viteServerConfig.host,
            protocol: viteServerConfig.vite_protocol || 'ws',
        },
    },
});
