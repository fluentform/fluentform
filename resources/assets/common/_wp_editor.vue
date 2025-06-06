<template>
    <div class="wp_vue_editor_wrapper">
        <popover v-if="editorShortcodes.length" class="popover-wrapper" :class="{'popover-wrapper-plaintext': !hasWpEditor}" :data="editorShortcodes" @command="handleCommand" btnType="info" :plain="true"></popover>
        <textarea v-if="hasWpEditor" class="wp_vue_editor" :id="editor_id" v-model="sanitizedValue"></textarea>
        <textarea v-else
                  class="wp_vue_editor wp_vue_editor_plain"
                  v-model="plain_content"
                  @click="updateCursorPos">
        </textarea>

        <button-designer v-if="showButtonDesigner" @close="() => {showButtonDesigner = false}" @insert="insertHtml" :visibility="showButtonDesigner"></button-designer>

    </div>
</template>

<script type="text/babel">
    import popover from './input-popover-dropdown.vue'
    import ButtonDesigner from './MCE/button';

    export default {
        name: 'wp_editor',
        components: {
            popover,
            ButtonDesigner
        },
        props: {
            editor_id: {
                type: String,
                default() {
                    return 'wp_editor_'+ Date.now() + parseInt( Math.random() * 1000 );
                }
            },
            value: {
                type: String,
                default() {
                    return '';
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
                showButtonDesigner: false,
                buttonInitiated: false,
                hasWpEditor: !!window.wp.editor,
                hasMedia: !!FluentFormApp.hasPro,
                plain_content: this.value,
                cursorPos: this.value.length,
            }
        },
        watch: {
            plain_content() {
                this.$emit('input', this.customSanitize(this.plain_content));
            }
        },
        methods: {
            initEditor() {
                wp.editor.remove(this.editor_id);
                const that = this;
                wp.editor.initialize(this.editor_id, {
                    mediaButtons: that.hasMedia,
                    tinymce: {
                        height : that.height,
                        toolbar1: 'formatselect,customInsertButton,table,bold,italic,bullist,numlist,link,blockquote,alignleft,aligncenter,alignright,underline,strikethrough,forecolor,removeformat,codeformat,outdent,indent,undo,redo',
                        setup(ed) {
                            ed.on('change', function (ed, l) {
                                that.changeContentEvent();
                            });
                            if (!that.buttonInitiated) {
                                that.buttonInitiated = true;
                                ed.addButton('customInsertButton', {
                                    text: 'Button',
                                    classes: 'wpns_editor_btn',
                                    onclick() {
                                        that.showInsertButtonModal(ed);
                                    }
                                });
                            }
                        }
                    },
                    quicktags: true
                });

                jQuery('#'+this.editor_id).on('change', function(e) {
                    that.changeContentEvent();
                });
            },
            changeContentEvent() {
                let content = wp.editor.getContent(this.editor_id);
                this.$emit('input', this.customSanitize(content));
            },

            handleCommand(command) {
                const sanitizedCommand = this.customSanitize(command);
                if(this.hasWpEditor) {
                    tinymce.activeEditor.insertContent(sanitizedCommand);
                } else {
                    var part1 = this.plain_content.slice(0, this.cursorPos);
                    var part2 = this.plain_content.slice(this.cursorPos, this.plain_content.length);
                    this.plain_content = part1 + sanitizedCommand + part2;
                    this.cursorPos += sanitizedCommand.length;
                }
            },
            showInsertButtonModal(editor) {
                this.currentEditor = editor;
                this.showButtonDesigner = true;
            },
            insertHtml(content) {
                this.currentEditor.insertContent(this.customSanitize(content));
            },
            updateCursorPos() {
                var cursorPos = jQuery('.wp_vue_editor_plain').prop('selectionStart');
                this.$set(this, 'cursorPos', cursorPos);
            },
            customSanitize(input) {
                // Remove potential event handlers
                let sanitized = input.replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+)/gi, '');
                // Remove http-equiv attributes
                sanitized = sanitized.replace(/\s*http-equiv\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+)/gi, '');
                return sanitized;
            },
        },
        computed: {
            sanitizedValue: {
                get() {
                    return this.value;
                },
                set(newValue) {
                    const sanitized = this.customSanitize(newValue);
                    this.$emit('input', sanitized);
                }
            }
        },
        mounted() {
            if(this.hasWpEditor) {
                this.initEditor();
            }
        }
    }
</script>
