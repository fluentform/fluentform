import DOMPurify from 'dompurify';

export default function sanitizeHtml(value) {
    if (value === null || typeof value === 'undefined') {
        return '';
    }

    return DOMPurify.sanitize(String(value));
}
