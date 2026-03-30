import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, 'assets');
const outputManifestPath = path.join(assetsDir, 'manifest.json');

function mergeManifests() {
    let combinedManifest = {};

    const manifestFiles = [
        'manifest.admin.json',
        'manifest.public.json',
        'manifest.gutenberg.json',
        'manifest.elementor.json'
    ];

    manifestFiles.forEach(file => {
        const manifestPath = path.join(assetsDir, file);
        if (!fs.existsSync(manifestPath)) {
            console.warn(`Manifest not found: ${file}`);
            return;
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        Object.entries(manifest).forEach(([key, value]) => {
            // For CSS-only entries (SCSS/LESS), the file field points directly to CSS
            // No JS wrappers to clean up when not using manualChunks
            if (key.endsWith('.scss') || key.endsWith('.less')) {
                // If the file points to a JS wrapper (old manualChunks behavior), remove it
                if (value.file && value.file.endsWith('.js')) {
                    const jsWrapperPath = path.join(assetsDir, value.file);
                    if (fs.existsSync(jsWrapperPath)) {
                        fs.unlinkSync(jsWrapperPath);
                        console.log(`Removed CSS wrapper: ${jsWrapperPath}`);
                    }
                    // Try to find the actual CSS file from css array or imports
                    if (value.css && value.css.length > 0) {
                        value.file = value.css[0];
                        delete value.css;
                    }
                }
                combinedManifest[key] = value;
            } else {
                combinedManifest[key] = value;
            }
        });
    });

    fs.writeFileSync(outputManifestPath, JSON.stringify(combinedManifest, null, 2));
    console.log(`Combined manifest written to ${outputManifestPath}`);

    // Remove individual manifest files
    manifestFiles.forEach(file => {
        const filePath = path.join(assetsDir, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Removed: ${file}`);
        }
    });
}

mergeManifests();
