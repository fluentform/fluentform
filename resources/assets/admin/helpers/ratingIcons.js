import DOMPurify from 'dompurify';

export const DEFAULT_RATING_ICON = 'star';
export const DEFAULT_RATING_INACTIVE_COLOR = '#d4d4d4';
export const DEFAULT_RATING_ACTIVE_COLOR = '#ffb100';

export const RATING_PRESET_ICONS = {
    star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 62 58"><path fill="currentColor" d="M31 44.237L12.19 57.889l7.172-22.108L.566 22.111l23.241-.01L31 0l7.193 22.1 23.24.011-18.795 13.67 7.171 22.108z"/></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 58"><path fill="currentColor" d="M32 55.8 27.36 51.62C11.52 37.4 1 27.92 1 16.28 1 6.8 8.36 0 17.68 0c5.28 0 10.34 2.4 13.66 6.18C34.66 2.4 39.72 0 45 0 54.32 0 61.68 6.8 61.68 16.28c0 11.64-10.52 21.12-26.36 35.34L32 55.8z"/></svg>',
    thumb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14 10V4.5a2.5 2.5 0 0 0-5 0V10m0 0H5.8c-.99 0-1.8.81-1.8 1.8V18a2 2 0 0 0 2 2h7.4a3 3 0 0 0 2.93-2.36l1.2-5.4A1.8 1.8 0 0 0 15.77 10H14ZM9 10v10"/></svg>',
    smile: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M9 14c.75 1 1.8 1.5 3 1.5s2.25-.5 3-1.5"/><circle cx="9" cy="10" r="1" fill="currentColor"/><circle cx="15" cy="10" r="1" fill="currentColor"/></svg>',
    bolt: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64"><path fill="currentColor" d="M28.56 0 4 36.22h15.18L12.86 64 44 24.86H28.64L28.56 0z"/></svg>',
};

export function normalizeRatingIconSource(iconSource) {
    return iconSource === 'custom_svg' ? 'custom_svg' : 'preset';
}

export function normalizeRatingIconType(iconType) {
    return Object.prototype.hasOwnProperty.call(RATING_PRESET_ICONS, iconType) ? iconType : DEFAULT_RATING_ICON;
}

export function sanitizeRatingSvg(svg) {
    if (!svg || typeof svg !== 'string') {
        return '';
    }

    const sanitized = DOMPurify.sanitize(svg, {
        USE_PROFILES: {
            html: false,
            svg: true,
            svgFilters: true,
        },
    }).trim();

    return sanitized.startsWith('<svg') ? sanitized : '';
}

export function sanitizeRatingColor(color, fallback) {
    if (typeof color !== 'string') {
        return fallback;
    }

    const normalized = color.trim();

    return /^#[0-9a-fA-F]{6}$/.test(normalized) || /^#[0-9a-fA-F]{3}$/.test(normalized)
        ? normalized
        : fallback;
}

export function resolveRatingIconMarkup(settings = {}) {
    const iconSource = normalizeRatingIconSource(settings.icon_source);
    const customSvg = sanitizeRatingSvg(settings.custom_icon_svg);

    if (iconSource === 'custom_svg' && customSvg) {
        return customSvg;
    }

    return RATING_PRESET_ICONS[normalizeRatingIconType(settings.icon_type)];
}
