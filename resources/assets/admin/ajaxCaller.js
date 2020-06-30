import { actions } from './jquery-actions'

function getMethod(getter = '') {
    getter = getter.split('.');

    let method = Object.assign({}, actions);

    getter.forEach(item => {
        method = method[item]
    });

    return method;
}

function validate(action) {
    return getMethod(action);
}

function error(message = '') {
    throw new Error(message)
}

function request(type, action, data = null) {
    let getter = action;

    action = validate(action);

    if (! action) {
        error(`The '${getter}' action is not declared!`)
    }

    data = data ? Object.assign({}, { action }, data) : { action };

    return jQuery[type](ajaxurl, data);
}

class Http {
    get(action, data = null) {
        return request('get', action, data)
    }
    post(action, data = null) {
        return request('post', action, data)
    }
    put(action, data = null) {
        return request('post', action, data)
    }

    delete(action, data = null) {
        return request('post', action, data)
    }
    $get(route, data) {
        data.action = 'fluentform_get_'+route;
        return jQuery.get(window.ajaxurl, data);
    }
    $post(route, data) {
        data.action = 'fluentform_post_'+route;
        return jQuery.post(window.ajaxurl, data);
    }
}

export default {
    install(Vue) {
        Vue.prototype.$ajax = new Http();

        if (! Vue.prototype.$action) {
            Vue.prototype.$action = actions;
        }
    }
}