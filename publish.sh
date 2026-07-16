#!/usr/bin/env bash
set -euo pipefail
cd /home/team/shared/site
rm -rf dist
bun run build
setsid nohup bun run start > .run/server.log 2>&1 < /dev/null &
for _ in $(seq 1 50); do
  if curl -sf -o /dev/null http://localhost:3000; then
    echo "site published; serving on port 3000"
    exit 0
  fi
  sleep 0.2
done
echo "warning: published, but the server isn't responding" >&2
exit 1