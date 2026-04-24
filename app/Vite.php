<?php

namespace FluentForm\App;

defined('ABSPATH') or die;

class Vite
{
    private array $moduleScripts = [];
    private bool $isScriptFilterAdded = false;
    private string $viteHostProtocol = 'http://';
    private string $viteHost = 'localhost';
    private string $vitePort = '8890';
    private string $resourceDirectory = 'resources/';

    protected static ?Vite $instance = null;
    private ?array $manifestData = null;
    public ?string $lastJsHandle = null;

    public function __construct()
    {
        $serverConfigPath = FLUENTFORM_DIR_PATH . 'config' . DIRECTORY_SEPARATOR . 'vite.json';

        if (file_exists($serverConfigPath)) {
            $serverConfig = json_decode(file_get_contents($serverConfigPath));

            if (!empty($serverConfig->host)) {
                $this->viteHost = $serverConfig->host;
            }

            if (!empty($serverConfig->protocol)) {
                $this->viteHostProtocol = $serverConfig->protocol;
            }

            if (!empty($serverConfig->port)) {
                $this->vitePort = $serverConfig->port;
            }
        }
    }

    private static function getInstance(): Vite
    {
        if (static::$instance === null) {
            static::$instance = new static();

            if (!static::$instance->usingDevMode()) {
                static::$instance->loadViteManifest();
            }
        }

        return static::$instance;
    }

    private function loadViteManifest(): void
    {
        if (!empty($this->manifestData)) {
            return;
        }

        $this->manifestData = App::config()->get('vite_config', []);

        if (empty($this->manifestData)) {
            $this->manifestData = [];
        }
    }

    public static function enqueueScript($handle, $src, $dependency = [], $version = null, $inFooter = false): Vite
    {
        return static::getInstance()->enqueue_script($handle, $src, $dependency, $version, $inFooter);
    }

    private function enqueue_script($handle, $src, $dependency = [], $version = null, $inFooter = false): Vite
    {
        $this->moduleScripts[] = $handle;
        $this->lastJsHandle = $handle;

        if (!$this->isScriptFilterAdded) {
            add_filter('script_loader_tag', function ($tag, $scriptHandle, $scriptSrc) {
                return $this->addModuleToScript($tag, $scriptHandle, $scriptSrc);
            }, 10, 3);
            $this->isScriptFilterAdded = true;
        }

        if (!$this->usingDevMode()) {
            $assetFile = $this->getFileFromManifest($src);
            $srcPath = $this->getProductionFilePath($assetFile);
        } else {
            $srcPath = $this->getVitePath() . $src;
        }

        if (empty($srcPath)) {
            return $this;
        }

        $version = $version ?: FLUENTFORM_VERSION;

        wp_enqueue_script(
            $handle,
            $srcPath,
            $dependency,
            $version,
            $inFooter
        );

        return $this;
    }

    public static function enqueueStyle($handle, $src, $dependency = [], $version = null, $media = 'all'): void
    {
        static::getInstance()->enqueue_style($handle, $src, $dependency, $version, $media);
    }

    private function enqueue_style($handle, $src, $dependency = [], $version = null, $media = 'all'): void
    {
        if (!$this->usingDevMode()) {
            $assetFile = $this->getFileFromManifest($src);
            $srcPath = $this->getProductionFilePath($assetFile, false);
        } else {
            $srcPath = $this->getVitePath() . $src;
        }

        if (empty($srcPath)) {
            return;
        }

        $version = $version ?: FLUENTFORM_VERSION;

        wp_enqueue_style(
            $handle,
            $srcPath,
            $dependency,
            $version,
            $media
        );

        $this->enqueueRtlStyleIfAvailable($handle, $srcPath, $dependency, $version, $media);
    }

    public static function enqueueStaticScript($handle, $src, $dependency = [], $version = null, $inFooter = false): Vite
    {
        return static::getInstance()->enqueue_static_script($handle, $src, $dependency, $version, $inFooter);
    }

    private function enqueue_static_script($handle, $src, $dependency = [], $version = null, $inFooter = false): Vite
    {
        wp_enqueue_script(
            $handle,
            $this->getStaticEnqueuePath($src),
            $dependency,
            $version ?: FLUENTFORM_VERSION,
            $inFooter
        );

        return $this;
    }

    public static function enqueueStaticStyle($handle, $src, $dependency = [], $version = null, $media = 'all'): void
    {
        static::getInstance()->enqueue_static_style($handle, $src, $dependency, $version, $media);
    }

    private function enqueue_static_style($handle, $src, $dependency = [], $version = null, $media = 'all'): void
    {
        $version = $version ?: FLUENTFORM_VERSION;
        $srcPath = $this->getStaticEnqueuePath($src);

        wp_enqueue_style(
            $handle,
            $srcPath,
            $dependency,
            $version,
            $media
        );

        $this->enqueueRtlStyleIfAvailable($handle, $srcPath, $dependency, $version, $media);
    }

