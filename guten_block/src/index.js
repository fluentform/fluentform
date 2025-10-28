const { __ } = wp.i18n;
const { registerBlockType } = wp.blocks;

import Edit from "./edit";

const fluentLogo = wp.element.createElement(
    "svg",
    {
        width: 20,
        height: 20,
    },
    wp.element.createElement("path", {
        d: "M15.57,0H4.43A4.43,4.43,0,0,0,0,4.43V15.57A4.43,4.43,0,0,0,4.43,20H15.57A4.43,4.43,0,0,0,20,15.57V4.43A4.43,4.43,0,0,0,15.57,0ZM12.82,14a2.36,2.36,0,0,1-1.66.68H6.5A2.31,2.31,0,0,1,7.18,13a2.36,2.36,0,0,1,1.66-.68l4.66,0A2.34,2.34,0,0,1,12.82,14Zm3.3-3.46a2.36,2.36,0,0,1-1.66.68H3.21a2.25,2.25,0,0,1,.68-1.64,2.36,2.36,0,0,1,1.66-.68H16.79A2.25,2.25,0,0,1,16.12,10.53Zm0-3.73a2.36,2.36,0,0,1-1.66.68H3.21a2.25,2.25,0,0,1,.68-1.64,2.36,2.36,0,0,1,1.66-.68H16.79A2.25,2.25,0,0,1,16.12,6.81Z",
    })
);


registerBlockType("fluentfom/guten-block", {
    title: __("Fluent Forms"),
    icon: fluentLogo,
    category: "formatting",
    keywords: [
        __("Contact Form"),
        __("Fluent Forms"),
        __("Forms"),
        __("Advanced Forms"),
        __("fluentforms-gutenberg-block"),
    ],
    apiVersion: 2,
    edit: Edit,
});
