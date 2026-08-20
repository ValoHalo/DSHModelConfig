#!/usr/bin/env bash
set -euo pipefail

kit_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
command -v dsh >/dev/null 2>&1 || { echo 'dsh was not found. Install the compatible @deepseek-ai/dsh version and make sure dsh is on PATH.' >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo 'pnpm was not found. Run "corepack enable" and try again.' >&2; exit 1; }

read_manifest() {
  node -e 'const fs = require("node:fs"); const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); const path = process.argv[2].split("."); let current = value; for (const key of path) current = current[key]; process.stdout.write(String(current));' "$kit_root/kit.json" "$1"
}

dsh_version=$(read_manifest dsh.version)
kit_version=$(read_manifest version)
artifact=$(read_manifest artifact)
profile=$(read_manifest profile)
dsh_version_output=$(dsh --version 2>&1) || { echo 'Unable to determine the installed DSH version.' >&2; exit 1; }
if ! node -e '
  const expected = process.argv[1]
  const output = process.argv[2]
  const escaped = expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  process.exit(new RegExp(`(^|[^0-9A-Za-z.-])v?${escaped}([^0-9A-Za-z.-]|$)`).test(output) ? 0 : 1)
' "$dsh_version" "$dsh_version_output"; then
  echo "This kit requires DSH $dsh_version, but the installed command reported: $dsh_version_output" >&2
  exit 1
fi
if [[ -n "${DSH_HOME:-}" ]]; then
  case "$DSH_HOME" in
    '~') dsh_home=$HOME ;;
    '~/'*) dsh_home="$HOME/${DSH_HOME#\~/}" ;;
    *) dsh_home=$DSH_HOME ;;
  esac
else
  dsh_home="$HOME/.dsh"
fi

cache_root="$dsh_home/plugin-cache/$artifact/$kit_version"
mkdir -p -- "$cache_root"
mapfile -t package_files < <(node -e 'const fs = require("node:fs"); const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); for (const item of value.packages) console.log(item.file);' "$kit_root/kit.json")
cached_packages=()
package_names=()
for file in "${package_files[@]}"; do
  [[ -f "$kit_root/$file" ]] || { echo "Package not found: $kit_root/$file" >&2; exit 1; }
  install -m 0644 "$kit_root/$file" "$cache_root/$file"
  cached_packages+=("$cache_root/$file")
done
mapfile -t package_names < <(node -e 'const fs = require("node:fs"); const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); for (const item of value.packages) console.log(item.name);' "$kit_root/kit.json")

profile_manifest="$dsh_home/profiles/$profile/package.json"
installed_packages=()
if [[ -f "$profile_manifest" ]]; then
  mapfile -t installed_packages < <(node -e 'const fs = require("node:fs"); const profile = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); const kit = JSON.parse(fs.readFileSync(process.argv[2], "utf8")); const dependencies = profile.dependencies || {}; for (const item of kit.packages) if (Object.hasOwn(dependencies, item.name)) console.log(item.name);' "$profile_manifest" "$kit_root/kit.json")
fi
if (( ${#installed_packages[@]} > 0 )); then
  dsh plugin --profile "$profile" remove "${installed_packages[@]}"
fi

dsh plugin --profile "$profile" add "${cached_packages[@]}"
echo "$(read_manifest title) installed for DSH $dsh_version."
echo 'The extracted kit directory can now be moved or deleted.'
