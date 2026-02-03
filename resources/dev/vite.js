/**
 * Vite dev/build mode switcher
 *
 * This script:
 * - Switches config/app.php 'env' between 'dev' and 'production'
 * - Clears vite_config.php manifest in dev mode
 * - Finds available port for dev server
 */

const fs = require('fs');
const path = require('path');
const net = require('net');

const args = process.argv;
const isBuild = args.includes('--build');
const mode = isBuild ? 'production' : 'dev';

const configDir = path.resolve(__dirname, '../../config');
const appConfigPath = path.join(configDir, 'app.php');
const viteConfigPath = path.join(configDir, 'vite_config.php');
const viteJsonPath = path.join(configDir, 'vite.json');

console.log(`\n🚀 Switching to ${mode.toUpperCase()} mode...\n`);

// Update app.php env setting
function updateAppConfig() {
    if (!fs.existsSync(appConfigPath)) {
        console.error('❌ config/app.php not found');
        process.exit(1);
    }

    let content = fs.readFileSync(appConfigPath, 'utf8');

    // Replace env value
    content = content.replace(
        /'env'\s*=>\s*'(dev|production)'/,
        `'env' => '${mode}'`
    );

    fs.writeFileSync(appConfigPath, content, 'utf8');
    console.log(`✅ config/app.php env set to '${mode}'`);
}

// Clear manifest in dev mode
function clearManifest() {
    if (mode === 'dev') {
        fs.writeFileSync(viteConfigPath, '<?php return [];', 'utf8');
        console.log('✅ config/vite_config.php cleared');
    }
}

// Check if port is available
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(false));
        server.once('listening', () => {
            server.close();
            resolve(true);
        });
        server.listen(port, 'localhost');
    });
}

// Find available port and update vite.json
async function updatePort() {
    if (mode !== 'dev') return;

    const viteConfig = JSON.parse(fs.readFileSync(viteJsonPath, 'utf8'));
    const allowedPorts = viteConfig.allowedPorts || [3000, 3001, 3002, 4000, 5000];

    // Check if current port is available
    const currentPortAvailable = await isPortAvailable(viteConfig.port);
    if (currentPortAvailable) {
        console.log(`✅ Port ${viteConfig.port} is available`);
        return;
    }

    // Find first available port
    for (const port of allowedPorts) {
        const available = await isPortAvailable(port);
        if (available) {
            viteConfig.port = port;
            fs.writeFileSync(viteJsonPath, JSON.stringify(viteConfig, null, 2), 'utf8');
            console.log(`✅ Switched to port ${port}`);
            return;
        }
    }

    console.error('❌ No available ports found');
    process.exit(1);
}

// Clean assets folder in dev mode
function cleanAssets() {
    if (mode !== 'dev') return;

    const assetsPath = path.resolve(__dirname, '../../assets');
    if (fs.existsSync(assetsPath)) {
        try {
            fs.rmSync(assetsPath, { recursive: true, force: true });
            console.log('✅ Cleaned assets folder');
        } catch (err) {
            console.warn('⚠️ Could not clean assets folder:', err.message);
        }
    }
}

// Run
(async () => {
    updateAppConfig();
    clearManifest();

    if (mode === 'dev') {
        cleanAssets();
        await updatePort();
    }

    console.log(`\n✅ Ready for ${mode} mode\n`);
})();
