#!/bin/bash

# FluentForm (Free) Build Script
#
# Builds the plugin for distribution by:
# 1. Building frontend assets (Vue.js apps) with Laravel Mix
# 2. Clean-installing composer production dependencies
# 3. Selectively copying plugin files to builds directory
# 4. Creating compressed ZIP file ready for deployment
#
# Usage:
#   sh build.sh                  # Build with existing assets
#   sh build.sh --node-build     # Rebuild frontend assets first

# Function to handle copying and compressing
copy_and_compress() {
  local source_dir="$1"
  local destination_dir="$2"
  local copy_list=("${@:3}")

  # Delete existing build directory
  rm -rf "$destination_dir"

  # Ensure the destination directory exists
  mkdir -p "$destination_dir"

  # Copy selected folders and files
  for item in "${copy_list[@]}"; do
    source_path="$source_dir/$item"

    if [ -e "$source_path" ]; then
      if [ "$item" != "vendor" ]; then
        rsync -av "$source_path" "$destination_dir/"
        echo "Copied: $item"
      else
        # Copy only production vendor packages and autoloader
        mkdir -p "$destination_dir/vendor"
        rsync -av "$source_dir/vendor/autoload.php" "$destination_dir/vendor/"
        rsync -av "$source_dir/vendor/composer" "$destination_dir/vendor/"
        rsync -av "$source_dir/vendor/openspout" "$destination_dir/vendor/"
        rsync -av "$source_dir/vendor/wpfluent" "$destination_dir/vendor/"
        echo "Copied: vendor (autoloader, openspout, wpfluent from local)"
      fi
    else
      echo "Warning: $item does not exist in the source directory."
    fi
  done

  echo -e "\nCopy completed."

  # Run the zip command and suppress output
  cd "$(dirname "$destination_dir")"
  local dest_dir_basename=$(basename "$destination_dir")
  zip -rq "${dest_dir_basename}.zip" "$dest_dir_basename" -x "*.DS_Store"

  if [ $? -ne 0 ]; then
    echo "Error occurred while compressing."
    cd ..
    exit 1
  fi

  cd ..

  echo -e "\nCompressing Completed. builds/$(basename "$destination_dir").zip is ready.\n"
}

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

# Clean install production composer dependencies
echo -e "\nClean-installing production composer dependencies..."
rm -rf vendor
composer install --no-dev -o --classmap-authoritative

if [ $? -ne 0 ]; then
  echo "Error: composer install failed."
  exit 1
fi

echo -e "\nComposer install completed.\n"

# Build production ZIP with selective vendor copy
echo -e "\nBuilding production version...\n"
copy_and_compress "." "builds/fluentform" \
  "app" "assets" "boot" "config" "database" "resources" "vendor" \
  "composer.json" "fluentform.php" "index.php" "readme.txt"

# Rename ZIP with version
if [ -f "builds/fluentform.zip" ]; then
  mv "builds/fluentform.zip" "builds/fluentform-${PLUGIN_VERSION}.zip"
fi

echo -e "\nBuild completed! builds/fluentform-${PLUGIN_VERSION}.zip is ready.\n"
ls -lh "builds/fluentform-${PLUGIN_VERSION}.zip"

# Restore dev dependencies for local development
echo -e "\nRestoring dev dependencies for local development..."
composer install
