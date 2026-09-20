#!/bin/sh

cd "$(dirname "$0")/.." || exit 1

# Cypress needs a running dev server.
# Start vite directly, bypassing the pnpm wrapper, to remove the warning upon killing the process.
./node_modules/.bin/vite >/dev/null 2>&1 &
PID_VITE=$!
trap 'kill $PID_VITE 2>/dev/null' EXIT INT TERM

# wait for dev server to be ready (port 5173 is Vite's default)
echo "Waiting for dev server..."
while ! nc -z localhost 5173; do
  sleep 0.5
done
echo "Dev server ready (PID $PID_VITE)"

pnpm run cy:run
