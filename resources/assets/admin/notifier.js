export default {
    $success(message, title = 'Success') {
        this.$notify.success({
            title: title,
            message: message,
            position: "bottom-right"
        });
    },
    
    $fail(message, title = 'Error') {
        this.$notify.error({
            title: title,
            message: message,
            position: "bottom-right"
        });
    },

    $copy() {
        this.$success(this.$t('Copied to Clipboard.'));
    }
}