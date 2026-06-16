#!/bin/bash
set -ex
# checkout 到指定branch的指定commit，然后tagging后push到origin,会自动触发github actions部署
# push后回复到原来所在的分支状态

BRANCH="${1:-main}"
COMMIT="${2:-}"

# 保存当前分支/状态
ORIGINAL_REF=$(git rev-parse --abbrev-ref HEAD)
ORIGINAL_COMMIT=$(git rev-parse HEAD)
echo "Original branch: ${ORIGINAL_REF}, commit: ${ORIGINAL_COMMIT}"

# Fetch the specified branch from origin
git fetch origin "${BRANCH}"

if [ -z "$COMMIT" ]; then
    # No commit specified, use the latest from the branch
    COMMIT=$(git rev-parse "origin/${BRANCH}")
    echo "Using latest COMMIT: ${COMMIT}"
fi

# checkout 到指定的 commit (detached HEAD)
# 如果已经是该 commit，则跳过 checkout
if [ "$(git rev-parse HEAD)" != "${COMMIT}" ]; then
    git checkout "${COMMIT}"
else
    echo "Already at commit ${COMMIT}, skipping checkout"
fi

# Generate tag with pattern: prod-yyyy-mm-dd-seq
date_prefix=$(date +%Y-%m-%d)

# Get the latest seq for today (check both local and remote tags)
remote_seq=$(git ls-remote --tags origin "refs/tags/prod-${date_prefix}-*" \
    | awk '{print $2}' \
    | sed "s|refs/tags/prod-${date_prefix}-||" \
    | sed 's|\^{}||' \
    | sort -V \
    | tail -1)

local_seq=$(git tag -l "prod-${date_prefix}-*" 2>/dev/null \
    | sed "s|prod-${date_prefix}-||" \
    | sort -V \
    | tail -1)

# Take the max of remote and local seq
if [ -z "$remote_seq" ] && [ -z "$local_seq" ]; then
    seq=1
elif [ -z "$remote_seq" ]; then
    seq=$((local_seq + 1))
elif [ -z "$local_seq" ]; then
    seq=$((remote_seq + 1))
else
    seq=$((remote_seq > local_seq ? remote_seq + 1 : local_seq + 1))
fi

tag="prod-${date_prefix}-${seq}"
echo "Creating tag: ${tag} -> ${COMMIT} (branch: ${BRANCH})"

# Create and push tag
git tag "${tag}" "${COMMIT}"
git push origin "${tag}"

echo "Tag ${tag} pushed successfully. GitHub Actions will deploy automatically."

# 恢复到原来所在的分支
git checkout "${ORIGINAL_REF}"
echo "Restored to original branch: ${ORIGINAL_REF} (commit: ${ORIGINAL_COMMIT})"