    public function with($params): void
    {
        if (!is_array($params) || empty($this->lastJsHandle)) {
            $this->lastJsHandle = null;
            return;
        }

        foreach ($params as $key => $val) {
            wp_localize_script($this->lastJsHandle, $key, $val);
        }

        $this->lastJsHandle = null;
    }

    public static function underDevelopment(): bool
    {
        return static::getInstance()->usingDevMode();
    }

    public static function getEnqueuePath($path = ''): string
    {
        $vite = static::getInstance();

        if (!$vite->usingDevMode()) {
            $assetFile = $vite->getFileFromManifest($path);
            return $vite->getProductionFilePath($assetFile);
        }

        return $vite->getVitePath() . $path;
    }

    public static function getAssetUrl($path = ''): string
    {
        return esc_url(static::getInstance()->get_asset_url($path));
    }

    private function get_asset_url($path = ''): string
    {
        if (!$this->usingDevMode()) {
            return wpFluentForm('url.assets') . ltrim($path, '/');
        }

        return $this->getVitePath() . ltrim($path, '/');
    }

    private function getStaticEnqueuePath($path): string
    {
        if (!$this->usingDevMode()) {
            return $this->get_asset_url($path);
        }

        return $this->getVitePath() . ltrim($path, '/');
    }

    private function getFileFromManifest($src)
    {
        $manifestKey = $this->resourceDirectory . ltrim($src, '/');

        if (isset($this->manifestData[$manifestKey])) {
            return $this->manifestData[$manifestKey];
        }

        if ($this->usingDevMode()) {
            throw new \Exception(esc_html($src) . ' file not found in vite manifest.');
        }

        return [];
    }

    private function getProductionFilePath($file, $loadChunkCss = true): string
    {
        if (!isset($file['file'])) {
            return '';
        }

        if ($loadChunkCss) {
            $this->ensureChunkCssIsLoaded($file);
        }

        return wpFluentForm('url.assets') . ltrim($file['file'], '/');
    }

    private function ensureChunkCssIsLoaded($file): void
    {
        if (!isset($file['css']) || !is_array($file['css'])) {
            return;
        }

        foreach ($file['css'] as $index => $path) {
            $handle = sanitize_key(($file['file'] ?? 'fluentform_vite') . '_' . $index . '_css');
            $srcPath = wpFluentForm('url.assets') . ltrim($path, '/');

            wp_enqueue_style(
                $handle,
                $srcPath,
                [],
                FLUENTFORM_VERSION
            );

            $this->enqueueRtlStyleIfAvailable($handle, $srcPath, [], FLUENTFORM_VERSION);
        }
    }

    private function enqueueRtlStyleIfAvailable($handle, $srcPath, $dependency = [], $version = null, $media = 'all'): void
    {
        if (!is_rtl() || empty($srcPath) || substr(parse_url($srcPath, PHP_URL_PATH) ?: '', -4) !== '.css') {
            return;
        }

        $rtlSrcPath = preg_replace('/\.css(\?.*)?$/', '.rtl.css$1', $srcPath);

        if (!$rtlSrcPath || $rtlSrcPath === $srcPath) {
            return;
        }

        if (!$this->rtlAssetExists($rtlSrcPath)) {
            return;
        }

        wp_enqueue_style(
            $handle . '_rtl',
            $rtlSrcPath,
            array_merge([$handle], $dependency),
            $version ?: FLUENTFORM_VERSION,
            $media
        );
    }

    private function rtlAssetExists(string $rtlSrcPath): bool
    {
        $assetsBaseUrl = wpFluentForm('url.assets');
        $assetsBasePath = wpFluentForm('path.assets');

        if (!$assetsBaseUrl || !$assetsBasePath || strpos($rtlSrcPath, $assetsBaseUrl) !== 0) {
            return false;
        }

        $relativePath = ltrim(substr($rtlSrcPath, strlen($assetsBaseUrl)), '/');

        return file_exists(trailingslashit($assetsBasePath) . $relativePath);
    }

    private function usingDevMode(): bool
    {
        if (defined('FLUENTFORM_VITE_DEV') && FLUENTFORM_VITE_DEV) {
            return true;
        }

        return App::config()->get('app.env') === 'dev';
    }

    private function getVitePath(): string
    {
        $protocol = rtrim($this->viteHostProtocol, ':/');
        $host = rtrim($this->viteHost, '/');
        $port = $this->vitePort;
        $resource = ltrim($this->resourceDirectory, '/');

        return sprintf('%s://%s:%s/%s', $protocol, $host, $port, $resource);
    }

    private function addModuleToScript($tag, $handle, $src)
    {
        if (in_array($handle, $this->moduleScripts, true)) {
            return wp_get_script_tag([
                'src'  => esc_url($src),
                'type' => 'module',
                'id'   => $handle . '-js',
            ]);
        }

        return $tag;
    }
}
