<?php

namespace FluentForm\App\Utils\Enqueuer;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

use FluentForm\App\App;
use FluentForm\Framework\Support\Arr;

class Vite extends Enqueuer
{
    /**
     * @method static enqueueScript(string $handle, string $src, array $dependency = [], string|null $version = null, bool|null $inFooter = false)
     * @method static enqueueStyle(string $handle, string $src, array $dependency = [], string|null $version = null)
     */

    private $moduleScripts = [];
    private $isScriptFilterAdded = false;
    private static $viteHostProtocol = 'http://';
    private static $viteHost = 'localhost';
    private static $vitePort = '8881';

    protected static $instance = null;
    protected static $lastJsHandel = null;

    private $manifestData = null;
    private $manifestLoaded = false;

    public static function __callStatic($method, $params)
    {
        if (static::$instance == null) {
            static::$instance = new static();
            if (!self::isOnDevMode()) {
                (static::$instance)->loadViteManifest();
            }
            (static::$instance)->initModuleFilter();
        }
        return call_user_func_array(array(static::$instance, $method), $params);
    }

    private function loadViteManifest()
    {
        if ((static::$instance)->manifestLoaded) {
            return;
        }

        (static::$instance)->manifestLoaded = true;

        $manifestPath = App::make('path.assets') . 'manifest.json';

        if (!file_exists($manifestPath)) {
            // No manifest yet — Phase 1 runs without Vite build
            (static::$instance)->manifestData = [];
            return;
        }

        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
        $manifestFile = fopen($manifestPath, "r");
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fread
        $manifestData = fread($manifestFile, filesize($manifestPath));
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
        fclose($manifestFile);
        (static::$instance)->manifestData = json_decode($manifestData, true);
    }

    private function enqueueScript($handle, $src, $dependency = [], $version = null, $inFooter = false)
    {
        (static::$instance)->moduleScripts[] = $handle;

        static::$lastJsHandel = $handle;

        if (!static::isOnDevMode()) {
            $assetFile = (static::$instance)->getFileFromManifest($src);
            if (!empty($assetFile)) {
                $srcPath = static::getProductionFilePath($assetFile);
                static::enqueueDependentRecursiveStyle($assetFile);
            } else {
                $srcPath = static::getAssetPath() . $src;
            }
        } else {
            $srcPath = static::getVitePath() . $src . '?t=' . time();
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

    private function getFileFromManifest($src)
    {
        $key = static::getResourceDirectory() . $src;

        if (isset((static::$instance)->manifestData[$key])) {
            return (static::$instance)->manifestData[$key];
        }

        return '';
    }

    public static function enqueueDependentRecursiveStyle($file)
    {
        if (empty($file) || !is_array($file)) {
            return;
        }

        $assetPath = static::getAssetPath();
        if (isset($file['css']) && is_array($file['css'])) {
            foreach ($file['css'] as $key => $path) {
                if (empty($path)) {
                    continue;
                }

                wp_enqueue_style(
                    $file['file'] . '_' . $key . '_css',
                    $assetPath . $path,
                    [],
                    FLUENTFORM_VERSION
                );
            }
        }
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

            if (!empty($assetFile)) {
                $srcPath = static::getProductionFilePath($assetFile);
                wp_enqueue_style($handle, $srcPath, $dependency, $version);
                static::enqueueDependentRecursiveStyle($assetFile);
            } else {
                wp_enqueue_style($handle, static::getAssetPath() . $src, $dependency, $version);
            }
        } else {
            $srcPath = static::getVitePath() . $src . '?t=' . time();
            wp_enqueue_style($handle, $srcPath, $dependency, $version);
        }
    }

    private function enqueueStaticScript($handle, $src, $dependency = [], $version = null, $inFooter = false)
    {
        wp_enqueue_script(
            $handle,
            static::getStaticFilePath($src),
            $dependency,
            $version,
            $inFooter
        );
    }

    private function enqueueStaticStyle($handle, $src, $dependency = [], $version = null)
    {
        wp_enqueue_style(
            $handle,
            static::getStaticFilePath($src),
            $dependency,
            $version
        );
    }

    private static $devModeCache = null;

    static function isOnDevMode()
    {
        if (static::$devModeCache !== null) {
            return static::$devModeCache;
        }

        if (defined('FLUENTFORM_VITE_DEV') && FLUENTFORM_VITE_DEV) {
            static::$devModeCache = true;
            return true;
        }

        static::$devModeCache = App::getInstance()->config->get('app.env') === 'dev';
        return static::$devModeCache;
    }

    static function getVitePath()
    {
        return static::$viteHostProtocol . static::$viteHost . ":" . (static::$vitePort) . '/' . (static::getResourceDirectory());
    }

    static function getEnqueuePath($path = '')
    {
        if (static::isOnDevMode()) {
            $fullPath = static::getVitePath() . $path;
            if (!empty($path)) {
                $fullPath .= '?t=' . time();
            }
            return $fullPath;
        }

        // Production mode - try manifest first, fall back to direct path
        if (!empty($path)) {
            if (static::$instance === null) {
                static::$instance = new static();
                static::$instance->loadViteManifest();
            }

            $assetFile = static::$instance->getFileFromManifest($path);
            if (!empty($assetFile)) {
                return static::getProductionFilePath($assetFile);
            }
        }

        return static::getAssetPath() . $path;
    }

    static function getStaticFilePath($path = '')
    {
        if (static::$instance === null) {
            static::$instance = new static();
            if (!self::isOnDevMode()) {
                (static::$instance)->loadViteManifest();
            }
            (static::$instance)->initModuleFilter();
        }
        return static::getAssetPath() . $path;
    }

    private function initModuleFilter()
    {
        if ((static::$instance)->isScriptFilterAdded) {
            return;
        }

        (static::$instance)->isScriptFilterAdded = true;

        add_filter('script_loader_tag', function ($tag, $handle, $src) {
            return (static::$instance)->addModuleToScript($tag, $handle, $src);
        }, 10, 3);
    }

    private function addModuleToScript($tag, $handle, $src)
    {
        // Scripts explicitly registered through Vite::enqueueScript
        if (in_array($handle, (static::$instance)->moduleScripts)) {
            return wp_get_script_tag(
                [
                    'src'  => esc_url($src),
                    'type' => 'module',
                ]
            );
        }

        // All Vite-built scripts from the assets/js/ directory
        $jsPath = static::getStaticFilePath('js/');
        if ($src && strpos($src, $jsPath) !== false) {
            if (strpos($tag, 'type=') !== false) {
                $tag = preg_replace('/type=["\'][^"\']*["\']/', 'type="module"', $tag, 1);
            } else {
                $tag = preg_replace('/(<script\b)/', '$1 type="module"', $tag, 1);
            }
        }

        return $tag;
    }
}
