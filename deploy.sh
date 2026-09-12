#!/usr/bin/env bash
#
# Deploys origin/main to kc.mortensens.cc.
#
# Runs ON the build host (MRTN-LAPPS), where the app lives at ~/Knowledge-Center-Web
# and systemd runs `sirv build` behind the nginx CT. From a dev machine just run
# `npm run deploy`, which SSHes in and calls this.
#
# Overridable: KC_APP_DIR, KC_BRANCH, KC_SERVICE, KC_PORT.

set -euo pipefail

APP_DIR="${KC_APP_DIR:-$HOME/Knowledge-Center-Web}"
BRANCH="${KC_BRANCH:-main}"
SERVICE="${KC_SERVICE:-knowledge-center-web}"
PORT="${KC_PORT:-5067}"

cd "$APP_DIR"

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "$BRANCH" ]; then
	echo "==> Checkout is on '$current_branch', expected '$BRANCH'. Aborting." >&2
	echo "    Switch the host checkout, or re-run with KC_BRANCH=$current_branch." >&2
	exit 1
fi

echo "==> Updating $APP_DIR ($BRANCH)"
git pull --ff-only origin "$BRANCH"

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Building"
npm run build

echo "==> Restarting $SERVICE"
sudo systemctl restart "$SERVICE"
sleep 2

if ! systemctl is-active --quiet "$SERVICE"; then
	echo "==> $SERVICE is not running:" >&2
	systemctl status "$SERVICE" --no-pager --lines 20 >&2 || true
	exit 1
fi

status=$(curl -fsS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/" || true)
if [ "$status" != "200" ]; then
	echo "==> Health check failed: http://127.0.0.1:$PORT/ returned '${status:-no response}'" >&2
	exit 1
fi

echo "==> Deployed $(git rev-parse --short HEAD) — $(git log -1 --pretty=%s)"
echo "==> https://kc.mortensens.cc is serving the new build."
