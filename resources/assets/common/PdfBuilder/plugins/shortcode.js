const shortcodePlugin = (editor, opts = {}) => {
    const bm = editor.Blocks;

    if (opts.shortcodes) {
        opts.shortcodes.forEach(category => {
            Object.entries(category.shortcodes || {}).forEach(([shortcode, name]) => {
                bm.add(shortcode, {
                    label: name,
                    category: category.title,
                    content: `<div class="shortcode-block">${shortcode}</div>`,
                    media: '<svg viewBox="0 0 24 24"><path d="M9.5 5H9a2 2 0 0 0-2 2v2c0 1-.6 3-3 3 1 0 3 .6 3 3v2a2 2 0 0 0 2 2h.5m5-14h.5a2 2 0 0 1 2 2v2c0 1 .6 3 3 3-1 0-3 .6-3 3v2a2 2 0 0 1-2 2h-.5"/></svg>'
                });
            });
        });
    }

}
export default shortcodePlugin;