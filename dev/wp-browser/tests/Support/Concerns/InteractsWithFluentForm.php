<?php

namespace Tests\Support\Concerns;

use WP_REST_Request;

/**
 * Shared REST + auth helpers for FluentForm tests. Mirrors the proven logic in
 * the legacy PHPUnit harness (dev/test/inc/Concerns.php): requests target
 * /fluentform/v1/, and PUT/PATCH/DELETE are sent as POST with an
 * X-HTTP-Method-Override header plus an explicit method so WP_REST_Server
 * dispatches to the route registered for that verb.
 *
 * Used by both the Integration base case (RestTestCase) and the Functional
 * Codeception module so the two suites share one request flow.
 */
trait InteractsWithFluentForm
{
    /** @var \WP_REST_Response|null */
    protected $lastResponse;

    /** @var array|null */
    protected $lastBody;

    protected function restNamespace(): string
    {
        $ns  = 'fluentform';
        $ver = 'v1';

        if (function_exists('wpFluentForm')) {
            $config = wpFluentForm('config');
            if ($config) {
                $ns  = $config->get('app.rest_namespace') ?: $ns;
                $ver = $config->get('app.rest_version') ?: $ver;
            }
        }

        return '/' . trim($ns, '/') . '/' . trim($ver, '/') . '/';
    }

    public function get(string $uri, array $params = []): array
    {
        return $this->dispatchRest('GET', $uri, $params);
    }

    public function post(string $uri, array $params = []): array
    {
        return $this->dispatchRest('POST', $uri, $params);
    }

    public function put(string $uri, array $params = []): array
    {
        return $this->dispatchRest('PUT', $uri, $params);
    }

    public function patch(string $uri, array $params = []): array
    {
        return $this->dispatchRest('PATCH', $uri, $params);
    }

    public function delete(string $uri, array $params = []): array
    {
        return $this->dispatchRest('DELETE', $uri, $params);
    }

    /**
     * Drive the admin-gated REST submit endpoint (used by authenticated entry
     * viewers). The controller reads the 'data' param and parse_str()s it.
     */
    public function submitForm(int $formId, array $data = []): array
    {
        return $this->post('form-submit', [
            'form_id' => $formId,
            'data'    => http_build_query($data),
        ]);
    }

    /**
     * Drive the REAL public submission path — the wp_ajax_nopriv_fluentform_submit
     * handler a logged-out visitor hits. SubmissionHandler::submit() terminates
     * via wp_send_json(_success), so the response is captured through wp_die.
     *
     * @return array{status:int, body:string, json:?array, died:bool}
     */
    public function submitPublicForm(int $formId, array $data = []): array
    {
        $post = ['form_id' => $formId, 'data' => http_build_query($data)];

        $originalPost    = $_POST;
        $originalRequest = $_REQUEST;
        $_POST           = $post;
        $_REQUEST        = array_merge($_REQUEST, $post);

        $this->resetFluentState($post);

        $app = $this->fluentApp();

        try {
            return \Tests\Support\WpDieCapture::capture(function () use ($app) {
                (new \FluentForm\App\Modules\SubmissionHandler\SubmissionHandler($app))->submit();
            });
        } finally {
            $_POST    = $originalPost;
            $_REQUEST = $originalRequest;
        }
    }

    protected function fluentApp()
    {
        if (class_exists(\FluentForm\Framework\Foundation\App::class)) {
            return \FluentForm\Framework\Foundation\App::getInstance();
        }
        return function_exists('wpFluentForm') ? wpFluentForm() : null;
    }

    /**
     * Reset per-request framework state between in-process dispatches: rebind a
     * fresh FluentForm Request from the given globals and clear each Route's
     * cached parameters / substitutedParameters (set during dispatch).
     */
    protected function resetFluentState(array $post = []): void
    {
        $app = $this->fluentApp();
        if (!$app) {
            return;
        }

        try {
            $requestClass = \FluentForm\Framework\Http\Request\Request::class;
            $request = new $requestClass($app, $_GET ?? [], $post);
            $app->instance($requestClass, $request);
            $app->instance('request', $request);
            if (method_exists($app, 'bound') && $app->bound('wprestrequest')) {
                $app->forgetInstance('wprestrequest');
            }
        } catch (\Throwable $e) {
            // Best-effort; framework internals only matter for multi-request bleed.
        }

        try {
            $router = $app->make('router');
            if (!method_exists($router, 'getRoutes')) {
                return;
            }
            foreach ((array) $router->getRoutes() as $group) {
                $routes = is_array($group) ? $group : [$group];
                foreach ($routes as $route) {
                    if (!is_object($route)) {
                        continue;
                    }
                    $this->nullRouteProp($route, 'parameters', null);
                    $this->nullRouteProp($route, 'substitutedParameters', []);
                }
            }
        } catch (\Throwable $e) {
            // Best-effort router cache clear for tests only.
        }
    }

