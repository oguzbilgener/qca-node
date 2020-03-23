#!/usr/bin/env sh

set -e

echo "Building and publishing version $1"

docker build -t qca-node:$1 .
docker image tag qca-node:$1 oguzbilgener/qca-node:$1
docker push "oguzbilgener/qca-node:$1"