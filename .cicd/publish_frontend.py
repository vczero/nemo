#!/usr/bin/env python3
"""
Frontend deployment script: upload dist/ to OSS.

- New files: upload directly
- Existing files: tag with temporary:true (deleted in 1 days by lifecycle policy)
"""

import argparse
import os
import oss2
from oss2.models import Tagging

# OSS配置
ENDPOINT = "oss-cn-hangzhou.aliyuncs.com"
BUCKET = "ywwlab-static"
ACCESS_KEY_ID = "xxx"
ACCESS_KEY_SECRET = "xxx"
REGION = "cn-hangzhou"
OSS_DIR = "frontend"


def get_oss_files():
    """列出OSS上frontend目录下的所有文件"""
    auth = oss2.Auth(ACCESS_KEY_ID, ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, ENDPOINT, BUCKET)

    oss_files = set()
    prefix = f"{OSS_DIR}/"

    for obj in oss2.ObjectIterator(bucket, prefix=prefix):
        rel_path = obj.key[len(prefix):] if obj.key.startswith(prefix) else obj.key
        oss_files.add(rel_path)

    return oss_files


def get_local_files(dist_dir):
    """获取本地dist目录下的所有文件"""
    local_files = set()

    for root, dirs, files in os.walk(dist_dir):
        for filename in files:
            filepath = os.path.join(root, filename)
            rel_path = os.path.relpath(filepath, dist_dir)
            local_files.add(rel_path)

    return local_files


def delete_temporary_files():
    """删除所有打了temporary=true标签的OSS文件"""
    auth = oss2.Auth(ACCESS_KEY_ID, ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, ENDPOINT, BUCKET, region=REGION)

    deleted_count = 0
    for obj in oss2.ObjectIterator(bucket, prefix=f"{OSS_DIR}/"):
        try:
            result = bucket.get_object_tagging(obj.key)
            if 'temporary' in result.tag_set.tagging_rule:
                bucket.delete_object(obj.key)
                deleted_count += 1
                print(f"  deleted {obj.key}")
        except Exception as e:
            print(f"  error checking {obj.key}: {e}")

    print(f"Deleted {deleted_count} temporary files.")


def main():
    parser = argparse.ArgumentParser(description="Deploy frontend to OSS")
    parser.add_argument("--dist", default="frontend/dist", help="Local dist directory")
    parser.add_argument("--oss-dir", default="frontend", help="OSS directory")
    parser.add_argument("--dry-run", action="store_true", default=False,
                        help="Only show what would be done, don't execute OSS operations")
    args = parser.parse_args()
    print(args)
    global OSS_DIR
    OSS_DIR = args.oss_dir
    dist_dir = os.path.abspath(args.dist)

    #print(f"Deleting temporary files in {OSS_DIR}...")
    #delete_temporary_files()

    print(f"Local dist: {dist_dir}")
    print(f"OSS dir: {OSS_DIR}")
    local_files = get_local_files(dist_dir)

    auth = oss2.Auth(ACCESS_KEY_ID, ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, ENDPOINT, BUCKET, region=REGION)

    print(f"Fetching OSS file list (before), {OSS_DIR}...")
    oss_files_before = get_oss_files()
    print(f"OSS files: {len(oss_files_before)}, Local dist: {len(local_files)}")

    # 分离文件
    # 新增：dist中有，OSS中没有
    # 旧文件：OSS中有，dist中没有（需要tag）
    # 已有：二者都有，不操作
    new_files = []
    to_tag_files = []
    existing_files = []

    for local_path in local_files:
        if local_path in oss_files_before:
            existing_files.append(local_path)
        else:
            new_files.append(local_path)

    if len(new_files) == 0:
        print("No new files to upload.")

    for oss_path in oss_files_before:
        oss_key = f"{OSS_DIR}/{oss_path}"
        if oss_key.endswith('/') or len(oss_path) == 0:
            continue
        if oss_path not in local_files:
            # 跳过已有temporary tag的文件
            try:
                result = bucket.get_object_tagging(oss_key)
                if 'temporary' not in result.tag_set.tagging_rule:
                    to_tag_files.append(oss_key)
            except Exception as e:
                print(e)
                pass

    # 上传新文件
    print(f"\nUploading {len(new_files)} new files...")
    for local_path in new_files:
        full_local_path = os.path.join(dist_dir, local_path)
        oss_key = f"{OSS_DIR}/{local_path}"
        print(f"  upload {full_local_path} to {oss_key}")
        if not args.dry_run:
            bucket.put_object_from_file(oss_key, full_local_path)

    # 标记不在dist中的旧文件
    print(f"\nTagging {len(to_tag_files)} old files...")
    tagging = Tagging()
    tagging.tag_set.add('temporary', 'true')
    for oss_key in to_tag_files:
        print(f"  {oss_key} -> temporary:true")
        if not args.dry_run:
            bucket.put_object_tagging(oss_key, tagging)

    print("Fetching OSS file list (after)...")
    oss_files_after = get_oss_files()
    print(f"  OSS files: {len(oss_files_after)}, Local dist: {len(local_files)}")

    print(f"\nSummary:")
    print(f"  Existing files (no action): {len(existing_files)}")
    print(f"  New files to upload: {len(new_files)}")
    print(f"  Old files to tag: {len(to_tag_files)}")
    print("\nDeploy completed!")


if __name__ == "__main__":
    main()
