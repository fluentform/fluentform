<?php

namespace FluentForm\App\Utils\Enqueuer;

use FluentForm\App\App;
use FluentForm\Framework\Support\Arr;

class Vite
{
    /**
     * @method static enqueueScript(string $handle, string $src, array $dependency = [], string|null $version = null, bool|null $inFooter = false)
     * @method static registerScript(string $handle, string $src, array $dependency = [], string|null $version = null, bool|null $inFooter = false)
     * @method static enqueueRegisteredScript(string $handle)
     * @method static enqueueStyle(string $handle, string $src, array $dependency = [], string|null $version = null)
     * @method static registerStyle(string $handle, string $src, array $dependency = [], string|null $version = null, string $media = 'all')
     * @method static enqueueRegisteredStyle(string $handle)
     */

    private array $moduleScripts = [];
    private bool $isScriptFilterAdded = false;
    private static string $viteHostProtocol = 'http://';
    private static string $viteHost = 'localhost';
    private static string $vitePort = '8880';
    private static string $resourceDirectory = 'resources/';

    protected static ?Vite $instance = null;
    protected static ?string $lastJsHandel = null;

    private ?array $manifestData = null;

    public function __construct()
    {
        $serverConfigPath = FLUENTFORM_DIR_PATH . 'config' . DIRECTORY_SEPARATOR . 'vite.json';
        if (file_exists($serverConfigPath)) {
            $serverConfig = json_decode(file_get_contents($serverConfigPath));
            static::$viteHost = $serverConfig->host ?: static::$viteHost;
            static::$viteHostProtocol = $serverConfig->protocol ?: static::$viteHostProtocol;
            static::$vitePort = $serverConfig->port ?: static::$vitePort;
        }
    }

    /**
     * @throws \Exception
     */
    public static function __callStatic($method, $params)
    {
        if (static::$instance == null) {
            static::$instance = new static();
            if (!self::isOnDevMode()) {
                (static::$instance)->loadViteManifest();
            }
        }
        return call_user_func_array(array(static::$instance, $method), $params);
    }

