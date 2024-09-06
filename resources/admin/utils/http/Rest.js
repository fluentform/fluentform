import ResponseProxyItr from './ResponseProxyItr';

const addQueryParam = function(url, key, value) {
    let separator = url.indexOf('?') !== -1 ? '&' : '?';
    return url + separator + key + '=' + value;
}

const maybeFixUrl = function(url) {
    const firstQuestionMarkIndex = url.indexOf('?');

    const secondQuestionMarkIndex = url.indexOf(
        '?', firstQuestionMarkIndex + 1
    );

    if (secondQuestionMarkIndex !== -1) {
        return url.slice(
            0, secondQuestionMarkIndex
        ) + '&' + url.slice(secondQuestionMarkIndex + 1);
    }

    return url;
};

const request = function (method, route, data = {}, headers = {}) {
    const framework = window.fluentFrameworkAdmin;
    
    const url = maybeFixUrl(
        `${framework.rest.url}/${route.replace(/^\/+/, '')}`
    );

    headers['X-WP-Nonce'] = framework.rest.nonce;

    if (['PUT', 'PATCH', 'DELETE'].indexOf(method.toUpperCase()) !== -1) {
        headers['X-HTTP-Method-Override'] = method;
        method = 'POST';
    }

    return new Promise((resolve, reject) => {
        jQuery.ajax({
            url: addQueryParam(url, 'query_timestamp', Date.now()),
            type: method,
            data: data,
            headers: headers
        })
        .then(response => resolve(response))
        .fail(response => reject(new ResponseProxyItr(response)));
    });
}

export default {
    get(route, data = {}, headers = {}) {
        return request('GET', route, data, headers);
    },
    post(route, data = {}, headers = {}) {
        return request('POST', route, data, headers);
    },
    delete(route, data = {}, headers = {}) {
        return request('DELETE', route, data, headers);
    },
    put(route, data = {}, headers = {}) {
        return request('PUT', route, data, headers);
    },
    patch(route, data = {}, headers = {}) {
        return request('PATCH', route, data, headers);
    }
};

jQuery(document).ajaxSuccess((event, xhr, settings) => {
    const nonce = xhr.getResponseHeader('X-WP-Nonce');
    if (nonce) {
        window.fluentFrameworkAdmin.rest_nonce = nonce;
    }
});
