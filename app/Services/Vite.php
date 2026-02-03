<?php

namespace FluentForm\App\Services;

/**
 * Vite asset helper for dev/production mode
 *
 * In dev mode: serves assets from Vite dev server
 * In production: serves from built assets folder using manifest
 */
class Vite
{
    private array $moduleScripts = [];
    private bool $isGlobalFilterAdded = false;
    private string $viteHostProtocol = 'http://';
    private string $viteHost = 'localhost';
    private string $vitePort = '3000';
    private string $resourceDirectory = 'resources/';

    protected static ?Vite $instance = null;
    public ?string $lastJsHandle = null;
    private ?array $manifestData = null;

    public function __construct()
    {
        $serverConfigPath = \FLUENTFORM_DIR_PATH . 'config' . DIRECTORY_SEPARATOR . 'vite.json';
        if (file_exists($serverConfigPath)) {
            $serverConfig = json_decode(file_get_contents($serverConfigPath));
            $this->viteHost = $serverConfig->host ?? $this->viteHost;
            $this->viteHostProtocol = $serverConfig->protocol ?? $this->viteHostProtocol;
            $this->vitePort = $serverConfig->port ?? $this->vitePort;
        }
    }

    private static function getInstance(): Vite
    {
        if (static::$instance === null) {
            static::$instance = new static();
            static::$instance->addGlobalScriptFilter();
            if (!static::$instance->usingDevMode()) {
                static::$instance->loadViteManifest();
            }
        }

        return static::$instance;
    }

    /**
     * Add global filter to automatically add type="module" to Vite scripts
     */
    private function addGlobalScriptFilter(): void
    {
        if ($this->isGlobalFilterAdded) {
            return;
        }

        add_filter('script_loader_tag', function ($tag, $handle, $src) {
            return $this->maybeAddModuleType($tag, $handle, $src);
        }, 10, 3);

        $this->isGlobalFilterAdded = true;
    }

    /**
     * Check if script is a Vite asset and add type="module" if needed
     */
    private function maybeAddModuleType($tag, $handle, $src): string
    {
        // Check if already handled by explicit enqueueScript
        if (in_array($handle, $this->moduleScripts)) {
            return wp_get_script_tag([
                'src'  => esc_url($src),
                'type' => 'module',
                'id'   => $handle . '-js'
            ]);
        }

        // Check if it's a Vite asset by URL pattern
        $isViteAsset = false;

        if ($this->usingDevMode()) {
            // In dev mode, check if URL starts with Vite dev server
            $vitePath = $this->getVitePath();
            if (strpos($src, $vitePath) === 0 && $this->isJsFile($src)) {
                $isViteAsset = true;
            }
        } else {
            // In production, check if URL is a Fluent Forms JS asset
            $assetsUrl = wpFluentForm('url.assets') . 'js/';
            if (strpos($src, $assetsUrl) === 0) {
                $isViteAsset = true;
            }
        }

        if ($isViteAsset) {
            return wp_get_script_tag([
                'src'  => esc_url($src),
                'type' => 'module',
                'id'   => $handle . '-js'
            ]);
        }

        return $tag;
    }

    /**
     * Check if URL points to a JavaScript file
     */
    private function isJsFile(string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH);
        return $path && preg_match('/\.js$/', $path);
    }

    private function loadViteManifest()
    {
        if (!empty($this->manifestData)) {
            return;
        }

        $manifestPath = \FLUENTFORM_DIR_PATH . 'config' . DIRECTORY_SEPARATOR . 'vite_manifest.json';
        if (file_exists($manifestPath)) {
            $this->manifestData = json_decode(file_get_contents($manifestPath), true);
        }

        if (empty($this->manifestData)) {
            $this->manifestData = [];
        }
    }

    public static function enqueueScript($handle, $src, $dependency = [], $version = null, $inFooter = true): Vite
    {
        return static::getInstance()->enqueue_script($handle, $src, $dependency, $version, $inFooter);
    }

    private function enqueue_script($handle, $src, $dependency = [], $version = null, $inFooter = true): Vite
    {
        $this->moduleScripts[] = $handle;
        $this->lastJsHandle = $handle;

        $srcPath = $this->getAssetPath($src, 'js');

        if (empty($srcPath)) {
            return $this;
        }

        $version = $version ?? \FLUENTFORM_VERSION;

        wp_enqueue_script($handle, $srcPath, $dependency, $version, $inFooter);

        return $this;
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

    public static function enqueueStyle($handle, $src, $dependency = [], $version = null, $media = 'all')
    {
        static::getInstance()->enqueue_style($handle, $src, $dependency, $version, $media);
    }

    private function enqueue_style($handle, $src, $dependency = [], $version = null, $media = 'all')
    {
        $srcPath = $this->getAssetPath($src, 'css');

        if (empty($srcPath)) {
            return;
        }

        $version = $version ?? \FLUENTFORM_VERSION;

        wp_enqueue_style($handle, $srcPath, $dependency, $version, $media);
    }

    /**
     * Get asset path based on dev/production mode
     */
    private function getAssetPath($src, $type = 'js'): string
    {
        if ($this->usingDevMode()) {
            return $this->getVitePath() . $src;
        }

        // Production mode - use manifest
        $assetFile = $this->getFileFromManifest($src);
        if (empty($assetFile)) {
            return '';
        }

        return wpFluentForm('url.assets') . $assetFile['file'];
    }

    private function getFileFromManifest($src)
    {
        // Try direct key lookup first
        $key = $this->resourceDirectory . $src;
        if (isset($this->manifestData[$key])) {
            return $this->manifestData[$key];
        }

        // Try without resources/ prefix
        if (isset($this->manifestData[$src])) {
            return $this->manifestData[$src];
        }

        // Search by output file path (for backward compatibility with fluentFormMix paths)
        foreach ($this->manifestData as $entry) {
            if (isset($entry['file']) && $entry['file'] === $src) {
                return $entry;
            }
        }

        return null;
    }

    public static function isDev(): bool
    {
        return static::getInstance()->usingDevMode();
    }

    private function usingDevMode(): bool
    {
        return wpFluentForm('config')->get('app.env') === 'dev';
    }

    private function getVitePath(): string
    {
        $protocol = rtrim($this->viteHostProtocol, ':/');
        $host = rtrim($this->viteHost, '/');
        $port = $this->vitePort;

        return sprintf('%s://%s:%s/', $protocol, $host, $port);
    }

    /**
     * Get static asset URL (for libs, images, etc. that don't go through Vite)
     */
    public static function staticAsset($path): string
    {
        if (static::getInstance()->usingDevMode()) {
            return static::getInstance()->getVitePath() . $path;
        }
        return wpFluentForm('url.assets') . ltrim($path, '/');
    }

    /**
     * Legacy compatibility - works like fluentFormMix but Vite-aware
     */
    public static function asset($path): string
    {
        $instance = static::getInstance();

        if ($instance->usingDevMode()) {
            return $instance->getVitePath() . $path;
        }

        // Production mode - use manifest if possible
        $assetFile = $instance->getFileFromManifest($path);
        if ($assetFile && isset($assetFile['file'])) {
            return wpFluentForm('url.assets') . $assetFile['file'];
        }

        // Fallback to direct path
        return wpFluentForm('url.assets') . ltrim($path, '/');
    }
}
