/**
 * ISO country identity for the Reports country heatmap.
 *
 * The heatmap used to join submission data to map polygons by comparing
 * display names. That silently dropped every country the plugin had renamed
 * since world.geo.json was published (Türkiye vs Turkey, Serbia vs Republic of
 * Serbia, …) and every country on a non-English admin locale, because the
 * names come from CountryNames.php which is __()-wrapped.
 *
 * Submissions store ISO 3166-1 alpha-2 (Helper::getCountryCodeFromHeaders) and
 * the geojson features carry alpha-3 in `feature.id`, so the code is a stable
 * key on both sides. Display names are for humans only.
 *
 * Not every payload carries a code: the free tier's upsell preview ships
 * name-only rows, and a Pro predating the `code` field does too. That path goes
 * through resolveLegacyRegionName(), which keeps the alias table the old
 * name-matcher needed — stripping "(US)" yields "United States", which is not
 * what the map calls it.
 *
 * CommonJS on purpose: webpack consumes it from the .vue component and
 * `node --test` consumes it from dev/tests/js/report-country-map-join.test.js,
 * so the test exercises this table rather than a copy of it.
 */

// Every alpha-2 CountryNames.php can produce. Countries with no polygon in the
// bundled dataset are still listed, so a higher-resolution map would pick them
// up without editing this table — provided its features are keyed by alpha-3
// too. See buildRegionIndex() for how a differently-keyed map is detected.
const ALPHA2_TO_ALPHA3 = {
    AD: 'AND', AE: 'ARE', AF: 'AFG', AG: 'ATG', AI: 'AIA', AL: 'ALB', AM: 'ARM',
    AO: 'AGO', AQ: 'ATA', AR: 'ARG', AS: 'ASM', AT: 'AUT', AU: 'AUS', AW: 'ABW',
    AX: 'ALA', AZ: 'AZE', BA: 'BIH', BB: 'BRB', BD: 'BGD', BE: 'BEL', BF: 'BFA',
    BG: 'BGR', BH: 'BHR', BI: 'BDI', BJ: 'BEN', BL: 'BLM', BM: 'BMU', BN: 'BRN',
    BO: 'BOL', BQ: 'BES', BR: 'BRA', BS: 'BHS', BT: 'BTN', BV: 'BVT', BW: 'BWA',
    BY: 'BLR', BZ: 'BLZ', CA: 'CAN', CC: 'CCK', CD: 'COD', CF: 'CAF', CG: 'COG',
    CH: 'CHE', CI: 'CIV', CK: 'COK', CL: 'CHL', CM: 'CMR', CN: 'CHN', CO: 'COL',
    CR: 'CRI', CU: 'CUB', CV: 'CPV', CW: 'CUW', CX: 'CXR', CY: 'CYP', CZ: 'CZE',
    DE: 'DEU', DJ: 'DJI', DK: 'DNK', DM: 'DMA', DO: 'DOM', DZ: 'DZA', EC: 'ECU',
    EE: 'EST', EG: 'EGY', EH: 'ESH', ER: 'ERI', ES: 'ESP', ET: 'ETH', FI: 'FIN',
    FJ: 'FJI', FK: 'FLK', FM: 'FSM', FO: 'FRO', FR: 'FRA', GA: 'GAB', GB: 'GBR',
    GD: 'GRD', GE: 'GEO', GF: 'GUF', GG: 'GGY', GH: 'GHA', GI: 'GIB', GL: 'GRL',
    GM: 'GMB', GN: 'GIN', GP: 'GLP', GQ: 'GNQ', GR: 'GRC', GS: 'SGS', GT: 'GTM',
    GU: 'GUM', GW: 'GNB', GY: 'GUY', HK: 'HKG', HM: 'HMD', HN: 'HND', HR: 'HRV',
    HT: 'HTI', HU: 'HUN', ID: 'IDN', IE: 'IRL', IL: 'ISR', IM: 'IMN', IN: 'IND',
    IO: 'IOT', IQ: 'IRQ', IR: 'IRN', IS: 'ISL', IT: 'ITA', JE: 'JEY', JM: 'JAM',
    JO: 'JOR', JP: 'JPN', KE: 'KEN', KG: 'KGZ', KH: 'KHM', KI: 'KIR', KM: 'COM',
    KN: 'KNA', KP: 'PRK', KR: 'KOR', KW: 'KWT', KY: 'CYM', KZ: 'KAZ', LA: 'LAO',
    LB: 'LBN', LC: 'LCA', LI: 'LIE', LK: 'LKA', LR: 'LBR', LS: 'LSO', LT: 'LTU',
    LU: 'LUX', LV: 'LVA', LY: 'LBY', MA: 'MAR', MC: 'MCO', MD: 'MDA', ME: 'MNE',
    MF: 'MAF', MG: 'MDG', MH: 'MHL', MK: 'MKD', ML: 'MLI', MM: 'MMR', MN: 'MNG',
    MO: 'MAC', MP: 'MNP', MQ: 'MTQ', MR: 'MRT', MS: 'MSR', MT: 'MLT', MU: 'MUS',
    MV: 'MDV', MW: 'MWI', MX: 'MEX', MY: 'MYS', MZ: 'MOZ', NA: 'NAM', NC: 'NCL',
    NE: 'NER', NF: 'NFK', NG: 'NGA', NI: 'NIC', NL: 'NLD', NO: 'NOR', NP: 'NPL',
    NR: 'NRU', NU: 'NIU', NZ: 'NZL', OM: 'OMN', PA: 'PAN', PE: 'PER', PF: 'PYF',
    PG: 'PNG', PH: 'PHL', PK: 'PAK', PL: 'POL', PM: 'SPM', PN: 'PCN', PR: 'PRI',
    PS: 'PSE', PT: 'PRT', PW: 'PLW', PY: 'PRY', QA: 'QAT', RE: 'REU', RO: 'ROU',
    RS: 'SRB', RU: 'RUS', RW: 'RWA', SA: 'SAU', SB: 'SLB', SC: 'SYC', SD: 'SDN',
    SE: 'SWE', SG: 'SGP', SH: 'SHN', SI: 'SVN', SJ: 'SJM', SK: 'SVK', SL: 'SLE',
    SM: 'SMR', SN: 'SEN', SO: 'SOM', SR: 'SUR', SS: 'SSD', ST: 'STP', SV: 'SLV',
    SX: 'SXM', SY: 'SYR', SZ: 'SWZ', TC: 'TCA', TD: 'TCD', TF: 'ATF', TG: 'TGO',
    TH: 'THA', TJ: 'TJK', TK: 'TKL', TL: 'TLS', TM: 'TKM', TN: 'TUN', TO: 'TON',
    TR: 'TUR', TT: 'TTO', TV: 'TUV', TW: 'TWN', TZ: 'TZA', UA: 'UKR', UG: 'UGA',
    UM: 'UMI', US: 'USA', UY: 'URY', UZ: 'UZB', VA: 'VAT', VC: 'VCT', VE: 'VEN',
    VG: 'VGB', VI: 'VIR', VN: 'VNM', VU: 'VUT', WF: 'WLF', WS: 'WSM', XK: 'XKX',
    YE: 'YEM', YT: 'MYT', ZA: 'ZAF', ZM: 'ZMB', ZW: 'ZWE',
};

