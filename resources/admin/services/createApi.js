export function createApi(rest = window.FluentFormsGlobal?.$rest) {
    return {
        route(name, params) {
            return rest.route(name, params);
        },
        get(url, params) {
            return rest.get(url, params);
        },
        post(url, payload) {
            return rest.post(url, payload);
        },
        put(url, payload) {
            return rest.put(url, payload);
        },
        delete(url, payload) {
            return rest.delete(url, payload);
        },
    };
}
