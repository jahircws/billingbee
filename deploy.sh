#!/usr/bin/env bash
#
# Deploy BillingBee to the EC2 instance.
#
# Runs from your local machine: SSHes into the server, fetches the requested
# branch, installs deps, builds, and restarts the pm2 process. Prints a health
# check at the end.
#
# Usage:
#   ./deploy.sh                 # deploy 'main' (default)
#   ./deploy.sh <branch>        # deploy a specific branch
#
# Requirements: the SSH key below must exist locally with 0400 perms.

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
HOST="${DEPLOY_HOST:-ubuntu@13.207.64.195}"
KEY="${DEPLOY_KEY:-hiredevelopers-key.pem}"
APP_DIR="${DEPLOY_APP_DIR:-/home/ubuntu/billingbee}"
PM2_NAME="${DEPLOY_PM2_NAME:-billingbee}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-http://localhost:3000/api/health}"
BRANCH="${1:-main}"

# ── Preflight ─────────────────────────────────────────────────────────────────
if [[ ! -f "$KEY" ]]; then
  echo "ERROR: SSH key '$KEY' not found." >&2
  exit 1
fi
chmod 400 "$KEY"

echo "▶ Deploying branch '$BRANCH' to $HOST ($APP_DIR)"

# ── Remote deploy ─────────────────────────────────────────────────────────────
# Note: 'npm ci' guarantees a clean install from the lockfile. The build runs
# `prisma generate && next build`; migrations are applied separately below only
# if the schema changed.
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 "$HOST" \
  BRANCH="$BRANCH" APP_DIR="$APP_DIR" PM2_NAME="$PM2_NAME" 'bash -seuo pipefail' <<'REMOTE'
  cd "$APP_DIR"

  echo "  • fetching origin"
  git fetch --prune origin

  echo "  • checking out $BRANCH (discarding tracked local changes, e.g. next-env.d.ts)"
  git checkout -f "$BRANCH"
  git reset --hard "origin/$BRANCH"

  echo "  • installing dependencies"
  npm ci --cache .npm --prefer-offline

  # Database migrations: this project manages its schema with `prisma db push`,
  # so prisma/migrations is normally empty. Only run `migrate deploy` if real
  # migration files exist — otherwise skip (running it would error with P3005).
  if ls prisma/migrations/*/migration.sql >/dev/null 2>&1; then
    echo "  • applying database migrations"
    # Prisma CLI loads .env, not Next's .env.local — surface DATABASE_URL for it.
    # Quoted assignment keeps URLs with & / ? intact; the value is never echoed.
    if [ -f .env.local ] && grep -q '^DATABASE_URL=' .env.local; then
      export DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//')"
    fi
    npx prisma migrate deploy
  else
    echo "  • no migration files — skipping (schema managed via db push)"
  fi

  echo "  • building"
  npm run build

  echo "  • restarting pm2 process: $PM2_NAME"
  pm2 restart "$PM2_NAME" --update-env
  pm2 save
REMOTE

# ── Health check ──────────────────────────────────────────────────────────────
echo "▶ Health check"
sleep 3
ssh -i "$KEY" -o ConnectTimeout=20 "$HOST" \
  "curl -fsS -o /dev/null -w 'HTTP %{http_code}\n' '$HEALTH_URL' || echo 'health check FAILED'"

echo "✅ Deploy of '$BRANCH' complete."