// Countries and territories with no polygon in the bundled dataset. Mostly
// small islands and micro-states, but NOT only — Hong Kong, Singapore, Macao,
// Mauritius and Bahrain are in here too, and they are real traffic sources.
// Declared explicitly so the test can tell "legitimately has no polygon" apart
// from "the join is broken", which look identical from the outside.
const KNOWN_ABSENT = [
    'AD', 'AG', 'AI', 'AS', 'AW', 'AX', 'BB', 'BH', 'BL', 'BQ', 'BV', 'CC',
    'CK', 'CV', 'CW', 'CX', 'DM', 'FM', 'FO', 'GD', 'GG', 'GI', 'GP', 'GS',
    'GU', 'HK', 'HM', 'IM', 'IO', 'JE', 'KI', 'KM', 'KN', 'KY', 'LC', 'LI',
    'MC', 'MF', 'MH', 'MO', 'MP', 'MQ', 'MS', 'MU', 'MV', 'NF', 'NR', 'NU',
    'PF', 'PM', 'PN', 'PW', 'RE', 'SC', 'SG', 'SH', 'SJ', 'SM', 'ST', 'SX',
    'TC', 'TK', 'TO', 'TV', 'UM', 'VA', 'VC', 'VG', 'VI', 'WF', 'WS', 'YT',
];

