#!/usr/bin/env bash

set -e

npx rollup -c rollup.config.js

HEADER="#!/usr/bin/env node \n\n// qca-cli executable.\n// Generated by the command \`npm run build\` in the cli/ directory."
sed -i "1i$HEADER" ../bin/qca-cli

chmod +x ../bin/qca-cli