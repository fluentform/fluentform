<?php

namespace Dev\Test\Inc;

use InvalidArgumentException;

trait Concerns
{
	public function get($uri, $params = [])
	{
		$response = $this->server->dispatch(
			$this->createRequest('GET', $uri, $params)
		);

		return new Response($response);
	}

	public function post($uri, $params = [])
	{
		$response = $this->server->dispatch(
			$this->createRequest('POST', $uri, $params)
		);

		return new Response($response);
	}

	/**
	 * Mirrors the production client: PUT / PATCH / DELETE are sent as POST
	 * with the X-HTTP-Method-Override header, which WP_REST_Server
	 * understands. Tests should use these helpers so the request flow
	 * matches what the admin REST client actually issues.
	 */
	public function put($uri, $params = [])
	{
		return $this->dispatchWithOverride('PUT', $uri, $params);
	}

	public function patch($uri, $params = [])
	{
		return $this->dispatchWithOverride('PATCH', $uri, $params);
	}

	public function delete($uri, $params = [])
	{
		return $this->dispatchWithOverride('DELETE', $uri, $params);
	}

	/**
	 * The production admin REST client sends PUT/PATCH/DELETE as POST with
	 * an X-HTTP-Method-Override header so firewalls don't block them.
	 * WP_REST_Server::serve_request() translates that header back to the
	 * real method at the HTTP boundary. In tests we go through dispatch()
	 * directly, which doesn't read the header — so we set the method
	 * explicitly so WP_REST_Server dispatches to the route registered for
	 * THAT method (DELETE routes hit @delete, not @update).
	 *
	 * Note: FluentForm currently registers no PUT/PATCH routes (only POST +
	 * DELETE + GET). put()/patch() helpers are forward-compatible; against
	 * today's routes they correctly produce 404 because no PUT route is
	 * registered. Use post() for "update" intent against FluentForm endpoints.
	 */
	protected function dispatchWithOverride($method, $uri, $params = [])
	{
		$request = $this->createRequest('POST', $uri, $params);
		$request->set_header('X-HTTP-Method-Override', strtoupper($method));
		$request->set_method(strtoupper($method));

		$response = $this->server->dispatch($request);

		return new Response($response);
	}

	public function createRequest($method, $uri, $params = [])
    {
    	do_action('rest_api_init');

        $request = new \WP_REST_Request(
        	$method, $this->getRestNamespace() . trim($uri, '/')
        );

        if (count($params)) {
    		foreach ($params as $param => $value) {
                $request->set_param($param, $value);
            }
        }

        return $request;
    }

	protected function getRestNamespace()
	{
		$ns = $this->plugin->config->get('app.rest_namespace');

		$ver = $this->plugin->config->get('app.rest_version');

		return '/' . $ns . '/' . $ver . '/';
	}

	public function login($id)
	{
		return $this->setUser($id);
	}

	public function logout()
	{
		return $this->setUser(0);
	}

	public function setUser($id)
	{
		$exception = new InvalidArgumentException(
			'The argument must be a valid user ID or WP_User object'
		);

		if (is_int($id) || $id instanceof \WP_User) {
			$user = wp_set_current_user(
				is_object($id) ? $id->ID : $id
			);

			if ($id && !$user->ID) {
				throw $exception;
			}

			return $this;
		}

		throw $exception;
	}

	/**
	 * Submit a form through the REST submission endpoint. Mirrors what the
	 * frontend AJAX flow does server-side. Returns the Response wrapper for
	 * fluent assertions.
	 *
	 * Tests using this helper exercise the same SubmissionHandlerService
	 * pipeline that production submissions go through — validation, sanitize,
	 * insert, post-submission hooks.
	 */
	public function submitForm($formId, array $data = [])
	{
		// SubmissionHandlerController::submit reads $this->request->get('data')
		// then parse_str()s it — only the 'data' query-string param matters.
		// Sending the same fields at top level would risk clobbering form_id
		// if a field happens to be named form_id.
		return $this->post('form-submit', [
			'form_id' => (int) $formId,
			'data'    => http_build_query($data),
		]);
	}

	/**
	 * Create a fresh user with the requested FluentForm capability and log
	 * them in. Maps the FF capability to a WordPress role that has it
	 * (administrator carries all FF caps via Acl::addCapsToAdmin).
	 *
	 * Returns the created user ID for chaining or post-creation assertions.
	 */
	public function impersonateAsRole($capability)
	{
		// Administrator role gets all FluentForm caps via Acl::addCapsToAdmin
		// during plugin activation. In the test env we add the cap explicitly
		// on a fresh subscriber-base user so the cap is granted by user-cap,
		// not by role inheritance — this lets tests target one cap precisely.
		$userId = wp_insert_user([
			'user_login' => 'ff_test_' . wp_generate_password(8, false),
			'user_pass'  => wp_generate_password(),
			'user_email' => 'ff_test_' . wp_generate_password(6, false) . '@example.com',
			'role'       => 'subscriber',
		]);

		if (is_wp_error($userId)) {
			throw new \RuntimeException('impersonateAsRole: failed to create user: ' . $userId->get_error_message());
		}

		$user = get_user_by('id', $userId);
		$user->add_cap($capability);

		$this->login((int) $userId);

		return (int) $userId;
	}

	/**
	 * Tracks installed mockHttp filters so clearMockedHttp() can remove
	 * them between tests. Keyed by filter callback so the closure can be
	 * looked up by reference.
	 */
	protected $mockedHttpFilters = [];

	/**
	 * Intercept any wp_remote_* call whose URL contains $needle and return
	 * the canned $response instead of hitting the network. $response keys:
	 *   - status: HTTP status code (default 200)
	 *   - body:   response body string (default '')
	 *   - headers: associative header array (default [])
	 *
	 * Filter is installed at priority 5 so the canned response wins over
	 * default-priority pre_http_request handlers. Call clearMockedHttp()
	 * in tearDown to remove all installed mocks (already wired into
	 * Concerns::resetHttpMocks below).
	 */
	public function mockHttp($needle, array $response = [])
	{
		$mock = [
			'response' => ['code' => (int) ($response['status'] ?? 200), 'message' => ''],
			'body'     => (string) ($response['body'] ?? ''),
			'headers'  => (array) ($response['headers'] ?? []),
			'cookies'  => [],
			'filename' => null,
		];

		$callback = function ($preempt, $args, $url) use ($needle, $mock) {
			if (strpos($url, $needle) !== false) {
				return $mock;
			}
			return $preempt;
		};

		add_filter('pre_http_request', $callback, 5, 3);
		$this->mockedHttpFilters[] = $callback;

		return $this;
	}

	/**
	 * Remove every mockHttp filter this test instance installed. Called
	 * automatically by TestCase::tearDown so mocks don't leak between
	 * tests within the same class run.
	 */
	public function clearMockedHttp()
	{
		foreach ($this->mockedHttpFilters as $callback) {
			remove_filter('pre_http_request', $callback, 5);
		}
		$this->mockedHttpFilters = [];
	}
}