// Coordinates for the countries above, as [longitude, latitude] — the order
// ECharts expects. The bundled map has no polygon for any of them, so they are
// plotted as point markers instead of being left off the map entirely.
const COUNTRY_CENTROIDS = {
    AD: [1.60, 42.55],     AG: [-61.80, 17.06],   AI: [-63.07, 18.22],
    AS: [-170.70, -14.30], AW: [-69.97, 12.52],   AX: [20.00, 60.20],
    BB: [-59.54, 13.19],   BH: [50.55, 26.07],    BL: [-62.83, 17.90],
    BQ: [-68.24, 12.18],   BV: [3.36, -54.42],    CC: [96.83, -12.17],
    CK: [-159.78, -21.24], CV: [-23.61, 15.12],   CW: [-68.99, 12.17],
    CX: [105.69, -10.45],  DM: [-61.37, 15.41],   FM: [158.16, 6.92],
    FO: [-6.79, 62.00],    GD: [-61.75, 12.06],   GG: [-2.58, 49.45],
    GI: [-5.35, 36.14],    GP: [-61.58, 16.25],   GS: [-36.51, -54.28],
    GU: [144.79, 13.44],   HK: [114.17, 22.32],   HM: [73.50, -53.08],
    IM: [-4.55, 54.24],    IO: [72.42, -7.34],    JE: [-2.13, 49.21],
    KI: [-157.36, 1.87],   KM: [43.87, -11.88],   KN: [-62.78, 17.36],
    KY: [-81.25, 19.31],   LC: [-60.98, 13.91],   LI: [9.55, 47.17],
    MC: [7.42, 43.73],     MF: [-63.05, 18.08],   MH: [171.18, 7.13],
    MO: [113.54, 22.20],   MP: [145.75, 15.19],   MQ: [-61.02, 14.64],
    MS: [-62.19, 16.74],   MU: [57.55, -20.35],   MV: [73.22, 3.20],
    NF: [167.95, -29.04],  NR: [166.93, -0.52],   NU: [-169.87, -19.05],
    PF: [-149.41, -17.68], PM: [-56.27, 46.94],   PN: [-127.44, -24.70],
    PW: [134.58, 7.51],    RE: [55.54, -21.12],   SC: [55.49, -4.68],
    SG: [103.82, 1.35],    SH: [-5.71, -15.96],   SJ: [15.63, 78.22],
    SM: [12.46, 43.94],    ST: [6.61, 0.19],      SX: [-63.07, 18.04],
    TC: [-71.80, 21.69],   TK: [-171.85, -9.20],  TO: [-175.20, -21.18],
    TV: [179.19, -8.52],   UM: [166.65, 19.28],   VA: [12.45, 41.90],
    VC: [-61.20, 13.25],   VG: [-64.64, 18.42],   VI: [-64.90, 18.34],
    WF: [-177.16, -13.77], WS: [-172.10, -13.76], YT: [45.17, -12.83],
};

