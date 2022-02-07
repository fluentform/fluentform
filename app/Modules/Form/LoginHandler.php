<?php

namespace FluentForm\App\Modules\Form;

class LoginHandler
{
    public function init()
    {
        add_filter('fluentform_is_form_renderable', [$this, 'shouldRender'], 100, 2);

        add_action('fluentform_before_insert_submission', [$this, 'handle'], 10, 3);
    }

    public function shouldRender($isRenderable, $form)
    {
        $shouldNotRender = $form->type == 'login_form' &&
                       !isset($_GET['preview_id']) &&
                       is_user_logged_in();

        if ($shouldNotRender) {
            $isRenderable = [
                'status'  => false,
                'message' => "You're already logged in"
            ];
        }

        return $isRenderable;
    }

    public function handle($insertData, $data, $form)
    {
        if ($form->type != 'login_form' || get_current_user_id()) {
            return;
        }

        $fields = \FluentForm\App\Modules\Form\FormFieldsParser::getFields($form, true);
        $usernameGetter = null;
        $passwordGetter = null;
        $rememberMeGetter = null;
        $isEmailUsername = false;

        foreach ($fields as $field) {
            if (in_array($field['element'], ['input_text', 'input_email'])) {
                if ($field['element'] == 'input_email') {
                    $isEmailUsername = true;
                }

                $usernameGetter = $field['attributes']['name'];
            } elseif ($field['element'] == 'input_password') {
                $passwordGetter = $field['attributes']['name'];
            } elseif ($field['element'] == 'input_checkbox') {
                $rememberMeGetter = $field['attributes']['name'];
            }
        }

        $username = $data[$usernameGetter];
        $password = $data[$passwordGetter];
        $rememberMe = isset($data[$rememberMeGetter]);

        if (is_email($username)) {
            $isEmailUsername = true;
        }

        $userBy = $isEmailUsername ? 'email' : 'login';
        $user = get_user_by($userBy, $username);

        if (!$user) {
            $message = sprintf(
                __('<b>Error:</b> The username <b>%s</b> is not registered on this site. If you are unsure of your username, try your email address instead.', 'fluentform'),
                $username
            );

            wp_send_json_error([
                'result' => [
                    'message' => $message
                ]
            ]);
        } else {
            if (!wp_check_password($password, $user->user_pass)) {
                $link = wp_lostpassword_url();

                $message = sprintf(
                    __(
                        '<b>Error:</b> The password you entered for the username <b>%s</b> is incorrect. <a href="%s">Lost your password?</a>',
                        'fluentform'
                    ),
                    $username,
                    $link
                );

                wp_send_json_error([
                    'result' => [
                        'message' => $message
                    ]
                ]);
            } else {
                if ($rememberMe) {
                    add_filter('auth_cookie_expiration', function () {
                        return 2592000;
                    });
                }

                wp_clear_auth_cookie();
                wp_set_current_user($user->ID);
                wp_set_auth_cookie($user->ID);

                $result = (
                    new \FluentForm\App\Modules\Form\FormHandler(wpFluentForm())
                )->getReturnData(null, $form, $data);

                wp_send_json_success([
                    'result' => $result
                ]);
            }
        }
    }
}
