<?php
namespace FluentForm\Framework\Helpers;
class ArrayHelper
{
    public static function get($array, $key, $default = null)
    {
        if ($key === null) return $array;
        if (is_array($array) && array_key_exists($key, $array)) return $array[$key];
        if (strpos((string) $key, '.') === false) return $default;
        foreach (explode('.', $key) as $seg) {
            if (is_array($array) && array_key_exists($seg, $array)) $array = $array[$seg];
            else return $default;
        }
        return $array;
    }
    public static function has($array, $key)
    {
        if (!is_array($array)) return false;
        if (array_key_exists($key, $array)) return true;
        if (strpos((string) $key, '.') === false) return false;
        foreach (explode('.', $key) as $seg) {
            if (is_array($array) && array_key_exists($seg, $array)) $array = $array[$seg];
            else return false;
        }
        return true;
    }
    public static function flatten($array)
    {
        $array = (array) $array;
        $r = []; array_walk_recursive($array, function ($i) use (&$r) { $r[] = $i; }); return $r;
    }
}
