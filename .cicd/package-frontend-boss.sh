#!/bin/bash
set -ex

mkdir -p /tmp/nemo

cd frontend-boss
pnpm install
pnpm run build
cd dist
tar -czf /tmp/nemo/frontend-boss.tar.gz .

echo "Frontend-boss package created successfully: /tmp/nemo/frontend-boss.tar.gz"
