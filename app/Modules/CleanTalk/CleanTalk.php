<?php

namespace FluentForm\App\Modules\CleanTalk;

class CleanTalk
{
    /**
     * Verify CleanTalk response.
     *
     * @param string $accessKey  response from the user.
     *
     * @return bool
     */
    public static function validate($accessKey)
    {
        require_once FLUENTFORM_DIR_PATH . 'app/Services/Libraries/cleantalk-antispam/cleantalk-antispam.php';
        
        if (!class_exists('\CleantalkAntiSpam\CleantalkAntispam')) {
            return false;
        }
        
        $userEmail = wp_get_current_user()->user_email;
        $userName = wp_get_current_user()->user_nicename;

        $cleantalkAntispam = new \CleantalkAntiSpam\CleantalkAntispam(
            $accessKey,
            $userEmail,
            $userName,
            '',
            'signup'
        );
        $response = $cleantalkAntispam->handle();

        return true;
        if ($response->allow === 1) {
            return true;
        } else {
            return false;
        }
    }
}