// world.geo.json labels Kosovo with a non-ISO id. Normalising it here keeps the
// table above pure ISO.
const GEOJSON_ID_ALIASES = {
    'CS-KM': 'XKX',
};

// Aliases the old display-name matcher needed, kept for payloads that carry no
// `code`. Suffix-stripping alone is not enough: 'United States (US)' becomes
// 'United States', and the map spells it 'United States of America'. Dropping
// this table silently removed the highest-volume country from the map.
const LEGACY_NAME_ALIASES = {
    'United States (US)': 'United States of America',
    'United States': 'United States of America',
    'United Kingdom (UK)': 'United Kingdom',
    'United Kingdom (GB)': 'United Kingdom',
};

/**
 * Index the map's own features by alpha-3, so the join follows whatever dataset
 * is bundled rather than a hardcoded list of region names.
 *
 * Reports what it skipped rather than swallowing it. A map keyed by anything
 * other than alpha-3 — Natural Earth's 50m build uses numeric ids — would
 * otherwise produce an empty index, and every country would be reported as
 * having no polygon. That is the original bug wearing a friendlier label, so
 * the caller needs to be able to tell the difference.
 *
 * @param {{features: Array}} geojson
 * @returns {{index: Object, total: number, skipped: Array}} index maps
 *          alpha-3 -> region name as the map spells it
 */
function buildRegionIndex(geojson) {
    const features = (geojson && geojson.features) || [];
    const index = {};
    const skipped = [];

    features.forEach((feature) => {
        const rawId = feature && feature.id;
        const name = feature && feature.properties && feature.properties.name;
        if (!rawId || !name) {
            skipped.push(String(rawId));
            return;
        }

        const id = GEOJSON_ID_ALIASES[rawId] || rawId;
        // Shape check, not a `-99` check. In the bundled dataset the only
        // rejects are the two `-99` placeholders (Northern Cyprus, Somaliland),
        // which have no ISO code at all — but a numerically-keyed map would
        // land here for every single feature.
        if (!/^[A-Z]{3}$/.test(id)) {
            skipped.push(String(rawId));
            return;
        }

        index[id] = name;
    });

    return {index, total: features.length, skipped};
}

/**
 * The region names the map uses, for resolving payloads that carry no code.
 *
 * @param {{features: Array}} geojson
 * @returns {Set<string>}
 */
function buildRegionNameSet(geojson) {
    const names = new Set();

    ((geojson && geojson.features) || []).forEach((feature) => {
        const name = feature && feature.properties && feature.properties.name;
        if (name) {
            names.add(name);
        }
    });

    return names;
}

/**
 * @param {string} alpha2 ISO 3166-1 alpha-2 as stored on the submission
 * @param {Object} index from buildRegionIndex()
 * @returns {string|null} the region name ECharts expects, or null if this
 *                        country has no polygon in the bundled map
 */
function resolveRegionName(alpha2, index) {
    if (!alpha2 || typeof alpha2 !== 'string' || 2 !== alpha2.length) {
        return null;
    }

    const alpha3 = ALPHA2_TO_ALPHA3[alpha2.toUpperCase()];

    return (alpha3 && index[alpha3]) || null;
}

/**
 * Resolve a display name for a payload row that carries no ISO code.
 *
 * @param {string} name as CountryNames.php spells it, possibly localized
 * @param {Set<string>} regionNames from buildRegionNameSet()
 * @returns {string|null}
 */
function resolveLegacyRegionName(name, regionNames) {
    if (!name || typeof name !== 'string' || !regionNames) {
        return null;
    }

    const direct = LEGACY_NAME_ALIASES[name] || name;
    if (regionNames.has(direct)) {
        return direct;
    }

    const stripped = name.replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim();
    const aliased = LEGACY_NAME_ALIASES[stripped] || stripped;

    return regionNames.has(aliased) ? aliased : null;
}

