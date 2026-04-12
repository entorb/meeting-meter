#!/bin/sh

# ensure we are in the root dir
cd $(dirname $0)/..

# exit upon error
set -e

# cleanup
rm -f .DS_Store
rm -f */.DS_Store

pnpm run check
pnpm run build

rsync -rhv --delete --no-perms --ignore-times dist/ entorb@entorb.net:html/meeting-meter/

echo DONE
