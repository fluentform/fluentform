export function createStorage(prefix = 'fluentform') {
    return {
        get(key, fallback = null) {
            const rawValue = window.localStorage.getItem(`${prefix}:${key}`);

            if (rawValue === null) {
                return fallback;
            }

            try {
                return JSON.parse(rawValue);
            } catch (e) {
                return rawValue;
            }
        },
        set(key, value) {
            const normalizedValue = typeof value === 'string' ? value : JSON.stringify(value);
            window.localStorage.setItem(`${prefix}:${key}`, normalizedValue);
        },
        remove(key) {
            window.localStorage.removeItem(`${prefix}:${key}`);
        },
    };
}
