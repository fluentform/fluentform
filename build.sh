#!/bin/bash

# FluentForm (Free) Build Script
#
# Builds the plugin for distribution by:
# 1. Building frontend assets (Vue.js apps) with Laravel Mix
# 2. Selectively copying plugin files to builds directory
#    (vendor is copied directly from local, including only
#    production packages: openspout, wpfluent, and the autoloader)
# 3. Creating compressed ZIP file ready for deployment
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
      if [ "$item" = "resources" ]; then
        mkdir -p "$destination_dir/resources"

        if [ -f "$source_path/index.php" ]; then
          rsync -av "$source_path/index.php" "$destination_dir/resources/"
        fi

        if [ -d "$source_path/languages" ]; then
          rsync -av "$source_path/languages" "$destination_dir/resources/"
        fi

        echo "Copied: resources (index.php, languages)"
      elif [ "$item" = "config" ]; then
        rsync -av \
          --exclude="vite.json" \
          "$source_path" "$destination_dir/"
        echo "Copied: config"
      elif [ "$item" != "vendor" ]; then
        rsync -av \
          --exclude="resources/assets" \
          --exclude="resources/admin" \
          --exclude="resources/img" \
          --exclude="*.map" \
          --exclude="mix-manifest.json" \
          "$source_path" "$destination_dir/"
        echo "Copied: $item"
      else
        # Copy only production vendor packages and autoloader from local
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

generate_stage1_rtl_css() {
  if ! command -v npx >/dev/null 2>&1; then
    echo "Warning: npx is not available, skipping Stage 1 RTL CSS generation."
    return 0
  fi

  if [ ! -d "assets/admin" ]; then
    return 0
  fi

  echo -e "\nGenerating Stage 1 RTL CSS...\n"

  find assets/admin \( -path "assets/admin/css/*.css" -o -path "assets/admin/assets/*.css" \) ! -name "*.rtl.css" | while read -r file
  do
      [ -f "$file" ] || continue

      local dir
      dir=$(dirname "$file")
      local filename
      filename=$(basename "$file")
      local newfile
      newfile="${filename%.*}.rtl.css"

      npx rtlcss "$file" > "$dir/$newfile"
      echo "Generated $dir/$newfile"
  done

  echo -e "\nStage 1 RTL CSS generation completed.\n"
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
else
  generate_stage1_rtl_css
fi

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
