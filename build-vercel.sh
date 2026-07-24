#!/bin/bash
set -e
echo "=== Building ==="
npm run build
echo "=== Syncing public dir ==="
mkdir -p public
cp -r .vercel/output/static/* public/
echo "=== Done ==="
