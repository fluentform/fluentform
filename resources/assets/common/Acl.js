export default class Acl {
    verify(permission) {
        return window.fluent_forms_global_var.permissions.indexOf(permission) !== -1;
    }
}