const loadComponents = (cmp, defaultValues) => {

    const header = cmp.addComponent({
        tagName: 'header',
        components: defaultValues.header,
        draggable: false,
        removable: false,
        copyable: false,
        attributes: { class: 'ffp-header', id: 'ffp-header' }
    });

    // body 
    const body = cmp.addComponent({
        tagName: 'main',
        components: defaultValues.body,
        draggable: false,
        removable: false,
        copyable: false,
        attributes: { class: 'ffp-body', id: 'ffp-body' },
    });

    // footer
    const footer = cmp.addComponent({
        tagName: 'footer',
        components: defaultValues.footer,
        draggable: false,
        removable: false,
        copyable: false,
        attributes: { class: 'ffp-footer', id: 'ffp-footer', 'data-attr-footer': true },
    });

    return { header, body, footer }
}

export default loadComponents;