/**
 * The single resolver. Everything that needs to know which polygon a payload
 * row belongs to must go through here — the drawing AND the legend scale.
 * Keeping two resolvers in sync by hand is what greyed out the whole map.
 *
 * Tries the ISO code first, then falls forward to the name. Falling forward
 * matters because `submissions.country` is VARCHAR(45) and the Pro aggregator
 * passes it through unvalidated, so the code may be junk while the name is fine.
 *
 * @param {{code?: string, name?: string}} item
 * @param {Object} index from buildRegionIndex().index
 * @param {Set<string>} regionNames from buildRegionNameSet()
 * @returns {string|null}
 */
function resolveRegionForItem(item, index, regionNames) {
    if (!item) {
        return null;
    }

    return resolveRegionName(item.code, index)
        || resolveLegacyRegionName(item.name, regionNames);
}

/**
 * Coordinates for a row the map has no polygon for, so it can be plotted as a
 * point instead of disappearing. Returns null when the row is drawable as a
 * region — a country is either a shape or a marker, never both.
 *
 * @param {{code?: string, name?: string}} item
 * @param {Object} index from buildRegionIndex().index
 * @param {Set<string>} regionNames from buildRegionNameSet()
 * @returns {Array<number>|null} [longitude, latitude]
 */
function resolveMarkerCoords(item, index, regionNames) {
    if (!item || resolveRegionForItem(item, index, regionNames)) {
        return null;
    }

    const code = item.code && String(item.code).toUpperCase();

    return (code && COUNTRY_CENTROIDS[code]) || null;
}

/**
 * True when a row appears on the map at all, as a region or as a marker.
 */
function isRendered(item, index, regionNames) {
    return !!(
        resolveRegionForItem(item, index, regionNames)
        || resolveMarkerCoords(item, index, regionNames)
    );
}

/**
 * The legend used to be scaled from the whole payload, including countries that
 * never render, so one dropped top country washed out every drawn country.
 *
 * @param {Array<{code?: string, name?: string, value: number}>} items
 * @param {Object} index from buildRegionIndex().index
 * @param {Set<string>} regionNames from buildRegionNameSet()
 * @returns {number} 0 when nothing renders
 */
function renderedMaxValue(items, index, regionNames) {
    const drawn = (items || [])
        .filter((item) => isRendered(item, index, regionNames))
        .map((item) => Number(item.value))
        .filter((value) => Number.isFinite(value));

    return drawn.length ? Math.max(...drawn) : 0;
}

/**
 * Whether a submission count falls inside the visualMap legend's selected band.
 *
 * The legend is a filter as much as a colour ramp — dragging the High/Low
 * handles greys out everything outside the band. Regions and markers are two
 * different ECharts series, so they must ask this one question rather than each
 * deriving its own answer, or the same control ends up saying two things.
 *
 * ECharts reports fractional handle positions from `datarangeselected`, hence
 * the rounding: without it a band dragged to "20" arrives as 19.6 and a country
 * with exactly 20 submissions drops out of its own selection.
 *
 * @param {number} value submission count; non-numeric is read as 0
 * @param {Array<number>} range [min, max] from the legend
 * @returns {boolean} true when the range is absent or unusable
 */
function isValueInVisualMapRange(value, range) {
    if (!Array.isArray(range) || range.length < 2) {
        return true;
    }

    const min = Number(range[0]);
    const max = Number(range[1]);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return true;
    }

    const count = Number(value) || 0;

    return count >= Math.round(min) && count <= Math.round(max);
}

module.exports = {
    ALPHA2_TO_ALPHA3,
    KNOWN_ABSENT,
    LEGACY_NAME_ALIASES,
    COUNTRY_CENTROIDS,
    buildRegionIndex,
    buildRegionNameSet,
    resolveRegionName,
    resolveLegacyRegionName,
    resolveRegionForItem,
    resolveMarkerCoords,
    isRendered,
    renderedMaxValue,
    isValueInVisualMapRange,
};
