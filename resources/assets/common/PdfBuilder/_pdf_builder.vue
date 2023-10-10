<template>
    <div class="pdf_builder_wrapper">
        <div :id="editor_id"></div>
    </div>
</template>

<script type="text/babel">
import 'grapesjs/dist/css/grapes.min.css';
import juice from 'juice';
import grapesjs from 'grapesjs';
import blocksPlugin from 'grapesjs-blocks-basic';
import shortcodePlugin from './plugins/shortcode';
import loadComponents from './components';

let borderColor = '#eee';

export default {
    name: 'pdf_builder',
    props: {
        editor_id: {
            type: String,
            default() {
                return 'pdf_builder_' + Date.now() + parseInt(Math.random() * 1000);
            }
        },
        value: {
            type: Object,
            default() {
                return {
                    header: '',
                    body: '',
                    footer: '',
                };
            }
        },
        editorShortcodes: {
            type: Array,
            default() {
                return []
            }
        },
        height: {
            type: Number,
            default() {
                return 250;
            }
        }
    },
    data() {
        return {
            editor: null,
        }
    },

    methods: {
        initBuilder() {
            this.editor = grapesjs.init({
                // Indicate where to init the editor. You can also pass an HTMLElement
                container: `#${this.editor_id}`,
                // Size of the editor
                height: this.height ?? '500px',
                width: 'auto',
                // Disable the storage manager for the moment
                storageManager: false,
                // remove the device manager
                showDevices: false,

                plugins: [
                    (editor) => blocksPlugin(editor, {
                        blocks: ['text', 'link', 'image'],
                    }),
                    editor => shortcodePlugin(editor, {
                        shortcodes: this.editorShortcodes,
                    }),
                ],
                canvasCss: `
                    .ffp-header {
                        border-bottom: 1px solid ${borderColor};
                        padding: 10px;
                    }
                    .ffp-body {
                        padding: 10px;
                        min-height: 200px;
                    }
                    .ffp-footer {
                        border-top: 1px solid ${borderColor};
                        padding: 20px 10px;
                    }
                `,
            });
            const panelManager = this.editor.Panels;
            const cmp = this.editor.Components;

            const { header, body, footer } = loadComponents(cmp, this.value);

            var wrapper = cmp.getWrapper();
            // do not allow to drop components inside the body directly
            wrapper.set('droppable', false);

            this.editor.onReady(() => {
                // turn off default outline
                this.editor.Commands.stop('core:component-outline');
                panelManager.getButton('options', 'sw-visibility').set('active', false);
                // set block view active by default
                panelManager.getButton('views', 'open-blocks').set('active', true)
                // turn off preview mode
                panelManager.removeButton('options', 'preview');
                // turn off view code
                panelManager.removeButton('options', 'export-template');
            })

            // observe changes
            this.editor.on('update', (model) => {
                const css = this.editor.getCss();

                const headerHtml = header.getInnerHTML();
                const bodyHtml = body.getInnerHTML();
                const footerHtml = footer.getInnerHTML();

                const value = {
                    header: juice.inlineContent(headerHtml, css),
                    body: juice.inlineContent(bodyHtml, css),
                    footer: juice.inlineContent(footerHtml, css),
                };
                this.$emit('input', value);
            });
        }
    },

    mounted() {
        this.initBuilder();
    },
}
</script>

<style>
.gjs-no-app {
    height: auto;
}

.gjs-layer-caret {
    top: auto;
}

.gjs-radio-item input[type="radio"] {
    display: none;
}

.gjs-select select {
    background: inherit !important;
    color: inherit !important;
    font-size: inherit !important;
}

select.gjs-input-unit {
    background: inherit !important;
    color: inherit !important;
    line-height: inherit !important;
    padding: inherit !important;
}

.gjs-field-integer input {
    background-color: inherit !important;
    color: inherit !important;
}
</style>