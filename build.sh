#!/bin/bash

# FluentForm (Free) Build Script
#
# Builds the plugin for distribution using wp dist-archive.
# Uses .distignore to exclude dev files from the ZIP.
#
# Usage:
#   sh build.sh                  # Build with existing assets
#   sh build.sh --node-build     # Rebuild frontend assets first

# Extract version from main plugin file
PLUGIN_VERSION=$(grep -m1 "Version:" fluentform.php | sed 's/.*Version:\s*//' | tr -d '[:space:]')
if [ -z "$PLUGIN_VERSION" ]; then
  echo "Warning: Could not extract version from fluentform.php, using 'unknown'"
  PLUGIN_VERSION="unknown"
fi
echo "Plugin version: $PLUGIN_VERSION"

# Parse command line arguments
nodeBuild=false

for arg in "$@"; do
  case "$arg" in
    "--node-build")
      nodeBuild=true
      ;;
  esac
done

# Build frontend assets if requested
if "$nodeBuild"; then
  echo -e "\nBuilding frontend assets with Laravel Mix...\n"

  npm run production

  if [ $? -ne 0 ]; then
    echo "Error: Node build failed."
    exit 1
  fi

  echo -e "\nNode build completed.\n"
fi

# Optimize composer autoloader (excludes dev dependencies)
echo -e "\nOptimizing composer autoloader..."
composer dump-autoload -o --classmap-authoritative --no-dev

if [ $? -ne 0 ]; then
  echo "Error: composer dump-autoload failed."
  exit 1
fi

echo -e "\nAutoloader optimized.\n"

# Build distribution archive using wp dist-archive
echo -e "\nCreating distribution archive...\n"
wp dist-archive .

if [ $? -ne 0 ]; then
  echo "Error: wp dist-archive failed."
  exit 1
fi

# Move ZIP to builds directory
mkdir -p builds
DIST_ZIP="../fluentform.${PLUGIN_VERSION}.zip"
if [ -f "$DIST_ZIP" ]; then
  mv "$DIST_ZIP" "builds/fluentform-${PLUGIN_VERSION}.zip"
fi

echo -e "\nBuild completed! builds/fluentform-${PLUGIN_VERSION}.zip is ready.\n"
ls -lh "builds/fluentform-${PLUGIN_VERSION}.zip"
