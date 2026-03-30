<?php

namespace FluentForm\App\Utils\Enqueuer;

use FluentForm\App\App;

abstract class Enqueuer
{
    private static $resourceDirectory = 'resources/assets/';

    public static function getResourceDirectory()
    {
        return static::$resourceDirectory;
    }

    private function enqueueStyle($handle, $src, $dependency = [], $version = null){}
    private function enqueueStaticStyle($handle, $src, $dependency = [], $version = null){}
    private function enqueueScript($handle, $src, $dependency = [], $version = null, $inFooter = false){}
    private function enqueueStaticScript($handle, $src, $dependency = [], $version = null, $inFooter = false){}

    static function getEnqueuePath($path = ''){}

    static function getAssetPath()
    {
        return App::getInstance()['url.assets'];
    }

    static function getProductionFilePath($assetFile)
    {
        if (empty($assetFile) || !isset($assetFile['file']) || empty($assetFile['file'])) {
            return static::getAssetPath();
        }

        return static::getAssetPath() . $assetFile['file'];
    }
}
