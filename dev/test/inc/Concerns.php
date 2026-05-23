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
}
