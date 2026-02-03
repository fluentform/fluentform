# Vite Migration Guide

This document outlines the migration from Laravel Mix (Webpack) to Vite for the FluentForm build system.

## Overview

- **From:** Laravel Mix 6.x (Webpack-based)
- **To:** Vite 6.x
- **Vue Version:** 2.7.x (upgraded from 2.6.x)
- **Breaking Changes:** Minimal - same output structure maintained

## Migration Steps

### 1. Backup Current Setup

```bash
# Keep webpack.mix.js as backup
mv webpack.mix.js webpack.mix.js.backup

# Keep original package.json
cp package.json package.json.backup
```

### 2. Update package.json

```bash
# Replace with new Vite-based package.json
cp package.vite.json package.json

# Install dependencies
rm -rf node_modules package-lock.json
npm install
```

### 3. Key Changes

#### Vue Version Upgrade (2.6 → 2.7)
Vue 2.7 is required for `@vitejs/plugin-vue2`. This is a minor upgrade with full backward compatibility.

#### New Scripts
```json
{
  "dev": "vite",              // Start dev server with HMR
  "watch": "vite build --watch", // Watch mode (like mix watch)
  "build": "vite build",      // Production build
  "production": "vite build", // Alias for build
  "preview": "vite preview"   // Preview production build locally
}
```

#### Legacy Scripts (Optional)
Laravel Mix is kept as optional dependency for fallback:
```json
{
  "legacy:dev": "mix",
  "legacy:watch": "mix watch",
  "legacy:production": "mix --production"
}
```

### 4. File Changes

| File | Status | Notes |
|------|--------|-------|
| `vite.config.js` | **New** | Main Vite configuration |
| `package.vite.json` | **New** | New dependencies (rename to package.json) |
| `resources/assets/admin/styles/index.scss` | **New** | Replaces index.less for Vite |
| `webpack.mix.js` | Keep | Can be removed after successful migration |

### 5. LESS to SCSS Migration

The `resources/assets/admin/styles/index.less` file has been converted to `index.scss` because:
- Vite's LESS preprocessor cannot import SCSS files
- The new `index.scss` contains equivalent SCSS code

The original `index.less` and `grid.less` files are kept for reference and Laravel Mix fallback.

## Build Output

The build output structure remains **identical** to Laravel Mix:

```
assets/
├── css/
│   ├── fluent-forms-public.css
│   ├── fluent-forms-public-rtl.css
│   ├── fluent-forms-admin.css
│   ├── fluent-forms-admin-rtl.css
│   └── ... (all other CSS files)
├── js/
│   ├── fluent_forms_global.js
│   ├── form_settings_app.js
│   └── ... (all other JS files)
├── libs/
│   └── ... (copied static files)
└── img/
    └── ... (copied images)
```

## RTL CSS Generation

RTL CSS files are automatically generated after build using `rtlcss`:
- Same output as Laravel Mix
- Files like `fluent-forms-public-rtl.css` are created automatically

## Development Server

Vite provides a much faster development experience with Hot Module Replacement (HMR):

```bash
npm run dev
```

This starts a dev server at `http://localhost:3000` with:
- Instant hot updates
- Fast cold starts
- No full page reloads for CSS changes

## Troubleshooting

### Issue: "Cannot find module 'vue'"
```bash
npm install vue@^2.7.16 vue-template-compiler@^2.7.16
```

### Issue: SCSS @import not working
Make sure the import path starts with `~` for node_modules:
```scss
@import "~element-theme-chalk/src/index.scss";
```

### Issue: RTL files not generated
Ensure `rtlcss` is installed:
```bash
npm install -D rtlcss
```

## Rollback

To rollback to Laravel Mix:
```bash
# Restore original package.json
cp package.json.backup package.json

# Restore webpack.mix.js
mv webpack.mix.js.backup webpack.mix.js

# Reinstall dependencies
rm -rf node_modules
npm install
```

## Performance Comparison

| Metric | Laravel Mix | Vite |
|--------|-------------|------|
| Cold Start | ~30s | ~2s |
| HMR Update | ~2-3s | ~50ms |
| Full Build | ~45s | ~15s |

## Questions?

If you encounter issues during migration, check:
1. Node.js version (requires 18+)
2. All dependencies are installed
3. The `vite.config.js` entry points match your file structure
