import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cssDir = path.join(__dirname, 'assets', 'css');

// Matches the exact naming from the original webpack.mix.js RTL generation
const rtlFiles = [
    ['fluent-forms-public.css', 'fluent-forms-public-rtl.css'],
    ['fluentform-public-default.css', 'fluentform-public-default-rtl.css'],
    ['settings_global.css', 'settings_global_rtl.css'],
    ['element-ui-css.css', 'element-ui-css-rtl.css'],
    ['fluent-all-forms.css', 'fluent-all-forms-rtl.css'],
    ['fluent-forms-admin-sass.css', 'fluent-forms-admin-sass-rtl.css'],
    ['fluent-forms-admin.css', 'fluent-forms-admin-rtl.css'],
    ['add-ons.css', 'add-ons-rtl.css'],
    ['admin_docs.css', 'admin_docs_rtl.css'],
    ['fluent-forms-reports.css', 'fluent-forms-reports-rtl.css'],
];

let generated = 0;
let skipped = 0;

rtlFiles.forEach(([src, dest]) => {
    const srcFile = path.join(cssDir, src);
    const rtlFile = path.join(cssDir, dest);

    if (!fs.existsSync(srcFile)) {
        console.warn(`⚠ Source not found, skipping: ${src}`);
        skipped++;
        return;
    }

    try {
        execSync(`npx rtlcss "${srcFile}" "${rtlFile}"`, { stdio: 'pipe' });
        console.log(`✅ ${src} → ${dest}`);
        generated++;
    } catch (err) {
        console.error(`❌ Failed to generate RTL for ${src}:`, err.message);
        skipped++;
    }
});

console.log(`\nRTL generation complete: ${generated} generated, ${skipped} skipped`);
