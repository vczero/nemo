#!/bin/bash
set -ex

pwd=$(pwd)

PROFILE=${1:-prod}
FRONTEND_DIR="$pwd/frontend"
DIST_DIR="$FRONTEND_DIR/dist"
CICD_DIR="$pwd/.cicd"

mkdir -p /tmp/nemo

cd $FRONTEND_DIR
pnpm install

pip install -q -r $CICD_DIR/requirements.txt

if [ "$PROFILE" = "prod" ]; then
    pnpm run build:prod
    python3 $CICD_DIR/publish_frontend.py --dist $DIST_DIR --oss-dir frontend
else
    pnpm run build:test
    python3 $CICD_DIR/publish_frontend.py --dist $DIST_DIR --oss-dir frontend-test
fi

cd $DIST_DIR
echo "$PROFILE: keep root html files and 3rd-tools directory from dist"
tar -czf /tmp/nemo/frontend.tar.gz ./*.html 

echo "Frontend package created successfully: /tmp/nemo/frontend.tar.gz"
