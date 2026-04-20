<?php

namespace FluentForm\Framework\Request;

use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Http\Request\Request as BaseRequest;
use FluentForm\Framework\Support\Arr;
use FluentForm\Framework\Support\Collection;
use FluentForm\Framework\Support\Helper;
use FluentForm\Framework\Support\Sanitizer;

class Request extends BaseRequest
{
    /**
     * Raw PHP $_GET values.
     *
     * @var array
     */
    protected $rawGet = [];

    /**
     * Raw PHP $_POST values.
     *
     * @var array
     */
    protected $rawPost = [];

    /**
     * Raw merged request values.
     *
     * @var array
     */
    protected $rawRequest = [];

    /**
     * Whether JSON payload has already been merged into raw bags.
     *
     * @var bool
     */
    protected $rawJsonMerged = false;

    public function __construct(Application $app, $get, $post)
    {
        $this->rawGet = $this->clean($get);
        $this->rawPost = $this->clean($post);
        $this->rawRequest = array_merge($this->rawGet, $this->rawPost);

        parent::__construct($app, $get, $post);
    }

    public function all()
    {
        return $this->get();
    }

    public function get($key = null, $default = null)
    {
        return Helper::dataGet($this->inputs(), $key, $default);
    }

    public function query($key = null, $default = null)
    {
        return $key ? Arr::get($this->rawGet, $key, $default) : $this->rawGet;
    }

    public function post($key = null, $default = null)
    {
        return $key ? Arr::get($this->rawPost, $key, $default) : $this->rawPost;
    }

    public function input($key = null, $default = null)
    {
        return Arr::get($this->inputs(), $key, $default);
    }

    public function only($keys)
    {
        $keys = is_array($keys) ? $keys : func_get_args();

        return Arr::only($this->inputs(), $keys);
    }

    public function except($keys)
    {
        $keys = is_array($keys) ? $keys : func_get_args();

        return Arr::except($this->inputs(), $keys);
    }

    public function exists($key)
    {
        return Arr::has($this->inputs(), $key);
    }

    public function has($key)
    {
        if (!$this->exists($key)) {
            return false;
        }

        $value = Helper::dataGet($this->inputs(), $key);

        return !($value === null || $value === '');
    }

    public function hasAny($keys)
    {
        $keys = is_array($keys) ? $keys : func_get_args();

        foreach ($keys as $key) {
            if ($this->has($key)) {
                return true;
            }
        }

        return false;
    }

    public function set($key, $value)
    {
        Arr::set($this->rawRequest, $key, $value);

        return parent::set($key, $value);
    }

    public function merge(array $data = [])
    {
        $this->rawRequest = array_replace($this->inputs(), $data);

        return parent::merge($data);
    }

    public function forget($key)
    {
        Arr::forget($this->rawRequest, $key);

        return parent::forget($key);
    }

    public function json($key = null, $default = null)
    {
        if (!$this->isJson()) {
            return is_null($key) ? [] : $default;
        }

        return parent::json($key, $default);
    }

    public function cookie($key = null, $default = null)
    {
        if ($key === null) {
            return $_COOKIE;
        }

        $cookie = Arr::get($_COOKIE, $key, $default);

        if (!is_string($cookie) || $cookie === '') {
            return $cookie;
        }

        $decoded = base64_decode($cookie, true);

        if ($decoded === false) {
            return $cookie;
        }

        $jsonDecoded = json_decode($decoded);

        return json_last_error() === JSON_ERROR_NONE ? $jsonDecoded : $cookie;
    }

    public function getSafe($key, $callback = null, $default = null)
    {
        $originalKey = $key;
        $array = $result = [];
        $expectsArray = true;

        if (!is_array($key)) {
            $key = [$key];
            $expectsArray = false;
        }

        if ($callback) {
            $callback = is_array($callback) ? $callback : [$callback];

            foreach ($key as $field) {
                $array[$field] = $callback;
            }
        } else {
            foreach ($key as $k => $v) {
                if (is_int($k)) {
                    $k = $v;
                    $v = fn($value) => $this->sanitizeByType($value);
                }

                $array[$k] = is_array($v) ? $v : [$v];
            }
        }

        $result = Sanitizer::sanitize($this->all(), $array);
        $result = $this->pickKeys(array_keys($array), $result);

        if (is_array($originalKey)) {
            return $expectsArray ? $result : reset($result);
        }

        return Arr::get($result, $originalKey, $default);
    }

