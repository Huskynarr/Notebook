#!/usr/bin/env bash
# Runs on the Plesk subscription user's shell. No sudo, no provider secrets
# supplied by CI; persistent production configuration stays on the server.
set -euo pipefail
release_root=${1:?Release root missing}
commit=${2:?Commit missing}
archive=${3:?Archive missing}
[[ "$release_root" =~ ^/[a-zA-Z0-9_./-]+$ && "$release_root" != / ]] || { echo 'Invalid release root' >&2; exit 1; }
[[ "$commit" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit' >&2; exit 1; }
[[ -f "$release_root/shared/api.env" ]] || { echo 'shared/api.env missing' >&2; exit 1; }
[[ $(stat -c '%a' "$release_root/shared/api.env") == 600 ]] || { echo 'shared/api.env must have mode 600' >&2; exit 1; }
[[ $(node -p 'Number(process.versions.node.split(".")[0]) > 22 || (Number(process.versions.node.split(".")[0]) === 22 && Number(process.versions.node.split(".")[1]) >= 18)') == true ]] || { echo 'Node >=22.18 required' >&2; exit 1; }
[[ $(pnpm --version) == 9.15.9 ]] || { echo 'pnpm 9.15.9 required' >&2; exit 1; }
mkdir -p "$release_root/releases" "$release_root/shared/data"
exec 9>"$release_root/.deploy.lock"
flock -n 9 || { echo 'A deployment is already running' >&2; exit 1; }
release="$release_root/releases/$commit"
[[ ! -e "$release" ]] || { echo 'Release already exists; inspect it before retrying.' >&2; exit 1; }
mkdir "$release"
tar -xzf "$archive" --no-same-owner -C "$release"
cd "$release"
[[ $(node -p 'JSON.parse(require("node:fs").readFileSync("release.json", "utf8")).commit') == "$commit" ]] || { echo 'Artifact commit mismatch' >&2; exit 1; }
[[ $(node -p 'JSON.parse(require("node:fs").readFileSync("release.json", "utf8")).dirty') == false ]] || { echo 'Dirty artifact rejected' >&2; exit 1; }
CI=true pnpm install --prod --frozen-lockfile --ignore-scripts
ln -s "$release_root/shared/api.env" apps/api/.env
ln -s "$release_root/shared/data" apps/api/data
# Validate exact startup configuration before stopping the old process.
(cd apps/api && node --env-file=.env --input-type=module -e 'import {loadConfig} from "./src/config.ts"; const c=loadConfig(); if(c.NODE_ENV!=="production" || c.HOST!=="127.0.0.1" || c.PORT!==8787 || c.DATABASE_PATH!=="./data/notebook.db") throw Error("Production requires NODE_ENV=production HOST=127.0.0.1 PORT=8787 DATABASE_PATH=./data/notebook.db")')
previous=$(readlink "$release_root/current" 2>/dev/null || true)
ln -s "$release" "$release_root/.current-$commit"
mv -Tf "$release_root/.current-$commit" "$release_root/current"
rollback() {
  if [[ -n "$previous" ]]; then
    ln -s "$previous" "$release_root/.rollback-$commit"
    mv -Tf "$release_root/.rollback-$commit" "$release_root/current"
    systemctl --user restart notebook.service || true
    echo 'Previous code release restored. Database migrations are not automatically reverted.' >&2
  else
    systemctl --user stop notebook.service || true
    echo 'First deployment failed; service stopped. Inspect service logs before retrying.' >&2
  fi
}
if ! systemctl --user restart notebook.service; then rollback; exit 1; fi
healthy=false
for attempt in {1..15}; do
  if curl --fail --silent --max-time 2 http://127.0.0.1:8787/v1/health >/dev/null; then healthy=true; break; fi
  sleep 1
done
if [[ "$healthy" != true ]]; then rollback; exit 1; fi
rm -- "$archive"
echo "Deployed $commit. Old releases and database backups are retained."
