#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd -- "$script_dir/.." && pwd)
kit_root="$project_root/release/plugin-kits"

node "$script_dir/build-packages.mjs"
for kit_directory in "$kit_root"/*; do
  kit_name=$(basename -- "$kit_directory")
  archive="$project_root/release/$kit_name.zip"
  rm -f -- "$archive"
  (cd -- "$kit_root" && zip -q -r "$archive" "$kit_name")
done
echo "Plugin release archives written to $project_root/release"
