<?php

namespace FluentForm\Framework\Support;

class Util
{
	/**
	 * Returns a comma-separated string or array of functions that
	 * have been called to get to the current point in code.
	 * 
	 * @param  string  $ignoreClass
	 * @param  integer $skipFrames
	 * @param  boolean $pretty
	 * @return string|array
	 * @see https://developer.wordpress.org/reference/functions/wp_debug_backtrace_summary/
	 */
	public static function debugBacktraceSummary(
		$ignoreClass = null,
		$skipFrames = 0,
		$pretty = true
	) {
		return wp_debug_backtrace_summary(
			$ignoreClass, $skipFrames, $pretty
		);
	}

	/**
	 * Searches for metadata in the first 8 KB of a file, such as a plugin or theme.
	 * Each piece of metadata must be on its own line. Fields can not span 
	 * multiple lines, the value will get cut at the end of the first
	 * line. If the file data is not within that first 8 KB, then
	 * the author should correct their plugin file and move
	 * the data headers to the top.
	 *
	 * @param string $file
	 * @param array keys
	 * @return array
	 */
	public static function getFileMetaData($file, $keys = [])
	{
	    $data = [];

	    $content = file_get_contents($file, false, null, 0, 8 * 1024);

	    if (false === $content) {
	        return $data;
	    }

	    $content = str_replace("\r", "\n", $content);

	    $pattern = '/^(?:[ \t]*<\?php)?[ \t\/*#@]*(.*?):(.*)$/mi';

	    if (preg_match_all($pattern, $content, $matches)) {
	        foreach ($matches[1] as $key => $value) {
	            $name = str_replace(' ', '_', strtolower(
            		trim($matches[1][$key])
            	));
	            $data[$name] = trim($matches[2][$key]);
	        }
	    }

	    return $keys ? Arr::only($data, array_map(function($key) {
	    	return strtolower(str_replace(' ', '_', $key));
	    }, $keys)) : $data;
	}

	/**
	 * @param  string|array $value
	 * @return mixed
	 * @see https://developer.wordpress.org/reference/functions/wp_slash
	 */
	public static function addslashes($value)
	{
		return wp_slash($value);
	}
}
