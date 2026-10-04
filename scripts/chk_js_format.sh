#!/bin/sh
set -e
cd "$(dirname "$0")/.."

out=$(mktemp)
trap 'rm -f "$out"' EXIT INT TERM

status=0
pnpm exec biome format --write . >"$out" 2>&1 && pnpm exec biome check --write . >>"$out" 2>&1 || status=$?

if [ $status -ne 0 ]; then
  printf 'Issues remaining, you can try:\npnpm exec biome check --write --unsafe .\n'
  head -n 100 "$out"
fi
exit $status
