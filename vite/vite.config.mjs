import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import fs from 'fs';
import path from 'path';

const pluginRoot = path.resolve(__dirname, '..');
const viteServerConfig = JSON.parse(
    fs.readFileSync(path.resolve(pluginRoot, 'config/vite.json'), 'utf8')
);

const inputs = {
    documentation: path.resolve(pluginRoot, 'resources/admin/boot/documentation.js'),
};

function writePhpManifestConfig() {
    return {
        name: 'write-fluentform-php-manifest',
        closeBundle() {
            const manifestPath = path.resolve(pluginRoot, 'assets/manifest.json');
            const phpConfigPath = path.resolve(pluginRoot, 'config/vite_config.php');

            if (!fs.existsSync(manifestPath)) {
                return;
            }

            const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const normalizedManifestContent = normalizeManifestKeys(manifestContent);

            normalizeEntryCss(normalizedManifestContent, {
                'resources/admin/boot/documentation.js': 'documentation',
            });

            fs.writeFileSync(
                manifestPath,
                `${JSON.stringify(normalizedManifestContent, null, 2)}\n`
            );

            const php = `<?php return ${toPhpArray(normalizedManifestContent)};`;
            fs.writeFileSync(phpConfigPath, php);
        }
    };
}

function normalizeManifestKeys(manifestContent) {
    return Object.fromEntries(
        Object.entries(manifestContent).map(([key, value]) => [
            key.replace(/^\.\.\//, ''),
            value,
        ])
    );
}

function normalizeEntryCss(manifestContent, entryMap) {
    Object.entries(entryMap).forEach(([manifestKey, cssName]) => {
        const entry = manifestContent[manifestKey];

        if (!entry?.css?.length) {
            return;
        }

        const originalCssPath = entry.css[0];
        const absoluteOriginalPath = path.resolve(pluginRoot, 'assets', originalCssPath);
        const normalizedCssPath = `admin/css/${cssName}.css`;
        const absoluteNormalizedPath = path.resolve(pluginRoot, 'assets', normalizedCssPath);

        if (fs.existsSync(absoluteOriginalPath)) {
            fs.mkdirSync(path.dirname(absoluteNormalizedPath), { recursive: true });
            fs.renameSync(absoluteOriginalPath, absoluteNormalizedPath);
            rewriteMovedCssAssetUrls(
                absoluteNormalizedPath,
                path.posix.dirname(originalCssPath),
                path.posix.dirname(normalizedCssPath)
            );
        }

        entry.css = [normalizedCssPath];
    });
}

function rewriteMovedCssAssetUrls(absoluteCssPath, originalCssDir, normalizedCssDir) {
    if (!fs.existsSync(absoluteCssPath)) {
        return;
    }

    const cssContent = fs.readFileSync(absoluteCssPath, 'utf8');
    const rewrittenCssContent = cssContent.replace(
        /url\((['"]?)(\.\/[^'")?#]+(?:\?[^'")#]*)?)\1\)/g,
        (_, quote, assetPath) => {
            const cleanAssetPath = assetPath.replace(/^\.\//, '');
            const originalAssetPath = path.posix.join(originalCssDir, cleanAssetPath);
            const rebasedAssetPath = path.posix.relative(normalizedCssDir, originalAssetPath);

            return `url(${quote}${rebasedAssetPath}${quote})`;
        }
    );

    if (rewrittenCssContent !== cssContent) {
        fs.writeFileSync(absoluteCssPath, rewrittenCssContent);
    }
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
        outDir: path.resolve(pluginRoot, 'assets'),
        emptyOutDir: false,
        assetsDir: '',
        sourcemap: true,
        rollupOptions: {
            input: inputs,
            output: {
                entryFileNames: 'admin/js/[name].js',
                chunkFileNames: 'admin/chunks/[name]-[hash].js',
                assetFileNames: 'admin/assets/[name]-[hash][extname]',
            },
        },
    },
    resolve: {
        alias: {
            vue: path.resolve(__dirname, 'node_modules/@vue/compat/dist/vue.esm-bundler.js'),
            'element-plus': path.resolve(__dirname, 'node_modules/element-plus'),
            '@admin': path.resolve(pluginRoot, 'resources/admin'),
            '@legacy-admin': path.resolve(pluginRoot, 'resources/assets/admin'),
            '@images': path.resolve(pluginRoot, 'resources/img'),
            '@bootstrap': path.resolve(pluginRoot, 'resources/admin/bootstrap'),
            '@services': path.resolve(pluginRoot, 'resources/admin/services'),
            '@compat': path.resolve(pluginRoot, 'resources/admin/compat'),
            '@modules': path.resolve(pluginRoot, 'resources/admin/modules'),
            '@shared': path.resolve(pluginRoot, 'resources/admin/shared'),
            '@utils': path.resolve(pluginRoot, 'resources/admin/shared/utils'),
            '@boot': path.resolve(pluginRoot, 'resources/admin/boot'),
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
