export function createEventBus() {
    const listeners = new Map();

    return {
        on(event, callback) {
            const callbacks = listeners.get(event) || [];
            callbacks.push(callback);
            listeners.set(event, callbacks);
        },
        off(event, callback) {
            const callbacks = listeners.get(event) || [];
            listeners.set(event, callbacks.filter((registered) => registered !== callback));
        },
        emit(event, payload) {
            const callbacks = listeners.get(event) || [];
            callbacks.forEach((callback) => callback(payload));
        },
    };
}
