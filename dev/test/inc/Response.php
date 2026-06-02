<?php

namespace Dev\Test\Inc;

class Response
{
	protected $response = null;

	public function __construct($response)
	{
		$this->response = $response;
	}

	public function dd()
	{
		dd([
			'status' => $this->response->get_status(),
			'data' => $this->response->get_data()
		]);
	}

	public function ddd()
	{
		ddd([
			'status' => $this->response->get_status(),
			'data' => $this->response->get_data()
		]);
	}

	public function isOkay()
	{
		return $this->getStatus() === 200;
	}

	public function isForbidden()
	{
		return $this->getStatus() === 403;
	}

	public function getStatus()
	{
		return $this->response->get_status();
	}

	public function getData()
	{
		return $this->response->get_data();
	}

	/**
	 * JSON-coerced data. Always returns an associative array; WP_REST_Response
	 * usually hands back arrays already, but if a controller returned an
	 * object we normalize it here so test assertions don't have to care.
	 */
	public function getJson()
	{
		$data = $this->response->get_data();

		if (is_array($data)) {
			return $data;
		}

		return json_decode(json_encode($data), true);
	}

	/**
	 * Fluent assertion: status code matches. Returns self for chaining.
	 */
	public function assertStatus($code)
	{
		\PHPUnit\Framework\Assert::assertSame(
			(int) $code,
			$this->getStatus(),
			'Expected response status ' . (int) $code . ', got ' . $this->getStatus()
		);

		return $this;
	}

	/**
	 * Fluent assertion: dot-notation path resolves and equals $expected.
	 * Example: $response->assertJsonPath('forms.data.0.id', 5);
	 */
	public function assertJsonPath($path, $expected)
	{
		$actual = $this->resolvePath($this->getJson(), $path);

		\PHPUnit\Framework\Assert::assertSame(
			$expected,
			$actual,
			"JSON path [{$path}] did not match expected value."
		);

		return $this;
	}

	/**
	 * Fluent assertion: key at the given dot-notation path EXISTS (even if
	 * its value is null).
	 */
	public function assertJsonHas($path)
	{
		\PHPUnit\Framework\Assert::assertTrue(
			$this->pathExists($this->getJson(), $path),
			"JSON path [{$path}] was missing from the response."
		);

		return $this;
	}

	/**
	 * Fluent assertion: key at the given dot-notation path is ABSENT.
	 * A present-but-null value fails this assertion (use isNull on the
	 * value for that intent).
	 */
	public function assertJsonMissing($path)
	{
		\PHPUnit\Framework\Assert::assertFalse(
			$this->pathExists($this->getJson(), $path),
			"JSON path [{$path}] should have been absent but the key was present."
		);

		return $this;
	}

	/**
	 * Walk a dot-notation path through nested arrays. Returns null when any
	 * segment is missing OR when the resolved value is genuinely null —
	 * callers needing to distinguish should use pathExists().
	 */
	protected function resolvePath($data, $path)
	{
		$segments = explode('.', $path);

		foreach ($segments as $segment) {
			if (!is_array($data) || !array_key_exists($segment, $data)) {
				return null;
			}
			$data = $data[$segment];
		}

		return $data;
	}

	/**
	 * True iff every segment of the dot-notation path is an existing key.
	 * Distinguishes "key present with null value" from "key absent".
	 */
	protected function pathExists($data, $path)
	{
		$segments = explode('.', $path);

		foreach ($segments as $segment) {
			if (!is_array($data) || !array_key_exists($segment, $data)) {
				return false;
			}
			$data = $data[$segment];
		}

		return true;
	}

	public function __call($method, $params = [])
	{
		if (preg_match('/[A-Z]/', $method, $matches)) {
			foreach ($matches as $match) {
				$method = str_replace($match, '_'.strtolower($match), $method);
			}
		}
		
		return $this->response->{$method}(...$params);
	}
}