    public function fileCollection($key = null)
    {
        $collection = Helper::collect($this->files($key));

        if (!method_exists($collection, 'save')) {
            $this->addSaveMethod($collection);
        }

        return $collection;
    }

    public function setHeaders()
    {
        $headers = [];

        $parameters = $this->server;

        $contentHeaders = [
            'CONTENT_LENGTH' => true,
            'CONTENT_MD5'    => true,
            'CONTENT_TYPE'   => true
        ];

        foreach ($parameters as $key => $value) {
            if (0 === strpos($key, 'HTTP_')) {
                $headers[substr($key, 5)] = $value;
            } elseif (isset($contentHeaders[$key])) {
                $headers[$key] = $value;
            }
        }

        if (isset($parameters['PHP_AUTH_USER'])) {
            $headers['PHP_AUTH_USER'] = $parameters['PHP_AUTH_USER'];
            $headers['PHP_AUTH_PW'] = isset($parameters['PHP_AUTH_PW']) ? $parameters['PHP_AUTH_PW'] : '';
        } else {
            $authorizationHeader = null;
            if (isset($parameters['HTTP_AUTHORIZATION'])) {
                $authorizationHeader = $parameters['HTTP_AUTHORIZATION'];
            } elseif (isset($parameters['REDIRECT_HTTP_AUTHORIZATION'])) {
                $authorizationHeader = $parameters['REDIRECT_HTTP_AUTHORIZATION'];
            }

            if (null !== $authorizationHeader) {
                if (0 === stripos($authorizationHeader, 'basic ')) {
                    $exploded = explode(':', base64_decode(substr($authorizationHeader, 6)), 2);

                    if (count($exploded) === 2) {
                        list($headers['PHP_AUTH_USER'], $headers['PHP_AUTH_PW']) = $exploded;
                    }
                } elseif (
                    empty($parameters['PHP_AUTH_DIGEST']) &&
                    (0 === stripos($authorizationHeader, 'digest '))
                ) {
                    $headers['PHP_AUTH_DIGEST'] = $authorizationHeader;
                    $parameters['PHP_AUTH_DIGEST'] = $authorizationHeader;
                } elseif (0 === stripos($authorizationHeader, 'bearer ')) {
                    $headers['AUTHORIZATION'] = $authorizationHeader;
                }
            }
        }

        if (!isset($headers['AUTHORIZATION'])) {
            if (isset($headers['PHP_AUTH_USER'])) {
                $headers['AUTHORIZATION'] = 'Basic ' . base64_encode(
                    $headers['PHP_AUTH_USER'] . ':' . $headers['PHP_AUTH_PW']
                );
            } elseif (isset($headers['PHP_AUTH_DIGEST'])) {
                $headers['AUTHORIZATION'] = $headers['PHP_AUTH_DIGEST'];
            }
        }

        return $this->headers = $headers;
    }

    public function mergeInputsFromRestRequest($wpRestRequest)
    {
        $params = $this->clean($wpRestRequest->get_params());
        $bodyParams = $this->clean($wpRestRequest->get_body_params());
        $queryParams = $this->clean($wpRestRequest->get_query_params());

        $this->rawRequest = array_merge($this->rawRequest, $params);
        $this->rawPost = array_merge($this->rawPost, $bodyParams);
        $this->rawGet = array_merge($this->rawGet, $queryParams);

        parent::mergeInputsFromRestRequest($wpRestRequest);
    }

    protected function inputs()
    {
        if (!$this->wpRestRequest && $this->app->bound('wprestrequest')) {
            // @phpstan-ignore-next-line
            $this->mergeInputsFromRestRequest($this->app->wprestrequest);
        }

        if (!$this->rawJsonMerged && ($json = $this->json())) {
            $this->rawPost = array_merge($this->rawPost, $json);
            $this->rawRequest = array_merge($this->rawRequest, $json);
            $this->rawJsonMerged = true;
        }

        return $this->safe === true ? $this->validated : $this->rawRequest;
    }
}
