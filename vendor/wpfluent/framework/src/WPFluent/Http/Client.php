<?php

namespace FluentForm\Framework\Http;

use FluentForm\Framework\Support\Arr;
use FluentForm\Framework\Http\Request\File;

class Client
{
	/**
	 * Base URl for the request.
	 * 
	 * @var string
	 */
	protected $baseUrl = '';
	
	/**
	 * Cookies to send with the request.
	 * 
	 * @var array
	 */
	protected $cookies = [];
	
	/**
	 * Headers to send with the request.
	 * @var array
	 */
	protected $headers = [];
	
	/**
	 * Options to set in wp_remote_request method.
	 * 
	 * @var array
	 */
	protected $options = [];

	/**
	 * Create a new HTTP client.
	 *
	 * @param string $baseUrl
	 * @param array $args
	 */
	public function __construct($baseUrl = '', $args = [])
	{
		$this->baseUrl = $baseUrl;
		$this->cookies = $args['cookies'] ?? [];
		$this->headers = $args['headers'] ?? [];
		$this->options = $args['options'] ?? [];
	}

	/**
	 * Create a new HTTP client.
	 * 
	 * @param string $baseUrl
	 * @param array $args
	 */
	public static function make($baseUrl = '', $args = [])
	{
		$args['cookies'] = $args['cookies'] ?? [];
		$args['headers'] = $args['headers'] ?? [];
		$args['options'] = $args['options'] ?? [];
		return new static($baseUrl, $args);
	}

	/**
	 * Build the request arguments.
	 * 
	 * @param  array  $params
	 * @param  string $method 
	 * @return array
	 */
	protected function buildRequestArgs($params, $method)
	{
		$cookies = $data = $headers = $options = [];

		$params = wp_parse_args(reset($params), compact(
			'cookies', 'data', 'headers', 'options'
		));
		
		$data = Arr::except(
			$params, ['cookies', 'data', 'headers', 'options']
		);

		$params['data'] = array_merge($data, $params['data'] ?? []);

		$params['cookies'] = array_merge(
			$this->cookies, $params['cookies']
		);
		
		$params['cookies'] = str_replace(
			'&', '; ', http_build_query($params['cookies'])
		);

		return [
			'method' => strtoupper($method),
			'body' => $params['data'],
			'headers' => array_merge(
				$this->headers,
				$params['headers'],
				['Cookie' => $params['cookies']],
			),
			'options' => array_merge($this->options, $params['options']),
		];
	}

	/**
	 * Send the request.
	 * 
	 * @param  string $url
	 * @param  array  $args
	 * @return Response object from anonymous class.
	 */
	protected function request($url, $args = [])
	{
		$response = wp_remote_request($url, $args);

		if (is_wp_error($response)) {
			throw new class(
				$response->get_error_message(), 500
			) extends \Exception {};
		}
		
		$this->cookies = array_merge(
			$this->cookies,
			wp_remote_retrieve_cookies($response)
		);

		return $this->makeResponse($response);
	}

	/**
	 * Download a remote file.
	 * 
	 * @param  string $url
	 * @return \FluentForm\Framework\Http\Request\File
	 * @throws \Exception
	 */
	public function download($url)
	{
		if (!function_exists('download_url')) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		if (is_wp_error($file = download_url($url))) {
			throw new \Exception($file->get_error_message(), 500);
		}

		add_action('shutdown', function () use ($file) {
			@unlink($file);
		});

		 return new File(
		 	$file,
		 	basename($file),
		 	mime_content_type($file) ?: 'application/octet-stream',
		 	filesize($file),
		 	UPLOAD_ERR_OK
		 );
	}

	/**
	 * Build a response object from an anonymous class.
	 * 
	 * @param  array $response
	 * @return @return Response object from anonymous class.
	 */
	protected function makeResponse($response)
	{
		return new class($response) {

			protected $response = null;
			
			public function __construct($response) {
				$this->response = $response;
			}

			public function toArray() {
				return $this->response;
			}

			public function isOkay() {
				return $this->getCode() == 200;
			}

			public function throw() {
				$class = sprintf(
					'WpOrg\Requests\Exception\Http\Status%d', $this->getCode()
				);
				
				if (!class_exists($class)) {
					$class = 'WpOrg\Requests\Exception\Http\Status\Http';
				}
				
				throw new $class;
			}

			public function throwIf(callable $callback) {
				if ($callback($this)) {
					return $this->throw();
				}
			}

			public function getCode() {
				return wp_remote_retrieve_response_code($this->response);
			}

			public function getMessage() {
				return wp_remote_retrieve_response_message($this->response);
			}

			public function getBody() {
				return wp_remote_retrieve_body($this->response);
			}

			public function isJson() {
				$header = $this->getHeader('content-type');
				return str_contains($header, 'application/json');
			}

			public function getJson() {
				if ($this->isJson()) {
					return json_decode($this->getBody(), true);
				}
			}

			public function getHeaders() {
				return wp_remote_retrieve_headers($this->response);
			}

			public function getHeader($key) {
				return wp_remote_retrieve_header($this->response, $key);
			}

			public function getCookies() {
				return wp_remote_retrieve_cookies($this->response);
			}

			public function getCookie($name, $isObject = false) {
				if ($isObject) {
					// Return the \WP_Http_Cookie object
					return wp_remote_retrieve_cookie($this->response, $name);
				}
				return wp_remote_retrieve_cookie_value($this->response, $name);
			}
		};
	}

	/**
	 * Handles the dynamic calls.
	 * 
	 * @param  string $method
	 * @param  array  $args
	 * @return mixed
	 */
	public function __call($method, $args)
	{
		$url = array_shift($args);

		$parsed = parse_url($url);

		if (!isset($parsed['scheme'])) {
			$url = trim($this->baseUrl, '/') . '/' . trim($url, '/');
		}
		
		return $this->request(
			$url, $this->buildRequestArgs($args, $method)
		);
	}

	/**
	 * Handle the static dynamic calls.
	 * 
	 * @param  string $method
	 * @param  array  $args
	 * @return self
	 */
	public static function __callStatic($method, $args)
	{
		return static::make()->$method(...$args);
	}
}
