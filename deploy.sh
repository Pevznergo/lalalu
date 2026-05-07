#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed. Install Node.js 22+ before deploy." >&2
  exit 1
fi

if [ ! -f package.json ]; then
  echo "package.json not found in $ROOT_DIR" >&2
  exit 1
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

npm run db:generate

if [ "${RUN_DB_PUSH:-false}" = "true" ]; then
  npm run db:push
else
  echo "Skipping database push. Set RUN_DB_PUSH=true to run prisma db push."
fi

npm run build

if [ "${RUN_SMOKE:-false}" = "true" ]; then
  npm run smoke:mock-generation
fi

if [ -n "${APP_SERVICE:-}" ]; then
  systemctl restart "$APP_SERVICE"
fi

if [ -n "${WORKER_SERVICE:-}" ]; then
  systemctl restart "$WORKER_SERVICE"
fi

cat <<'MSG'
Deploy build complete.

Optional flags:
  RUN_DB_PUSH=true ./deploy.sh
  RUN_SMOKE=true ./deploy.sh
  APP_SERVICE=lalalu.service WORKER_SERVICE=lalalu-worker.service ./deploy.sh
MSG