    /**
     * @throws \Exception
     */
    private function loadViteManifest()
    {
        if (!empty((static::$instance)->manifestData)) {
            return;
        }

        $manifestPath = realpath(__DIR__ . '/../../../assets/manifest.json');
        if (!file_exists($manifestPath)) {
            throw new \Exception('Vite Manifest Not Found. Run : npm run dev or npm run prod');
        }

        if (!function_exists('get_filesystem_method')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        $manifestData = '';
        if (!(false === ($credentials = request_filesystem_credentials(site_url())) || !WP_Filesystem($credentials))) {
            global $wp_filesystem;
            $manifestData = $wp_filesystem->get_contents($manifestPath);
        }

        (static::$instance)->manifestData = json_decode($manifestData, true);
    }

    /**
     * @throws \Exception
     */
    private function enqueueScript($handle, $src, $dependency = [], $version = null, $inFooter = false): Vite
    {
        if (in_array($handle, (static::$instance)->moduleScripts)) {
            if (self::isOnDevMode()) {
                $callerReference = (debug_backtrace()[2]);
                $fileName = explode('plugins', $callerReference['file'])[1];
                $line = $callerReference['line'];
                //throw new \Exception("This handel Has been used'. 'Filename: $fileName Line: $line");
            }
        }

        (static::$instance)->moduleScripts[] = $handle;

        static::$lastJsHandel = $handle;

        if (!(static::$instance)->isScriptFilterAdded) {
            add_filter('script_loader_tag', function ($tag, $handle, $src) {
                return (static::$instance)->addModuleToScript($tag, $handle, $src);
            }, 10, 3);
            (static::$instance)->isScriptFilterAdded = true;
        }

        if (!static::isOnDevMode()) {
            $assetFile = (static::$instance)->getFileFromManifest($src);
            $srcPath = static::getProductionFilePath($assetFile);
        } else {
            $srcPath = static::getVitePath() . $src;
        }

        if (empty($srcPath)) {
            return $this;
        }

        wp_enqueue_script(
            $handle,
            $srcPath,
            $dependency,
            $version,
            $inFooter
        );

        return $this;
    }

    private function registerScript($handle, $src, $dependency = [], $version = null, $inFooter = false)
    {
        if (in_array($handle, (static::$instance)->moduleScripts)) {
            if (self::isOnDevMode()) {
                $callerReference = (debug_backtrace()[2]);
                $fileName = explode('plugins', $callerReference['file'])[1];
                $line = $callerReference['line'];
                //throw new \Exception("This handel Has been used'. 'Filename: $fileName Line: $line");
            }
        }

        (static::$instance)->moduleScripts[] = $handle;

        static::$lastJsHandel = $handle;

        if (!(static::$instance)->isScriptFilterAdded) {
            add_filter('script_loader_tag', function ($tag, $handle, $src) {
                return (static::$instance)->addModuleToScript($tag, $handle, $src);
            }, 10, 3);
            (static::$instance)->isScriptFilterAdded = true;
        }

        if (!static::isOnDevMode()) {
            $assetFile = (static::$instance)->getFileFromManifest($src);
            $srcPath = static::getProductionFilePath($assetFile);
        } else {
            $srcPath = static::getVitePath() . $src;
        }

        if (empty($srcPath)) {
            return $this;
        }

        wp_register_script(
            $handle,
            $srcPath,
            $dependency,
            $version,
            $inFooter
        );

        return $this;
    }

    private function enqueueRegisteredScript($handle)
    {
        wp_enqueue_script($handle);
    }

    private function getFileFromManifest($src)
    {
        if (isset((static::$instance)->manifestData[static::$resourceDirectory . $src])) {
            return (static::$instance)->manifestData[static::$resourceDirectory . $src];
        }

        if (static::isOnDevMode()) {
            throw new \Exception(esc_html($src) . " file not found in vite manifest, Make sure it is in rollupOptions input and build again");
        }
        return '';
    }

    static function getProductionFilePath($file)
    {
        if (!isset($file['file'])) {
            return '';
        }

        $assetPath = static::getAssetPath();
        if (isset($file['css']) && is_array($file['css'])) {
            foreach ($file['css'] as $key => $path) {
                wp_enqueue_style(
                    $file['file'] . '_' . $key . '_css',
                    $assetPath . $path,
                    [],
                    FLUENTFORM_VERSION
                );
            }
        }
        return ($assetPath . $file['file']);
    }

    static function with($params)
    {
        if (!is_array($params) || !Arr::isAssoc($params) || empty(static::$lastJsHandel)) {
            static::$lastJsHandel = null;
            return;
        }

        foreach ($params as $key => $val) {
            wp_localize_script(static::$lastJsHandel, $key, $val);
        }
        static::$lastJsHandel = null;
    }

    private function enqueueStyle($handle, $src, $dependency = [], $version = null)
    {
        if (!static::isOnDevMode()) {
            $assetFile = (static::$instance)->getFileFromManifest($src);
            $srcPath = static::getProductionFilePath($assetFile);
        } else {
            $srcPath = static::getVitePath() . $src;
        }

        if (empty($srcPath)) {
            return;
        }

        wp_enqueue_style(
            $handle,
            $srcPath,
            $dependency,
            $version
        );
    }

    private function registerStyle($handle, $src, $dependency = [], $version = null, $media = 'all')
    {
        if (!static::isOnDevMode()) {
            $assetFile = (static::$instance)->getFileFromManifest($src);
            $srcPath = static::getProductionFilePath($assetFile);
        } else {
            $srcPath = static::getVitePath() . $src;
        }

        if (empty($srcPath)) {
            return;
        }

        wp_register_style(
            $handle,
            $srcPath,
            $dependency,
            $version,
            $media
        );
    }

    private function enqueueRegisteredStyle($handle)
    {
        wp_enqueue_style($handle);
    }

    private function registerStaticScript($handle, $src, $dependency = [], $version = null, $inFooter = false)
    {
        wp_register_script(
            $handle,
            static::getStaticEnqueuePath($src),
            $dependency,
            $version,
            $inFooter
        );
    }

    private function enqueueStaticScript($handle, $src, $dependency = [], $version = null, $inFooter = false)
    {
        wp_enqueue_script(
            $handle,
            static::getStaticEnqueuePath($src),
            $dependency,
            $version,
            $inFooter
        );
    }

    private static function getStaticEnqueuePath($path)
    {
        if (!static::isOnDevMode()) {
            $srcPath = static::getAssetUrl($path);
        } else {
            $srcPath = static::getVitePath() . $path;
        }

        return $srcPath;
    }

    private function registerStaticStyle($handle, $src, $dependency = [], $version = null, $media = 'all')
    {
        wp_register_style(
            $handle,
            static::getEnqueuePath($src),
            $dependency,
            $version,
            $media
        );
    }

    private function enqueueStaticStyle($handle, $src, $dependency = [], $version = null)
    {
        wp_enqueue_style(
            $handle,
            static::getEnqueuePath($src),
            $dependency,
            $version
        );
    }

    static function isOnDevMode(): bool
    {
        return App::getInstance()->config->get('app.env') === 'dev';
    }

    static function getVitePath(): string
    {
        return static::$viteHostProtocol . static::$viteHost . ":" . (static::$vitePort) . '/' . (static::$resourceDirectory);
    }

    private function getEnqueuePath($path = ''): string
    {
        if (!static::isOnDevMode()) {
            $assetFile = (static::$instance)->getFileFromManifest($path);
            $srcPath = static::getProductionFilePath($assetFile);
        } else {
            $srcPath = static::getVitePath() . $path;
        }

        return $srcPath;
    }

    static function getAssetUrl($path = '')
    {
        if (!static::isOnDevMode()) {
            return FLUENTFORM_URL . 'assets' . DIRECTORY_SEPARATOR . $path;
        } else {
            return static::getVitePath() . $path;
        }
    }

    static function getAssetPath(): string
    {
        return App::getInstance()['url.assets'];
    }

    private function addModuleToScript($tag, $handle, $src)
    {
        if (in_array($handle, (static::$instance)->moduleScripts)) {
            return wp_get_script_tag(
                [
                    'src' =>  esc_url($src),
                    'type' => 'module'
                ]
            );
        }
        return $tag;
    }
}
