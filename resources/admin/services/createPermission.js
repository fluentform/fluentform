export function createPermission(permissions = window.fluent_forms_global_var?.permissions || {}) {
    return {
        all() {
            return permissions;
        },
        can(permission) {
            return Boolean(permissions?.[permission]);
        },
    };
}
