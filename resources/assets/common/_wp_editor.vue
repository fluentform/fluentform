<template>
    <div class="wp_vue_editor_wrapper">
        <popover
            v-if="editorShortcodes.length"
            class="popover-wrapper"
            :class="{'popover-wrapper-plaintext': !hasWpEditor}"
            :data="editorShortcodes"
            @command="handleCommand"
            btnType="info"
            :plain="true"
        />
        <textarea
            v-if="hasWpEditor"
            class="wp_vue_editor"
            :id="editor_id"
            :value="modelValue"
        />
        <textarea
            v-else
            class="wp_vue_editor wp_vue_editor_plain"
            v-model="plain_content"
            @click="updateCursorPos"
        />
        <button-designer
            v-if="showButtonDesigner"
            @close="showButtonDesigner = false"
            @insert="insertHtml"
            :visibility="showButtonDesigner"
        />
    </div>
</template>
<script>
import ButtonDesigner from './MCE/button.vue';
import Popover from './input-popover-dropdown.vue';

export default {
    name: 'WpEditor',
    emits: ['update:modelValue'],
    components: {
        ButtonDesigner,
        Popover
    },
    props: {
        editor_id: {
            type: String,
            default() {
                return 'wp_editor_' + Date.now() + parseInt(Math.random() * 1000);
            }
        },
        modelValue: {
            type: String,
            default: ''
        },
        editorShortcodes: {
            type: Array,
            default: () => []
        },
        height: {
            type: Number,
            default: 250
        }
    },
    data() {
        return {
            plain_content: this.modelValue,
            showButtonDesigner: false,
            buttonInitiated: false,
            hasWpEditor: !!window.wp?.editor,
            hasMedia: !!window.FluentFormApp?.hasPro,
            cursorPos: this.modelValue.length,
            currentEditor: null
        };
    },
    watch: {
        plain_content(newVal) {
            this.$emit('update:modelValue', this.customSanitize(newVal));
        },
        modelValue(newVal) {
            this.$emit('update:modelValue', this.customSanitize(newVal));
        }
        
    },
    methods: {
        initEditor() {
            window.wp.editor.remove(this.editor_id);
            const that = this;
            window.wp.editor.initialize(this.editor_id, {
                mediaButtons: that.hasMedia,
                tinymce: {
                    height: that.height,
                    toolbar1: 'formatselect,customInsertButton,table,bold,italic,bullist,numlist,link,blockquote,alignleft,aligncenter,alignright,underline,strikethrough,forecolor,removeformat,codeformat,outdent,indent,undo,redo',
                    setup(ed) {
                        ed.on('change', function () {
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

            document.getElementById(this.editor_id).addEventListener('change', this.changeContentEvent);
        },
        changeContentEvent() {
            const content = window.wp.editor.getContent(this.editor_id);
            this.$emit('update:modelValue', this.customSanitize(content));
        },
        handleCommand(command) {
            const sanitizedCommand = this.customSanitize(command);
            if (this.hasWpEditor) {
                tinymce.activeEditor.insertContent(sanitizedCommand);
            } else {
                const part1 = this.plain_content.slice(0, this.cursorPos);
                const part2 = this.plain_content.slice(this.cursorPos, this.plain_content.length);
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
            const textarea = document.querySelector('.wp_vue_editor_plain');
            this.cursorPos = textarea.selectionStart;
        },
        customSanitize(input) {
            // Remove potential event handlers
            let sanitized = input.replace(/\s+(on\w+)\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+)/gi, '');
            // Remove http-equiv attributes
            sanitized = sanitized.replace(/\s+http-equiv\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+)/gi, '');
            return sanitized;
        },
    },
    mounted() {
        if (this.hasWpEditor) {
            this.initEditor();
        }
    }
};
</script>
