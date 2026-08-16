#!/usr/bin/env bash
set -euo pipefail

kit_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
command -v npx >/dev/null 2>&1 || { echo 'npx was not found. Install a compatible Node.js version first.' >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo 'pnpm was not found. Run "corepack enable" and try again.' >&2; exit 1; }

read_manifest() {
  node -e 'const fs = require("node:fs"); const value = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); const path = process.argv[2].split("."); let current = value; for (const key of path) current = current[key]; process.stdout.write(String(current));' "$kit_root/kit.json" "$1"
}

dsh_version=$(read_manifest dsh.version)
kit_version=$(read_manifest version)
artifact=$(read_manifest artifact)
profile=$(read_manifest profile)
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
for file in "${package_files[@]}"; do
  [[ -f "$kit_root/$file" ]] || { echo "Package not found: $kit_root/$file" >&2; exit 1; }
  install -m 0644 "$kit_root/$file" "$cache_root/$file"
  cached_packages+=("$cache_root/$file")
done

npx --yes "@deepseek-ai/dsh@$dsh_version" plugin --profile "$profile" add "${cached_packages[@]}"
echo "$(read_manifest title) installed for DSH $dsh_version."
echo 'The extracted kit directory can now be moved or deleted.'
