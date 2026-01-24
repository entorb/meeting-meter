#!/bin/sh

# ensure we are in the root dir
cd $(dirname $0)/..

# exit upon error
set -e

# remove old node_modules
rm -rf node_modules

pnpm up
pnpm run check
echo "start 'pnpm run dev' and press Enter"
read ok
pnpm run cy:run

echo DONE
