<?php
namespace FluentForm\App\Helpers;
class Str
{
    public static function startsWith($haystack, $needle)
    {
        $haystack = (string) $haystack; $needle = (string) $needle;
        return $needle === '' || strpos($haystack, $needle) === 0;
    }
    public static function endsWith($haystack, $needle)
    {
        $haystack = (string) $haystack; $needle = (string) $needle;
        return $needle === '' || substr($haystack, -strlen($needle)) === $needle;
    }
    public static function contains($haystack, $needle)
    {
        $haystack = (string) $haystack; $needle = (string) $needle;
        return $needle !== '' && strpos($haystack, $needle) !== false;
    }
}
