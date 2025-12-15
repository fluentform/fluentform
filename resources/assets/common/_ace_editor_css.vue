<template>
    <div v-loading="loading" :element-loading-text="$t('Loading Editor...')">
        <div class="ace_container">
            <div class="ninja_custom_css_editor" id="ninja_custom_css">{{ value }}</div>
        </div>
        <div  class="editor_errors" :class="'ninja_'+mode+'_errors'">
            <span v-show="editorError" style="text-align: right; display: inline-block; color: #ff7171; float: right">{{ editorError }}</span>
        </div>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'ninja_ace_editor',
        props: ['value', 'mode', 'editor_id', 'aceLoaded'],
        data() {
            return {
                ace_path: window.FluentFormApp?.ace_path_url || window.fluent_forms_global_var?.ace_path_url || '',
                editorError: '',
                loading: true,
                editor: null
            }
        },

        watch: {
            aceLoaded(status) {
                console.log('watcheraceeditcss')
                if (status && !this.editor) {
                    this.initEditor();
                }
            }
        },
        methods: {
            initEditor() {
                if (typeof ace === 'undefined') {
                    console.error('ACE editor not loaded yet');
                    this.loading = false;
                    return;
                }

                ace.config.set("workerPath", this.ace_path);
                ace.config.set("modePath", this.ace_path);
                ace.config.set("themePath", this.ace_path);
                this.editor = ace.edit('ninja_custom_css');
                this.editor.setTheme("ace/theme/monokai");
                this.editor.session.setMode("ace/mode/"+this.mode);
                this.editor.getSession().on("changeAnnotation", () => {
                    var annot = this.editor.getSession().getAnnotations();
                    this.editorError = '';
                    for (var key in annot) {
                       if(annot[key].type == 'error') {
                           this.editorError = annot[key].text;
                       }
                    }
                });
                this.editor.getSession().on("change", () => {
                    this.$emit('input', this.editor.getSession().getValue());
                });
                this.loading = false;
            }
        },
        mounted() {
            if (this.aceLoaded) {
                this.initEditor();
            }
        }
    }
</script>

