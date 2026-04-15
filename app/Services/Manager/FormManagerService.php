<?php

namespace FluentForm\App\Services\Manager;



class FormManagerService
{
    private static function normalizeFormIds($formIds)
    {
        $formIds = is_array($formIds) ? $formIds : [$formIds];
        $resolvedFormIds = [];

        foreach ($formIds as $formId) {
            if (is_string($formId)) {
                $formId = trim($formId);
            }

            if (!is_int($formId) && (!is_string($formId) || !ctype_digit($formId))) {
                return [];
            }

            $formId = (int) $formId;

            if ($formId <= 0) {
                return [];
            }

            $resolvedFormIds[] = $formId;
        }

        return array_values(array_unique($resolvedFormIds));
    }

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

    public static function updateHasSpecificFormsPermission($userId, $status)
    {
        if (in_array($status, ['no', 'yes'])) {
            update_user_meta($userId, '_fluent_forms_has_specific_forms_permission', $status);
        }
    }

    public static function hasSpecificFormsPermission($userId)
    {
        $hasFormsPermission = get_user_meta($userId, '_fluent_forms_has_specific_forms_permission', true);
        return 'yes' === $hasFormsPermission;
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
        if ($userId && self::hasSpecificFormsPermission($userId)) {
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
            $formIds = self::normalizeFormIds($formId);

            if (!$formIds) {
                return false;
            }

            return !array_diff($formIds, $allowedForm);
        }

        return true;
    }
}
