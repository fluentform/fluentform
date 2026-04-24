export function createI18n(messages = {}) {
    const translate = (key, ...args) => {
        const template = messages[key] || key;

        return template.replace(/%s/g, () => {
            return args.length ? String(args.shift()) : '%s';
        });
    };

    return {
        t: translate,
        n(singular, plural, count, ...args) {
            const number = parseInt(String(count).replace(/,/g, ''), 10);
            const phrase = number > 1 ? plural : singular;

            return translate(phrase, count, ...args);
        },
    };
}
