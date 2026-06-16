#!/bin/sh
set -ex

# Fix private key permissions if needed
if [ -f ".cicd/playbook/.key/private" ]; then
    chmod 0600 ".cicd/playbook/.key/private"
fi

export ANSIBLE_CONFIG=".cicd/playbook/ansible.cfg"
hosts=".cicd/playbook/inventories/hosts"
deploy_env="$1"
playbook=".cicd/playbook/inventories/${deploy_env}.yml"

ansible-playbook ${playbook} \
    -b -i ${hosts} \
    -e deploy_env="${deploy_env}" \
    -v
