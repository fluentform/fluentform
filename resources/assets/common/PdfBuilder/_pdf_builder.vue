<template>
    <div class="pdf_builder_wrapper">
        <div :id="editor_id"></div>
    </div>
</template>
<script type="text/babel">
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';
import blocksPlugin from 'grapesjs-blocks-basic';
import juice from 'juice';

let borderColor = '#eee';
const containerWidth = '90%';

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
                // stylePrefix: prefix,
                // Indicate where to init the editor. You can also pass an HTMLElement
                container: `#${this.editor_id}`,
                // Get the content for the canvas directly from the element
                // As an alternative we could use: `components: '<h1>Hello World Component!</h1>'`,
                // fromElement: true,
                // Size of the editor
                // height: this.height ?? '500px',
                height: '500px',
                width: 'auto',
                // Disable the storage manager for the moment
                storageManager: false,
                // hide the device manager
                showDevices: false,
                plugins: [
                    (editor) => blocksPlugin(editor, {
                        blocks: ['column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image'],
                        flexGrid: true,
                        // stylePrefix: prefix,
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

            // console.log(this.editorShortcodes)


            const panelManager = this.editor.Panels;

            // Components manager
            const cmp = this.editor.Components;
            const header = cmp.addComponent({
                tagName: 'header',
                // components: `
                // <div style="max-width: ${containerWidth}; margin: 0 auto;">
                //     <h2 style="text-align: center;">PDF Title</h2>
                // </div>
                // `,
                components: this.value.header,
                draggable: false,
                removable: false,
                copyable: false,
                attributes: { class: 'ffp-header', id: 'ffp-header' }
            });

            // body 
            const body = cmp.addComponent({
                tagName: 'main',
                // content: 'Put your body here',
                // components: `
                //     <div style="max-width: ${containerWidth}; margin: 0 auto;">{all_data}</div>
                // `,
                components: this.value.body,
                draggable: false,
                removable: false,
                copyable: false,
                attributes: { class: 'ffp-body', id: 'ffp-body' },

            });

            const footer = cmp.addComponent({
                tagName: 'footer',
                // components: `
                // <div style="display: flex; justify-content: space-between; margin: 0 auto; max-width: ${containerWidth}">
                //     <div>{DATE j-m-Y}</div>
                //     <div>{PAGENO}/{nbpg}</div>
                // </div>
                // `,
                components: this.value.footer,
                draggable: false,
                removable: false,
                copyable: false,
                attributes: { class: 'ffp-footer', id: 'ffp-footer', 'data-attr-footer': true },

            });

            var wrapper = cmp.getWrapper();
            // do not allow to drop components inside the body directly
            wrapper.set('droppable', false);



            this.editor.onReady(() => {
                // turn off default outline
                this.editor.Commands.stop('core:component-outline');
                panelManager.getButton('options', 'sw-visibility').set('active', false);
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
                console.log(value);

                this.$emit('input', value);
            });
        }

    },

    mounted() {
        console.log(this.value);
        this.initBuilder();
    },
}
</script>