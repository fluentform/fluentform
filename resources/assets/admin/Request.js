export default function (method, route, data = {}) {
    const url = `${window.fluent_forms_global_var.rest.url}/${route}`;

    const headers = { "X-WP-Nonce": window.fluent_forms_global_var.rest.nonce };

    if (["PUT", "PATCH", "DELETE"].indexOf(method.toUpperCase()) !== -1) {
        headers["X-HTTP-Method-Override"] = method;
        method = "POST";
    }

    data.query_timestamp = Date.now();

    return new Promise((resolve, reject) => {
        window.jQuery
            .ajax({
                url: url,
                type: method,
                data: data,
                headers: headers,
            })
            .then(response => resolve(response))
            .fail(errors => reject(errors.responseJSON));
    });
}
