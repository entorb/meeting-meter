#!/bin/sh

# ensure we are in the root dir
cd $(dirname $0)/..

# exit upon error
set -e

# remove old node_modules
rm -rf node_modules

pnpm up
pnpm exec biome migrate --write
pnpm run check

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

echo "DONE"
exit $EXIT_CODE
