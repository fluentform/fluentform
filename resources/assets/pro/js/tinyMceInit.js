(($) => {
    function ffInitRichTextEditors() {
        $('.fluentform-post-content').each((index, el) => {
            let $el = $(el);
            let editorId = $el.attr('id');

            if (window.wp && window.wp.editor && editorId) {
                if (window.tinymce.get(editorId)) {
                    window.wp.editor.remove(editorId);
                }

                setTimeout(() => {
                    window.wp.editor.initialize(editorId, {
                        mediaButtons: false,
                        tinymce: {
                            height: 250,
                            toolbar1: 'formatselect,table,bold,italic,bullist,numlist,link,blockquote,alignleft,aligncenter,alignright,underline,strikethrough,forecolor,removeformat,codeformat,outdent,indent,undo,redo',
                            setup(ed) {
                                ed.on('change', (ed, l) => {
                                    let content = wp.editor.getContent(editorId);
                                    $el.val(content).trigger('change');
                                });
                            }
                        },
                        quicktags: false
                    });
                }, 10)
            }
        });
    }


    $(document).ready(function () {
        ffInitRichTextEditors();
    });

    $(document).on('lity:open', function () {
        ffInitRichTextEditors();
    });
})(jQuery)
