<?php

namespace FluentForm\App\Services\RoleManager;

use FluentForm\App\Modules\Acl\Acl;
use FluentForm\Framework\Support\Arr;
use FluentForm\Framework\Validator\ValidationException;
use FluentForm\Framework\Validator\Validator;

class RoleManagerService
{
    public function getRolesAndManager($attributes = [])
    {
        $roles = $this->getRoles();
        $managers = $this->getManagers($attributes);
        
        return [
            'roles'    => $roles,
            'managers' => $managers
        ];
    }
    
    public function setCapability($attributes = [])
    {
        if (current_user_can('manage_options')) {
            $capability = wp_unslash(Arr::get($attributes, 'capability', []));
            
            foreach ($capability as $item) {
                if ('subscriber' == strtolower($item)) {
                    return ([
                        'message' => __('Sorry, you can not give access to the Subscriber role.', 'fluentform'),
                    ]);
                }
            }
            
            update_option('_fluentform_form_permission', $capability, 'no');
            
            return ([
                'message' => __('Successfully saved the role(s).', 'fluentform'),
            ]);
        } else {
            return ([
                'message' => __('Sorry, You can not update permissions. Only administrators can update permissions',
                    'fluentform')
            ]);
        }
    }
    
    private function getManagers($attributes = [])
    {
        $limit = Arr::get($attributes, 'per_page', 10);
        $page = Arr::get($attributes, 'page', 1);
        
        $query = new \WP_User_Query([
            'meta_key'     => '_fluent_forms_has_role',
            'meta_value'   => 1,
            'meta_compare' => '=',
            'number'       => $limit,
            'paged'        => $page,
        ]);
        
        $managers = [];
        
        foreach ($query->get_results() as $user) {
            $managers[] = [
                'id'          => $user->ID,
                'first_name'  => $user->first_name,
                'last_name'   => $user->last_name,
                'email'       => $user->user_email,
                'permissions' => Acl::getUserPermissions($user),
            ];
        }
        
        return ([
            'managers'    => [
                'data'  => $managers,
                'total' => $query->get_total(),
            ],
            'permissions' => Acl::getReadablePermissions(),
        ]);
    }
    
    public function addManager($attributes = [])
    {
        $manager = Arr::get($attributes, 'manager');
        
        $this->validate($manager);
        
        $permissions = Arr::get($manager, 'permissions', []);
        
        $user = get_user_by('email', $manager['email']);
        
        if (!$user) {
            throw new ValidationException('', 0, null, ['message' => 'Please Provide Valid Email']);
        }
        
        Acl::attachPermissions($user, $permissions);
        
        update_user_meta($user->ID, '_fluent_forms_has_role', 1);
        
        $updatedUser = [
            'id'          => $user->ID,
            'first_name'  => $user->first_name,
            'last_name'   => $user->last_name,
            'email'       => $user->user_email,
            'permissions' => Acl::getUserPermissions($user)
        ];
        
        return ([
            'message' => __('Manager has been saved.', 'fluentform'),
            'manager' => $updatedUser
        ]);
    }
    
    public function removeManager($attributes = [])
    {
        $userID = intval(Arr::get($attributes, 'id'));
        $user = get_user_by('ID', $userID);
        
        if (!$user) {
            return ([
                'message' => __('Associate user could not be found', 'fluentform'),
            ]);
        }
        
        Acl::attachPermissions($user, []);
        
        delete_user_meta($user->ID, '_fluent_forms_has_role');
        
        $deletedUser = [
            'id'          => $user->ID,
            'first_name'  => $user->first_name,
            'last_name'   => $user->last_name,
            'email'       => $user->user_email,
            'permissions' => Acl::getUserPermissions($user)
        ];
        
        return ([
            'message' => __('Manager has been removed.', 'fluentform'),
            'manager' => $deletedUser
        ]);
    }
    
    private function validate($manager)
    {
        $rules = [
            'permissions' => 'required',
            'email'       => 'required|email',
        ];
        
        $validatorInstance = new Validator();
        $validator = $validatorInstance->make($manager, $rules);
        
        $errors = null;
        
        if ($validator->validate()->fails()) {
            $errors = $validator->errors();
        }
        
        if (!isset($errors['email'])) {
            $user = get_user_by('email', $manager['email']);
            
            if (!$user) {
                $errors['email'] = [
                    'no_user' => __('We could not found any user with this email.', 'fluentform'),
                ];
            }
        }
        
        if (!isset($errors['permissions'])) {
            $message = $this->dependencyValidate($manager['permissions']);
            
            if ($message) {
                $errors['permissions'] = [
                    'dependency' => $message,
                ];
            }
        }
        
        if ($errors) {
            throw new ValidationException('', 0, null, [
                'errors' => $errors,
            ]);
        }
    }
    
    private function dependencyValidate($permissions)
    {
        $allPermissions = Acl::getReadablePermissions();
        
        foreach ($permissions as $permission) {
            $depends = Arr::get($allPermissions, $permission . '.depends', []);
            
            if ($depends && $more = array_values(array_diff($depends, $permissions))) {
                $message = $allPermissions[$permission]['title'] . ' requires permission: ';
                
                foreach ($more as $i => $p) {
                    $joiner = $i ? ', ' : '';
                    $message = $message . $joiner . $allPermissions[$p]['title'];
                }
                
                return $message;
            }
        }
    }
    
    private function getFormattedRoles()
    {
        if (!function_exists('get_editable_roles')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }
        
        $formatted = [];
        $roles = \get_editable_roles();
        
        foreach ($roles as $key => $role) {
            if ('administrator' == $key) {
                continue;
            }
            if ('subscriber' != $key) {
                $formatted[] = [
                    'name' => $role['name'],
                    'key'  => $key,
                ];
            }
        }
        return $formatted;
    }
    
    private function getRoles()
    {
        if (!current_user_can('manage_options')) {
            return ([
                'capability' => [],
                'roles'      => [],
            ]);
        }
        
        $formatted = $this->getFormattedRoles();
        
        $capability = get_option('_fluentform_form_permission');
        
        if (is_string($capability)) {
            $capability = [];
        }
        
        return ([
            'capability' => $capability,
            'roles'      => $formatted,
        ]);
    }
}
