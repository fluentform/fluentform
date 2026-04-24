export function mountApp(app, target) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;

    if (!element) {
        return null;
    }

    return app.mount(element);
}
