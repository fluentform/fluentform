import Vue from 'vue'
import AiChatApp from './AiChatApp'

function bootAiChatApp(element) {
    window.fluentFormVars = window[element.getAttribute('data-var_name')];

    if (isMounted(element.id)) {
        const app = document.querySelector('#' + element.id);
        if (app && app.__vue__) {
            app.__vue__.$destroy();
        }
    }

    new Vue({
        el: '#' + element.id,
        render: h => h(AiChatApp),
        data() {
            return {
                globalVars: window.fluentFormVars
            }
        }
    });
}

function init(elements = []) {
    for (const element of elements) {
        bootAiChatApp(element);
    }
}

// Initialize AI Chat apps
const elements = document.getElementsByClassName('ffc_ai_chat_app');
init(elements)

// Listen for dynamic initialization
document.addEventListener('ff-elm-ai-chat-event', function (event) {
    init(event.detail);
});

function isMounted(elementID) {
    const app = document.querySelector('#' + elementID);
    return app && app.__vue__ ? true : false;
}

