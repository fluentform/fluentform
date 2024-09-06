import Rest from '@/utils/http/Rest.js';
import Storage from '@/utils/Storage';
import { convertToText } from '@/misc/functions';

export default {
    data() {
        return {
            Storage
        }
    },
    methods: {
        $get: Rest.get,
        $post: Rest.post,
        $put: Rest.put,
        $patch: Rest.patch,
        $del: Rest.delete,
        $formatNumber(amount, hideEmpty = false) {
            if (!amount && hideEmpty) {
                return '';
            }

            if (!amount) {
                amount = '0';
            }

            return new Intl.NumberFormat('en-US').format(amount)
        },
        $changeTitle(title) {
            jQuery('head title').text(title + ' - FluentCart');
        },
        $handleError(response) {
            let errorMessage = '';

            if (typeof response === 'string') {
                errorMessage = response;
            } else if ('message' in response) {
                errorMessage = response.message;
            } else {
                if (response.status === 422) {
                    errorMessage = 'Data validation failed. Please try again.';
                }
            }
            
            this.$notifyError(errorMessage || 'Something went wrong');
        }
    }
};
