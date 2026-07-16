set -euo pipefail
cd "$(dirname "$0")"
umask 002
echo "[1/3] vite build"
npm run build
echo "[2/3] assemble .vercel/output"
rm -rf .vercel/output
mkdir -p .vercel/output/functions/render.func
cp -R dist/client .vercel/output/static
rm -f .vercel/output/static/index.html
echo "[3/3] bundle SSR handler"
npx esbuild vercel-entry.ts --bundle --platform=node --target=node22 --outfile=.vercel/output/functions/render.func/index.mjs --external:./dist/server/server.js --packages=external
cat > .vercel/output/functions/render.func/.vc-config.json <<'JSON'
{ "runtime": "nodejs22.x", "handler": "index.mjs", "launcherType": "Nodejs", "supportsResponseStreaming": true }
JSON
cat > .vercel/output/config.json <<'JSON'
{ "version": 3, "routes": [ { "handle": "filesystem" }, { "src": "/(.*)", "dest": "/render" } ] }
JSON
echo "done"
