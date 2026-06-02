export default function (method, route, data = {}) {
    const url = `${window.fluent_forms_global_var.rest.url}/${route}`;
    const originalMethod = method;

    const headers = {
        "X-WP-Nonce": window.fluent_forms_global_var.rest.nonce,
        "Accept": "application/json"
    };

    data._locale = 'user';
    data.query_timestamp = Date.now();

    if (["PUT", "PATCH", "DELETE"].indexOf(method.toUpperCase()) !== -1) {
        headers["X-HTTP-Method-Override"] = method;
        method = "POST";
    }

    return new Promise((resolve, reject) => {
        window.jQuery
            .ajax({
                url: url,
                type: method,
                data: data,
                headers: headers,
            })
            .then(response => resolve(response))
            .fail(errors => {
                // Only show the "REST unreachable" banner when WP itself reports the
                // entire route is missing (rest_no_route). Other 404s — a deleted
                // form, a missing entry id — are normal resource-not-found responses
                // and must not trigger this notice.
                if (
                    errors && errors.status === 404
                    && url.indexOf('/fluentform/v1/') !== -1
                    && errors.responseJSON && errors.responseJSON.code === 'rest_no_route'
                ) {
                    if (!document.getElementById('ff-rest-unreachable')) {
                        const message = (window.fluent_forms_global_var && window.fluent_forms_global_var.i18n_rest_404)
                            || 'Fluent Forms REST endpoints are unreachable on this site. This sometimes happens after a plugin update — try reloading the page, clearing your site cache, or asking your host to clear PHP OpCache. If the issue persists, check whether a security plugin is blocking REST requests.';
                        jQuery('#wpbody-content').prepend(
                            '<div id="ff-rest-unreachable" class="ff_alert danger-soft" style="margin: 20px;">' +
                            '<p class="text" style="margin:0"></p></div>'
                        );
                        // textContent prevents any HTML injection from the localized string.
                        document.querySelector('#ff-rest-unreachable .text').textContent = message;
                    }
                }

                if (errors.responseJSON && errors.responseJSON.code == 'rest_cookie_invalid_nonce') {
                    // Renew nonce from the server and retry the original request.
                    window.FluentFormsGlobal.$get({
                        action: "fluentform_renew_rest_nonce",
                    }).then(response => {
                        if (response.nonce) {
                            window.fluent_forms_global_var.rest.nonce = response.nonce;
                            const retryMethod = originalMethod.toLowerCase();

                            window.FluentFormsGlobal.$rest[retryMethod](route, data).then(response => {
                                resolve(response)
                            })
                            .fail(errors => reject(errors.responseJSON));
                        }
                    });
                } else {
                    reject(errors.responseJSON)
                }
            });
    });
}