    private function nullRouteProp(object $route, string $property, $value): void
    {
        $ref = new \ReflectionClass($route);
        if (!$ref->hasProperty($property)) {
            return;
        }
        $prop = $ref->getProperty($property);
        $prop->setAccessible(true);
        $prop->setValue($route, $value);
    }

    /**
     * @return array{0:int,1:array,2:\WP_REST_Response}
     */
    protected function dispatchRest(string $method, string $uri, array $params = []): array
    {
        // Codeception runs many requests per PHP process; the WPFluent Router
        // caches resolved URL params on each Route object across requests, so a
        // second request to /forms/{id} would otherwise inherit the first id.
        // Production never sees this (one request per process).
        $this->resetFluentState();

        $method = strtoupper($method);
        $route  = $this->restNamespace() . ltrim($uri, '/');

        $request = new WP_REST_Request($method, $route);

        foreach ($params as $key => $value) {
            $request->set_param($key, $value);
        }

        if (in_array($method, ['PUT', 'PATCH', 'DELETE'], true)) {
            $request->set_header('X-HTTP-Method-Override', $method);
            $request->set_method($method);
        }

        $userId = get_current_user_id();
        if ($userId && in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $nonce = wp_create_nonce('wp_rest');
            $request->set_header('X-WP-Nonce', $nonce);
            $_REQUEST['_wpnonce']       = $nonce;
            $_SERVER['HTTP_X_WP_NONCE'] = $nonce;
        } else {
            unset($_REQUEST['_wpnonce'], $_SERVER['HTTP_X_WP_NONCE']);
        }

        $response = rest_do_request($request);

        $this->lastResponse = $response;
        $data               = $response->get_data();
        $encoded            = wp_json_encode($data);
        $this->lastBody     = is_string($encoded) ? json_decode($encoded, true) : (is_array($data) ? $data : []);

        return [$response->get_status(), $this->lastBody ?? [], $response];
    }

    // -----------------------------------------------------------------
    // Auth
    // -----------------------------------------------------------------

    public function loginAsAdmin(): int
    {
        $userId = $this->ensureUser('ff_test_admin', 'administrator');
        wp_set_current_user($userId);

        return $userId;
    }

    public function logout(): void
    {
        wp_set_current_user(0);
    }

    /**
     * Create a fresh subscriber, grant a single FluentForm capability, and log
     * them in — so a permission test can target exactly one cap rather than
     * inheriting a role's full cap set.
     */
    public function impersonateAsRole(string $capability): int
    {
        $userId = wp_insert_user([
            'user_login' => 'ff_test_' . wp_generate_password(8, false),
            'user_pass'  => wp_generate_password(),
            'user_email' => 'ff_test_' . wp_generate_password(6, false) . '@example.com',
            'role'       => 'subscriber',
        ]);

        if (is_wp_error($userId)) {
            throw new \RuntimeException('impersonateAsRole failed: ' . $userId->get_error_message());
        }

        $user = get_user_by('id', $userId);
        $user->add_cap($capability);
        wp_set_current_user((int) $userId);

        return (int) $userId;
    }

    private function ensureUser(string $login, string $wpRole): int
    {
        $user = get_user_by('login', $login);
        if ($user) {
            return (int) $user->ID;
        }

        $userId = wp_insert_user([
            'user_login' => $login,
            'user_email' => $login . '@example.com',
            'user_pass'  => wp_generate_password(12, false),
            'role'       => $wpRole,
        ]);

        if (is_wp_error($userId)) {
            throw new \RuntimeException('Failed to create test user: ' . $userId->get_error_message());
        }

        return (int) $userId;
    }
}
