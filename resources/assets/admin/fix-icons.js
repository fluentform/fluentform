#!/usr/bin/env node

/**
 * FluentForm Element UI to Element Plus Icon Migration Script
 * This script systematically replaces all Element UI icon references with Element Plus equivalents
 * while preserving color classes and other styling
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Icon mapping from Element UI to Element Plus
const iconMapping = {
    'el-icon-edit': 'Edit',
    'el-icon-delete': 'Delete',
    'el-icon-plus': 'Plus',
    'el-icon-minus': 'Minus',
    'el-icon-close': 'Close',
    'el-icon-check': 'Check',
    'el-icon-arrow-down': 'ArrowDown',
    'el-icon-arrow-up': 'ArrowUp',
    'el-icon-arrow-left': 'ArrowLeft',
    'el-icon-arrow-right': 'ArrowRight',
    'el-icon-search': 'Search',
    'el-icon-info': 'InfoFilled',
    'el-icon-warning': 'Warning',
    'el-icon-more': 'More',
    'el-icon-tickets': 'Tickets',
    'el-icon-loading': 'Loading',
    'el-icon-refresh': 'Refresh',
    'el-icon-upload': 'Upload',
    'el-icon-download': 'Download',
    'el-icon-view': 'View',
    'el-icon-document': 'Document',
    'el-icon-folder': 'Folder',
    'el-icon-setting': 'Setting',
    'el-icon-user': 'User',
    'el-icon-phone': 'Phone',
    'el-icon-phone-outline': 'Phone'
};

// Color classes to preserve
const colorClasses = [
    'text-primary', 'text-success', 'text-warning', 'text-danger', 'text-info',
    'text-muted', 'text-dark', 'text-light', 'ff-icon', 'search-icon'
];

function processFile(filePath) {
    console.log(`Processing: ${filePath}`);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let iconsUsed = new Set();
        
        // Replace icon attributes in templates
        content = content.replace(/icon="(el-icon-[^"]+)"/g, (match, iconClass) => {
            const elementPlusIcon = iconMapping[iconClass];
            if (elementPlusIcon) {
                iconsUsed.add(elementPlusIcon);
                modified = true;
                return `><el-icon><${elementPlusIcon} /></el-icon`;
            }
            return match;
        });
        
        // Replace class-based icons while preserving color classes
        content = content.replace(/class="([^"]*\b(el-icon-[^"\s]+)[^"]*)"/g, (match, fullClass, iconClass) => {
            const elementPlusIcon = iconMapping[iconClass];
            if (elementPlusIcon) {
                iconsUsed.add(elementPlusIcon);
                modified = true;
                
                // Preserve color and utility classes
                const preservedClasses = fullClass
                    .replace(iconClass, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                // Create new element with preserved classes
                const classAttr = preservedClasses ? ` class="${preservedClasses}"` : '';
                return `${classAttr}><el-icon><${elementPlusIcon} /></el-icon`;
            }
            return match;
        });
        
        // Add imports if icons were used
        if (iconsUsed.size > 0 && filePath.endsWith('.vue')) {
            const iconImports = Array.from(iconsUsed).join(', ');
            
            // Add Element Plus icon imports
            if (!content.includes('@element-plus/icons-vue')) {
                content = content.replace(
                    /(<script[^>]*>)/,
                    `$1\nimport { ${iconImports} } from '@element-plus/icons-vue';\nimport { ElIcon } from 'element-plus';`
                );
            }
            
            // Add to components
            const componentNames = Array.from(iconsUsed).concat(['ElIcon']).join(',\n        ');
            content = content.replace(
                /(components:\s*{[^}]*)/,
                `$1,\n        ${componentNames}`
            );
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
        } else {
            console.log(`⏭️  No changes: ${filePath}`);
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

console.log('🎨 FluentForm Icon Migration with Color Support');
console.log('📋 This script preserves color classes and styling while migrating icons\n');
