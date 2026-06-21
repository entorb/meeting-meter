#!/bin/sh

# ensure we are in the root dir
cd $(dirname $0)/..

# exit upon error
set -e

echo === delete old node_modules and lock ===
rm -rf node_modules pnpm-lock.yaml

echo === update packages ===
pnpm up -L
pnpm exec biome migrate --write

# fit audit findings
if ! pnpm audit; then
  echo === fix audit findings ===
  pnpm audit --fix update
  pnpm audit --fix override
fi

echo === check ===
pnpm run check

echo === Cypress ===
# start dev server in background, bypassing pnpm wrapper to remove warning upon killing process
# pnpm run dev
./node_modules/.bin/vite > /dev/null 2>&1 &
DEV_PID=$!

# wait for dev server to be ready (port 5173 is Vite's default)
echo "Waiting for dev server..."
while ! nc -z localhost 5173; do
  sleep 0.5
done
echo "Dev server ready (PID $DEV_PID)"

# run Cypress and capture its exit code immediately
pnpm run cy:run || EXIT_CODE=$?
EXIT_CODE=${EXIT_CODE:-0}

kill $DEV_PID
wait $DEV_PID 2>/dev/null || true

if [ -n "$(git status --porcelain)" ]; then
  echo === git push ===
  git add pnpm-lock.yaml
  git diff --staged --quiet -- pnpm-lock.yaml || git commit -m "Update Lock"

  git add package.json pnpm-workspace.yaml biome.json
  git commit -m "package update and pnpm audit findings"
  git push
fi

echo "update DONE, not yet deployed"
exit $EXIT_CODE
