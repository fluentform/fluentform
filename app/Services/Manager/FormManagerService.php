<?php

namespace FluentForm\App\Services\Manager;



class FormManagerService
{

    public static function maybeAddUserAllowedFormIds($formId)
    {
        if ($allowFormIds = self::getUserAllowedForms()) {
            $allowFormIds[] = $formId;
            self::addUserAllowedForms($allowFormIds);
        }
    }

    public static function addUserAllowedForms($formIds, $userId = false)
    {
        if (!$userId) {
            $userId = get_current_user_id();
        }
        if ($userId) {
            $formIds = array_filter(array_map('intval', $formIds));
            update_user_meta($userId, '_fluent_forms_allowed_forms', $formIds);
        }
    }

    /**
     * Return user allowed form id's
     * @param string $userId Optional, If not pass user will be current user
     *
     * @return mixed|false
     */
    public static function getUserAllowedForms($userId = false)
    {
        if (!$userId) {
            $userId = get_current_user_id();
        }
        if ($userId) {
            $formIds = get_user_meta($userId, '_fluent_forms_allowed_forms', true);
            if (is_array($formIds)) {
                return array_filter(array_map('intval', $formIds));
            }
        }
        return false;
    }

    public static function hasFormPermission($formId)
    {
        if ($formId && $allowedForm = self::getUserAllowedForms()) {
            $formId = is_array($formId) ? array_map('intval', $formId) : [intval($formId)];
            return (bool)array_intersect($formId, $allowedForm);
        }
        return true;
    }
}
