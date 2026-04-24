import { ElLoading, ElMessage, ElMessageBox, ElNotification } from 'element-plus';

export function createUi() {
    return {
        notify(options = {}) {
            return ElNotification(options);
        },
        success(message, title = 'Success') {
            return ElNotification.success({
                title,
                message,
                position: 'bottom-right',
            });
        },
        error(message, title = 'Error') {
            return ElNotification.error({
                title,
                message,
                position: 'bottom-right',
            });
        },
        warning(message, title = 'Warning') {
            return ElNotification.warning({
                title,
                message,
                position: 'bottom-right',
            });
        },
        message(options = {}) {
            return ElMessage(options);
        },
        confirm(message, title = 'Confirm', options = {}) {
            return ElMessageBox.confirm(message, title, options);
        },
        loading(options = {}) {
            return ElLoading.service(options);
        },
    };
}
