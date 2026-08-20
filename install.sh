#!/usr/bin/env bash
set -euo pipefail

repository=https://github.com/ValoHalo/DSHModelConfig
asset=DSH-Model-Extensions.zip
temporary_root=$(mktemp -d)
trap 'rm -rf -- "$temporary_root"' EXIT

curl --fail --location --output "$temporary_root/$asset" \
  "$repository/releases/latest/download/$asset"
unzip -q "$temporary_root/$asset" -d "$temporary_root/extracted"
installer=$(find "$temporary_root/extracted" -type f -name install.sh -print -quit)
[[ -n "$installer" && -f "$(dirname -- "$installer")/kit.json" ]] || {
  echo 'The downloaded release does not contain a plugin-kit installer.' >&2
  exit 1
}
bash "$installer"
